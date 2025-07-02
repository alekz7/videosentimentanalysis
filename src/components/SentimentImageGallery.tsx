import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Image, Play, Clock, Maximize2, X } from 'lucide-react';
import { SentimentData } from '../types';
import { sentimentColors, sentimentLabels } from '../utils/mockData';
import { parseTimestamp, formatDuration } from '../utils/videoUtils';

interface SentimentImageGalleryProps {
  moments: SentimentData[];
  selectedSentiment: string;
  onSeek: (time: number) => void;
  currentTime: number;
}

const SentimentImageGallery: React.FC<SentimentImageGalleryProps> = ({
  moments,
  selectedSentiment,
  onSeek,
  currentTime
}) => {
  const [selectedImage, setSelectedImage] = useState<SentimentData | null>(null);

  const galleryImages = useMemo(() => {
    return moments
      .filter(moment => 
        moment.imageUrl && 
        (!selectedSentiment || moment.sentiment === selectedSentiment)
      )
      .map(moment => ({
        ...moment,
        timeInSeconds: parseTimestamp(moment.timestamp),
        isActive: Math.abs(parseTimestamp(moment.timestamp) - currentTime) < 1
      }))
      .sort((a, b) => b.confidence - a.confidence); // Sort by confidence
  }, [moments, selectedSentiment, currentTime]);

  const handleImageClick = (moment: SentimentData) => {
    const timeInSeconds = parseTimestamp(moment.timestamp);
    onSeek(timeInSeconds);
  };

  const openImageModal = (moment: SentimentData, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedImage(moment);
  };

  const closeImageModal = () => {
    setSelectedImage(null);
  };

  if (galleryImages.length === 0) {
    return (
      <div className="bg-dark-800 border border-dark-600 rounded-xl p-8 text-center">
        <Image className="mx-auto mb-4 text-gray-500" size={48} />
        <h3 className="text-lg font-semibold text-white mb-2">No Screenshots Available</h3>
        <p className="text-gray-400">
          {selectedSentiment 
            ? `No screenshots found for ${sentimentLabels[selectedSentiment as keyof typeof sentimentLabels].toLowerCase()} moments`
            : 'Select a sentiment to view related screenshots from the video analysis'
          }
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-dark-800 border border-dark-600 rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary-500/20 flex items-center justify-center">
              <Image className="text-primary-500" size={18} />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">
                {selectedSentiment 
                  ? `${sentimentLabels[selectedSentiment as keyof typeof sentimentLabels]} Screenshots`
                  : 'Video Screenshots'
                }
              </h3>
              <p className="text-sm text-gray-400">
                {galleryImages.length} screenshot{galleryImages.length !== 1 ? 's' : ''} available
              </p>
            </div>
          </div>
          
          {selectedSentiment && (
            <div 
              className="w-6 h-6 rounded-full"
              style={{ backgroundColor: sentimentColors[selectedSentiment as keyof typeof sentimentColors] }}
            />
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 max-h-96 overflow-y-auto">
          {galleryImages.map((moment, index) => (
            <motion.div
              key={`${moment.timestamp}-${index}`}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              className={`group relative aspect-square rounded-lg overflow-hidden cursor-pointer transition-all duration-200 hover:scale-105 ${
                moment.isActive
                  ? 'ring-2 ring-primary-500 shadow-lg shadow-primary-500/20'
                  : 'hover:ring-2 hover:ring-primary-500/50'
              }`}
              onClick={() => handleImageClick(moment)}
            >
              <img
                src={moment.imageUrl}
                alt={`${moment.sentiment} at ${moment.timestamp}`}
                className="w-full h-full object-cover"
                loading="lazy"
              />
              
              {/* Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <div className="absolute bottom-0 left-0 right-0 p-2">
                  <div className="flex items-center justify-between text-white text-xs">
                    <span className="font-medium">{formatDuration(moment.timeInSeconds)}</span>
                    <span>{(moment.confidence * 100).toFixed(0)}%</span>
                  </div>
                </div>
              </div>

              {/* Sentiment indicator */}
              <div 
                className="absolute top-2 left-2 w-3 h-3 rounded-full border-2 border-white shadow-lg"
                style={{ backgroundColor: sentimentColors[moment.sentiment as keyof typeof sentimentColors] }}
              />

              {/* Current time indicator */}
              {moment.isActive && (
                <div className="absolute top-2 right-2 bg-primary-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                  Now
                </div>
              )}

              {/* Play button overlay */}
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <div className="bg-primary-500 text-white rounded-full p-2 shadow-lg">
                  <Play size={16} />
                </div>
              </div>

              {/* Expand button */}
              <button
                onClick={(e) => openImageModal(moment, e)}
                className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-black/70"
              >
                <Maximize2 size={12} />
              </button>
            </motion.div>
          ))}
        </div>

        <div className="mt-4 pt-4 border-t border-dark-600">
          <p className="text-xs text-gray-500 text-center">
            Click any screenshot to jump to that moment • Hover to see details • Click expand icon for full view
          </p>
        </div>
      </div>

      {/* Image Modal */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
            onClick={closeImageModal}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative max-w-4xl max-h-full bg-dark-800 rounded-xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={closeImageModal}
                className="absolute top-4 right-4 bg-black/50 text-white rounded-full p-2 hover:bg-black/70 transition-colors duration-200 z-10"
              >
                <X size={20} />
              </button>

              <img
                src={selectedImage.imageUrl}
                alt={`${selectedImage.sentiment} at ${selectedImage.timestamp}`}
                className="w-full h-auto max-h-[80vh] object-contain"
              />

              <div className="p-6 bg-dark-800">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-6 h-6 rounded-full"
                      style={{ backgroundColor: sentimentColors[selectedImage.sentiment as keyof typeof sentimentColors] }}
                    />
                    <div>
                      <h3 className="text-lg font-semibold text-white">
                        {sentimentLabels[selectedImage.sentiment as keyof typeof sentimentLabels]}
                      </h3>
                      <p className="text-sm text-gray-400">
                        Timestamp: {formatDuration(parseTimestamp(selectedImage.timestamp))}
                      </p>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => {
                      handleImageClick(selectedImage);
                      closeImageModal();
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors duration-200"
                  >
                    <Play size={16} />
                    Jump to Moment
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-400">Confidence:</span>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 h-2 bg-dark-600 rounded-full overflow-hidden">
                        <div 
                          className="h-full rounded-full transition-all duration-300"
                          style={{ 
                            width: `${selectedImage.confidence * 100}%`,
                            backgroundColor: sentimentColors[selectedImage.sentiment as keyof typeof sentimentColors]
                          }}
                        />
                      </div>
                      <span className="text-white font-medium">
                        {(selectedImage.confidence * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  
                  <div>
                    <span className="text-gray-400">Quality:</span>
                    <p className="text-white font-medium mt-1">
                      {selectedImage.confidence >= 0.8 ? 'High Confidence' : 
                       selectedImage.confidence >= 0.6 ? 'Medium Confidence' : 'Low Confidence'}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default SentimentImageGallery;