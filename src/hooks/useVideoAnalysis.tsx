import { useState, useCallback } from 'react';
import { VideoAnalysis, UploadProgress } from '../types';
import { mockVideoAnalysis, mockSentimentData } from '../utils/mockData';

export const useVideoAnalysis = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState<UploadProgress | null>(null);
  const [analysis, setAnalysis] = useState<VideoAnalysis | null>(null);
  const [isMockMode, setIsMockMode] = useState(true);

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

  const processVideo = useCallback(async (file: File, url: string) => {
    setIsUploading(true);
    setProgress({ percentage: 0, stage: 'uploading', message: 'Starting upload...' });

    simulateProgress(() => {
      // Create analysis result
      const newAnalysis: VideoAnalysis = {
        id: Math.random().toString(36).substr(2, 9),
        filename: file.name,
        duration: 10, // This would be extracted from the actual video
        url: url,
        sentiments: isMockMode ? mockSentimentData : [], // In real mode, this would be populated by actual analysis
        status: 'completed',
        createdAt: new Date(),
      };

      setAnalysis(newAnalysis);
      setIsUploading(false);
      setProgress(null);
    });
  }, [isMockMode, simulateProgress]);

  const toggleMockMode = useCallback(() => {
    setIsMockMode(!isMockMode);
  }, [isMockMode]);

  const reset = useCallback(() => {
    setAnalysis(null);
    setIsUploading(false);
    setProgress(null);
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