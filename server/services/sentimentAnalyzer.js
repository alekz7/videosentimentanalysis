import { bedrock, BEDROCK_MODEL_ID, rekognition } from "../config/aws.js";
import { S3Service } from "./s3Service.js";

export class SentimentAnalyzer {
  constructor() {
    this.mockMode =
      process.env.NODE_ENV === "development" &&
      !process.env.MY_APP_AWS_ACCESS_KEY_ID;
    this.rekognition = rekognition;
    this.s3Service = new S3Service();
  }

  async analyzeFrame(frameBuffer, frameFilename, videoId, timestamp) {
    let imageUrl = null;

    try {
      // Construct S3 key for the frame
      const s3Key = `${videoId}/${frameFilename}`;

      // Upload frame buffer to S3
      console.log(`📸 Uploading frame to S3: ${s3Key}`);
      const uploadResult = await this.s3Service.uploadImage(frameBuffer, s3Key);
      imageUrl = uploadResult.url;

      if (imageUrl) {
        console.log(`✅ Frame uploaded successfully: ${imageUrl}`);
      } else {
        console.log(`⚠️ Frame upload skipped (S3 not configured)`);
      }
    } catch (error) {
      console.error("❌ Error uploading frame to S3:", error);
      // Continue with analysis even if upload fails
    }

    if (this.mockMode) {
      const mockResult = this.getMockSentiment(timestamp);
      return {
        ...mockResult,
        imageUrl,
      };
    }

    try {
      const params = {
        Image: { Bytes: frameBuffer },
        Attributes: ["ALL"],
      };

      // Use Rekognition to detect faces and emotions
      const data = await this.rekognition.detectFaces(params).promise();

      const emotions = data.FaceDetails[0]?.Emotions || [];

      if (emotions.length === 0) {
        // No emotions detected, return neutral with low confidence
        return {
          timestamp,
          sentiment: "neutral",
          confidence: 0.1,
          imageUrl,
        };
      }

      // Find the emotion with the highest confidence
      const primaryEmotion = emotions.reduce((prev, current) =>
        prev.Confidence > current.Confidence ? prev : current
      );

      // Map Rekognition emotion types to your sentiment format
      const emotionMapping = {
        HAPPY: "happy",
        SAD: "sad",
        ANGRY: "angry",
        SURPRISED: "surprised",
        FEAR: "fearful",
        DISGUSTED: "angry", // Map disgust to angry as closest match
        CONFUSED: "neutral",
        CALM: "neutral",
      };

      const mappedSentiment = emotionMapping[primaryEmotion.Type] || "neutral";

      // Convert confidence from 0-100 scale to 0-1 scale
      const normalizedConfidence = primaryEmotion.Confidence / 100;

      return {
        timestamp,
        sentiment: mappedSentiment,
        confidence: parseFloat(normalizedConfidence.toFixed(2)),
        imageUrl,
      };
    } catch (error) {
      console.error("Error analyzing frame with Rekognition:", error);
      // Fallback to mock data on error
      const mockResult = this.getMockSentiment(timestamp);
      return {
        ...mockResult,
        imageUrl,
      };
    }
  }

  getMockSentiment(timestamp) {
    const sentiments = [
      "happy",
      "neutral",
      "sad",
      "angry",
      "surprised",
      "fearful",
    ];
    const weights = [0.3, 0.25, 0.15, 0.1, 0.15, 0.05]; // Weighted towards positive emotions

    // Use timestamp to create consistent but varied results
    const seed = parseInt(timestamp.replace(/[^\d]/g, "")) || 1;
    const random = ((seed * 9301 + 49297) % 233280) / 233280;

    let cumulative = 0;
    let selectedSentiment = "neutral";

    for (let i = 0; i < sentiments.length; i++) {
      cumulative += weights[i];
      if (random <= cumulative) {
        selectedSentiment = sentiments[i];
        break;
      }
    }

    return {
      timestamp,
      sentiment: selectedSentiment,
      confidence: 0.7 + random * 0.25, // Confidence between 0.7 and 0.95
    };
  }

  async analyzeBatch(frameData, onProgress) {
    const results = [];

    for (let i = 0; i < frameData.length; i++) {
      const frame = frameData[i];
      const timestamp = this.frameToTimestamp(frame.index);

      try {
        console.log(
          `🧠 Analyzing frame ${i + 1}/${frameData.length}: ${timestamp}`
        );
        const result = await this.analyzeFrame(
          frame.buffer,
          frame.filename,
          frame.videoId || 'unknown',
          timestamp
        );
        results.push(result);

        if (onProgress) {
          onProgress(Math.round(((i + 1) / frameData.length) * 100));
        }
      } catch (error) {
        console.error(`Error analyzing frame ${i + 1}:`, error);
        // Continue with next frame
      }
    }

    return results;
  }

  frameToTimestamp(frameNumber) {
    const seconds = frameNumber;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `00:${minutes.toString().padStart(2, "0")}:${remainingSeconds
      .toString()
      .padStart(2, "0")}`;
  }
}