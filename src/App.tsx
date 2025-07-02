import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { useVideoAnalysis } from './hooks/useVideoAnalysis';
import VideoUpload from './components/VideoUpload';
import Dashboard from './components/Dashboard';

function App() {
  const {
    isUploading,
    progress,
    analysis,
    isMockMode,
    processVideo,
    toggleMockMode,
    reset,
  } = useVideoAnalysis();

  return (
    <div className="min-h-screen bg-dark-900 font-inter">
      <AnimatePresence mode="wait">
        {!analysis ? (
          <motion.div
            key="upload"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="min-h-screen flex items-center justify-center"
          >
            <VideoUpload
              onUploadComplete={processVideo}
              isUploading={isUploading}
              progress={progress}
            />
          </motion.div>
        ) : (
          <motion.div
            key="dashboard"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Back Button */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="absolute top-6 left-6 z-10"
            >
              <button
                onClick={reset}
                className="flex items-center gap-2 px-4 py-2 bg-dark-800 hover:bg-dark-700 text-gray-300 rounded-lg border border-dark-600 transition-colors duration-200"
              >
                <ArrowLeft size={18} />
                New Analysis
              </button>
            </motion.div>

            <Dashboard
              analysis={analysis}
              isMockMode={isMockMode}
              onToggleMockMode={toggleMockMode}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;