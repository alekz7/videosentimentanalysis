import { s3, S3_BUCKET } from '../config/aws.js';
import fs from 'fs';
import path from 'path';

export class S3Service {
  constructor() {
    this.bucket = S3_BUCKET;
    this.useS3 = !!process.env.AWS_ACCESS_KEY_ID && !!S3_BUCKET;
  }

  async uploadVideo(filePath, key) {
    if (!this.useS3) {
      // Return local path if S3 is not configured
      return { url: `/uploads/${path.basename(filePath)}`, isLocal: true };
    }

    try {
      const fileStream = fs.createReadStream(filePath);
      
      const uploadParams = {
        Bucket: this.bucket,
        Key: `videos/${key}`,
        Body: fileStream,
        ContentType: 'video/mp4',
        ACL: 'public-read'
      };

      const result = await s3.upload(uploadParams).promise();
      
      return {
        url: result.Location,
        key: result.Key,
        isLocal: false
      };
    } catch (error) {
      console.error('S3 upload error:', error);
      // Fallback to local storage
      return { url: `/uploads/${path.basename(filePath)}`, isLocal: true };
    }
  }

  async deleteVideo(key) {
    if (!this.useS3 || !key) return;

    try {
      await s3.deleteObject({
        Bucket: this.bucket,
        Key: key
      }).promise();
    } catch (error) {
      console.error('S3 delete error:', error);
    }
  }

  async checkConnection() {
    if (!this.useS3) {
      return { connected: false, reason: 'AWS credentials not configured' };
    }

    try {
      await s3.headBucket({ Bucket: this.bucket }).promise();
      return { connected: true };
    } catch (error) {
      return { connected: false, reason: error.message };
    }
  }
}