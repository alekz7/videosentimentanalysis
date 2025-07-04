import { useState, useCallback } from "react";
import axios from "axios";
import { ManualAnnotation, AnnotationFormData } from "../types";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export const useManualAnnotations = (videoId: string) => {
  const [annotations, setAnnotations] = useState<ManualAnnotation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Helper to convert seconds to timestamp string
  const secondsToTimestamp = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `00:${minutes.toString().padStart(2, "0")}:${remainingSeconds
      .toString()
      .padStart(2, "0")}`;
  };

  // Helper to convert timestamp string to seconds
  const timestampToSeconds = (timestamp: string): number => {
    const parts = timestamp.split(":");
    const minutes = parseInt(parts[1] || "0");
    const seconds = parseInt(parts[2] || "0");
    return minutes * 60 + seconds;
  };

  // Fetch all annotations for the video
  const fetchAnnotations = useCallback(async () => {
    if (!videoId) return;

    try {
      setIsLoading(true);
      setError(null);

      const response = await axios.get(
        `${API_BASE_URL}/annotations/${videoId}`
      );

      // Transform timestamps back to seconds for frontend use
      const transformedAnnotations = response.data.annotations.map(
        (annotation: any) => ({
          ...annotation,
          timestamp: annotation.timestamp
            ? timestampToSeconds(annotation.timestamp)
            : undefined,
          startTimestamp: annotation.startTimestamp
            ? timestampToSeconds(annotation.startTimestamp)
            : undefined,
          endTimestamp: annotation.endTimestamp
            ? timestampToSeconds(annotation.endTimestamp)
            : undefined,
          createdAt: new Date(annotation.createdAt),
          updatedAt: new Date(annotation.updatedAt),
        })
      );

      setAnnotations(transformedAnnotations);
    } catch (err) {
      console.error("Error fetching annotations:", err);
      setError(
        err instanceof Error ? err.message : "Failed to fetch annotations"
      );
    } finally {
      setIsLoading(false);
    }
  }, [videoId]);

  // Create a new annotation
  const createAnnotation = useCallback(
    async (formData: AnnotationFormData) => {
      if (!videoId) return null;

      try {
        setError(null);

        // Transform seconds to timestamp strings for backend
        const payload = {
          type: formData.type,
          label: formData.label,
          description: formData.description,
          color: formData.color,
          timestamp:
            formData.type === "moment" && formData.timestamp !== undefined
              ? secondsToTimestamp(formData.timestamp)
              : undefined,
          startTimestamp:
            formData.type === "interval" &&
            formData.startTimestamp !== undefined
              ? secondsToTimestamp(formData.startTimestamp)
              : undefined,
          endTimestamp:
            formData.type === "interval" && formData.endTimestamp !== undefined
              ? secondsToTimestamp(formData.endTimestamp)
              : undefined,
        };

        const response = await axios.post(
          `${API_BASE_URL}/annotations/${videoId}`,
          payload
        );

        // Transform response back to frontend format
        const newAnnotation = {
          ...response.data.annotation,
          timestamp: response.data.annotation.timestamp
            ? timestampToSeconds(response.data.annotation.timestamp)
            : undefined,
          startTimestamp: response.data.annotation.startTimestamp
            ? timestampToSeconds(response.data.annotation.startTimestamp)
            : undefined,
          endTimestamp: response.data.annotation.endTimestamp
            ? timestampToSeconds(response.data.annotation.endTimestamp)
            : undefined,
          createdAt: new Date(response.data.annotation.createdAt),
          updatedAt: new Date(response.data.annotation.updatedAt),
        };

        setAnnotations((prev) => [newAnnotation, ...prev]);
        return newAnnotation;
      } catch (err) {
        console.error("Error creating annotation:", err);
        const errorMessage =
          err instanceof Error ? err.message : "Failed to create annotation";
        setError(errorMessage);
        throw new Error(errorMessage);
      }
    },
    [videoId]
  );

  // Update an existing annotation
  const updateAnnotation = useCallback(
    async (annotationId: string, updates: Partial<AnnotationFormData>) => {
      if (!videoId) return null;

      try {
        setError(null);

        const response = await axios.put(
          `${API_BASE_URL}/annotations/${videoId}/${annotationId}`,
          updates
        );

        // Transform response back to frontend format
        const updatedAnnotation = {
          ...response.data.annotation,
          timestamp: response.data.annotation.timestamp
            ? timestampToSeconds(response.data.annotation.timestamp)
            : undefined,
          startTimestamp: response.data.annotation.startTimestamp
            ? timestampToSeconds(response.data.annotation.startTimestamp)
            : undefined,
          endTimestamp: response.data.annotation.endTimestamp
            ? timestampToSeconds(response.data.annotation.endTimestamp)
            : undefined,
          createdAt: new Date(response.data.annotation.createdAt),
          updatedAt: new Date(response.data.annotation.updatedAt),
        };

        setAnnotations((prev) =>
          prev.map((annotation) =>
            annotation.id === annotationId ? updatedAnnotation : annotation
          )
        );
        return updatedAnnotation;
      } catch (err) {
        console.error("Error updating annotation:", err);
        const errorMessage =
          err instanceof Error ? err.message : "Failed to update annotation";
        setError(errorMessage);
        throw new Error(errorMessage);
      }
    },
    [videoId]
  );

  // Delete an annotation
  const deleteAnnotation = useCallback(
    async (annotationId: string) => {
      if (!videoId) return;

      try {
        setError(null);

        await axios.delete(
          `${API_BASE_URL}/annotations/${videoId}/${annotationId}`
        );

        setAnnotations((prev) =>
          prev.filter((annotation) => annotation.id !== annotationId)
        );
      } catch (err) {
        console.error("Error deleting annotation:", err);
        const errorMessage =
          err instanceof Error ? err.message : "Failed to delete annotation";
        setError(errorMessage);
        throw new Error(errorMessage);
      }
    },
    [videoId]
  );

  // Get annotation statistics
  const getAnnotationStats = useCallback(async () => {
    if (!videoId) return null;

    try {
      const response = await axios.get(
        `${API_BASE_URL}/annotations/${videoId}/stats`
      );
      return response.data.stats;
    } catch (err) {
      console.error("Error fetching annotation stats:", err);
      return null;
    }
  }, [videoId]);

  return {
    annotations,
    isLoading,
    error,
    fetchAnnotations,
    createAnnotation,
    updateAnnotation,
    deleteAnnotation,
    getAnnotationStats,
  };
};
