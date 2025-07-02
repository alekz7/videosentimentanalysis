import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Play, Clock, TrendingUp, ArrowUpDown, Timer } from 'lucide-react';
import { SentimentData } from '../types';
import { sentimentColors, sentimentLabels } from '../utils/mockData';
import { parseTimestamp, formatDuration } from '../utils/videoUtils';

interface HighlightedMomentsProps {
  moments: SentimentData[];
  selectedSentiment: string;
  onSeek: (time: number) => void;
  currentTime: number;
}

type SortOrder = 'confidence' | 'time';

const HighlightedMoments: React.FC<HighlightedMomentsProps> = ({ 
  moments, 
  selectedSentiment, 
  onSeek, 
  currentTime 
}) => {
  const [sortOrder, setSortOrder] = useState<SortOrder>('confidence');

  const processedMoments = useMemo(() => {
    if (!selectedSentiment) return [];
    
    // Filter moments by selected sentiment
    const filteredMoments = moments
      .filter(moment => moment.sentiment === selectedSentiment)
      .map(moment => ({
        ...moment,
        timeInSeconds: parseTimestamp(moment.timestamp),
        isActive: Math.abs(parseTimestamp(moment.timestamp) - currentTime) < 1
      }));

    // Sort based on selected order
    return filteredMoments.sort((a, b) => {
      if (sortOrder === 'confidence') {
        return b.confidence - a.confidence; // Highest confidence first
      } else {
        return a.timeInSeconds - b.timeInSeconds; // Earliest time first
      }
    });
  }, [moments, selectedSentiment, currentTime, sortOrder]);

  const handleMomentClick = (timeInSeconds: number) => {
    onSeek(timeInSeconds);
  };

  const toggleSortOrder = () => {
    setSortOrder(current => current === 'confidence' ? 'time' : 'confidence');
  };

  if (!selectedSentiment) {
    return (
      <div className="bg-dark-800 border border-dark-600 rounded-xl p-8 text-center">
        <Clock className="mx-auto mb-4 text-gray-500" size={48} />
        <h3 className="text-lg font-semibold text-white mb-2">Select a Sentiment</h3>
        <p className="text-gray-400">
          Choose a sentiment from the stats cards above or the filter panel to see highlighted moments
        </p>
      </div>
    );
  }

  if (processedMoments.length === 0) {
    return (
      <div className="bg-dark-800 border border-dark-600 rounded-xl p-8 text-center">
        <div 
          className="w-12 h-12 rounded-full mx-auto mb-4 flex items-center justify-center"
          style={{ backgroundColor: `${sentimentColors[selectedSentiment as keyof typeof sentimentColors]}20` }}
        >
          <div 
            className="w-6 h-6 rounded-full"
            style={{ backgroundColor: sentimentColors[selectedSentiment as keyof typeof sentimentColors] }}
          />
        </div>
        <h3 className="text-lg font-semibold text-white mb-2">No Moments Found</h3>
        <p className="text-gray-400">
          No {sentimentLabels[selectedSentiment as keyof typeof sentimentLabels].toLowerCase()} moments detected in this video
        </p>
      </div>
    );
  }

  return (
    <div className="bg-dark-800 border border-dark-600 rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div 
            className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ backgroundColor: `${sentimentColors[selectedSentiment as keyof typeof sentimentColors]}20` }}
          >
            <div 
              className="w-4 h-4 rounded-full"
              style={{ backgroundColor: sentimentColors[selectedSentiment as keyof typeof sentimentColors] }}
            />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">
              {sentimentLabels[selectedSentiment as keyof typeof sentimentLabels]} Moments
            </h3>
            <p className="text-sm text-gray-400">
              {processedMoments.length} moment{processedMoments.length !== 1 ? 's' : ''} detected
            </p>
          </div>
        </div>
        
        <button
          onClick={toggleSortOrder}
          className="flex items-center gap-2 px-3 py-2 bg-dark-700 hover:bg-dark-600 text-gray-300 rounded-lg transition-colors duration-200 text-sm border border-dark-600"
        >
          {sortOrder === 'confidence' ? (
            <>
              <TrendingUp size={16} />
              Sort by Confidence
            </>
          ) : (
            <>
              <Timer size={16} />
              Sort by Time
            </>
          )}
          <ArrowUpDown size={14} className="text-gray-500" />
        </button>
      </div>

      <div className="space-y-3 max-h-80 overflow-y-auto">
        {processedMoments.map((moment, index) => (
          <motion.div
            key={`${moment.timestamp}-${index}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className={`group relative p-4 rounded-lg border transition-all duration-200 cursor-pointer hover:scale-[1.02] ${
              moment.isActive
                ? 'bg-primary-500/20 border-primary-500/50 shadow-lg shadow-primary-500/20'
                : 'bg-dark-700 border-dark-600 hover:bg-dark-600 hover:border-dark-500'
            }`}
            onClick={() => handleMomentClick(moment.timeInSeconds)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full transition-colors duration-200 ${
                  moment.isActive 
                    ? 'bg-primary-500 text-white' 
                    : 'bg-dark-600 text-gray-400 group-hover:bg-primary-500 group-hover:text-white'
                }`}>
                  <Play size={16} />
                </div>
                
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-white font-medium">
                      {formatDuration(moment.timeInSeconds)}
                    </span>
                    {moment.isActive && (
                      <span className="px-2 py-1 bg-primary-500 text-white text-xs rounded-full">
                        Current
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-400">
                      Confidence: {(moment.confidence * 100).toFixed(1)}%
                    </span>
                    <div className="w-16 h-1 bg-dark-600 rounded-full overflow-hidden">
                      <div 
                        className="h-full rounded-full transition-all duration-300"
                        style={{ 
                          width: `${moment.confidence * 100}%`,
                          backgroundColor: sentimentColors[selectedSentiment as keyof typeof sentimentColors]
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="text-right">
                <div className="text-xs text-gray-500 mb-1">
                  {sortOrder === 'confidence' ? `#${index + 1}` : formatDuration(moment.timeInSeconds)}
                </div>
                <div className="text-xs text-gray-400">
                  {moment.confidence >= 0.8 ? 'High' : moment.confidence >= 0.6 ? 'Medium' : 'Low'}
                </div>
              </div>
            </div>
            
            {/* Hover effect overlay */}
            <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-transparent via-transparent to-primary-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none" />
          </motion.div>
        ))}
      </div>
      
      {processedMoments.length > 5 && (
        <div className="mt-4 pt-4 border-t border-dark-600">
          <p className="text-xs text-gray-500 text-center">
            Showing all {processedMoments.length} moments • Sorted by {sortOrder === 'confidence' ? 'confidence (highest first)' : 'time (earliest first)'} • Click any moment to jump to that time
          </p>
        </div>
      )}
    </div>
  );
};

export default HighlightedMoments;