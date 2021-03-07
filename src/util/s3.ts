import { S3 } from 'aws-sdk';
import { Duplex } from 'stream';
import { AWS_ACCESS_KEY, AWS_ACCESS_KEY_SECRET } from '../config/secrets';
import { S3_USER_RECORDINGS_BUCKET } from '../config/settings';

export const s3 = new S3({
  // TODO Resolve this issue
  region: 'us-west-2',
  credentials: { accessKeyId: AWS_ACCESS_KEY, secretAccessKey: AWS_ACCESS_KEY_SECRET },
});

export const uploadRecordingToS3 = async (
  userId: string,
  recordingId: string,
  stream: Duplex,
  suffix: string = ''
): Promise<S3.ManagedUpload.SendData> => {
  const key = `vid/${userId}/${recordingId}${suffix}.webm`;

  return await s3
    .upload({
      Bucket: S3_USER_RECORDINGS_BUCKET,
      Key: key,
      ContentType: 'video/webm',
      Body: stream,
    })
    .promise();
};

export const getFileSize = async (key: string): Promise<number> => {
  return (
    await s3.headObject({ Bucket: S3_USER_RECORDINGS_BUCKET, Key: key }).promise()
  ).ContentLength;
};

export const listRecordings = async (
  userId: string,
  recordingId?: string
): Promise<S3.ObjectList> => {
  const prefix = !!recordingId ? `vid/${userId}/${recordingId}` : `vid/${userId}`;

  const response = await s3
    .listObjectsV2({ Bucket: S3_USER_RECORDINGS_BUCKET, Prefix: prefix }).promise();
  // First page only? 
  return response.Contents;
};

export const getPlayUrl = async (
  key: string,
  lifetime: number = 1 * 60 * 60 * 24 * 5
): Promise<string> => {
  return await s3.getSignedUrlPromise('getObject', {
    Bucket: S3_USER_RECORDINGS_BUCKET,
    Key: key,
    Expires: lifetime // default: 5 days in seconds
  });
};

export const deleteRecording = async (key: string): Promise<boolean> => {
  const response = await s3
    .deleteObject({ Bucket: S3_USER_RECORDINGS_BUCKET, Key: key }).promise();
  return true;
};

export const deleteRecordings = async (keys: string[]): Promise<string[]> => {
  const response = await s3.deleteObjects({
    Bucket: S3_USER_RECORDINGS_BUCKET,
    Delete: { Objects: keys.map(key => ({ Key: key })) }
  }).promise();
  return response.Deleted.map(obj => obj.Key);
};
