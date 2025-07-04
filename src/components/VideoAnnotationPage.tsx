import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Play, Pause, SkipBack, SkipForward } from "lucide-react";
import { VideoAnalysis, ManualAnnotation } from "../types";
import { useManualAnnotations } from "../hooks/useManualAnnotations";
import VideoPlayer from "./VideoPlayer";
import AnnotationEditor from "./AnnotationEditor";

interface VideoAnnotationPageProps {
  analysis: VideoAnalysis;
  onBack: () => void;
}

const VideoAnnotationPage: React.FC<VideoAnnotationPageProps> = ({
  analysis,
  onBack,
}) => {
  const [currentTime, setCurrentTime] = useState(0);
  const [annotations, setAnnotations] = useState<ManualAnnotation[]>([]);
  const { fetchAnnotations } = useManualAnnotations(analysis.id);

  // Load annotations on mount
  useEffect(() => {
    const loadAnnotations = async () => {
      try {
        await fetchAnnotations();
      } catch (error) {
        console.error("Failed to load annotations:", error);
      }
    };
    loadAnnotations();
  }, [fetchAnnotations]);

  const handleTimeUpdate = (time: number) => {
    setCurrentTime(time);
  };

  const handleSeek = (time: number) => {
    setCurrentTime(time);
  };

  const handleAnnotationsChange = (newAnnotations: ManualAnnotation[]) => {
    setAnnotations(newAnnotations);
  };

  // Quick navigation functions
  const skipBackward = () => {
    const newTime = Math.max(0, currentTime - 10);
    handleSeek(newTime);
  };

  const skipForward = () => {
    const newTime = Math.min(analysis.duration, currentTime + 10);
    handleSeek(newTime);
  };

  const jumpToStart = () => {
    handleSeek(0);
  };

  const jumpToEnd = () => {
    handleSeek(analysis.duration);
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
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="flex items-center gap-2 px-4 py-2 bg-dark-800 hover:bg-dark-700 text-gray-300 rounded-lg border border-dark-600 transition-colors duration-200"
            >
              <ArrowLeft size={18} />
              Back to Dashboard
            </button>

            <div>
              <h1 className="text-3xl font-bold text-white">
                Video Annotation Editor
              </h1>
              <p className="text-gray-400">
                Editing:{" "}
                <span className="text-primary-500 font-medium">
                  {analysis.filename}
                </span>
              </p>
            </div>
          </div>

          {/* Quick Navigation Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={jumpToStart}
              className="p-2 bg-dark-800 hover:bg-dark-700 text-gray-300 rounded-lg border border-dark-600 transition-colors duration-200"
              title="Jump to start"
            >
              <SkipBack size={18} />
            </button>

            <button
              onClick={skipBackward}
              className="p-2 bg-dark-800 hover:bg-dark-700 text-gray-300 rounded-lg border border-dark-600 transition-colors duration-200"
              title="Skip backward 10s"
            >
              <SkipBack size={18} />
              <span className="text-xs">10s</span>
            </button>

            <button
              onClick={skipForward}
              className="p-2 bg-dark-800 hover:bg-dark-700 text-gray-300 rounded-lg border border-dark-600 transition-colors duration-200"
              title="Skip forward 10s"
            >
              <span className="text-xs">10s</span>
              <SkipForward size={18} />
            </button>

            <button
              onClick={jumpToEnd}
              className="p-2 bg-dark-800 hover:bg-dark-700 text-gray-300 rounded-lg border border-dark-600 transition-colors duration-200"
              title="Jump to end"
            >
              <SkipForward size={18} />
            </button>
          </div>
        </motion.div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Video Player */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <div className="mb-4">
                <h2 className="text-xl font-semibold text-white mb-2">
                  Video Player
                </h2>
                <p className="text-gray-400">
                  Use the timeline to navigate and the annotation panel to mark
                  important moments
                </p>
              </div>

              <VideoPlayer
                src={analysis.url}
                currentTime={currentTime}
                onTimeUpdate={handleTimeUpdate}
                onSeek={handleSeek}
                sentiments={[]} // Don't show sentiment markers in annotation mode
                selectedSentiment=""
                annotations={annotations} // Pass annotations to show on timeline
              />

              {/* Current Time Display */}
              <div className="mt-4 p-4 bg-dark-800 border border-dark-600 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="text-white">
                    <span className="text-2xl font-mono">
                      {Math.floor(currentTime / 60)
                        .toString()
                        .padStart(2, "0")}
                      :
                      {Math.floor(currentTime % 60)
                        .toString()
                        .padStart(2, "0")}
                    </span>
                    <span className="text-gray-400 ml-2">
                      /{" "}
                      {Math.floor(analysis.duration / 60)
                        .toString()
                        .padStart(2, "0")}
                      :
                      {Math.floor(analysis.duration % 60)
                        .toString()
                        .padStart(2, "0")}
                    </span>
                  </div>

                  <div className="text-gray-400 text-sm">
                    Current position: {currentTime.toFixed(1)}s
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Annotation Editor */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <AnnotationEditor
                videoId={analysis.id}
                videoDuration={analysis.duration}
                currentTime={currentTime}
                onSeek={handleSeek}
                onAnnotationsChange={handleAnnotationsChange}
              />
            </motion.div>
          </div>
        </div>

        {/* Instructions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-8 bg-dark-800 border border-dark-600 rounded-xl p-6"
        >
          <h3 className="text-lg font-semibold text-white mb-4">How to Use</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-gray-400">
            <div>
              <h4 className="text-white font-medium mb-2">
                Creating Annotations
              </h4>
              <ul className="space-y-1">
                <li>• Click "Add Annotation" to create a new marker</li>
                <li>• Choose "Moment" for single time points</li>
                <li>• Choose "Interval" for time ranges</li>
                <li>• The current video time is automatically used</li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-medium mb-2">Navigation</h4>
              <ul className="space-y-1">
                <li>• Click on annotations to jump to that time</li>
                <li>• Use the video timeline to scrub through</li>
                <li>• Use skip buttons for quick 10-second jumps</li>
                <li>• Annotations will appear on the main dashboard</li>
              </ul>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default VideoAnnotationPage;
