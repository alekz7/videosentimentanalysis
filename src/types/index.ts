export interface SentimentData {
  timestamp: string;
  sentiment: "happy" | "neutral" | "sad" | "angry" | "surprised" | "fearful";
  confidence: number;
  imageUrl?: string;
}

export interface VideoAnalysis {
  id: string;
  filename: string;
  duration: number;
  url: string;
  sentiments: SentimentData[];
  status: "uploading" | "processing" | "completed" | "error";
  createdAt: Date;
}

export interface UploadProgress {
  percentage: number;
  stage: "uploading" | "compressing" | "analyzing" | "completed";
  message: string;
}

export interface ChartDataPoint {
  time: number;
  sentiment: string;
  confidence: number;
  color: string;
}

// Manual Annotation Types
export interface ManualAnnotation {
  id: string;
  videoId: string;
  type: "moment" | "interval";
  label: string;
  description?: string;
  color: string;
  timestamp?: string; // For moments
  startTimestamp?: string; // For intervals
  endTimestamp?: string; // For intervals
  createdAt: Date;
  updatedAt: Date;
}

export interface AnnotationFormData {
  type: "moment" | "interval";
  label: string;
  description?: string;
  color: string;
  timestamp?: number; // For moments (in seconds)
  startTimestamp?: number; // For intervals (in seconds)
  endTimestamp?: number; // For intervals (in seconds)
}
