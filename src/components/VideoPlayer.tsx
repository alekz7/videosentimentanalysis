import React, { useRef, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Play, Pause, Volume2, VolumeX, Maximize } from "lucide-react";
import { formatDuration, parseTimestamp } from "../utils/videoUtils";
import { SentimentData } from "../types";
import { sentimentColors } from "../utils/mockData";

interface VideoPlayerProps {
  src: string;
  currentTime: number;
  onTimeUpdate: (time: number) => void;
  onSeek: (time: number) => void;
  sentiments?: SentimentData[];
  selectedSentiment?: string;
  annotations?: ManualAnnotation[];
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({
  src,
  currentTime,
  onTimeUpdate,
  onSeek,
  sentiments = [],
  selectedSentiment,
  annotations = [],
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      onTimeUpdate(video.currentTime);
    };

    const handleLoadedMetadata = () => {
      setDuration(video.duration);
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    video.addEventListener("timeupdate", handleTimeUpdate);
    video.addEventListener("loadedmetadata", handleLoadedMetadata);
    video.addEventListener("play", handlePlay);
    video.addEventListener("pause", handlePause);

    return () => {
      video.removeEventListener("timeupdate", handleTimeUpdate);
      video.removeEventListener("loadedmetadata", handleLoadedMetadata);
      video.removeEventListener("play", handlePlay);
      video.removeEventListener("pause", handlePause);
    };
  }, [onTimeUpdate]);

  useEffect(() => {
    if (
      videoRef.current &&
      Math.abs(videoRef.current.currentTime - currentTime) > 1
    ) {
      videoRef.current.currentTime = currentTime;
    }
  }, [currentTime]);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const newTime = (clickX / rect.width) * duration;
    onSeek(newTime);
  };

  const handleMarkerClick = (timestamp: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const timeInSeconds = parseTimestamp(timestamp);
    onSeek(timeInSeconds);
  };

  const handleAnnotationClick = (
    annotation: ManualAnnotation,
    e: React.MouseEvent
  ) => {
    e.stopPropagation();
    if (annotation.type === "moment" && annotation.timestamp !== undefined) {
      onSeek(annotation.timestamp);
    } else if (
      annotation.type === "interval" &&
      annotation.startTimestamp !== undefined
    ) {
      onSeek(annotation.startTimestamp);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      videoRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // Filter sentiment markers based on selected sentiment
  const visibleSentimentMarkers = sentiments.filter(
    (sentiment) =>
      !selectedSentiment || sentiment.sentiment === selectedSentiment
  );

  return (
    <div className="bg-dark-800 rounded-xl overflow-hidden border border-dark-600">
      <div className="relative group">
        <video
          ref={videoRef}
          src={src}
          className="w-full aspect-video bg-black"
          playsInline
        />

        {/* Video Controls Overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        >
          <div className="absolute bottom-0 left-0 right-0 p-4">
            {/* Progress Bar Container */}
            <div className="relative mb-4">
              {/* Main Progress Bar */}
              <div
                className="w-full h-3 bg-white/20 rounded-full cursor-pointer relative"
                onClick={handleSeek}
              >
                {/* Progress Fill */}
                <div
                  className="h-full bg-primary-500 rounded-full relative"
                  style={{ width: `${(currentTime / duration) * 100}%` }}
                >
                  <div className="absolute right-0 top-1/2 w-4 h-4 bg-primary-500 rounded-full transform -translate-y-1/2 translate-x-1/2 shadow-lg" />
                </div>

                {/* Sentiment Markers */}
                {duration > 0 &&
                  visibleSentimentMarkers.map((sentiment, index) => {
                    const timeInSeconds = parseTimestamp(sentiment.timestamp);
                    const position = (timeInSeconds / duration) * 100;
                    const isActive = Math.abs(timeInSeconds - currentTime) < 1;

                    return (
                      <motion.div
                        key={`sentiment-${sentiment.timestamp}-${index}`}
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: index * 0.02 }}
                        className="absolute top-1/2 transform -translate-y-1/2 -translate-x-1/2 cursor-pointer group/marker"
                        style={{ left: `${position}%` }}
                        onClick={(e) =>
                          handleMarkerClick(sentiment.timestamp, e)
                        }
                      >
                        {/* Sentiment Marker Dot */}
                        <div
                          className={`w-3 h-3 rounded-full border-2 border-white shadow-lg transition-all duration-200 hover:scale-150 ${
                            isActive
                              ? "scale-150 ring-2 ring-white/50"
                              : "hover:scale-125"
                          }`}
                          style={{
                            backgroundColor:
                              sentimentColors[
                                sentiment.sentiment as keyof typeof sentimentColors
                              ],
                            opacity: sentiment.confidence * 0.8 + 0.2,
                          }}
                        />

                        {/* Sentiment Tooltip */}
                        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 opacity-0 group-hover/marker:opacity-100 transition-opacity duration-200 pointer-events-none">
                          <div className="bg-dark-900 text-white text-xs px-2 py-1 rounded-lg shadow-lg whitespace-nowrap border border-dark-600">
                            <div className="font-medium capitalize">
                              {sentiment.sentiment}
                            </div>
                            <div className="text-gray-400">
                              {formatDuration(timeInSeconds)} •{" "}
                              {(sentiment.confidence * 100).toFixed(0)}%
                            </div>
                            <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-2 border-r-2 border-t-2 border-transparent border-t-dark-900"></div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}

                {/* Manual Annotation Markers */}
                {duration > 0 &&
                  annotations.map((annotation, index) => {
                    if (
                      annotation.type === "moment" &&
                      annotation.timestamp !== undefined
                    ) {
                      const position = (annotation.timestamp / duration) * 100;
                      const isActive =
                        Math.abs(annotation.timestamp - currentTime) < 1;

                      return (
                        <motion.div
                          key={`annotation-moment-${annotation.id}`}
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{
                            delay:
                              (visibleSentimentMarkers.length + index) * 0.02,
                          }}
                          className="absolute top-1/2 transform -translate-y-1/2 -translate-x-1/2 cursor-pointer group/annotation"
                          style={{ left: `${position}%` }}
                          onClick={(e) => handleAnnotationClick(annotation, e)}
                        >
                          {/* Annotation Marker */}
                          <div
                            className={`w-4 h-4 rounded-sm border-2 border-white shadow-lg transition-all duration-200 hover:scale-125 ${
                              isActive ? "scale-125 ring-2 ring-white/50" : ""
                            }`}
                            style={{ backgroundColor: annotation.color }}
                          />

                          {/* Annotation Tooltip */}
                          <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 opacity-0 group-hover/annotation:opacity-100 transition-opacity duration-200 pointer-events-none">
                            <div className="bg-dark-900 text-white text-xs px-2 py-1 rounded-lg shadow-lg whitespace-nowrap border border-dark-600 max-w-32">
                              <div className="font-medium truncate">
                                {annotation.label}
                              </div>
                              <div className="text-gray-400">
                                {formatDuration(annotation.timestamp)} • Manual
                              </div>
                              <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-2 border-r-2 border-t-2 border-transparent border-t-dark-900"></div>
                            </div>
                          </div>
                        </motion.div>
                      );
                    } else if (
                      annotation.type === "interval" &&
                      annotation.startTimestamp !== undefined &&
                      annotation.endTimestamp !== undefined
                    ) {
                      const startPosition =
                        (annotation.startTimestamp / duration) * 100;
                      const endPosition =
                        (annotation.endTimestamp / duration) * 100;
                      const width = endPosition - startPosition;
                      const isActive =
                        currentTime >= annotation.startTimestamp &&
                        currentTime <= annotation.endTimestamp;

                      return (
                        <motion.div
                          key={`annotation-interval-${annotation.id}`}
                          initial={{ scaleX: 0, opacity: 0 }}
                          animate={{ scaleX: 1, opacity: 1 }}
                          transition={{
                            delay:
                              (visibleSentimentMarkers.length + index) * 0.02,
                          }}
                          className="absolute top-0 bottom-0 cursor-pointer group/annotation"
                          style={{
                            left: `${startPosition}%`,
                            width: `${width}%`,
                            backgroundColor: `${annotation.color}40`,
                            border: `2px solid ${annotation.color}`,
                            borderRadius: "4px",
                          }}
                          onClick={(e) => handleAnnotationClick(annotation, e)}
                        >
                          {/* Interval Tooltip */}
                          <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 opacity-0 group-hover/annotation:opacity-100 transition-opacity duration-200 pointer-events-none">
                            <div className="bg-dark-900 text-white text-xs px-2 py-1 rounded-lg shadow-lg whitespace-nowrap border border-dark-600 max-w-40">
                              <div className="font-medium truncate">
                                {annotation.label}
                              </div>
                              <div className="text-gray-400">
                                {formatDuration(annotation.startTimestamp)} -{" "}
                                {formatDuration(annotation.endTimestamp)}
                              </div>
                              <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-2 border-r-2 border-t-2 border-transparent border-t-dark-900"></div>
                            </div>
                          </div>
                        </motion.div>
                      );
                    }
                    return null;
                  })}
              </div>

              {/* Legend for markers */}
              {(visibleSentimentMarkers.length > 0 ||
                annotations.length > 0) && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute -top-8 left-0 flex items-center gap-4 text-xs text-white/80"
                >
                  {visibleSentimentMarkers.length > 0 && selectedSentiment && (
                    <div className="flex items-center gap-1">
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{
                          backgroundColor:
                            sentimentColors[
                              selectedSentiment as keyof typeof sentimentColors
                            ],
                        }}
                      />
                      <span className="capitalize">
                        {selectedSentiment} ({visibleSentimentMarkers.length})
                      </span>
                    </div>
                  )}
                  {annotations.length > 0 && (
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-sm bg-primary-500" />
                      <span>Manual annotations ({annotations.length})</span>
                    </div>
                  )}
                </motion.div>
              )}
            </div>

            {/* Control Buttons */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={togglePlay}
                  className="w-10 h-10 bg-primary-500 hover:bg-primary-600 rounded-full flex items-center justify-center transition-colors duration-200"
                >
                  {isPlaying ? <Pause size={20} /> : <Play size={20} />}
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={toggleMute}
                    className="text-white hover:text-primary-500 transition-colors"
                  >
                    {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                  </button>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={volume}
                    onChange={handleVolumeChange}
                    className="w-20 accent-primary-500"
                  />
                </div>

                <span className="text-white text-sm">
                  {formatDuration(currentTime)} / {formatDuration(duration)}
                </span>
              </div>

              <button
                onClick={toggleFullscreen}
                className="text-white hover:text-primary-500 transition-colors"
              >
                <Maximize size={20} />
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default VideoPlayer;
