import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import multer from "multer";

// Import routes
import uploadRoutes from "./routes/upload.js";
import healthRoutes from "./routes/health.js";
import annotationRoutes from "./routes/annotations.js";

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

const corsOrigins =
  process.env.NODE_ENV === "production"
    ? ["https://playful-manatee-e3dc81.netlify.app"]
    : ["http://localhost:5173", "http://localhost:3000"];

// Middleware
app.use(
  cors({
    origin: corsOrigins,
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use("/api/health", healthRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/annotations", annotationRoutes);

// Error handling middleware
app.use((error, req, res, next) => {
  console.error("❌ Server error:", error);

  if (error instanceof multer.MulterError) {
    if (error.code === "LIMIT_FILE_SIZE") {
      return res
        .status(400)
        .json({ error: "File too large. Maximum size is 100MB." });
    }
    if (error.code === "LIMIT_UNEXPECTED_FILE") {
      return res.status(400).json({
        error: 'Unexpected file field. Please use "video" field name.',
      });
    }
  }

  res.status(500).json({ error: "Internal server error" });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`📁 Upload endpoint: http://localhost:${PORT}/api/upload`);
  console.log(
    `📝 Annotations endpoint: http://localhost:${PORT}/api/annotations`
  );

  if (!process.env.MY_APP_AWS_ACCESS_KEY_ID) {
    console.log(
      "⚠️  AWS credentials not configured - using local storage fallback"
    );
  } else {
    console.log("☁️  AWS S3 configured for video storage");
  }

  if (!process.env.MY_APP_AWS_S3_BUCKET) {
    console.log("⚠️  S3 bucket not configured - using local storage");
  } else {
    console.log(`🪣 S3 Bucket: ${process.env.MY_APP_AWS_S3_BUCKET}`);
  }

  console.log("💾 Using in-memory file processing with temporary files");
});

export default app;
