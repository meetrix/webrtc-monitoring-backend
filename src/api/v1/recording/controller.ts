import { S3 } from 'aws-sdk';
import { Duplex } from 'stream';
import { AWS_ACCESS_KEY, AWS_ACCESS_KEY_SECRET } from '../../../config/secrets';
import { S3_USER_RECORDINGS_BUCKET } from '../../../config/settings';

const s3 = new S3({
  credentials: { accessKeyId: AWS_ACCESS_KEY, secretAccessKey: AWS_ACCESS_KEY_SECRET },
});

export const uploadRecordingToS3 = async (userId: string, recordingId: string, stream: Duplex, suffix: string = ''): Promise<S3.ManagedUpload.SendData> => {
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

export const listRecordings = async (userId: string, recordingId?: string): Promise<S3.ObjectList> => {
  const prefix = !!recordingId ? `vid/${userId}/${recordingId}` : `vid/${userId}`;

  const response = await s3.listObjectsV2({ Bucket: S3_USER_RECORDINGS_BUCKET, Prefix: prefix }).promise();
  // First page only? 
  return response.Contents;
};

