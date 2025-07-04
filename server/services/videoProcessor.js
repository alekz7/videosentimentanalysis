import { execSync } from "child_process";
import ffmpeg from "fluent-ffmpeg";
import tmp from "tmp";
import fs from "fs";
import path from "path";
import os from "os";

if (os.platform() === "win32") {
  const installation_path = process.env.FFMPEG_WINDOWS_PATH;
  if (!installation_path) {
    console.log("⚠️  Missing FFMPEG installation");
  }
  // Windows configuration
  ffmpeg.setFfmpegPath(`${installation_path}ffmpeg.exe`);
  ffmpeg.setFfprobePath(`${installation_path}ffprobe.exe`);
  console.log("Using Windows FFmpeg paths");
} else {
  // Unix-like systems (Linux, macOS)
  try {
    const ffmpegPath = execSync("which ffmpeg").toString().trim();
    const ffprobePath = execSync("which ffprobe").toString().trim();

    ffmpeg.setFfmpegPath(ffmpegPath);
    ffmpeg.setFfprobePath(ffprobePath);
    console.log("FFMPEG ruta:", ffmpegPath);
    console.log("FFPROBE ruta:", ffprobePath);
  } catch (err) {
    console.error("Couldn't found ffmpeg/ffprobe:", err);
  }
}

export class VideoProcessor {
  constructor() {
    // Configure tmp to clean up automatically
    tmp.setGracefulCleanup();
  }

  // Helper function to create a temporary file from buffer
  createTempFile(buffer, suffix = ".mp4") {
    return new Promise((resolve, reject) => {
      tmp.file({ suffix, keep: false }, (err, path, fd, cleanupCallback) => {
        if (err) {
          reject(err);
          return;
        }

        fs.writeFile(path, buffer, (writeErr) => {
          if (writeErr) {
            cleanupCallback();
            reject(writeErr);
            return;
          }

          resolve({ path, cleanup: cleanupCallback });
        });
      });
    });
  }

  // Helper function to create a temporary directory
  createTempDir() {
    return new Promise((resolve, reject) => {
      tmp.dir({ unsafeCleanup: true }, (err, path, cleanupCallback) => {
        if (err) {
          reject(err);
          return;
        }
        resolve({ path, cleanup: cleanupCallback });
      });
    });
  }

  // Helper function to read file into buffer
  readFileToBuffer(filePath) {
    return new Promise((resolve, reject) => {
      fs.readFile(filePath, (err, data) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(data);
      });
    });
  }

  async getVideoMetadata(videoBuffer) {
    let tempFile = null;

    try {
      // Create temporary file from buffer
      tempFile = await this.createTempFile(videoBuffer);

      return new Promise((resolve, reject) => {
        ffmpeg.ffprobe(tempFile.path, (err, metadata) => {
          // Clean up temporary file AFTER ffprobe completes
          if (tempFile) {
            tempFile.cleanup();
          }

          if (err) {
            reject(err);
            return;
          }

          const videoStream = metadata.streams.find(
            (stream) => stream.codec_type === "video"
          );
          resolve({
            duration: metadata.format.duration,
            width: videoStream?.width,
            height: videoStream?.height,
            fps: eval(videoStream?.r_frame_rate) || 30,
          });
        });
      });
    } catch (error) {
      // Clean up on error during temp file creation
      if (tempFile) {
        tempFile.cleanup();
      }
      throw error;
    }
  }

  async compressVideo(inputBuffer, onProgress) {
    let inputTempFile = null;
    let outputTempFile = null;

    try {
      // Create temporary input file from buffer
      inputTempFile = await this.createTempFile(inputBuffer);

      // Create temporary output file
      outputTempFile = await this.createTempFile(Buffer.alloc(0), ".mp4");

      return new Promise((resolve, reject) => {
        const command = ffmpeg(inputTempFile.path)
          .videoCodec("libx264")
          .audioCodec("aac")
          .size("1280x720")
          .videoBitrate("1000k")
          .audioBitrate("128k")
          .format("mp4")
          .on("progress", (progress) => {
            if (onProgress) {
              onProgress(Math.round(progress.percent || 0));
            }
          })
          .on("end", async () => {
            try {
              // Read compressed video into buffer
              const compressedBuffer = await this.readFileToBuffer(
                outputTempFile.path
              );

              // Clean up temporary files AFTER ffmpeg completes successfully
              if (inputTempFile) {
                inputTempFile.cleanup();
              }
              if (outputTempFile) {
                outputTempFile.cleanup();
              }

              resolve(compressedBuffer);
            } catch (readError) {
              // Clean up on read error
              if (inputTempFile) {
                inputTempFile.cleanup();
              }
              if (outputTempFile) {
                outputTempFile.cleanup();
              }
              reject(readError);
            }
          })
          .on("error", (err) => {
            // Clean up temporary files AFTER ffmpeg fails
            if (inputTempFile) {
              inputTempFile.cleanup();
            }
            if (outputTempFile) {
              outputTempFile.cleanup();
            }
            reject(err);
          });

        command.save(outputTempFile.path);
      });
    } catch (error) {
      // Clean up on error during temp file creation
      if (inputTempFile) {
        inputTempFile.cleanup();
      }
      if (outputTempFile) {
        outputTempFile.cleanup();
      }
      throw error;
    }
  }

  async extractFrames(videoBuffer, videoId, onProgress) {
    let inputTempFile = null;
    let tempDir = null;

    try {
      // Create temporary input file from buffer
      inputTempFile = await this.createTempFile(videoBuffer);

      // Create temporary directory for frames
      tempDir = await this.createTempDir();
      const framesOutputDir = tempDir.path;

      return new Promise((resolve, reject) => {
        const command = ffmpeg(inputTempFile.path)
          .fps(1) // Extract 1 frame per second
          .format("image2")
          .on("progress", (progress) => {
            if (onProgress) {
              onProgress(Math.round(progress.percent || 0));
            }
          })
          .on("end", async () => {
            try {
              // Read all extracted frames into buffers
              const frameFiles = fs
                .readdirSync(framesOutputDir)
                .filter((file) => file.endsWith(".png"))
                .sort()
                .map((file) => path.join(framesOutputDir, file));

              const frameData = [];
              for (let i = 0; i < frameFiles.length; i++) {
                const frameBuffer = await this.readFileToBuffer(frameFiles[i]);
                frameData.push({
                  buffer: frameBuffer,
                  filename: `frame_${String(i + 1).padStart(3, "0")}.png`,
                  index: i + 1,
                });
              }

              // Clean up temporary files AFTER ffmpeg completes successfully
              if (inputTempFile) {
                inputTempFile.cleanup();
              }
              if (tempDir) {
                tempDir.cleanup();
              }

              resolve(frameData);
            } catch (readError) {
              // Clean up on read error
              if (inputTempFile) {
                inputTempFile.cleanup();
              }
              if (tempDir) {
                tempDir.cleanup();
              }
              reject(readError);
            }
          })
          .on("error", (err) => {
            // Clean up temporary files AFTER ffmpeg fails
            if (inputTempFile) {
              inputTempFile.cleanup();
            }
            if (tempDir) {
              tempDir.cleanup();
            }
            reject(err);
          });

        command.save(path.join(framesOutputDir, "frame_%03d.png"));
      });
    } catch (error) {
      // Clean up on error during temp file creation
      if (inputTempFile) {
        inputTempFile.cleanup();
      }
      if (tempDir) {
        tempDir.cleanup();
      }
      throw error;
    }
  }

  async cleanup(videoId) {
    // With temporary files, cleanup is handled automatically
    // This method is kept for compatibility but doesn't need to do anything
    console.log(
      `🧹 Cleanup completed for video: ${videoId} (using temporary files)`
    );
  }
}
