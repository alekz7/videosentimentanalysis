import { s3, S3_BUCKET } from "../config/aws.js";
import fs from "fs";
import path from "path";

export class S3Service {
  constructor() {
    this.bucket = S3_BUCKET;
    this.useS3 = !!process.env.MY_APP_AWS_ACCESS_KEY_ID && !!S3_BUCKET;

    // Enforce S3 usage in production
    if (process.env.NODE_ENV === "production" && !this.useS3) {
      throw new Error(
        "AWS S3 configuration is required for production deployment. " +
          "Please set AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION, and AWS_S3_BUCKET environment variables."
      );
    }
  }

  async uploadVideo(filePath, key) {
    if (!this.useS3) {
      if (process.env.NODE_ENV === "production") {
        throw new Error(
          "S3 configuration is required for video uploads in production"
        );
      }
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

      console.log(`✅ Video uploaded to S3: ${result.Location}`);

      return {
        url: result.Location,
        key: result.Key,
        isLocal: false,
      };
    } catch (error) {
      console.error("❌ S3 video upload error:", error);

      if (process.env.NODE_ENV === "production") {
        throw new Error(`Failed to upload video to S3: ${error.message}`);
      }

      // Fallback to local storage only in development
      console.log("⚠️ Falling back to local storage (development only)");
      return { url: `/uploads/${path.basename(filePath)}`, isLocal: true };
    }
  }

  async uploadImage(filePath, key) {
    if (!this.useS3) {
      if (process.env.NODE_ENV === "production") {
        throw new Error(
          "S3 configuration is required for image uploads in production"
        );
      }
      // Return null if S3 is not configured in development
      console.log(
        "⚠️ S3 not configured, skipping image upload (development mode)"
      );
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

      if (process.env.NODE_ENV === "production") {
        throw new Error(`Failed to upload image to S3: ${error.message}`);
      }

      // Return null on error in development so analysis can continue
      console.log(
        "⚠️ Image upload failed, continuing without image (development mode)"
      );
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
      console.log(`🗑️ Video deleted from S3: ${key}`);
    } catch (error) {
      console.error("❌ S3 video delete error:", error);
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
      return {
        connected: false,
        reason:
          process.env.NODE_ENV === "production"
            ? "AWS credentials not configured (required for production)"
            : "AWS credentials not configured (development mode)",
      };
    }

    try {
      await s3.headBucket({ Bucket: this.bucket }).promise();
      return { connected: true };
    } catch (error) {
      return { connected: false, reason: error.message };
    }
  }
}
