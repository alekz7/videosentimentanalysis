import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, Filter, Eye, Brain, Download, Share2, Target, Image } from 'lucide-react';
import { VideoAnalysis } from '../types';
import { sentimentLabels, sentimentColors } from '../utils/mockData';
import VideoPlayer from './VideoPlayer';
import SentimentChart from './SentimentChart';
import HighlightedMoments from './HighlightedMoments';
import SentimentImageGallery from './SentimentImageGallery';

interface DashboardProps {
  analysis: VideoAnalysis;
  isMockMode: boolean;
  onToggleMockMode: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ analysis, isMockMode, onToggleMockMode }) => {
  const [currentTime, setCurrentTime] = useState(0);
  const [selectedSentiment, setSelectedSentiment] = useState<string>('');

  const sentimentStats = useMemo(() => {
    const stats: Record<string, { count: number; percentage: number; avgConfidence: number; totalConfidence: number }> = {};
    
    analysis.sentiments.forEach(item => {
      if (!stats[item.sentiment]) {
        stats[item.sentiment] = { count: 0, percentage: 0, avgConfidence: 0, totalConfidence: 0 };
      }
      stats[item.sentiment].count++;
      stats[item.sentiment].totalConfidence += item.confidence;
      stats[item.sentiment].avgConfidence += item.confidence;
    });

    // Calculate total confidence across all sentiments for percentage calculation
    const totalConfidence = Object.values(stats).reduce((sum, stat) => sum + stat.totalConfidence, 0);

    Object.keys(stats).forEach(sentiment => {
      stats[sentiment].percentage = (stats[sentiment].totalConfidence / totalConfidence) * 100;
      stats[sentiment].avgConfidence = stats[sentiment].avgConfidence / stats[sentiment].count;
    });

    return stats;
  }, [analysis.sentiments]);

  const filteredMoments = useMemo(() => {
    return analysis.sentiments.filter(moment => 
      !selectedSentiment || moment.sentiment === selectedSentiment
    );
  }, [analysis.sentiments, selectedSentiment]);

  const handleTimeUpdate = (time: number) => {
    setCurrentTime(time);
  };

  const handleSeek = (time: number) => {
    setCurrentTime(time);
  };

  const handleChartClick = (time: number) => {
    setCurrentTime(time);
  };

  const exportData = () => {
    const dataStr = JSON.stringify(analysis.sentiments, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `sentiment-analysis-${analysis.filename}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-dark-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Sentiment Analysis Dashboard
            </h1>
            <p className="text-gray-400">
              Analyzing: <span className="text-primary-500 font-medium">{analysis.filename}</span>
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <button
              onClick={onToggleMockMode}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors duration-200 ${
                isMockMode 
                  ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30' 
                  : 'bg-dark-700 text-gray-300 border border-dark-600 hover:bg-dark-600'
              }`}
            >
              {isMockMode ? <Eye size={18} /> : <Brain size={18} />}
              {isMockMode ? 'Mock Mode' : 'Live Analysis'}
            </button>
            
            <button
              onClick={exportData}
              className="flex items-center gap-2 px-4 py-2 bg-dark-700 hover:bg-dark-600 text-gray-300 rounded-lg border border-dark-600 transition-colors duration-200"
            >
              <Download size={18} />
              Export Data
            </button>
            
            <button className="flex items-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors duration-200">
              <Share2 size={18} />
              Share
            </button>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-8"
        >
          {Object.entries(sentimentStats)
            .sort(([, a], [, b]) => b.percentage - a.percentage)
            .map(([sentiment, stats]) => (
              <div
                key={sentiment}
                className={`bg-dark-800 border rounded-xl p-4 cursor-pointer transition-all duration-200 hover:scale-105 ${
                  selectedSentiment === sentiment 
                    ? 'border-primary-500 bg-primary-500/10 shadow-lg shadow-primary-500/20' 
                    : 'border-dark-600 hover:border-dark-500'
                }`}
                onClick={() => setSelectedSentiment(selectedSentiment === sentiment ? '' : sentiment)}
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-white font-medium text-sm">
                    {sentimentLabels[sentiment as keyof typeof sentimentLabels]}
                  </h3>
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: sentimentColors[sentiment as keyof typeof sentimentColors] }}
                  />
                </div>
                <div className="space-y-1">
                  <p className="text-xl font-bold text-white">
                    {stats.percentage.toFixed(1)}%
                  </p>
                  <p className="text-xs text-gray-400">
                    Avg: {(stats.avgConfidence * 100).toFixed(0)}%
                  </p>
                </div>
                {selectedSentiment === sentiment && (
                  <div className="mt-2 flex items-center gap-1 text-xs text-primary-400">
                    <Target size={12} />
                    Selected
                  </div>
                )}
              </div>
            ))}
        </motion.div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Video Player */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-3"
          >
            <div className="mb-4">
              <h2 className="text-xl font-semibold text-white mb-2 flex items-center gap-2">
                <BarChart3 className="text-primary-500" size={24} />
                Video Analysis
              </h2>
            </div>
            <VideoPlayer
              src={analysis.url}
              currentTime={currentTime}
              onTimeUpdate={handleTimeUpdate}
              onSeek={handleSeek}
            />
          </motion.div>

          {/* Sentiment Filter */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="space-y-6"
          >
            <div className="bg-dark-800 border border-dark-600 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Filter className="text-primary-500" size={20} />
                Filter Timeline
              </h3>
              <div className="space-y-2">
                <button
                  onClick={() => setSelectedSentiment('')}
                  className={`w-full text-left px-3 py-2 rounded-lg transition-colors duration-200 ${
                    !selectedSentiment 
                      ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30' 
                      : 'text-gray-300 hover:bg-dark-700'
                  }`}
                >
                  All Sentiments
                </button>
                {Object.keys(sentimentStats).map(sentiment => (
                  <button
                    key={sentiment}
                    onClick={() => setSelectedSentiment(sentiment)}
                    className={`w-full text-left px-3 py-2 rounded-lg transition-colors duration-200 flex items-center gap-2 ${
                      selectedSentiment === sentiment
                        ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30'
                        : 'text-gray-300 hover:bg-dark-700'
                    }`}
                  >
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: sentimentColors[sentiment as keyof typeof sentimentColors] }}
                    />
                    {sentimentLabels[sentiment as keyof typeof sentimentLabels]}
                    <span className="ml-auto text-sm">
                      {sentimentStats[sentiment].count}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Sentiment Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-8"
        >
          <div className="mb-4">
            <h2 className="text-xl font-semibold text-white mb-2">
              Multi-Sentiment Timeline
            </h2>
            <p className="text-gray-400">
              {selectedSentiment 
                ? `Showing ${sentimentLabels[selectedSentiment as keyof typeof sentimentLabels]} timeline - click chart points to jump to that moment`
                : 'All sentiment lines displayed simultaneously - click any point to jump to that moment in the video'
              }
            </p>
          </div>
          <SentimentChart
            data={analysis.sentiments}
            currentTime={currentTime}
            onTimeClick={handleChartClick}
            selectedSentiment={selectedSentiment}
          />
        </motion.div>

        {/* Highlighted Moments */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-8"
        >
          <div className="mb-4">
            <h2 className="text-xl font-semibold text-white mb-2 flex items-center gap-2">
              <Target className="text-primary-500" size={24} />
              Highlighted Moments
            </h2>
            <p className="text-gray-400">
              {selectedSentiment 
                ? `Jump to specific ${sentimentLabels[selectedSentiment as keyof typeof sentimentLabels].toLowerCase()} moments in the video`
                : 'Select a sentiment above to see specific moments you can jump to'
              }
            </p>
          </div>
          <HighlightedMoments
            moments={filteredMoments}
            selectedSentiment={selectedSentiment}
            onSeek={handleSeek}
            currentTime={currentTime}
          />
        </motion.div>

        {/* Screenshot Gallery */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-8"
        >
          <div className="mb-4">
            <h2 className="text-xl font-semibold text-white mb-2 flex items-center gap-2">
              <Image className="text-primary-500" size={24} />
              Video Screenshots
            </h2>
            <p className="text-gray-400">
              {selectedSentiment 
                ? `Screenshots from ${sentimentLabels[selectedSentiment as keyof typeof sentimentLabels].toLowerCase()} moments - click to jump to that time`
                : 'Visual gallery of analyzed moments - select a sentiment to filter screenshots'
              }
            </p>
          </div>
          <SentimentImageGallery
            moments={filteredMoments}
            selectedSentiment={selectedSentiment}
            onSeek={handleSeek}
            currentTime={currentTime}
          />
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;