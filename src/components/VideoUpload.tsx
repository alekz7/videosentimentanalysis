import React, { useCallback, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, X, FileVideo, AlertCircle } from 'lucide-react';
import { validateVideoFile, formatFileSize, createVideoThumbnail } from '../utils/videoUtils';
import { UploadProgress } from '../types';
import ProgressBar from './ProgressBar';

interface VideoUploadProps {
  onUploadComplete: (file: File, url: string) => void;
  isUploading: boolean;
  progress: UploadProgress | null;
}

const VideoUpload: React.FC<VideoUploadProps> = ({ onUploadComplete, isUploading, progress }) => {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [thumbnail, setThumbnail] = useState<string | null>(null);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelection(e.dataTransfer.files[0]);
    }
  }, []);

  const handleFileSelection = async (file: File) => {
    setError(null);
    
    const validation = validateVideoFile(file);
    if (!validation.isValid) {
      setError(validation.error!);
      return;
    }

    setSelectedFile(file);
    
    try {
      const thumbnailUrl = await createVideoThumbnail(file);
      setThumbnail(thumbnailUrl);
    } catch (err) {
      console.warn('Could not create thumbnail:', err);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelection(e.target.files[0]);
    }
  };

  const startUpload = () => {
    if (!selectedFile) return;
    
    const url = URL.createObjectURL(selectedFile);
    onUploadComplete(selectedFile, url);
  };

  const clearSelection = () => {
    setSelectedFile(null);
    setThumbnail(null);
    setError(null);
  };

  if (isUploading && progress) {
    return (
      <div className="max-w-2xl mx-auto p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-dark-800 rounded-2xl p-8 border border-dark-600"
        >
          <h2 className="text-2xl font-semibold text-white mb-6 text-center">
            Processing Your Video
          </h2>
          <ProgressBar progress={progress} />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <h1 className="text-4xl font-bold text-white mb-4">
          Video Sentiment <span className="text-primary-500">Analyzer</span>
        </h1>
        <p className="text-gray-300 text-lg">
          Upload your video to analyze facial expressions and emotions in real-time
        </p>
      </motion.div>

      <AnimatePresence mode="wait">
        {!selectedFile ? (
          <motion.div
            key="upload"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={`relative border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-300 ${
              dragActive 
                ? 'border-primary-500 bg-primary-500/10' 
                : 'border-dark-600 bg-dark-800 hover:border-primary-500/50 hover:bg-primary-500/5'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input
              type="file"
              accept="video/*"
              onChange={handleFileInput}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            
            <motion.div
              animate={{ scale: dragActive ? 1.1 : 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              <Upload 
                size={64} 
                className={`mx-auto mb-6 ${
                  dragActive ? 'text-primary-500' : 'text-gray-400'
                }`} 
              />
            </motion.div>
            
            <h3 className="text-xl font-semibold text-white mb-2">
              {dragActive ? 'Drop your video here' : 'Upload Video File'}
            </h3>
            <p className="text-gray-400 mb-4">
              Drag and drop or click to select
            </p>
            <p className="text-sm text-gray-500">
              MP4, WebM, or MOV • Max 100MB • Up to 2 minutes
            </p>
          </motion.div>
        ) : (
          <motion.div
            key="preview"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-dark-800 rounded-2xl p-6 border border-dark-600"
          >
            <div className="flex items-start gap-4">
              {thumbnail && (
                <div className="flex-shrink-0 w-24 h-24 rounded-lg overflow-hidden bg-dark-700">
                  <img 
                    src={thumbnail} 
                    alt="Video thumbnail" 
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              
              <div className="flex-grow min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <FileVideo className="text-primary-500" size={20} />
                  <h3 className="text-lg font-medium text-white truncate">
                    {selectedFile.name}
                  </h3>
                </div>
                <p className="text-gray-400 mb-2">
                  {formatFileSize(selectedFile.size)}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={startUpload}
                    className="bg-primary-500 hover:bg-primary-600 text-white px-6 py-2 rounded-lg font-medium transition-colors duration-200"
                  >
                    Start Analysis
                  </button>
                  <button
                    onClick={clearSelection}
                    className="bg-dark-700 hover:bg-dark-600 text-gray-300 px-4 py-2 rounded-lg transition-colors duration-200"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 p-4 bg-red-500/20 border border-red-500/30 rounded-lg flex items-center gap-2"
        >
          <AlertCircle className="text-red-400" size={20} />
          <span className="text-red-300">{error}</span>
        </motion.div>
      )}
    </div>
  );
};

export default VideoUpload;