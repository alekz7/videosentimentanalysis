# Video Sentiment Analyzer

A sophisticated web application that analyzes facial expressions and emotions in videos using AI-powered sentiment analysis.

## Features

- **Video Upload**: Drag-and-drop interface with progress tracking
- **Real-time Processing**: Video compression, frame extraction, and sentiment analysis
- **Interactive Dashboard**: Video player with sentiment timeline and filtering
- **AWS Integration**: S3 storage and Amazon Bedrock for AI analysis
- **Mock Mode**: Demo functionality without requiring AWS services
- **Responsive Design**: Beautiful dark theme with orange accents

## Tech Stack

### Frontend
- React 18 with TypeScript
- Tailwind CSS for styling
- Framer Motion for animations
- Recharts for data visualization
- Lucide React for icons

### Backend
- Node.js with Express
- SQLite database
- AWS SDK (S3 + Bedrock)
- FFmpeg for video processing
- Multer for file uploads

## Setup Instructions

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Configuration
Copy `.env.example` to `.env` and configure your settings:

```bash
cp .env.example .env
```

Required environment variables:
- `AWS_ACCESS_KEY_ID` - Your AWS access key
- `AWS_SECRET_ACCESS_KEY` - Your AWS secret key
- `AWS_S3_BUCKET` - S3 bucket name for video storage
- `BEDROCK_MODEL_ID` - Amazon Bedrock model ID for sentiment analysis

### 3. AWS Setup (Optional)

#### S3 Bucket Configuration:
1. Create an S3 bucket in your AWS account
2. Configure bucket permissions for public read access
3. Update the bucket name in your `.env` file

#### Amazon Bedrock Setup:
1. Enable Amazon Bedrock in your AWS account
2. Request access to Claude 3 Sonnet model
3. Update the model ID in your `.env` file

### 4. FFmpeg Installation
Install FFmpeg for video processing:

**macOS:**
```bash
brew install ffmpeg
```

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install ffmpeg
```

**Windows:**
Download from [https://ffmpeg.org/download.html](https://ffmpeg.org/download.html)

### 5. Run the Application

#### Development Mode (Frontend + Backend):
```bash
npm run dev:full
```

#### Frontend Only:
```bash
npm run dev
```

#### Backend Only:
```bash
npm run server
```

## API Endpoints

### Upload Video
```
POST /api/upload
Content-Type: multipart/form-data

Body: video file (max 100MB, 2 minutes)
```

### Process Video
```
POST /api/upload/:videoId/process
```

### Check Processing Status
```
GET /api/upload/:videoId/status/:jobId
```

### Get Analysis Results
```
GET /api/upload/:videoId/results
```

### Health Check
```
GET /api/health
```

## Usage

1. **Upload Video**: Drag and drop or select a video file (MP4, WebM, MOV)
2. **Processing**: The system will compress, upload, and analyze the video
3. **View Results**: Interactive dashboard with video player and sentiment timeline
4. **Filter Data**: Click sentiment types to filter the timeline
5. **Export Data**: Download analysis results as JSON

## Mock Mode

The application includes a comprehensive mock mode that works without AWS services:
- Simulated video processing with realistic progress updates
- Generated sentiment data based on video timestamps
- Full dashboard functionality for demonstrations

## Architecture

### Video Processing Pipeline:
1. **Upload** → Multer handles file upload with validation
2. **Compression** → FFmpeg compresses video for optimal processing
3. **Storage** → Upload to S3 or store locally as fallback
4. **Frame Extraction** → Extract 1 frame per second using FFmpeg
5. **AI Analysis** → Amazon Bedrock analyzes each frame for sentiment
6. **Results Storage** → Save sentiment data to SQLite database
7. **Dashboard** → Interactive visualization of results

### Database Schema:
- `videos` - Video metadata and file information
- `sentiment_results` - Frame-by-frame sentiment analysis
- `analysis_jobs` - Processing job status and progress

## Deployment

### Production Checklist:
- [ ] Configure AWS credentials and services
- [ ] Set up production database (PostgreSQL recommended)
- [ ] Configure HTTPS and domain
- [ ] Set up monitoring and logging
- [ ] Configure backup strategies
- [ ] Optimize video processing for scale

### Environment Variables for Production:
```bash
NODE_ENV=production
AWS_ACCESS_KEY_ID=your_production_key
AWS_SECRET_ACCESS_KEY=your_production_secret
AWS_S3_BUCKET=your_production_bucket
DATABASE_URL=your_production_database_url
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details