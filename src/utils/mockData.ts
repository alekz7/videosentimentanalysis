import { SentimentData, VideoAnalysis } from '../types';

export const mockSentimentData: SentimentData[] = [
  { timestamp: '00:00:01', sentiment: 'happy', confidence: 0.91, imageUrl: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=300' },
  { timestamp: '00:00:01', sentiment: 'neutral', confidence: 0.12, imageUrl: 'https://images.pexels.com/photos/91227/pexels-photo-91227.jpeg?auto=compress&cs=tinysrgb&w=300' },
  { timestamp: '00:00:02', sentiment: 'happy', confidence: 0.87, imageUrl: 'https://images.pexels.com/photos/1043471/pexels-photo-1043471.jpeg?auto=compress&cs=tinysrgb&w=300' },
  { timestamp: '00:00:02', sentiment: 'surprised', confidence: 0.15, imageUrl: 'https://images.pexels.com/photos/1040881/pexels-photo-1040881.jpeg?auto=compress&cs=tinysrgb&w=300' },
  { timestamp: '00:00:03', sentiment: 'neutral', confidence: 0.78, imageUrl: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=300' },
  { timestamp: '00:00:03', sentiment: 'happy', confidence: 0.22, imageUrl: 'https://images.pexels.com/photos/1130626/pexels-photo-1130626.jpeg?auto=compress&cs=tinysrgb&w=300' },
  { timestamp: '00:00:04', sentiment: 'happy', confidence: 0.93, imageUrl: 'https://images.pexels.com/photos/1181519/pexels-photo-1181519.jpeg?auto=compress&cs=tinysrgb&w=300' },
  { timestamp: '00:00:04', sentiment: 'surprised', confidence: 0.08, imageUrl: 'https://images.pexels.com/photos/1040880/pexels-photo-1040880.jpeg?auto=compress&cs=tinysrgb&w=300' },
  { timestamp: '00:00:05', sentiment: 'surprised', confidence: 0.82, imageUrl: 'https://images.pexels.com/photos/1040879/pexels-photo-1040879.jpeg?auto=compress&cs=tinysrgb&w=300' },
  { timestamp: '00:00:05', sentiment: 'happy', confidence: 0.18, imageUrl: 'https://images.pexels.com/photos/1181686/pexels-photo-1181686.jpeg?auto=compress&cs=tinysrgb&w=300' },
  { timestamp: '00:00:06', sentiment: 'happy', confidence: 0.89, imageUrl: 'https://images.pexels.com/photos/1181690/pexels-photo-1181690.jpeg?auto=compress&cs=tinysrgb&w=300' },
  { timestamp: '00:00:06', sentiment: 'neutral', confidence: 0.11, imageUrl: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=300' },
  { timestamp: '00:00:07', sentiment: 'neutral', confidence: 0.75, imageUrl: 'https://images.pexels.com/photos/91227/pexels-photo-91227.jpeg?auto=compress&cs=tinysrgb&w=300' },
  { timestamp: '00:00:07', sentiment: 'sad', confidence: 0.25, imageUrl: 'https://images.pexels.com/photos/1043473/pexels-photo-1043473.jpeg?auto=compress&cs=tinysrgb&w=300' },
  { timestamp: '00:00:08', sentiment: 'sad', confidence: 0.66, imageUrl: 'https://images.pexels.com/photos/1043474/pexels-photo-1043474.jpeg?auto=compress&cs=tinysrgb&w=300' },
  { timestamp: '00:00:08', sentiment: 'neutral', confidence: 0.34, imageUrl: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=300' },
  { timestamp: '00:00:09', sentiment: 'neutral', confidence: 0.71, imageUrl: 'https://images.pexels.com/photos/91227/pexels-photo-91227.jpeg?auto=compress&cs=tinysrgb&w=300' },
  { timestamp: '00:00:09', sentiment: 'happy', confidence: 0.29, imageUrl: 'https://images.pexels.com/photos/1181519/pexels-photo-1181519.jpeg?auto=compress&cs=tinysrgb&w=300' },
  { timestamp: '00:00:10', sentiment: 'happy', confidence: 0.95, imageUrl: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=300' },
  { timestamp: '00:00:10', sentiment: 'surprised', confidence: 0.05, imageUrl: 'https://images.pexels.com/photos/1040881/pexels-photo-1040881.jpeg?auto=compress&cs=tinysrgb&w=300' },
  { timestamp: '00:00:11', sentiment: 'angry', confidence: 0.45, imageUrl: 'https://images.pexels.com/photos/1043472/pexels-photo-1043472.jpeg?auto=compress&cs=tinysrgb&w=300' },
  { timestamp: '00:00:11', sentiment: 'neutral', confidence: 0.35, imageUrl: 'https://images.pexels.com/photos/91227/pexels-photo-91227.jpeg?auto=compress&cs=tinysrgb&w=300' },
  { timestamp: '00:00:11', sentiment: 'sad', confidence: 0.20, imageUrl: 'https://images.pexels.com/photos/1043473/pexels-photo-1043473.jpeg?auto=compress&cs=tinysrgb&w=300' },
  { timestamp: '00:00:12', sentiment: 'angry', confidence: 0.72, imageUrl: 'https://images.pexels.com/photos/1043475/pexels-photo-1043475.jpeg?auto=compress&cs=tinysrgb&w=300' },
  { timestamp: '00:00:12', sentiment: 'sad', confidence: 0.28, imageUrl: 'https://images.pexels.com/photos/1043474/pexels-photo-1043474.jpeg?auto=compress&cs=tinysrgb&w=300' },
  { timestamp: '00:00:13', sentiment: 'fearful', confidence: 0.58, imageUrl: 'https://images.pexels.com/photos/1040878/pexels-photo-1040878.jpeg?auto=compress&cs=tinysrgb&w=300' },
  { timestamp: '00:00:13', sentiment: 'surprised', confidence: 0.42, imageUrl: 'https://images.pexels.com/photos/1040879/pexels-photo-1040879.jpeg?auto=compress&cs=tinysrgb&w=300' },
  { timestamp: '00:00:14', sentiment: 'neutral', confidence: 0.68, imageUrl: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=300' },
  { timestamp: '00:00:14', sentiment: 'fearful', confidence: 0.32, imageUrl: 'https://images.pexels.com/photos/1040877/pexels-photo-1040877.jpeg?auto=compress&cs=tinysrgb&w=300' },
  { timestamp: '00:00:15', sentiment: 'happy', confidence: 0.88, imageUrl: 'https://images.pexels.com/photos/1181690/pexels-photo-1181690.jpeg?auto=compress&cs=tinysrgb&w=300' },
  { timestamp: '00:00:15', sentiment: 'neutral', confidence: 0.12, imageUrl: 'https://images.pexels.com/photos/91227/pexels-photo-91227.jpeg?auto=compress&cs=tinysrgb&w=300' },
];

export const mockVideoAnalysis: VideoAnalysis = {
  id: 'mock-video-1',
  filename: 'sample-video.mp4',
  duration: 15,
  url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
  sentiments: mockSentimentData,
  status: 'completed',
  createdAt: new Date(),
};

export const sentimentColors = {
  happy: '#10B981',      // green
  neutral: '#6B7280',    // gray
  sad: '#3B82F6',        // blue
  angry: '#EF4444',      // red
  surprised: '#F59E0B',  // amber
  fearful: '#8B5CF6',    // purple
};

export const sentimentLabels = {
  happy: 'Happy 😊',
  neutral: 'Neutral 😐',
  sad: 'Sad 😢',
  angry: 'Angry 😠',
  surprised: 'Surprised 😲',
  fearful: 'Fearful 😨',
};