import { useState, useCallback } from 'react';
import axios from 'axios';
import { VideoAnalysis, UploadProgress } from '../types';
import { mockSentimentData } from '../utils/mockData';

const API_BASE_URL = 'http://localhost:3001/api';

export const useVideoAnalysis = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState<UploadProgress | null>(null);
  const [analysis, setAnalysis] = useState<VideoAnalysis | null>(null);
  const [isMockMode, setIsMockMode] = useState(false); // Default to real mode
  const [currentJobId, setCurrentJobId] = useState<string | null>(null);
  const [currentVideoId, setCurrentVideoId] = useState<string | null>(null);

  const simulateProgress = useCallback((onComplete: () => void) => {
    const stages = [
      { stage: 'uploading' as const, duration: 2000, message: 'Uploading video...' },
      { stage: 'compressing' as const, duration: 1500, message: 'Compressing video...' },
      { stage: 'analyzing' as const, duration: 3000, message: 'Analyzing sentiment...' },
      { stage: 'completed' as const, duration: 500, message: 'Analysis complete!' },
    ];

    let currentStage = 0;
    let currentProgress = 0;

    const updateProgress = () => {
      if (currentStage >= stages.length) {
        onComplete();
        return;
      }

      const stage = stages[currentStage];
      const increment = 100 / (stage.duration / 50); // Update every 50ms

      currentProgress += increment;

      if (currentProgress >= 100) {
        currentProgress = 100;
        setProgress({
          percentage: Math.round(currentProgress),
          stage: stage.stage,
          message: stage.message,
        });

        setTimeout(() => {
          currentStage++;
          currentProgress = 0;
          if (currentStage < stages.length) {
            setTimeout(updateProgress, 100);
          } else {
            onComplete();
          }
        }, 500);
      } else {
        setProgress({
          percentage: Math.round(currentProgress),
          stage: stage.stage,
          message: stage.message,
        });
        setTimeout(updateProgress, 50);
      }
    };

    updateProgress();
  }, []);

  const uploadToServer = useCallback(async (file: File): Promise<{ videoId: string; filename: string; duration: number }> => {
    const formData = new FormData();
    formData.append('video', file);

    try {
      const response = await axios.post(`${API_BASE_URL}/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setProgress({
              percentage: percentCompleted,
              stage: 'uploading',
              message: 'Uploading to server...',
            });
          }
        },
      });

      return response.data;
    } catch (error) {
      console.error('Upload error:', error);
      throw new Error('Failed to upload video to server');
    }
  }, []);

  const startProcessing = useCallback(async (videoId: string): Promise<string> => {
    try {
      const response = await axios.post(`${API_BASE_URL}/upload/${videoId}/process`);
      return response.data.jobId;
    } catch (error) {
      console.error('Processing start error:', error);
      throw new Error('Failed to start video processing');
    }
  }, []);

  const pollProcessingStatus = useCallback(async (videoId: string, jobId: string): Promise<void> => {
    const pollInterval = 1000; // Poll every second
    const maxAttempts = 300; // 5 minutes max
    let attempts = 0;

    const poll = async (): Promise<void> => {
      try {
        attempts++;
        const response = await axios.get(`${API_BASE_URL}/upload/${videoId}/status/${jobId}`);
        const { status, progress: serverProgress, error } = response.data;

        if (error) {
          throw new Error(error);
        }

        // Update progress based on server response
        let stage: UploadProgress['stage'] = 'analyzing';
        let message = 'Processing video...';

        if (serverProgress <= 30) {
          stage = 'compressing';
          message = 'Compressing video...';
        } else if (serverProgress <= 70) {
          stage = 'analyzing';
          message = 'Analyzing sentiment...';
        } else if (serverProgress < 100) {
          stage = 'analyzing';
          message = 'Finalizing analysis...';
        } else {
          stage = 'completed';
          message = 'Analysis complete!';
        }

        setProgress({
          percentage: serverProgress || 0,
          stage,
          message,
        });

        if (status === 'completed') {
          return; // Processing complete
        } else if (status === 'failed') {
          throw new Error('Video processing failed');
        } else if (attempts >= maxAttempts) {
          throw new Error('Processing timeout - please try again');
        } else {
          // Continue polling
          setTimeout(poll, pollInterval);
        }
      } catch (error) {
        console.error('Polling error:', error);
        throw error;
      }
    };

    await poll();
  }, []);

  const getAnalysisResults = useCallback(async (videoId: string): Promise<VideoAnalysis> => {
    try {
      const response = await axios.get(`${API_BASE_URL}/upload/${videoId}/results`);
      return {
        ...response.data,
        createdAt: new Date(response.data.createdAt),
      };
    } catch (error) {
      console.error('Results fetch error:', error);
      throw new Error('Failed to fetch analysis results');
    }
  }, []);

  const processVideo = useCallback(async (file: File, url: string) => {
    setIsUploading(true);
    setProgress({ percentage: 0, stage: 'uploading', message: 'Starting upload...' });

    try {
      if (isMockMode) {
        // Use mock mode for demo
        simulateProgress(() => {
          const newAnalysis: VideoAnalysis = {
            id: Math.random().toString(36).substr(2, 9),
            filename: file.name,
            duration: 15,
            url: url,
            sentiments: mockSentimentData,
            status: 'completed',
            createdAt: new Date(),
          };

          setAnalysis(newAnalysis);
          setIsUploading(false);
          setProgress(null);
        });
      } else {
        // Real upload and processing
        
        // Step 1: Upload video to server
        setProgress({ percentage: 0, stage: 'uploading', message: 'Uploading video...' });
        const uploadResult = await uploadToServer(file);
        setCurrentVideoId(uploadResult.videoId);

        // Step 2: Start processing
        setProgress({ percentage: 30, stage: 'compressing', message: 'Starting video processing...' });
        const jobId = await startProcessing(uploadResult.videoId);
        setCurrentJobId(jobId);

        // Step 3: Poll for completion
        await pollProcessingStatus(uploadResult.videoId, jobId);

        // Step 4: Get final results
        setProgress({ percentage: 100, stage: 'completed', message: 'Loading results...' });
        const analysisResult = await getAnalysisResults(uploadResult.videoId);

        setAnalysis(analysisResult);
        setIsUploading(false);
        setProgress(null);
        setCurrentJobId(null);
        setCurrentVideoId(null);
      }
    } catch (error) {
      console.error('Video processing error:', error);
      setProgress({
        percentage: 0,
        stage: 'uploading',
        message: `Error: ${error instanceof Error ? error.message : 'Unknown error occurred'}`,
      });
      
      // Reset after showing error for a moment
      setTimeout(() => {
        setIsUploading(false);
        setProgress(null);
        setCurrentJobId(null);
        setCurrentVideoId(null);
      }, 3000);
    }
  }, [isMockMode, simulateProgress, uploadToServer, startProcessing, pollProcessingStatus, getAnalysisResults]);

  const toggleMockMode = useCallback(() => {
    setIsMockMode(!isMockMode);
  }, [isMockMode]);

  const reset = useCallback(() => {
    setAnalysis(null);
    setIsUploading(false);
    setProgress(null);
    setCurrentJobId(null);
    setCurrentVideoId(null);
  }, []);

  return {
    isUploading,
    progress,
    analysis,
    isMockMode,
    processVideo,
    toggleMockMode,
    reset,
  };
};