import React, { useMemo, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Eye, EyeOff } from 'lucide-react';
import { SentimentData } from '../types';
import { sentimentColors, sentimentLabels } from '../utils/mockData';
import { parseTimestamp } from '../utils/videoUtils';

interface SentimentChartProps {
  data: SentimentData[];
  currentTime: number;
  onTimeClick: (time: number) => void;
  selectedSentiment?: string;
}

const SentimentChart: React.FC<SentimentChartProps> = ({ 
  data, 
  currentTime, 
  onTimeClick,
  selectedSentiment 
}) => {
  const [visibleSentiments, setVisibleSentiments] = useState<Set<string>>(
    new Set(['happy', 'neutral', 'sad', 'angry', 'surprised', 'fearful'])
  );

  const chartData = useMemo(() => {
    // Group data by timestamp and create a comprehensive dataset
    const timeMap = new Map<number, Record<string, number>>();
    
    // Initialize all timestamps with zero values for all sentiments
    data.forEach(item => {
      const time = parseTimestamp(item.timestamp);
      if (!timeMap.has(time)) {
        timeMap.set(time, {
          time,
          happy: 0,
          neutral: 0,
          sad: 0,
          angry: 0,
          surprised: 0,
          fearful: 0,
        });
      }
      
      // Set the confidence for the detected sentiment
      const timeData = timeMap.get(time)!;
      timeData[item.sentiment] = item.confidence;
    });
    
    // Convert to array and sort by time
    return Array.from(timeMap.values()).sort((a, b) => a.time - b.time);
  }, [data]);

  const sentimentTypes = ['happy', 'neutral', 'sad', 'angry', 'surprised', 'fearful'];

  const toggleSentimentVisibility = (sentiment: string) => {
    const newVisible = new Set(visibleSentiments);
    if (newVisible.has(sentiment)) {
      newVisible.delete(sentiment);
    } else {
      newVisible.add(sentiment);
    }
    setVisibleSentiments(newVisible);
  };

  const toggleAllSentiments = () => {
    if (visibleSentiments.size === sentimentTypes.length) {
      // Hide all
      setVisibleSentiments(new Set());
    } else {
      // Show all
      setVisibleSentiments(new Set(sentimentTypes));
    }
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const timeInSeconds = label;
      const minutes = Math.floor(timeInSeconds / 60);
      const seconds = timeInSeconds % 60;
      
      // Filter out zero values and sort by confidence
      const activeSentiments = payload
        .filter((item: any) => item.value > 0 && visibleSentiments.has(item.dataKey))
        .sort((a: any, b: any) => b.value - a.value);

      return (
        <div className="bg-dark-800 border border-dark-600 rounded-lg p-4 shadow-lg min-w-48">
          <p className="text-gray-300 mb-2 font-medium">
            Time: {minutes}:{seconds.toString().padStart(2, '0')}
          </p>
          {activeSentiments.length > 0 ? (
            <div className="space-y-1">
              {activeSentiments.map((item: any) => (
                <div key={item.dataKey} className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-white text-sm">
                      {sentimentLabels[item.dataKey as keyof typeof sentimentLabels]}
                    </span>
                  </div>
                  <span className="text-gray-400 text-sm font-medium">
                    {(item.value * 100).toFixed(1)}%
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-sm">No visible sentiment detected</p>
          )}
        </div>
      );
    }
    return null;
  };

  const CustomDot = (props: any) => {
    const { cx, cy, payload, dataKey } = props;
    const value = payload[dataKey];
    
    // Only show dots for non-zero values and visible sentiments
    if (value === 0 || !visibleSentiments.has(dataKey)) return null;
    
    return (
      <circle
        cx={cx}
        cy={cy}
        r={3}
        fill={sentimentColors[dataKey as keyof typeof sentimentColors]}
        stroke="#1F2937"
        strokeWidth={1}
        className="cursor-pointer hover:r-5 transition-all duration-200"
        onClick={() => onTimeClick(payload.time)}
      />
    );
  };

  const getVisibleSentiments = () => {
    if (selectedSentiment) {
      return visibleSentiments.has(selectedSentiment) ? [selectedSentiment] : [];
    }
    return sentimentTypes.filter(sentiment => visibleSentiments.has(sentiment));
  };

  return (
    <div className="space-y-4">
      {/* Interactive Legend/Controls */}
      <div className="bg-dark-800 border border-dark-600 rounded-xl p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Sentiment Lines</h3>
          <button
            onClick={toggleAllSentiments}
            className="flex items-center gap-2 px-3 py-1 bg-dark-700 hover:bg-dark-600 text-gray-300 rounded-lg transition-colors duration-200 text-sm"
          >
            {visibleSentiments.size === sentimentTypes.length ? (
              <>
                <EyeOff size={16} />
                Hide All
              </>
            ) : (
              <>
                <Eye size={16} />
                Show All
              </>
            )}
          </button>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
          {sentimentTypes.map((sentiment) => {
            const isVisible = visibleSentiments.has(sentiment);
            const isSelected = selectedSentiment === sentiment;
            
            return (
              <button
                key={sentiment}
                onClick={() => toggleSentimentVisibility(sentiment)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 text-sm ${
                  isVisible
                    ? isSelected
                      ? 'bg-primary-500/20 border border-primary-500/50 text-primary-400'
                      : 'bg-dark-700 border border-dark-600 text-white hover:bg-dark-600'
                    : 'bg-dark-900 border border-dark-700 text-gray-500 hover:bg-dark-800'
                }`}
              >
                <div className="flex items-center gap-2 flex-1">
                  <div 
                    className={`w-3 h-3 rounded-full transition-opacity duration-200 ${
                      isVisible ? 'opacity-100' : 'opacity-30'
                    }`}
                    style={{ backgroundColor: sentimentColors[sentiment as keyof typeof sentimentColors] }}
                  />
                  <span className="truncate">
                    {sentimentLabels[sentiment as keyof typeof sentimentLabels]}
                  </span>
                </div>
                {isVisible ? (
                  <Eye size={14} className="text-green-400" />
                ) : (
                  <EyeOff size={14} className="text-gray-500" />
                )}
              </button>
            );
          })}
        </div>
        
        <div className="mt-3 text-xs text-gray-400">
          {visibleSentiments.size} of {sentimentTypes.length} sentiment lines visible
          {selectedSentiment && (
            <span className="ml-2 text-primary-400">
              • Filtered by {sentimentLabels[selectedSentiment as keyof typeof sentimentLabels]}
            </span>
          )}
        </div>
      </div>

      {/* Chart */}
      <div className="w-full h-96 bg-dark-800 rounded-xl p-6 border border-dark-600">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis 
              dataKey="time" 
              stroke="#9CA3AF"
              tickFormatter={(value) => {
                const minutes = Math.floor(value / 60);
                const seconds = value % 60;
                return `${minutes}:${seconds.toString().padStart(2, '0')}`;
              }}
            />
            <YAxis 
              domain={[0, 1]} 
              stroke="#9CA3AF"
              tickFormatter={(value) => `${(value * 100).toFixed(0)}%`}
            />
            <Tooltip content={<CustomTooltip />} />
            
            {/* Current time indicator */}
            <ReferenceLine 
              x={currentTime} 
              stroke="#FF6B35" 
              strokeWidth={2}
              strokeDasharray="4 4"
              label={{ value: "Current", position: "top", fill: "#FF6B35" }}
            />
            
            {/* Render lines for each visible sentiment */}
            {getVisibleSentiments().map((sentiment) => (
              <Line
                key={sentiment}
                type="monotone"
                dataKey={sentiment}
                stroke={sentimentColors[sentiment as keyof typeof sentimentColors]}
                strokeWidth={selectedSentiment === sentiment ? 4 : 2}
                dot={<CustomDot />}
                activeDot={{ 
                  r: 5, 
                  fill: sentimentColors[sentiment as keyof typeof sentimentColors],
                  stroke: '#1F2937',
                  strokeWidth: 2
                }}
                connectNulls={false}
                opacity={selectedSentiment && selectedSentiment !== sentiment ? 0.3 : 1}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default SentimentChart;