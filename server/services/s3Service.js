import { s3, S3_BUCKET } from "../config/aws.js";
import fs from "fs";
import path from "path";

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
        ContentType: "video/mp4",
        ACL: "public-read",
      };

      const result = await s3.upload(uploadParams).promise();

      return {
        url: result.Location,
        key: result.Key,
        isLocal: false,
      };
    } catch (error) {
      console.error("S3 upload error:", error);
      // Fallback to local storage
      return { url: `/uploads/${path.basename(filePath)}`, isLocal: true };
    }
  }

  async uploadImage(filePath, key) {
    if (!this.useS3) {
      // Return null if S3 is not configured (local temp files are not served)
      console.log("⚠️ S3 not configured, skipping image upload");
      return { url: null, key: null, isLocal: true };
    }

    try {
      const fileStream = fs.createReadStream(filePath);

      const uploadParams = {
        Bucket: this.bucket,
        Key: `screenshots/${key}`,
        Body: fileStream,
        ContentType: "image/png",
        ACL: "public-read",
      };

      const result = await s3.upload(uploadParams).promise();

      console.log(`✅ Image uploaded to S3: ${result.Location}`);

      return {
        url: result.Location,
        key: result.Key,
        isLocal: false,
      };
    } catch (error) {
      console.error("❌ S3 image upload error:", error);
      // Return null on error so analysis can continue
      return { url: null, key: null, isLocal: true };
    }
  }

  async deleteVideo(key) {
    if (!this.useS3 || !key) return;

    try {
      await s3
        .deleteObject({
          Bucket: this.bucket,
          Key: key,
        })
        .promise();
    } catch (error) {
      console.error("S3 delete error:", error);
    }
  }

  async deleteImage(key) {
    if (!this.useS3 || !key) return;

    try {
      await s3
        .deleteObject({
          Bucket: this.bucket,
          Key: key,
        })
        .promise();
      console.log(`🗑️ Image deleted from S3: ${key}`);
    } catch (error) {
      console.error("❌ S3 image delete error:", error);
    }
  }

  async checkConnection() {
    if (!this.useS3) {
      return { connected: false, reason: "AWS credentials not configured" };
    }

    try {
      await s3.headBucket({ Bucket: this.bucket }).promise();
      return { connected: true };
    } catch (error) {
      return { connected: false, reason: error.message };
    }
  }
}
