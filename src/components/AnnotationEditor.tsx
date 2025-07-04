import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Edit3,
  Trash2,
  Save,
  X,
  Clock,
  Timer,
  Tag,
  Palette,
  MessageSquare,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { ManualAnnotation, AnnotationFormData } from "../types";
import { useManualAnnotations } from "../hooks/useManualAnnotations";
import { formatDuration } from "../utils/videoUtils";

interface AnnotationEditorProps {
  videoId: string;
  videoDuration: number;
  currentTime: number;
  onSeek: (time: number) => void;
  onAnnotationsChange?: (annotations: ManualAnnotation[]) => void;
}

const PRESET_COLORS = [
  "#FF6B35", // Primary orange
  "#10B981", // Green
  "#3B82F6", // Blue
  "#EF4444", // Red
  "#F59E0B", // Amber
  "#8B5CF6", // Purple
  "#EC4899", // Pink
  "#06B6D4", // Cyan
];

const AnnotationEditor: React.FC<AnnotationEditorProps> = ({
  videoId,
  videoDuration,
  currentTime,
  onSeek,
  onAnnotationsChange,
}) => {
  const {
    annotations,
    isLoading,
    error,
    fetchAnnotations,
    createAnnotation,
    updateAnnotation,
    deleteAnnotation,
  } = useManualAnnotations(videoId);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAnnotation, setEditingAnnotation] =
    useState<ManualAnnotation | null>(null);
  const [formData, setFormData] = useState<AnnotationFormData>({
    type: "moment",
    label: "",
    description: "",
    color: PRESET_COLORS[0],
    timestamp: currentTime,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Fetch annotations on mount
  useEffect(() => {
    fetchAnnotations();
  }, [fetchAnnotations]);

  // Notify parent of annotations changes
  useEffect(() => {
    if (onAnnotationsChange) {
      onAnnotationsChange(annotations);
    }
  }, [annotations, onAnnotationsChange]);

  // Update form timestamp when current time changes and form is open for new annotation
  useEffect(() => {
    if (isFormOpen && !editingAnnotation) {
      setFormData((prev) => ({
        ...prev,
        timestamp: formData.type === "moment" ? currentTime : prev.timestamp,
        startTimestamp:
          formData.type === "interval" ? currentTime : prev.startTimestamp,
      }));
    }
  }, [currentTime, isFormOpen, editingAnnotation, formData.type]);

  const openCreateForm = () => {
    setEditingAnnotation(null);
    setFormData({
      type: "moment",
      label: "",
      description: "",
      color: PRESET_COLORS[0],
      timestamp: currentTime,
    });
    setIsFormOpen(true);
  };

  const openEditForm = (annotation: ManualAnnotation) => {
    setEditingAnnotation(annotation);
    setFormData({
      type: annotation.type,
      label: annotation.label,
      description: annotation.description || "",
      color: annotation.color,
      timestamp: annotation.timestamp,
      startTimestamp: annotation.startTimestamp,
      endTimestamp: annotation.endTimestamp,
    });
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingAnnotation(null);
    setFormData({
      type: "moment",
      label: "",
      description: "",
      color: PRESET_COLORS[0],
      timestamp: currentTime,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (editingAnnotation) {
        await updateAnnotation(editingAnnotation.id, {
          label: formData.label,
          description: formData.description,
          color: formData.color,
        });
        setSuccessMessage("Annotation updated successfully!");
      } else {
        await createAnnotation(formData);
        setSuccessMessage("Annotation created successfully!");
      }

      closeForm();

      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      // Error is handled by the hook
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (annotationId: string) => {
    if (window.confirm("Are you sure you want to delete this annotation?")) {
      try {
        await deleteAnnotation(annotationId);
        setSuccessMessage("Annotation deleted successfully!");
        setTimeout(() => setSuccessMessage(null), 3000);
      } catch (err) {
        // Error is handled by the hook
      }
    }
  };

  const handleAnnotationClick = (annotation: ManualAnnotation) => {
    if (annotation.type === "moment" && annotation.timestamp !== undefined) {
      onSeek(annotation.timestamp);
    } else if (
      annotation.type === "interval" &&
      annotation.startTimestamp !== undefined
    ) {
      onSeek(annotation.startTimestamp);
    }
  };

  return (
    <div className="bg-dark-800 border border-dark-600 rounded-xl p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary-500/20 rounded-xl flex items-center justify-center">
            <Edit3 className="text-primary-500" size={18} />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">
              Manual Annotations
            </h3>
            <p className="text-sm text-gray-400">
              {annotations.length} annotation
              {annotations.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>

        <button
          onClick={openCreateForm}
          className="flex items-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors duration-200"
        >
          <Plus size={18} />
          Add Annotation
        </button>
      </div>

      {/* Success Message */}
      <AnimatePresence>
        {successMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-4 p-3 bg-green-500/20 border border-green-500/30 rounded-lg flex items-center gap-2"
          >
            <CheckCircle className="text-green-400" size={16} />
            <span className="text-green-300 text-sm">{successMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg flex items-center gap-2">
          <AlertCircle className="text-red-400" size={16} />
          <span className="text-red-300 text-sm">{error}</span>
        </div>
      )}

      {/* Annotation Form */}
      <AnimatePresence>
        {isFormOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-6 overflow-hidden"
          >
            <form
              onSubmit={handleSubmit}
              className="bg-dark-700 rounded-lg p-4 border border-dark-600"
            >
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-white font-medium">
                  {editingAnnotation
                    ? "Edit Annotation"
                    : "Create New Annotation"}
                </h4>
                <button
                  type="button"
                  onClick={closeForm}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Type Selection (only for new annotations) */}
                {!editingAnnotation && (
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Annotation Type
                    </label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setFormData((prev) => ({
                            ...prev,
                            type: "moment",
                            timestamp: currentTime,
                            startTimestamp: undefined,
                            endTimestamp: undefined,
                          }))
                        }
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors duration-200 ${
                          formData.type === "moment"
                            ? "bg-primary-500 text-white"
                            : "bg-dark-600 text-gray-300 hover:bg-dark-500"
                        }`}
                      >
                        <Clock size={16} />
                        Moment
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setFormData((prev) => ({
                            ...prev,
                            type: "interval",
                            timestamp: undefined,
                            startTimestamp: currentTime,
                            endTimestamp: Math.min(
                              currentTime + 10,
                              videoDuration
                            ),
                          }))
                        }
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors duration-200 ${
                          formData.type === "interval"
                            ? "bg-primary-500 text-white"
                            : "bg-dark-600 text-gray-300 hover:bg-dark-500"
                        }`}
                      >
                        <Timer size={16} />
                        Interval
                      </button>
                    </div>
                  </div>
                )}

                {/* Label */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    <Tag size={14} className="inline mr-1" />
                    Label *
                  </label>
                  <input
                    type="text"
                    value={formData.label}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        label: e.target.value,
                      }))
                    }
                    placeholder="Enter annotation label"
                    className="w-full px-3 py-2 bg-dark-600 border border-dark-500 rounded-lg text-white placeholder-gray-400 focus:border-primary-500 focus:outline-none"
                    required
                  />
                </div>

                {/* Color */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    <Palette size={14} className="inline mr-1" />
                    Color
                  </label>
                  <div className="flex gap-2">
                    {PRESET_COLORS.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() =>
                          setFormData((prev) => ({ ...prev, color }))
                        }
                        className={`w-8 h-8 rounded-full border-2 transition-all duration-200 ${
                          formData.color === color
                            ? "border-white scale-110"
                            : "border-dark-500 hover:border-gray-400"
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>

                {/* Timestamps */}
                {formData.type === "moment" ? (
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Timestamp
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={formData.timestamp || 0}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            timestamp: Math.max(
                              0,
                              Math.min(
                                parseFloat(e.target.value) || 0,
                                videoDuration
                              )
                            ),
                          }))
                        }
                        min="0"
                        max={videoDuration}
                        step="0.1"
                        className="flex-1 px-3 py-2 bg-dark-600 border border-dark-500 rounded-lg text-white focus:border-primary-500 focus:outline-none"
                        disabled={!!editingAnnotation}
                      />
                      <span className="text-gray-400 text-sm">
                        {formatDuration(formData.timestamp || 0)}
                      </span>
                    </div>
                  </div>
                ) : (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Start Time
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={formData.startTimestamp || 0}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              startTimestamp: Math.max(
                                0,
                                Math.min(
                                  parseFloat(e.target.value) || 0,
                                  videoDuration
                                )
                              ),
                            }))
                          }
                          min="0"
                          max={videoDuration}
                          step="0.1"
                          className="flex-1 px-3 py-2 bg-dark-600 border border-dark-500 rounded-lg text-white focus:border-primary-500 focus:outline-none"
                          disabled={!!editingAnnotation}
                        />
                        <span className="text-gray-400 text-sm">
                          {formatDuration(formData.startTimestamp || 0)}
                        </span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        End Time
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={formData.endTimestamp || 0}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              endTimestamp: Math.max(
                                0,
                                Math.min(
                                  parseFloat(e.target.value) || 0,
                                  videoDuration
                                )
                              ),
                            }))
                          }
                          min="0"
                          max={videoDuration}
                          step="0.1"
                          className="flex-1 px-3 py-2 bg-dark-600 border border-dark-500 rounded-lg text-white focus:border-primary-500 focus:outline-none"
                          disabled={!!editingAnnotation}
                        />
                        <span className="text-gray-400 text-sm">
                          {formatDuration(formData.endTimestamp || 0)}
                        </span>
                      </div>
                    </div>
                  </>
                )}

                {/* Description */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    <MessageSquare size={14} className="inline mr-1" />
                    Description (Optional)
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    placeholder="Add additional notes or description"
                    rows={2}
                    className="w-full px-3 py-2 bg-dark-600 border border-dark-500 rounded-lg text-white placeholder-gray-400 focus:border-primary-500 focus:outline-none resize-none"
                  />
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex justify-end gap-2 mt-4">
                <button
                  type="button"
                  onClick={closeForm}
                  className="px-4 py-2 bg-dark-600 hover:bg-dark-500 text-gray-300 rounded-lg transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !formData.label.trim()}
                  className="flex items-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 disabled:bg-primary-500/50 text-white rounded-lg transition-colors duration-200"
                >
                  <Save size={16} />
                  {isSubmitting
                    ? "Saving..."
                    : editingAnnotation
                    ? "Update"
                    : "Create"}
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Annotations List */}
      <div className="space-y-3 max-h-80 overflow-y-auto">
        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full mx-auto mb-2"></div>
            <p className="text-gray-400 text-sm">Loading annotations...</p>
          </div>
        ) : annotations.length === 0 ? (
          <div className="text-center py-8">
            <Edit3 className="mx-auto mb-4 text-gray-500" size={48} />
            <h4 className="text-lg font-semibold text-white mb-2">
              No Annotations Yet
            </h4>
            <p className="text-gray-400 text-sm">
              Create your first annotation to mark important moments or
              intervals in the video
            </p>
          </div>
        ) : (
          annotations.map((annotation) => (
            <motion.div
              key={annotation.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="group bg-dark-700 rounded-lg p-4 border border-dark-600 hover:border-dark-500 transition-all duration-200 cursor-pointer"
              onClick={() => handleAnnotationClick(annotation)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: annotation.color }}
                    />
                    <span className="text-white font-medium truncate">
                      {annotation.label}
                    </span>
                    <span className="text-xs text-gray-400 bg-dark-600 px-2 py-1 rounded">
                      {annotation.type === "moment" ? (
                        <>
                          <Clock size={10} className="inline mr-1" />
                          {formatDuration(annotation.timestamp || 0)}
                        </>
                      ) : (
                        <>
                          <Timer size={10} className="inline mr-1" />
                          {formatDuration(
                            annotation.startTimestamp || 0
                          )} - {formatDuration(annotation.endTimestamp || 0)}
                        </>
                      )}
                    </span>
                  </div>

                  {annotation.description && (
                    <p className="text-gray-400 text-sm mb-2 line-clamp-2">
                      {annotation.description}
                    </p>
                  )}

                  <p className="text-xs text-gray-500">
                    Created {annotation.createdAt.toLocaleDateString()}
                  </p>
                </div>

                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      openEditForm(annotation);
                    }}
                    className="p-2 text-gray-400 hover:text-primary-400 hover:bg-dark-600 rounded-lg transition-colors duration-200"
                  >
                    <Edit3 size={14} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(annotation.id);
                    }}
                    className="p-2 text-gray-400 hover:text-red-400 hover:bg-dark-600 rounded-lg transition-colors duration-200"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};

export default AnnotationEditor;
