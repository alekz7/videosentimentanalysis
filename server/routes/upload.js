import express from 'express';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs';
import db from '../config/database.js';
import { VideoProcessor } from '../services/videoProcessor.js';
import { SentimentAnalyzer } from '../services/sentimentAnalyzer.js';
import { S3Service } from '../services/s3Service.js';

const router = express.Router();
const videoProcessor = new VideoProcessor();
const sentimentAnalyzer = new SentimentAnalyzer();
const s3Service = new S3Service();

// Ensure upload directory exists
const uploadDir = process.env.UPLOAD_DIR || './uploads';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 104857600 // 100MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['video/mp4', 'video/webm', 'video/quicktime'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only MP4, WebM, and MOV files are allowed.'));
    }
  }
});

// Upload endpoint
router.post('/', upload.single('video'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No video file provided' });
    }

    const videoId = uuidv4();
    const filePath = req.file.path;

    // Get video metadata
    const metadata = await videoProcessor.getVideoMetadata(filePath);

    // Check video duration (max 2 minutes)
    if (metadata.duration > 120) {
      fs.unlinkSync(filePath); // Clean up uploaded file
      return res.status(400).json({ error: 'Video duration must be less than 2 minutes' });
    }

    // Save video record to database
    db.run(
      `INSERT INTO videos (id, filename, original_filename, file_size, duration, local_path, status)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [videoId, req.file.filename, req.file.originalname, req.file.size, metadata.duration, filePath, 'uploaded'],
      function(err) {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).json({ error: 'Failed to save video record' });
        }
      }
    );

    res.json({
      success: true,
      videoId,
      filename: req.file.originalname,
      duration: metadata.duration,
      size: req.file.size
    });

  } catch (error) {
    console.error('Upload error:', error);
    
    // Clean up uploaded file on error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({ error: 'Upload failed: ' + error.message });
  }
});

// Process video endpoint
router.post('/:videoId/process', async (req, res) => {
  const { videoId } = req.params;
  const jobId = uuidv4();

  try {
    // Create analysis job
    db.run(
      `INSERT INTO analysis_jobs (id, video_id, status, started_at)
       VALUES (?, ?, ?, ?)`,
      [jobId, videoId, 'processing', new Date().toISOString()]
    );

    // Start processing in background
    processVideoAsync(videoId, jobId);

    res.json({
      success: true,
      jobId,
      message: 'Video processing started'
    });

  } catch (error) {
    console.error('Process error:', error);
    res.status(500).json({ error: 'Failed to start processing: ' + error.message });
  }
});

// Get processing status
router.get('/:videoId/status/:jobId', (req, res) => {
  const { videoId, jobId } = req.params;

  db.get(
    `SELECT * FROM analysis_jobs WHERE id = ? AND video_id = ?`,
    [jobId, videoId],
    (err, job) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      if (!job) {
        return res.status(404).json({ error: 'Job not found' });
      }

      res.json({
        status: job.status,
        progress: job.progress,
        error: job.error_message
      });
    }
  );
});

// Get analysis results
router.get('/:videoId/results', (req, res) => {
  const { videoId } = req.params;

  // Get video info
  db.get(
    `SELECT * FROM videos WHERE id = ?`,
    [videoId],
    (err, video) => {
      if (err || !video) {
        return res.status(404).json({ error: 'Video not found' });
      }

      // Get sentiment results
      db.all(
        `SELECT timestamp, sentiment, confidence FROM sentiment_results 
         WHERE video_id = ? ORDER BY timestamp`,
        [videoId],
        (err, sentiments) => {
          if (err) {
            return res.status(500).json({ error: 'Database error' });
          }

          const videoUrl = video.s3_url || `/uploads/${video.filename}`;

          res.json({
            id: video.id,
            filename: video.original_filename,
            duration: video.duration,
            url: videoUrl,
            sentiments: sentiments || [],
            status: 'completed',
            createdAt: video.created_at
          });
        }
      );
    }
  );
});

// Background processing function
async function processVideoAsync(videoId, jobId) {
  try {
    // Update job status
    const updateJobStatus = (status, progress = null, error = null) => {
      const fields = ['status = ?'];
      const values = [status];

      if (progress !== null) {
        fields.push('progress = ?');
        values.push(progress);
      }

      if (error) {
        fields.push('error_message = ?');
        values.push(error);
      }

      if (status === 'completed' || status === 'failed') {
        fields.push('completed_at = ?');
        values.push(new Date().toISOString());
      }

      values.push(jobId);

      db.run(
        `UPDATE analysis_jobs SET ${fields.join(', ')} WHERE id = ?`,
        values
      );
    };

    // Get video info
    const video = await new Promise((resolve, reject) => {
      db.get(`SELECT * FROM videos WHERE id = ?`, [videoId], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    if (!video) {
      throw new Error('Video not found');
    }

    updateJobStatus('compressing', 10);

    // Compress video
    const compressedPath = `./temp/compressed/${videoId}.mp4`;
    await videoProcessor.compressVideo(video.local_path, compressedPath, (progress) => {
      updateJobStatus('compressing', 10 + (progress * 0.2));
    });

    updateJobStatus('uploading', 30);

    // Upload to S3 or keep local
    const uploadResult = await s3Service.uploadVideo(compressedPath, `${videoId}.mp4`);
    
    // Update video record with S3 URL
    db.run(
      `UPDATE videos SET s3_url = ?, status = ? WHERE id = ?`,
      [uploadResult.url, 'processed', videoId]
    );

    updateJobStatus('analyzing', 40);

    // Extract frames
    const frames = await videoProcessor.extractFrames(compressedPath, videoId, (progress) => {
      updateJobStatus('analyzing', 40 + (progress * 0.3));
    });

    updateJobStatus('analyzing', 70);

    // Analyze sentiment
    const sentimentResults = await sentimentAnalyzer.analyzeBatch(frames, (progress) => {
      updateJobStatus('analyzing', 70 + (progress * 0.25));
    });

    // Save sentiment results
    for (const result of sentimentResults) {
      db.run(
        `INSERT INTO sentiment_results (video_id, timestamp, sentiment, confidence)
         VALUES (?, ?, ?, ?)`,
        [videoId, result.timestamp, result.sentiment, result.confidence]
      );
    }

    // Cleanup temporary files
    await videoProcessor.cleanup(videoId);
    if (fs.existsSync(compressedPath)) {
      fs.unlinkSync(compressedPath);
    }

    updateJobStatus('completed', 100);

  } catch (error) {
    console.error('Processing error:', error);
    
    // Update job with error
    db.run(
      `UPDATE analysis_jobs SET status = ?, error_message = ?, completed_at = ? WHERE id = ?`,
      ['failed', error.message, new Date().toISOString(), jobId]
    );

    // Cleanup on error
    await videoProcessor.cleanup(videoId);
  }
}

export default router;