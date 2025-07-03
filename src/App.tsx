import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, History, Upload } from 'lucide-react';
import { useVideoAnalysis } from './hooks/useVideoAnalysis';
import VideoUpload from './components/VideoUpload';
import Dashboard from './components/Dashboard';
import AnalysisHistory from './components/AnalysisHistory';

type CurrentView = 'upload' | 'history' | 'dashboard';

function App() {
  const {
    isUploading,
    isProcessing,
    progress,
    analysis,
    isMockMode,
    isLoadingHistory,
    currentVideoId,
    currentJobId,
    processVideo,
    toggleMockMode,
    reset,
    loadAnalysisById,
  } = useVideoAnalysis();

  const [currentView, setCurrentView] = useState<CurrentView>('upload');

  // Auto-switch to dashboard when analysis is available
  React.useEffect(() => {
    if (analysis) {
      setCurrentView('dashboard');
    }
  }, [analysis]);

  const handleNewAnalysis = () => {
    reset();
    setCurrentView('upload');
  };

  const handleViewHistory = () => {
    setCurrentView('history');
  };

  const handleLoadAnalysis = async (videoId: string) => {
    try {
      await loadAnalysisById(videoId);
      // Analysis will be set and useEffect will switch to dashboard
    } catch (error) {
      console.error('Failed to load analysis:', error);
      // Could show an error toast here
    }
  };

  const renderNavigation = () => {
    if (currentView === 'upload') {
      return (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-6 right-6 z-10"
        >
          <button
            onClick={handleViewHistory}
            className="flex items-center gap-2 px-4 py-2 bg-dark-800 hover:bg-dark-700 text-gray-300 rounded-lg border border-dark-600 transition-colors duration-200"
          >
            <History size={18} />
            View History
          </button>
        </motion.div>
      );
    }

    if (currentView === 'history') {
      return (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-6 left-6 z-10"
        >
          <button
            onClick={() => setCurrentView('upload')}
            className="flex items-center gap-2 px-4 py-2 bg-dark-800 hover:bg-dark-700 text-gray-300 rounded-lg border border-dark-600 transition-colors duration-200"
          >
            <ArrowLeft size={18} />
            Back to Upload
          </button>
        </motion.div>
      );
    }

    if (currentView === 'dashboard') {
      return (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-6 left-6 z-10 flex gap-3"
        >
          <button
            onClick={handleNewAnalysis}
            className="flex items-center gap-2 px-4 py-2 bg-dark-800 hover:bg-dark-700 text-gray-300 rounded-lg border border-dark-600 transition-colors duration-200"
          >
            <Upload size={18} />
            New Analysis
          </button>
          
          <button
            onClick={handleViewHistory}
            className="flex items-center gap-2 px-4 py-2 bg-dark-800 hover:bg-dark-700 text-gray-300 rounded-lg border border-dark-600 transition-colors duration-200"
          >
            <History size={18} />
            History
          </button>
        </motion.div>
      );
    }

    return null;
  };

  return (
    <div className="min-h-screen bg-dark-900 font-inter relative">
      {renderNavigation()}

      <AnimatePresence mode="wait">
        {currentView === 'upload' && (
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
        )}

        {currentView === 'history' && (
          <motion.div
            key="history"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <AnalysisHistory
              onLoadAnalysis={handleLoadAnalysis}
              isLoading={isLoadingHistory}
            />
          </motion.div>
        )}

        {currentView === 'dashboard' && analysis && (
          <motion.div
            key="dashboard"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <Dashboard
              analysis={analysis}
              isMockMode={isMockMode}
              onToggleMockMode={toggleMockMode}
              isProcessing={isProcessing}
              processingProgress={progress}
              videoId={currentVideoId || undefined}
              jobId={currentJobId || undefined}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;