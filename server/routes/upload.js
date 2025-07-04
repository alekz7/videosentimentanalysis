import express from "express";
import multer from "multer";
import { v4 as uuidv4 } from "uuid";
import database from "../config/database.js";
import { VideoProcessor } from "../services/videoProcessor.js";
import { SentimentAnalyzer } from "../services/sentimentAnalyzer.js";
import { S3Service } from "../services/s3Service.js";

const router = express.Router();
const videoProcessor = new VideoProcessor();
const sentimentAnalyzer = new SentimentAnalyzer();
const s3Service = new S3Service();

// Configure multer for in-memory file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 104857600, // 100MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ["video/mp4", "video/webm", "video/quicktime"];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new Error(
          "Invalid file type. Only MP4, WebM, and MOV files are allowed."
        )
      );
    }
  },
});

// Get analysis history endpoint
router.get("/history", async (req, res) => {
  try {
    console.log("📋 Fetching analysis history...");

    // Get all completed videos with their sentiment count
    const videos = await database.videos
      .aggregate([
        {
          $match: { status: "processed" },
        },
        {
          $lookup: {
            from: "sentiment_results",
            localField: "_id",
            foreignField: "video_id",
            as: "sentiments",
          },
        },
        {
          $project: {
            _id: 1,
            original_filename: 1,
            duration: 1,
            file_size: 1,
            created_at: 1,
            s3_url: 1,
            sentimentCount: { $size: "$sentiments" },
          },
        },
        {
          $sort: { created_at: -1 },
        },
      ])
      .toArray();

    console.log(`📊 Found ${videos.length} completed analyses`);

    const history = videos.map((video) => ({
      id: video._id,
      filename: video.original_filename,
      duration: video.duration,
      fileSize: video.file_size,
      sentimentCount: video.sentimentCount,
      createdAt: video.created_at,
      thumbnailUrl: video.s3_url, // Use video URL as thumbnail for now
    }));

    res.json({
      success: true,
      history,
    });
  } catch (error) {
    console.error("❌ History fetch error:", error);
    res.status(500).json({ error: "Failed to fetch analysis history" });
  }
});

// Upload endpoint
router.post("/", upload.single("video"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No video file provided" });
    }

    const videoId = uuidv4();
    const videoBuffer = req.file.buffer;

    console.log(`📹 Processing upload for video: ${req.file.originalname}`);
    console.log(`💾 File loaded into memory: ${videoBuffer.length} bytes`);
    console.log(`🆔 Video ID: ${videoId}`);

    // Get video metadata from buffer
    const metadata = await videoProcessor.getVideoMetadata(videoBuffer);
    console.log(`⏱️ Video duration: ${metadata.duration} seconds`);

    // Check video duration (max 2 minutes)
    if (metadata.duration > 120) {
      return res
        .status(400)
        .json({ error: "Video duration must be less than 2 minutes" });
    }

    // Upload original video to S3 immediately
    console.log(`☁️ Uploading original video to S3...`);
    const originalUploadResult = await s3Service.uploadVideo(
      videoBuffer,
      `${videoId}_original.mp4`
    );

    // Save video record to MongoDB
    const videoDoc = {
      _id: videoId,
      filename: `${videoId}.mp4`,
      original_filename: req.file.originalname,
      file_size: req.file.size,
      duration: metadata.duration,
      status: "uploaded",
      s3_url: originalUploadResult.url,
      s3_key: originalUploadResult.key,
      created_at: new Date(),
      updated_at: new Date(),
    };

    await database.videos.insertOne(videoDoc);
    console.log(`✅ Video record saved to MongoDB`);

    res.json({
      success: true,
      videoId,
      filename: req.file.originalname,
      duration: metadata.duration,
      size: req.file.size,
    });
  } catch (error) {
    console.error("❌ Upload error:", error);
    res.status(500).json({ error: "Upload failed: " + error.message });
  }
});

// Process video endpoint
router.post("/:videoId/process", async (req, res) => {
  const { videoId } = req.params;
  const jobId = uuidv4();

  try {
    console.log(`🚀 Starting processing for video: ${videoId}, job: ${jobId}`);

    // Create analysis job in MongoDB
    const jobDoc = {
      _id: jobId,
      video_id: videoId,
      status: "processing",
      progress: 0,
      error_message: null,
      started_at: new Date(),
      completed_at: null,
      created_at: new Date(),
    };

    await database.analysisJobs.insertOne(jobDoc);

    // Start processing in background
    processVideoAsync(videoId, jobId);

    res.json({
      success: true,
      jobId,
      message: "Video processing started",
    });
  } catch (error) {
    console.error("❌ Process error:", error);
    res
      .status(500)
      .json({ error: "Failed to start processing: " + error.message });
  }
});

// Get processing status
router.get("/:videoId/status/:jobId", async (req, res) => {
  const { videoId, jobId } = req.params;

  try {
    const job = await database.analysisJobs.findOne({
      _id: jobId,
      video_id: videoId,
    });

    if (!job) {
      return res.status(404).json({ error: "Job not found" });
    }

    res.json({
      status: job.status,
      progress: job.progress,
      error: job.error_message,
    });
  } catch (error) {
    console.error("❌ Database error:", error);
    res.status(500).json({ error: "Database error" });
  }
});

// Get analysis results
router.get("/:videoId/results", async (req, res) => {
  const { videoId } = req.params;

  try {
    // Get video info
    const video = await database.videos.findOne({ _id: videoId });

    if (!video) {
      console.error("❌ Video not found:", videoId);
      return res.status(404).json({ error: "Video not found" });
    }

    // Get sentiment results with image URLs
    const sentiments = await database.sentimentResults
      .find({ video_id: videoId })
      .sort({ timestamp: 1 })
      .toArray();

    const videoUrl = video.s3_url;

    console.log(`📊 Returning results for video: ${video.original_filename}`);
    console.log(`📈 Sentiment data points: ${sentiments?.length || 0}`);

    res.json({
      id: video._id,
      filename: video.original_filename,
      duration: video.duration,
      url: videoUrl,
      sentiments:
        sentiments.map((s) => ({
          timestamp: s.timestamp,
          sentiment: s.sentiment,
          confidence: s.confidence,
          imageUrl: s.imageUrl || null,
        })) || [],
      status: "completed",
      createdAt: video.created_at,
    });
  } catch (error) {
    console.error("❌ Database error:", error);
    res.status(500).json({ error: "Database error" });
  }
});

// Background processing function
async function processVideoAsync(videoId, jobId) {
  try {
    console.log(`🔄 Starting background processing for video: ${videoId}`);

    // Update job status helper
    const updateJobStatus = async (status, progress = null, error = null) => {
      const updateDoc = {
        status,
        updated_at: new Date(),
      };

      if (progress !== null) {
        updateDoc.progress = progress;
      }

      if (error) {
        updateDoc.error_message = error;
      }

      if (status === "completed" || status === "failed") {
        updateDoc.completed_at = new Date();
      }

      try {
        await database.analysisJobs.updateOne(
          { _id: jobId },
          { $set: updateDoc }
        );
        console.log(`📊 Job ${jobId} status updated: ${status} (${progress}%)`);
      } catch (err) {
        console.error("❌ Failed to update job status:", err);
      }
    };

    // Get video info
    const video = await database.videos.findOne({ _id: videoId });

    if (!video) {
      throw new Error("Video not found");
    }

    console.log(`📹 Processing video: ${video.original_filename}`);

    await updateJobStatus("processing", 10);

    // Download original video from S3
    console.log(`📥 Downloading original video from S3...`);
    const originalVideoBuffer = await s3Service.downloadVideo(video.s3_key);
    console.log(`✅ Original video downloaded: ${originalVideoBuffer.length} bytes`);

    await updateJobStatus("compressing", 20);

    // Compress video
    console.log(`🗜️ Compressing video...`);
    const compressedVideoBuffer = await videoProcessor.compressVideo(
      originalVideoBuffer,
      async (progress) => {
        await updateJobStatus("compressing", 20 + progress * 0.2);
      }
    );
    console.log(`✅ Video compressed: ${compressedVideoBuffer.length} bytes`);

    await updateJobStatus("uploading", 40);

    // Upload compressed video to S3
    console.log(`☁️ Uploading compressed video to S3...`);
    const compressedUploadResult = await s3Service.uploadVideo(
      compressedVideoBuffer,
      `${videoId}.mp4`
    );
    console.log(`✅ Compressed video uploaded: ${compressedUploadResult.url}`);

    // Update video record with compressed S3 URL
    await database.videos.updateOne(
      { _id: videoId },
      {
        $set: {
          s3_url: compressedUploadResult.url,
          s3_key: compressedUploadResult.key,
          status: "processed",
          updated_at: new Date(),
        },
      }
    );
    console.log(`✅ Video record updated with compressed S3 URL`);

    await updateJobStatus("analyzing", 50);

    // Extract frames
    console.log(`🎞️ Extracting frames...`);
    const frameData = await videoProcessor.extractFrames(
      compressedVideoBuffer,
      videoId,
      async (progress) => {
        await updateJobStatus("analyzing", 50 + progress * 0.2);
      }
    );
    console.log(`📸 Extracted ${frameData.length} frames`);

    await updateJobStatus("analyzing", 70);

    // Add videoId to frame data for S3 upload
    const frameDataWithVideoId = frameData.map(frame => ({
      ...frame,
      videoId
    }));

    // Analyze sentiment
    console.log(`🧠 Analyzing sentiment...`);
    const sentimentResults = await sentimentAnalyzer.analyzeBatch(
      frameDataWithVideoId,
      async (progress) => {
        await updateJobStatus("analyzing", 70 + progress * 0.25);
      }
    );
    console.log(`📊 Generated ${sentimentResults.length} sentiment results`);

    // Save sentiment results to MongoDB
    console.log(`💾 Saving sentiment results to MongoDB...`);
    if (sentimentResults.length > 0) {
      const sentimentDocs = sentimentResults.map((result) => ({
        video_id: videoId,
        timestamp: result.timestamp,
        sentiment: result.sentiment,
        confidence: result.confidence,
        imageUrl: result.imageUrl || null,
        created_at: new Date(),
      }));

      await database.sentimentResults.insertMany(sentimentDocs);
      console.log(
        `✅ Saved ${sentimentDocs.length} sentiment results with image URLs`
      );
    }

    // Final cleanup
    console.log(`🧹 Final cleanup...`);
    await videoProcessor.cleanup(videoId);

    await updateJobStatus("completed", 100);
    console.log(`✅ Processing completed for video: ${videoId}`);
  } catch (error) {
    console.error("❌ Processing error:", error);

    // Cleanup on error
    await videoProcessor.cleanup(videoId);

    // Update job with error
    try {
      await database.analysisJobs.updateOne(
        { _id: jobId },
        {
          $set: {
            status: "failed",
            error_message: error.message,
            completed_at: new Date(),
            updated_at: new Date(),
          },
        }
      );
    } catch (err) {
      console.error("❌ Failed to update job with error:", err);
    }
  }
}

export default router;