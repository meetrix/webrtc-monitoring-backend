import WebSocket from 'ws';
import http from 'http';
import jwt from 'jsonwebtoken';
import { URL } from 'url';
import { Socket } from 'net';
import { ManagedUpload } from 'aws-sdk/clients/s3';

import { CORS_REGEX, SESSION_SECRET } from './config/secrets';
import { API_BASE_URL, USER_PACKAGES } from './config/settings';
import { User, UserDocument } from './models/User';
import { FileType, FileSystemEntityType } from './models/FileSystemEntity';
import { getFileSize, getPlayUrl, listRecordings, uploadRecordingToS3, deleteRecording } from './util/s3';
import { RecordingRequest } from './models/RecordingRequest';

type SyncContext = { type: 'primary' | 'secondary' | 'plugin'; data: string };

const syncContextToProvider: { [x in SyncContext['type']]: FileSystemEntityType['provider'] } = {
  plugin: 'S3:plugin',
  primary: 'S3',
  secondary: 'S3:request',
};

function abortHandshake(socket: Socket, code: number, message: string, headers: { [x: string]: string | number }): void {
  if (socket.writable) {
    message = message || http.STATUS_CODES[code];
    headers = {
      Connection: 'close',
      'Content-type': 'text/html',
      'Content-Length': Buffer.byteLength(message),
      ...headers
    };

    socket.write(
      `HTTP/1.1 ${code} ${http.STATUS_CODES[code]}\r\n` +
      Object.keys(headers)
        .map((h) => `${h}: ${headers[h]}`)
        .join('\r\n') +
      '\r\n\r\n' +
      message
    );
  }

  socket.destroy();
}

async function updateRecordingRequest(syncContext: SyncContext, _id: string): Promise<void> {
  const recReq = await RecordingRequest.findById(syncContext.data);
  recReq.fileId = _id;
  await recReq.save();
}

const handleWebSocketEvents = (server: http.Server): void => {
  const wss = new WebSocket.Server({ noServer: true, perMessageDeflate: false });

  server.on('upgrade', async function upgrade(request: http.IncomingMessage, socket: Socket, head: Buffer) {
    const reqUrl = new URL(request.url, API_BASE_URL);
    const token = reqUrl.searchParams.get('access_token');

    let jwtUser: Express.IJwtUser;
    try {
      jwtUser = jwt.verify(token, SESSION_SECRET) as Express.IJwtUser;
      if (!jwtUser) {
        throw new Error('JWT Verification failed');
      }
    } catch (error) {
      abortHandshake(socket, 401, 'Authentication failed. ', {});
      console.log(`Authentication failed for token ${token}`);
      return;
    }

    let originVerified = false;
    let syncContextType = 'primary';
    let syncContextData = '';
    if ((jwtUser as Express.JwtPluginUser).plugin) { // Third-party site
      syncContextType = 'plugin';
      // Validate the correct third party site
      const website = (jwtUser as Express.JwtPluginUser).website;
      originVerified = !!request.headers['origin'].toString().includes(website);
    } else { // Main site
      originVerified = !!request.headers['origin'].toString().match(new RegExp(CORS_REGEX));
      const recordingRequestId = (jwtUser as Express.JwtSecondaryUser).recordingRequestId;
      if (recordingRequestId) {
        syncContextType = 'secondary';
        syncContextData = recordingRequestId;
      }
    }

    if (!originVerified) {
      abortHandshake(socket, 401, 'Origin verification failed. ', {});
      console.log(`Origin verification failed for origin ${request.headers['origin']}`);
      return;
    }

    const userDoc = await User.findOne({ _id: jwtUser.sub });
    if (!userDoc || (
      USER_PACKAGES.indexOf(userDoc.package) < USER_PACKAGES.indexOf('STANDARD')
      && !userDoc.features.plugin
    )) {
      // Check for at least STANDARD user package 
      // N.B.: Added to include STANDARD on 2021 May 7 after user complaints of missing files
      abortHandshake(socket, 403, 'Unauthorized. ', {});
      console.log(`Authorization failed for user ${userDoc._id} (${userDoc.role}, ${userDoc.package})`);
      return;
    }

    wss.handleUpgrade(request, socket as Socket, head, function done(ws) {
      wss.emit(
        'connection',
        ws,
        request,
        { reqUrl, user: userDoc, syncContext: { type: syncContextType, data: syncContextData } }
      );
    });
  });

  // Notifying the clients that the connection is alive
  const heartbeat = setInterval(function beat() {
    wss.clients.forEach(function each(client) {
      if (client.readyState === WebSocket.OPEN) {
        client.send('');
      }
    });
  }, 1000);

  wss.on('connection', async function connection(
    ws: WebSocket,
    req: http.IncomingMessage,
    { reqUrl, user, syncContext }: {
      reqUrl: URL;
      user: UserDocument;
      syncContext: SyncContext;
    }
  ) {

    ws.on('close', function close(code: number, reason: string) {
      // This ends the stream properly, results in an upload. 
      console.log(`WebSocket closed. ${code}: ${reason}`);
    });

    ws.on('error', function error(code: number, reason: string) {
      console.log(`WebSocket error. ${code}: ${reason}`);
    });

    const userId = user._id;

    // pathname format: /ws/recordingId
    // e.g.: /ws/04d7bc00-5fa2-11eb-acce-45b0eb5de22d
    const [recordingId] = reqUrl.pathname
      .replace('/ws/', '')
      .split(/\//g);

    // WARNING: Stream must be created before doing anything expensive. 
    // (Everything websocket receives before the event handler attached, is lost.)
    // OR: TODO create stream long before trying to upload file. 
    const wsStream = WebSocket.createWebSocketStream(ws);
    console.log(`Receiving file ${userId}/${recordingId}.webm. `);

    const prevVideosWithSameKey = (await listRecordings(userId, recordingId)).length;

    let upload: ManagedUpload.SendData = null;
    try {
      const startTimestamp = Date.now();
      if (prevVideosWithSameKey > 0) {
        upload = await uploadRecordingToS3(userId, recordingId, wsStream, `_${prevVideosWithSameKey}`);
      } else {
        upload = await uploadRecordingToS3(userId, recordingId, wsStream);
      }

      const folderId = reqUrl.searchParams.get('folder_id');
      const name = reqUrl.searchParams.get('name') || `Recording_${startTimestamp}`;
      const description = reqUrl.searchParams.get('description') || '';
      const _id = prevVideosWithSameKey > 0 ? `${recordingId}_${prevVideosWithSameKey}` : recordingId;

      const file: FileType = {
        _id,
        type: 'File',
        parentId: folderId,
        name,
        provider: syncContextToProvider[syncContext.type],
        providerKey: upload.Key,
        description,
        // Need another API call for file size
        size: await getFileSize(upload.Key),
        // And another for signed URL
        url: await getPlayUrl(upload.Key),
      };

      if (file?.size > 0) {
        // Create file here; no validations done
        user.fileSystem.push(file);
        await user.save();
        console.log(`File ${userId}/${recordingId}.webm uploaded. `);

        if (syncContext.type === 'secondary') {
          await updateRecordingRequest(syncContext, _id);
        }
      } else {
        await deleteRecording(file.providerKey);
      }
    } catch (error) {
      console.error(error);
    }
  });

  wss.on('close', function close() {
    clearInterval(heartbeat);
  });
};

export default handleWebSocketEvents;
