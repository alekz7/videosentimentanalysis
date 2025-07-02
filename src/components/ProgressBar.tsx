import React from 'react';
import { motion } from 'framer-motion';
import { UploadProgress } from '../types';

interface ProgressBarProps {
  progress: UploadProgress;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ progress }) => {
  const getStageIcon = (stage: string) => {
    switch (stage) {
      case 'uploading':
        return '📤';
      case 'compressing':
        return '🔄';
      case 'analyzing':
        return '🧠';
      case 'completed':
        return '✅';
      default:
        return '⏳';
    }
  };

  const getStageColor = (stage: string) => {
    switch (stage) {
      case 'uploading':
        return 'from-blue-500 to-blue-600';
      case 'compressing':
        return 'from-yellow-500 to-orange-500';
      case 'analyzing':
        return 'from-purple-500 to-primary-500';
      case 'completed':
        return 'from-green-500 to-green-600';
      default:
        return 'from-gray-500 to-gray-600';
    }
  };

  const isError = progress.message.toLowerCase().includes('error');

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="flex items-center justify-between mb-2">
        <span className={`text-sm font-medium flex items-center gap-2 ${
          isError ? 'text-red-400' : 'text-gray-300'
        }`}>
          <span className="text-lg">{isError ? '❌' : getStageIcon(progress.stage)}</span>
          {progress.message}
        </span>
        {!isError && (
          <span className="text-sm font-semibold text-primary-400">
            {progress.percentage}%
          </span>
        )}
      </div>
      
      <div className="w-full bg-dark-700 rounded-full h-3 overflow-hidden">
        <motion.div
          className={`h-full bg-gradient-to-r ${
            isError ? 'from-red-500 to-red-600' : getStageColor(progress.stage)
          } rounded-full`}
          initial={{ width: 0 }}
          animate={{ width: `${progress.percentage}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </div>
      
      {progress.stage === 'completed' && !isError && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 text-center"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/20 border border-green-500/30 rounded-lg">
            <span className="text-green-400 font-medium">Analysis Complete!</span>
          </div>
        </motion.div>
      )}

      {isError && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 text-center"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-500/20 border border-red-500/30 rounded-lg">
            <span className="text-red-400 font-medium">Upload Failed</span>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default ProgressBar;