import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Import routes
import uploadRoutes from './routes/upload.js';
import healthRoutes from './routes/health.js';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files (uploaded videos)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// API Routes
app.use('/api/health', healthRoutes);
app.use('/api/upload', uploadRoutes);

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Server error:', error);
  
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large. Maximum size is 100MB.' });
    }
  }
  
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`📁 Upload endpoint: http://localhost:${PORT}/api/upload`);
  
  if (!process.env.AWS_ACCESS_KEY_ID) {
    console.log('⚠️  AWS credentials not configured - using local storage fallback');
  }
  
  if (!process.env.AWS_S3_BUCKET) {
    console.log('⚠️  S3 bucket not configured - using local storage');
  }
});

export default app;