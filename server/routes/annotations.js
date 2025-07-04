import express from "express";
import { v4 as uuidv4 } from "uuid";
import database from "../config/database.js";

const router = express.Router();

// Get all manual annotations for a video
router.get("/:videoId", async (req, res) => {
  const { videoId } = req.params;

  try {
    console.log(`📋 Fetching manual annotations for video: ${videoId}`);

    // Verify video exists
    const video = await database.videos.findOne({ _id: videoId });
    if (!video) {
      return res.status(404).json({ error: "Video not found" });
    }

    // Get all manual annotations for this video
    const annotations = await database.manualAnnotations
      .find({ video_id: videoId })
      .sort({ created_at: -1 })
      .toArray();

    console.log(`📊 Found ${annotations.length} manual annotations`);

    // Transform annotations for frontend
    const formattedAnnotations = annotations.map((annotation) => ({
      id: annotation._id,
      videoId: annotation.video_id,
      type: annotation.type,
      label: annotation.label,
      description: annotation.description || null,
      color: annotation.color || "#FF6B35",
      timestamp: annotation.timestamp || null,
      startTimestamp: annotation.start_timestamp || null,
      endTimestamp: annotation.end_timestamp || null,
      createdAt: annotation.created_at,
      updatedAt: annotation.updated_at,
    }));

    res.json({
      success: true,
      annotations: formattedAnnotations,
    });
  } catch (error) {
    console.error("❌ Annotations fetch error:", error);
    res.status(500).json({ error: "Failed to fetch annotations" });
  }
});

// Create a new manual annotation
router.post("/:videoId", async (req, res) => {
  const { videoId } = req.params;
  const {
    type,
    label,
    description,
    color,
    timestamp,
    startTimestamp,
    endTimestamp,
  } = req.body;

  try {
    console.log(`📝 Creating manual annotation for video: ${videoId}`);

    // Verify video exists
    const video = await database.videos.findOne({ _id: videoId });
    if (!video) {
      return res.status(404).json({ error: "Video not found" });
    }

    // Validate required fields
    if (!type || !label) {
      return res.status(400).json({
        error: "Type and label are required fields",
      });
    }

    // Validate annotation type
    if (!["moment", "interval"].includes(type)) {
      return res.status(400).json({
        error: "Type must be either 'moment' or 'interval'",
      });
    }

    // Validate timestamps based on type
    if (type === "moment") {
      if (!timestamp) {
        return res.status(400).json({
          error: "Timestamp is required for moment annotations",
        });
      }
      if (startTimestamp || endTimestamp) {
        return res.status(400).json({
          error:
            "Start and end timestamps should not be provided for moment annotations",
        });
      }
    } else if (type === "interval") {
      if (!startTimestamp || !endTimestamp) {
        return res.status(400).json({
          error:
            "Start and end timestamps are required for interval annotations",
        });
      }
      if (timestamp) {
        return res.status(400).json({
          error: "Timestamp should not be provided for interval annotations",
        });
      }
      // Validate that start is before end
      if (parseFloat(startTimestamp) >= parseFloat(endTimestamp)) {
        return res.status(400).json({
          error: "Start timestamp must be before end timestamp",
        });
      }
    }

    // Validate timestamps are within video duration
    const validateTimestamp = (ts, name) => {
      const timeValue = parseFloat(ts);
      if (isNaN(timeValue) || timeValue < 0 || timeValue > video.duration) {
        throw new Error(
          `${name} must be between 0 and ${video.duration} seconds`
        );
      }
    };

    if (timestamp) validateTimestamp(timestamp, "Timestamp");
    if (startTimestamp) validateTimestamp(startTimestamp, "Start timestamp");
    if (endTimestamp) validateTimestamp(endTimestamp, "End timestamp");

    const annotationId = uuidv4();
    const now = new Date();

    // Create annotation document
    const annotationDoc = {
      _id: annotationId,
      video_id: videoId,
      type,
      label: label.trim(),
      description: description?.trim() || null,
      color: color || "#FF6B35",
      timestamp: type === "moment" ? timestamp : null,
      start_timestamp: type === "interval" ? startTimestamp : null,
      end_timestamp: type === "interval" ? endTimestamp : null,
      created_at: now,
      updated_at: now,
    };

    await database.manualAnnotations.insertOne(annotationDoc);
    console.log(`✅ Manual annotation created: ${annotationId}`);

    // Return formatted annotation
    const formattedAnnotation = {
      id: annotationDoc._id,
      videoId: annotationDoc.video_id,
      type: annotationDoc.type,
      label: annotationDoc.label,
      description: annotationDoc.description,
      color: annotationDoc.color,
      timestamp: annotationDoc.timestamp,
      startTimestamp: annotationDoc.start_timestamp,
      endTimestamp: annotationDoc.end_timestamp,
      createdAt: annotationDoc.created_at,
      updatedAt: annotationDoc.updated_at,
    };

    res.status(201).json({
      success: true,
      annotation: formattedAnnotation,
    });
  } catch (error) {
    console.error("❌ Annotation creation error:", error);
    res
      .status(500)
      .json({ error: "Failed to create annotation: " + error.message });
  }
});

// Update an existing manual annotation
router.put("/:videoId/:annotationId", async (req, res) => {
  const { videoId, annotationId } = req.params;
  const { label, description, color } = req.body;

  try {
    console.log(`📝 Updating manual annotation: ${annotationId}`);

    // Verify annotation exists and belongs to the video
    const annotation = await database.manualAnnotations.findOne({
      _id: annotationId,
      video_id: videoId,
    });

    if (!annotation) {
      return res.status(404).json({ error: "Annotation not found" });
    }

    // Validate required fields
    if (!label) {
      return res.status(400).json({
        error: "Label is required",
      });
    }

    // Update annotation
    const updateDoc = {
      label: label.trim(),
      description: description?.trim() || null,
      color: color || annotation.color,
      updated_at: new Date(),
    };

    await database.manualAnnotations.updateOne(
      { _id: annotationId },
      { $set: updateDoc }
    );

    // Get updated annotation
    const updatedAnnotation = await database.manualAnnotations.findOne({
      _id: annotationId,
    });

    console.log(`✅ Manual annotation updated: ${annotationId}`);

    // Return formatted annotation
    const formattedAnnotation = {
      id: updatedAnnotation._id,
      videoId: updatedAnnotation.video_id,
      type: updatedAnnotation.type,
      label: updatedAnnotation.label,
      description: updatedAnnotation.description,
      color: updatedAnnotation.color,
      timestamp: updatedAnnotation.timestamp,
      startTimestamp: updatedAnnotation.start_timestamp,
      endTimestamp: updatedAnnotation.end_timestamp,
      createdAt: updatedAnnotation.created_at,
      updatedAt: updatedAnnotation.updated_at,
    };

    res.json({
      success: true,
      annotation: formattedAnnotation,
    });
  } catch (error) {
    console.error("❌ Annotation update error:", error);
    res
      .status(500)
      .json({ error: "Failed to update annotation: " + error.message });
  }
});

// Delete a manual annotation
router.delete("/:videoId/:annotationId", async (req, res) => {
  const { videoId, annotationId } = req.params;

  try {
    console.log(`🗑️ Deleting manual annotation: ${annotationId}`);

    // Verify annotation exists and belongs to the video
    const annotation = await database.manualAnnotations.findOne({
      _id: annotationId,
      video_id: videoId,
    });

    if (!annotation) {
      return res.status(404).json({ error: "Annotation not found" });
    }

    // Delete annotation
    await database.manualAnnotations.deleteOne({ _id: annotationId });
    console.log(`✅ Manual annotation deleted: ${annotationId}`);

    res.json({
      success: true,
      message: "Annotation deleted successfully",
    });
  } catch (error) {
    console.error("❌ Annotation deletion error:", error);
    res
      .status(500)
      .json({ error: "Failed to delete annotation: " + error.message });
  }
});

// Get annotation statistics for a video
router.get("/:videoId/stats", async (req, res) => {
  const { videoId } = req.params;

  try {
    console.log(`📊 Fetching annotation statistics for video: ${videoId}`);

    // Verify video exists
    const video = await database.videos.findOne({ _id: videoId });
    if (!video) {
      return res.status(404).json({ error: "Video not found" });
    }

    // Get annotation statistics
    const stats = await database.manualAnnotations
      .aggregate([
        { $match: { video_id: videoId } },
        {
          $group: {
            _id: "$type",
            count: { $sum: 1 },
            labels: { $addToSet: "$label" },
          },
        },
      ])
      .toArray();

    const totalAnnotations = await database.manualAnnotations.countDocuments({
      video_id: videoId,
    });

    const formattedStats = {
      total: totalAnnotations,
      byType: stats.reduce((acc, stat) => {
        acc[stat._id] = {
          count: stat.count,
          uniqueLabels: stat.labels.length,
        };
        return acc;
      }, {}),
    };

    console.log(`📈 Annotation stats: ${totalAnnotations} total annotations`);

    res.json({
      success: true,
      stats: formattedStats,
    });
  } catch (error) {
    console.error("❌ Annotation stats error:", error);
    res.status(500).json({ error: "Failed to fetch annotation statistics" });
  }
});

export default router;
