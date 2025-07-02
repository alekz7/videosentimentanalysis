export interface SentimentData {
  timestamp: string;
  sentiment: 'happy' | 'neutral' | 'sad' | 'angry' | 'surprised' | 'fearful';
  confidence: number;
  imageUrl?: string;
}

export interface VideoAnalysis {
  id: string;
  filename: string;
  duration: number;
  url: string;
  sentiments: SentimentData[];
  status: 'uploading' | 'processing' | 'completed' | 'error';
  createdAt: Date;
}

export interface UploadProgress {
  percentage: number;
  stage: 'uploading' | 'compressing' | 'analyzing' | 'completed';
  message: string;
}

export interface ChartDataPoint {
  time: number;
  sentiment: string;
  confidence: number;
  color: string;
}