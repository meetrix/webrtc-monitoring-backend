import WebSocket from 'ws';
import http from 'http';
import jwt from 'jsonwebtoken';
import { URL } from 'url';
import { Socket } from 'net';
import { ManagedUpload } from 'aws-sdk/clients/s3';

import { CORS_REGEX, SESSION_SECRET } from './config/secrets';
import { API_BASE_URL, USER_ROLES, USER_PACKAGES } from './config/settings';
import { User, UserDocument } from './models/User';
import { FileType } from './models/FileSystemEntity';
import { getFileSize, getPlayUrl, listRecordings, uploadRecordingToS3 } from './api/v1/recording/controller';

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

const handleWebSocketEvents = (server: http.Server): void => {
  const wss = new WebSocket.Server({ noServer: true, perMessageDeflate: false });

  server.on('upgrade', async function upgrade(request: http.IncomingMessage, socket: Socket, head: Buffer) {

    const corsVerified = request.headers['origin'].toString().match(new RegExp(CORS_REGEX)) ? true : false;
    if (!corsVerified) {
      abortHandshake(socket, 401, 'CORS verification failed. ', {});
      console.log(`CORS verification failed for origin ${request.headers['origin']}`);
      return;
    }

    const reqUrl = new URL(request.url, API_BASE_URL);
    const token = reqUrl.searchParams.get('access_token');

    let jwtUser: Express.JwtUser;
    try {
      jwtUser = jwt.verify(token, SESSION_SECRET) as Express.JwtUser;
    } catch (error) {
      abortHandshake(socket, 401, 'Authentication failed. ', {});
      console.log(`Authentication failed for token ${token}`);
      return;
    }

    if (!jwtUser) {
      abortHandshake(socket, 401, 'Authentication failed. ', {});
      console.log(`Authentication failed for token ${token}`);
      return;
    }

    const userDoc = await User.findOne({ _id: jwtUser.sub });
    if (!userDoc
      || USER_ROLES.indexOf(userDoc.role) < USER_ROLES.indexOf('user')
      || USER_PACKAGES.indexOf(userDoc.package) < USER_PACKAGES.indexOf('PREMIUM')) {
      // Check for PREMIUM user package 
      abortHandshake(socket, 403, 'Unauthorized. ', {});
      console.log(`Authorization failed for user ${userDoc.id} (${userDoc.role}, ${userDoc.package})`);
      return;
    }

    wss.handleUpgrade(request, socket as Socket, head, function done(ws) {
      wss.emit('connection', ws, request, reqUrl, userDoc);
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

  wss.on('connection', async function connection(ws: WebSocket, req: http.IncomingMessage, reqUrl: URL, user: UserDocument) {
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

      const reqUrl = new URL(req.url, API_BASE_URL);
      const folderId = reqUrl.searchParams.get('folder_id');

      const file: FileType = {
        type: 'File',
        parentId: folderId,
        name: `Recording_${startTimestamp}`,
        provider: 'S3',
        providerKey: upload.Key,
        description: '',
        // Need another API call for file size
        size: await getFileSize(upload.Key),
        // And another for signed URL
        url: await getPlayUrl(upload.Key),
      };

      // Create file here; no validations done
      user.fileSystem.push(file);
      await user.save();

      console.log(`File ${userId}/${recordingId}.webm uploaded. `);
    } catch (error) {
      console.error(error);
    }
  });

  wss.on('close', function close() {
    clearInterval(heartbeat);
  });
};

export default handleWebSocketEvents;
