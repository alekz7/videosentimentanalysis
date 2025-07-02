import AWS from "aws-sdk";
import dotenv from "dotenv";

dotenv.config();

// Configure AWS SDK
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION || "us-east-1",
});

// S3 Configuration
export const s3 = new AWS.S3({
  apiVersion: "2006-03-01",
  params: {
    Bucket: process.env.AWS_S3_BUCKET,
  },
});

// Bedrock Configuration
export const bedrock = new AWS.BedrockRuntime({
  region: process.env.BEDROCK_REGION || "us-east-1",
  apiVersion: "2023-09-30",
});

export const rekognition = new AWS.Rekognition();

export const S3_BUCKET = process.env.AWS_S3_BUCKET;
export const BEDROCK_MODEL_ID =
  process.env.BEDROCK_MODEL_ID || "anthropic.claude-3-sonnet-20240229-v1:0";
