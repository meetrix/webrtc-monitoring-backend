import { S3 } from 'aws-sdk';
import { AWS_ACCESS_KEY, AWS_ACCESS_KEY_SECRET } from '../../../config/secrets';
import { S3_USER_RECORDINGS_BUCKET } from '../../../config/settings';

const s3 = new S3({
  credentials: { accessKeyId: AWS_ACCESS_KEY, secretAccessKey: AWS_ACCESS_KEY_SECRET },
});

export const uploadToS3 = async (userId: string, recordingId: string, stream): Promise<S3.ManagedUpload.SendData> => {
  return await s3
    .upload({
      Bucket: S3_USER_RECORDINGS_BUCKET,
      Key: `vid/${userId}/${recordingId}.webm`,
      ContentType: 'video/webm',
      Body: stream,
    })
    .promise();
};

