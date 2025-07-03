import ffmpeg from "fluent-ffmpeg";
ffmpeg.setFfmpegPath(
  "C:\\code\\bolt\\videosentimentanalysis\\node_modules_ffmpeg\\bin\\ffmpeg.exe"
);
ffmpeg.setFfprobePath(
  "C:\\code\\bolt\\videosentimentanalysis\\node_modules_ffmpeg\\bin\\ffprobe.exe"
);

import path from "path";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";

export class VideoProcessor {
  constructor() {
    this.framesDir = './temp/frames';
    this.compressedDir = './temp/compressed';
    
    // Ensure directories exist
    [this.framesDir, this.compressedDir].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  async getVideoMetadata(videoPath) {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(videoPath, (err, metadata) => {
        if (err) {
          reject(err);
          return;
        }
        
        const videoStream = metadata.streams.find(stream => stream.codec_type === 'video');
        resolve({
          duration: metadata.format.duration,
          width: videoStream?.width,
          height: videoStream?.height,
          fps: eval(videoStream?.r_frame_rate) || 30
        });
      });
    });
  }

  async compressVideo(inputPath, outputPath, onProgress) {
    return new Promise((resolve, reject) => {
      const command = ffmpeg(inputPath)
        .videoCodec('libx264')
        .audioCodec('aac')
        .size('1280x720')
        .videoBitrate('1000k')
        .audioBitrate('128k')
        .format('mp4')
        .on('progress', (progress) => {
          if (onProgress) {
            onProgress(Math.round(progress.percent || 0));
          }
        })
        .on('end', () => {
          resolve(outputPath);
        })
        .on('error', (err) => {
          reject(err);
        });

      command.save(outputPath);
    });
  }

  async extractFrames(videoPath, videoId, onProgress) {
    const framesOutputDir = path.join(this.framesDir, videoId);
    
    if (!fs.existsSync(framesOutputDir)) {
      fs.mkdirSync(framesOutputDir, { recursive: true });
    }

    return new Promise((resolve, reject) => {
      const command = ffmpeg(videoPath)
        .fps(1) // Extract 1 frame per second
        .format('image2')
        .on('progress', (progress) => {
          if (onProgress) {
            onProgress(Math.round(progress.percent || 0));
          }
        })
        .on('end', () => {
          // Get list of extracted frames
          const frames = fs.readdirSync(framesOutputDir)
            .filter(file => file.endsWith('.png'))
            .sort()
            .map(file => path.join(framesOutputDir, file));
          
          resolve(frames);
        })
        .on('error', (err) => {
          reject(err);
        });

      command.save(path.join(framesOutputDir, 'frame_%03d.png'));
    });
  }

  async cleanup(videoId) {
    const framesDir = path.join(this.framesDir, videoId);
    if (fs.existsSync(framesDir)) {
      fs.rmSync(framesDir, { recursive: true, force: true });
    }
  }
}