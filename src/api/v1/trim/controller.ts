import { Request, Response } from 'express';
import ffmpeg from 'fluent-ffmpeg';
import { PassThrough } from 'stream';
import { v4 } from 'uuid';

import { getAsStream, getFileSize, getPlayUrl, uploadRecordingToS3 } from '../../../util/s3';
import { FileDocument, FileType } from '../../../models/FileSystemEntity';

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
  if (!file || file.type === 'Folder') {
    res.status(404).json({ success: false, error: 'No such source file.' });
    return;
  }

  if (begin === undefined || end === undefined) {
    res.status(400).json({ success: false, error: 'Both begin and end positions must be specified.' });
    return;
  }

  const input = getAsStream(userId, id);
  const output = new PassThrough();

  const command = ffmpeg(input)
    .format('webm')
    .setStartTime((begin / 1000).toFixed(3))
    .setDuration(((end - begin) / 1000).toFixed(3))
    .audioCodec('copy')
    .videoCodec('copy')
    .output(output, { end: true });

  command.run();

  if (replace) {
    const upload = await uploadRecordingToS3(userId, id, output);

    (file as FileDocument).size = await getFileSize(upload.Key);
    (file as FileDocument).url = await getPlayUrl(upload.Key);

    await req.user.save();

    res.status(200).json({
      success: true,
      data: {
        file
      }
    });
  } else {
    const newId = v4();
    const upload = await uploadRecordingToS3(userId, newId, output);

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
        file: newFile
      }
    });
  }
};
