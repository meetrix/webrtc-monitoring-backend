import { Request, Response } from 'express';
import ffmpeg from 'fluent-ffmpeg';
import { Duplex } from 'stream';
import { v4 } from 'uuid';
import { FileType } from '../../../models/FileSystemEntity';

import { getAsStream, getFileSize, getPlayUrl, uploadRecordingToS3 } from '../../../util/s3';

export const trim = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { id } = req.params;
  const userId = req.user?._id;
  const { begin, end, replace = true }: {
    begin: number;
    end: number;
    replace: boolean;
  } = req.body;

  const file = req.user.fileSystem.id(id);
  if (!file) {
    res.status(404).json({ success: false, error: 'No such source file.' });
    return;
  }

  const stream = new Duplex();

  const command = ffmpeg()
    .input(getAsStream(userId, id))
    .setStartTime((begin / 1000).toFixed(3))
    .setDuration(((end - begin) / 1000).toFixed(3))
    .audioCodec('copy')
    .videoCodec('copy')
    .output(stream);

  command.run();

  if (replace) {
    await uploadRecordingToS3(userId, id, stream);

    res.status(200).json({
      success: true,
      data: {
        file
      }
    });
  } else {
    const newId = v4();
    const upload = await uploadRecordingToS3(userId, newId, stream);

    const newFile: FileType = {
      _id: newId,
      type: 'File',
      parentId: file.parentId,
      name: `Trimmed_${file.name}`,
      provider: file.provider,
      providerKey: upload.Key,
      description: '',
      // Need another API call for file size
      size: await getFileSize(upload.Key),
      // And another for signed URL
      url: await getPlayUrl(upload.Key),
    };

    req.user.fileSystem.push(newFile);

    res.status(200).json({
      success: true,
      data: {
        file: (await req.user.save()).fileSystem.id(newId)
      }
    });
  }
};
