import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  History, 
  Play, 
  Clock, 
  FileVideo, 
  Calendar,
  TrendingUp,
  Search,
  Filter,
  SortAsc,
  SortDesc,
  Loader2,
  AlertCircle,
  Eye
} from 'lucide-react';
import { formatDuration, formatFileSize } from '../utils/videoUtils';

interface AnalysisHistoryItem {
  id: string;
  filename: string;
  duration: number;
  fileSize: number;
  sentimentCount: number;
  createdAt: string;
  thumbnailUrl: string;
}

interface AnalysisHistoryProps {
  onLoadAnalysis: (videoId: string) => void;
  isLoading?: boolean;
}

type SortField = 'date' | 'filename' | 'duration' | 'sentiments';
type SortOrder = 'asc' | 'desc';

const AnalysisHistory: React.FC<AnalysisHistoryProps> = ({ onLoadAnalysis, isLoading = false }) => {
  const [history, setHistory] = useState<AnalysisHistoryItem[]>([]);
  const [filteredHistory, setFilteredHistory] = useState<AnalysisHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  useEffect(() => {
    fetchHistory();
  }, []);

  useEffect(() => {
    // Filter and sort history
    let filtered = history.filter(item =>
      item.filename.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Sort
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortField) {
        case 'date':
          aValue = new Date(a.createdAt).getTime();
          bValue = new Date(b.createdAt).getTime();
          break;
        case 'filename':
          aValue = a.filename.toLowerCase();
          bValue = b.filename.toLowerCase();
          break;
        case 'duration':
          aValue = a.duration;
          bValue = b.duration;
          break;
        case 'sentiments':
          aValue = a.sentimentCount;
          bValue = b.sentimentCount;
          break;
        default:
          aValue = a.createdAt;
          bValue = b.createdAt;
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredHistory(filtered);
  }, [history, searchTerm, sortField, sortOrder]);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('http://localhost:3001/api/upload/history');
      
      if (!response.ok) {
        throw new Error('Failed to fetch analysis history');
      }
      
      const data = await response.json();
      setHistory(data.history || []);
    } catch (err) {
      console.error('Error fetching history:', err);
      setError(err instanceof Error ? err.message : 'Failed to load history');
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      return 'Today';
    } else if (diffDays === 2) {
      return 'Yesterday';
    } else if (diffDays <= 7) {
      return `${diffDays - 1} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return null;
    return sortOrder === 'asc' ? <SortAsc size={14} /> : <SortDesc size={14} />;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <Loader2 className="mx-auto mb-4 text-primary-500 animate-spin" size={48} />
          <h2 className="text-xl font-semibold text-white mb-2">Loading Analysis History</h2>
          <p className="text-gray-400">Fetching your past video analyses...</p>
        </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-md"
        >
          <AlertCircle className="mx-auto mb-4 text-red-500" size={48} />
          <h2 className="text-xl font-semibold text-white mb-2">Error Loading History</h2>
          <p className="text-gray-400 mb-4">{error}</p>
          <button
            onClick={fetchHistory}
            className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors duration-200"
          >
            Try Again
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-900 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-primary-500/20 rounded-xl flex items-center justify-center">
              <History className="text-primary-500" size={24} />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Analysis History</h1>
              <p className="text-gray-400">
                {history.length} video{history.length !== 1 ? 's' : ''} analyzed
              </p>
            </div>
          </div>
        </motion.div>

        {/* Search and Filter Controls */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-dark-800 border border-dark-600 rounded-xl p-6 mb-6"
        >
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search by filename..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white placeholder-gray-400 focus:border-primary-500 focus:outline-none"
              />
            </div>

            {/* Sort Controls */}
            <div className="flex gap-2">
              <button
                onClick={() => handleSort('date')}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors duration-200 text-sm ${
                  sortField === 'date'
                    ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30'
                    : 'bg-dark-700 text-gray-300 border border-dark-600 hover:bg-dark-600'
                }`}
              >
                <Calendar size={16} />
                Date
                {getSortIcon('date')}
              </button>
              
              <button
                onClick={() => handleSort('filename')}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors duration-200 text-sm ${
                  sortField === 'filename'
                    ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30'
                    : 'bg-dark-700 text-gray-300 border border-dark-600 hover:bg-dark-600'
                }`}
              >
                <FileVideo size={16} />
                Name
                {getSortIcon('filename')}
              </button>
              
              <button
                onClick={() => handleSort('duration')}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors duration-200 text-sm ${
                  sortField === 'duration'
                    ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30'
                    : 'bg-dark-700 text-gray-300 border border-dark-600 hover:bg-dark-600'
                }`}
              >
                <Clock size={16} />
                Duration
                {getSortIcon('duration')}
              </button>
              
              <button
                onClick={() => handleSort('sentiments')}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors duration-200 text-sm ${
                  sortField === 'sentiments'
                    ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30'
                    : 'bg-dark-700 text-gray-300 border border-dark-600 hover:bg-dark-600'
                }`}
              >
                <TrendingUp size={16} />
                Data Points
                {getSortIcon('sentiments')}
              </button>
            </div>
          </div>
        </motion.div>

        {/* History List */}
        <AnimatePresence>
          {filteredHistory.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-dark-800 border border-dark-600 rounded-xl p-12 text-center"
            >
              <History className="mx-auto mb-4 text-gray-500" size={48} />
              <h3 className="text-lg font-semibold text-white mb-2">
                {searchTerm ? 'No matching analyses found' : 'No analyses yet'}
              </h3>
              <p className="text-gray-400">
                {searchTerm 
                  ? 'Try adjusting your search terms'
                  : 'Upload and analyze your first video to see it here'
                }
              </p>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredHistory.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-dark-800 border border-dark-600 rounded-xl overflow-hidden hover:border-primary-500/50 transition-all duration-200 group cursor-pointer"
                  onClick={() => onLoadAnalysis(item.id)}
                >
                  {/* Thumbnail */}
                  <div className="aspect-video bg-dark-700 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <div className="bg-primary-500 text-white rounded-full p-3 shadow-lg">
                        <Play size={24} />
                      </div>
                    </div>
                    <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                      {formatDuration(item.duration)}
                    </div>
                    <div className="absolute top-2 left-2 bg-primary-500 text-white text-xs px-2 py-1 rounded">
                      {item.sentimentCount} data points
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-4">
                    <h3 className="text-white font-medium mb-2 truncate group-hover:text-primary-400 transition-colors duration-200">
                      {item.filename}
                    </h3>
                    
                    <div className="space-y-2 text-sm text-gray-400">
                      <div className="flex items-center justify-between">
                        <span>Created:</span>
                        <span>{formatDate(item.createdAt)}</span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span>File size:</span>
                        <span>{formatFileSize(item.fileSize)}</span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span>Sentiments:</span>
                        <span className="text-primary-400 font-medium">
                          {item.sentimentCount} points
                        </span>
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-dark-600">
                      <button
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary-500/20 hover:bg-primary-500/30 text-primary-400 rounded-lg transition-colors duration-200 group-hover:bg-primary-500 group-hover:text-white"
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <>
                            <Loader2 size={16} className="animate-spin" />
                            Loading...
                          </>
                        ) : (
                          <>
                            <Eye size={16} />
                            View Analysis
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </AnimatePresence>

        {/* Results Summary */}
        {filteredHistory.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-8 text-center text-gray-400 text-sm"
          >
            Showing {filteredHistory.length} of {history.length} analyses
            {searchTerm && (
              <span className="ml-2">
                • Filtered by "{searchTerm}"
              </span>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default AnalysisHistory;