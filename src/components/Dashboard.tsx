import React, { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BarChart3,
  Filter,
  Eye,
  Brain,
  Download,
  Share2,
  Target,
  Image,
  Wifi,
  WifiOff,
  Loader2,
  Clock,
} from "lucide-react";
import { VideoAnalysis, UploadProgress, ManualAnnotation } from "../types";
import { sentimentLabels, sentimentColors } from "../utils/mockData";
import { useManualAnnotations } from "../hooks/useManualAnnotations";
import VideoPlayer from "./VideoPlayer";
import SentimentChart from "./SentimentChart";
import HighlightedMoments from "./HighlightedMoments";
import SentimentImageGallery from "./SentimentImageGallery";
import ProgressBar from "./ProgressBar";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

interface DashboardProps {
  analysis: VideoAnalysis;
  isMockMode: boolean;
  onToggleMockMode: () => void;
  isProcessing?: boolean;
  processingProgress?: UploadProgress | null;
  videoId?: string;
  jobId?: string;
}

const Dashboard: React.FC<DashboardProps> = ({
  analysis,
  isMockMode,
  onToggleMockMode,
  isProcessing = false,
  processingProgress = null,
  videoId,
  jobId,
}) => {
  const [currentTime, setCurrentTime] = useState(0);
  const [selectedSentiment, setSelectedSentiment] = useState<string>("");
  const [liveProgress, setLiveProgress] = useState<UploadProgress | null>(
    processingProgress
  );

  // Load manual annotations
  const { annotations, fetchAnnotations } = useManualAnnotations(analysis.id);

  // Fetch annotations when component mounts
  useEffect(() => {
    fetchAnnotations();
  }, [fetchAnnotations]);

  // Poll for live progress when in processing mode
  useEffect(() => {
    if (!isProcessing || !videoId || !jobId || isMockMode) {
      setLiveProgress(null);
      return;
    }

    const pollProgress = async () => {
      try {
        const response = await fetch(
          `${API_BASE_URL}/upload/${videoId}/status/${jobId}`
        );
        if (response.ok) {
          const data = await response.json();

          if (data.error) {
            setLiveProgress({
              percentage: 0,
              stage: "uploading",
              message: `Error: ${data.error}`,
            });
            return;
          }

          // Map server status to progress stages
          let stage: UploadProgress["stage"] = "analyzing";
          let message = "Processing video...";

          if (data.progress <= 30) {
            stage = "compressing";
            message = "Compressing video...";
          } else if (data.progress <= 70) {
            stage = "analyzing";
            message = "Analyzing sentiment...";
          } else if (data.progress < 100) {
            stage = "analyzing";
            message = "Finalizing analysis...";
          } else {
            stage = "completed";
            message = "Analysis complete!";
          }

          setLiveProgress({
            percentage: data.progress || 0,
            stage,
            message,
          });

          // Stop polling when completed or failed
          if (data.status === "completed" || data.status === "failed") {
            return;
          }
        }
      } catch (error) {
        console.error("Error polling progress:", error);
        setLiveProgress({
          percentage: 0,
          stage: "uploading",
          message: "Error checking progress",
        });
      }
    };

    // Initial poll
    pollProgress();

    // Set up polling interval
    const interval = setInterval(pollProgress, 1000);

    return () => clearInterval(interval);
  }, [isProcessing, videoId, jobId, isMockMode]);

  const sentimentStats = useMemo(() => {
    const stats: Record<
      string,
      {
        count: number;
        percentage: number;
        avgConfidence: number;
        totalConfidence: number;
      }
    > = {};

    analysis.sentiments.forEach((item) => {
      if (!stats[item.sentiment]) {
        stats[item.sentiment] = {
          count: 0,
          percentage: 0,
          avgConfidence: 0,
          totalConfidence: 0,
        };
      }
      stats[item.sentiment].count++;
      stats[item.sentiment].totalConfidence += item.confidence;
      stats[item.sentiment].avgConfidence += item.confidence;
    });

    // Calculate total confidence across all sentiments for percentage calculation
    const totalConfidence = Object.values(stats).reduce(
      (sum, stat) => sum + stat.totalConfidence,
      0
    );

    Object.keys(stats).forEach((sentiment) => {
      stats[sentiment].percentage =
        (stats[sentiment].totalConfidence / totalConfidence) * 100;
      stats[sentiment].avgConfidence =
        stats[sentiment].avgConfidence / stats[sentiment].count;
    });

    return stats;
  }, [analysis.sentiments]);

  const filteredMoments = useMemo(() => {
    return analysis.sentiments.filter(
      (moment) => !selectedSentiment || moment.sentiment === selectedSentiment
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
    const exportData = {
      video: {
        id: analysis.id,
        filename: analysis.filename,
        duration: analysis.duration,
        createdAt: analysis.createdAt,
      },
      sentiments: analysis.sentiments,
      annotations: annotations,
    };

    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `video-analysis-${analysis.filename}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Show processing state when in live mode and processing
  const showProcessing = !isMockMode && isProcessing && liveProgress;

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
              Analyzing:{" "}
              <span className="text-primary-500 font-medium">
                {analysis.filename}
              </span>
              {annotations.length > 0 && (
                <span className="ml-4 text-orange-400">
                  • {annotations.length} manual annotation
                  {annotations.length !== 1 ? "s" : ""}
                </span>
              )}
            </p>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={onToggleMockMode}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors duration-200 ${
                isMockMode
                  ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                  : "bg-green-500/20 text-green-400 border border-green-500/30"
              }`}
            >
              {isMockMode ? <WifiOff size={18} /> : <Wifi size={18} />}
              {isMockMode ? "Demo Mode" : "Live Analysis"}
            </button>

            <button
              onClick={exportData}
              disabled={showProcessing}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors duration-200 ${
                showProcessing
                  ? "bg-dark-700 text-gray-500 border-dark-600 cursor-not-allowed"
                  : "bg-dark-700 hover:bg-dark-600 text-gray-300 border-dark-600"
              }`}
            >
              <Download size={18} />
              Export Data
            </button>

            <button
              disabled={showProcessing}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors duration-200 ${
                showProcessing
                  ? "bg-primary-500/50 text-white/50 cursor-not-allowed"
                  : "bg-primary-500 hover:bg-primary-600 text-white"
              }`}
            >
              <Share2 size={18} />
              Share
            </button>
          </div>
        </motion.div>

        {/* Mode Indicator */}
        {isMockMode && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg"
          >
            <div className="flex items-center gap-2 text-amber-400">
              <WifiOff size={16} />
              <span className="text-sm font-medium">
                Demo Mode Active - Using simulated data for demonstration
                purposes
              </span>
            </div>
          </motion.div>
        )}

        {/* Processing Indicator */}
        {showProcessing && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg"
          >
            <div className="flex items-center gap-3 text-blue-400 mb-3">
              <Loader2 size={20} className="animate-spin" />
              <span className="font-medium">Live Analysis in Progress</span>
            </div>
            <ProgressBar progress={liveProgress!} />
          </motion.div>
        )}

        <AnimatePresence mode="wait">
          {showProcessing ? (
            // Processing State
            <motion.div
              key="processing"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              {/* Video Player (still available during processing) */}
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                <div className="lg:col-span-3">
                  <div className="mb-4">
                    <h2 className="text-xl font-semibold text-white mb-2 flex items-center gap-2">
                      <BarChart3 className="text-primary-500" size={24} />
                      Video Preview
                    </h2>
                    <p className="text-gray-400">
                      Analysis results will appear here once processing is
                      complete
                    </p>
                  </div>
                  <VideoPlayer
                    src={analysis.url}
                    currentTime={currentTime}
                    onTimeUpdate={handleTimeUpdate}
                    onSeek={handleSeek}
                    sentiments={[]} // No sentiments during processing
                    selectedSentiment=""
                    annotations={annotations}
                  />
                </div>

                {/* Processing Status Panel */}
                <div className="space-y-6">
                  <div className="bg-dark-800 border border-dark-600 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <Clock className="text-primary-500" size={20} />
                      Processing Status
                    </h3>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-400">Stage:</span>
                        <span className="text-white capitalize">
                          {liveProgress?.stage}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-400">Progress:</span>
                        <span className="text-primary-400 font-medium">
                          {liveProgress?.percentage}%
                        </span>
                      </div>

                      <div className="pt-4 border-t border-dark-600">
                        <p className="text-xs text-gray-500">
                          This may take a few minutes depending on video length
                          and complexity.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-dark-800 border border-dark-600 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-white mb-4">
                      What's Happening?
                    </h3>

                    <div className="space-y-3 text-sm">
                      <div className="flex items-start gap-3">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                        <div>
                          <p className="text-white font-medium">
                            Video Compression
                          </p>
                          <p className="text-gray-400">
                            Optimizing video for analysis
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2 flex-shrink-0"></div>
                        <div>
                          <p className="text-white font-medium">
                            Frame Extraction
                          </p>
                          <p className="text-gray-400">
                            Capturing frames for analysis
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
                        <div>
                          <p className="text-white font-medium">AI Analysis</p>
                          <p className="text-gray-400">
                            Detecting emotions and sentiments
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Placeholder sections */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  "Sentiment Timeline",
                  "Highlighted Moments",
                  "Video Screenshots",
                ].map((title, index) => (
                  <div
                    key={title}
                    className="bg-dark-800 border border-dark-600 rounded-xl p-8 text-center"
                  >
                    <div className="w-12 h-12 bg-dark-700 rounded-full mx-auto mb-4 flex items-center justify-center">
                      <Loader2
                        className="text-gray-500 animate-spin"
                        size={24}
                      />
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2">
                      {title}
                    </h3>
                    <p className="text-gray-400 text-sm">
                      Available after analysis completes
                    </p>
                  </div>
                ))}
              </div>
            </motion.div>
          ) : (
            // Completed Analysis State
            <motion.div
              key="completed"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                {Object.entries(sentimentStats)
                  .sort(([, a], [, b]) => b.percentage - a.percentage)
                  .map(([sentiment, stats]) => (
                    <div
                      key={sentiment}
                      className={`bg-dark-800 border rounded-xl p-4 cursor-pointer transition-all duration-200 hover:scale-105 ${
                        selectedSentiment === sentiment
                          ? "border-primary-500 bg-primary-500/10 shadow-lg shadow-primary-500/20"
                          : "border-dark-600 hover:border-dark-500"
                      }`}
                      onClick={() =>
                        setSelectedSentiment(
                          selectedSentiment === sentiment ? "" : sentiment
                        )
                      }
                    >
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-white font-medium text-sm">
                          {
                            sentimentLabels[
                              sentiment as keyof typeof sentimentLabels
                            ]
                          }
                        </h3>
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{
                            backgroundColor:
                              sentimentColors[
                                sentiment as keyof typeof sentimentColors
                              ],
                          }}
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
              </div>

              {/* Main Content */}
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Video Player */}
                <div className="lg:col-span-3">
                  <div className="mb-4">
                    <h2 className="text-xl font-semibold text-white mb-2 flex items-center gap-2">
                      <BarChart3 className="text-primary-500" size={24} />
                      Video Analysis
                      {selectedSentiment && (
                        <span className="text-sm text-gray-400 ml-2">
                          • Showing{" "}
                          {
                            sentimentLabels[
                              selectedSentiment as keyof typeof sentimentLabels
                            ]
                          }{" "}
                          markers
                        </span>
                      )}
                    </h2>
                  </div>
                  <VideoPlayer
                    src={analysis.url}
                    currentTime={currentTime}
                    onTimeUpdate={handleTimeUpdate}
                    onSeek={handleSeek}
                    sentiments={analysis.sentiments}
                    selectedSentiment={selectedSentiment}
                    annotations={annotations}
                  />
                </div>

                {/* Sentiment Filter */}
                <div className="space-y-6">
                  <div className="bg-dark-800 border border-dark-600 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <Filter className="text-primary-500" size={20} />
                      Filter Timeline
                    </h3>
                    <div className="space-y-2">
                      <button
                        onClick={() => setSelectedSentiment("")}
                        className={`w-full text-left px-3 py-2 rounded-lg transition-colors duration-200 ${
                          !selectedSentiment
                            ? "bg-primary-500/20 text-primary-400 border border-primary-500/30"
                            : "text-gray-300 hover:bg-dark-700"
                        }`}
                      >
                        All Sentiments
                      </button>
                      {Object.keys(sentimentStats).map((sentiment) => (
                        <button
                          key={sentiment}
                          onClick={() => setSelectedSentiment(sentiment)}
                          className={`w-full text-left px-3 py-2 rounded-lg transition-colors duration-200 flex items-center gap-2 ${
                            selectedSentiment === sentiment
                              ? "bg-primary-500/20 text-primary-400 border border-primary-500/30"
                              : "text-gray-300 hover:bg-dark-700"
                          }`}
                        >
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{
                              backgroundColor:
                                sentimentColors[
                                  sentiment as keyof typeof sentimentColors
                                ],
                            }}
                          />
                          {
                            sentimentLabels[
                              sentiment as keyof typeof sentimentLabels
                            ]
                          }
                          <span className="ml-auto text-sm">
                            {sentimentStats[sentiment].count}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Sentiment Chart */}
              <div>
                <div className="mb-4">
                  <h2 className="text-xl font-semibold text-white mb-2">
                    Multi-Sentiment Timeline with Manual Annotations
                  </h2>
                  <p className="text-gray-400">
                    {selectedSentiment
                      ? `Showing ${
                          sentimentLabels[
                            selectedSentiment as keyof typeof sentimentLabels
                          ]
                        } timeline with manual annotations - click chart points to jump to that moment`
                      : "All sentiment lines and manual annotations displayed - click any point to jump to that moment in the video"}
                  </p>
                </div>
                <SentimentChart
                  data={analysis.sentiments}
                  currentTime={currentTime}
                  onTimeClick={handleChartClick}
                  selectedSentiment={selectedSentiment}
                  annotations={annotations}
                />
              </div>

              {/* Highlighted Moments */}
              <div>
                <div className="mb-4">
                  <h2 className="text-xl font-semibold text-white mb-2 flex items-center gap-2">
                    <Target className="text-primary-500" size={24} />
                    Highlighted Moments
                  </h2>
                  <p className="text-gray-400">
                    {selectedSentiment
                      ? `Jump to specific ${sentimentLabels[
                          selectedSentiment as keyof typeof sentimentLabels
                        ].toLowerCase()} moments in the video`
                      : "Select a sentiment above to see specific moments you can jump to"}
                  </p>
                </div>
                <HighlightedMoments
                  moments={filteredMoments}
                  selectedSentiment={selectedSentiment}
                  onSeek={handleSeek}
                  currentTime={currentTime}
                />
              </div>

              {/* Screenshot Gallery */}
              <div>
                <div className="mb-4">
                  <h2 className="text-xl font-semibold text-white mb-2 flex items-center gap-2">
                    <Image className="text-primary-500" size={24} />
                    Video Screenshots
                  </h2>
                  <p className="text-gray-400">
                    {selectedSentiment
                      ? `Screenshots from ${sentimentLabels[
                          selectedSentiment as keyof typeof sentimentLabels
                        ].toLowerCase()} moments - click to jump to that time`
                      : "Visual gallery of analyzed moments - select a sentiment to filter screenshots"}
                  </p>
                </div>
                <SentimentImageGallery
                  moments={filteredMoments}
                  selectedSentiment={selectedSentiment}
                  onSeek={handleSeek}
                  currentTime={currentTime}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Dashboard;
