import { execSync } from "child_process";
import ffmpegInstaller from "@ffmpeg-installer/ffmpeg";
import ffprobeInstaller from "@ffprobe-installer/ffprobe";
import path from "path";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";

// Set FFmpeg paths from installers
const ffmpegPath = ffmpegInstaller.path;
const ffprobePath = ffprobeInstaller.path;

console.log("FFMPEG path:", ffmpegPath);
console.log("FFPROBE path:", ffprobePath);

export class VideoProcessor {
  constructor() {
    this.framesDir = "./temp/frames";
    this.compressedDir = "./temp/compressed";

    // Ensure directories exist
    [this.framesDir, this.compressedDir].forEach((dir) => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  async getVideoMetadata(videoPath) {
    return new Promise((resolve, reject) => {
      const cmd = `"${ffprobePath}" -v quiet -print_format json -show_format -show_streams "${videoPath}"`;

      try {
        const result = execSync(cmd, { encoding: "utf8" });
        const metadata = JSON.parse(result);

        const videoStream = metadata.streams.find(
          (stream) => stream.codec_type === "video"
        );

        resolve({
          duration: parseFloat(metadata.format.duration),
          width: videoStream?.width,
          height: videoStream?.height,
          fps: this.parseFPS(videoStream?.r_frame_rate) || 30,
        });
      } catch (err) {
        reject(err);
      }
    });
  }

  parseFPS(fpsString) {
    if (!fpsString) return null;
    const parts = fpsString.split("/");
    return parts.length === 2
      ? parseFloat(parts[0]) / parseFloat(parts[1])
      : parseFloat(fpsString);
  }

  async compressVideo(inputPath, outputPath, onProgress) {
    return new Promise((resolve, reject) => {
      const cmd = `"${ffmpegPath}" -i "${inputPath}" -c:v libx264 -c:a aac -s 1280x720 -b:v 1000k -b:a 128k -f mp4 -y "${outputPath}"`;

      try {
        // For progress tracking, you'd need to parse stderr output
        execSync(cmd, { stdio: "inherit" });
        resolve(outputPath);
      } catch (err) {
        reject(err);
      }
    });
  }

  async extractFrames(videoPath, videoId, onProgress) {
    const framesOutputDir = path.join(this.framesDir, videoId);

    if (!fs.existsSync(framesOutputDir)) {
      fs.mkdirSync(framesOutputDir, { recursive: true });
    }

    return new Promise((resolve, reject) => {
      const outputPattern = path.join(framesOutputDir, "frame_%03d.png");
      const cmd = `"${ffmpegPath}" -i "${videoPath}" -vf fps=1 "${outputPattern}" -y`;

      try {
        execSync(cmd, { stdio: "inherit" });

        // Get list of extracted frames
        const frames = fs
          .readdirSync(framesOutputDir)
          .filter((file) => file.endsWith(".png"))
          .sort()
          .map((file) => path.join(framesOutputDir, file));

        resolve(frames);
      } catch (err) {
        reject(err);
      }
    });
  }

  async cleanup(videoId) {
    const framesDir = path.join(this.framesDir, videoId);
    if (fs.existsSync(framesDir)) {
      fs.rmSync(framesDir, { recursive: true, force: true });
    }
  }
}
