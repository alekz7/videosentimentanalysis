import { MongoClient } from "mongodb";
import dotenv from "dotenv";

dotenv.config();

const MONGODB_URI =
  process.env.MONGODB_URI ||
  "mongodb://localhost:27017/video-sentiment-analyzer";
const DB_NAME = "video-sentiment-analyzer";

class Database {
  constructor() {
    this.client = null;
    this.db = null;
    this.isConnected = false;
  }

  async connect() {
    try {
      if (this.isConnected) {
        return this.db;
      }

      console.log("🔌 Connecting to MongoDB...");
      this.client = new MongoClient(MONGODB_URI);
      await this.client.connect();

      this.db = this.client.db(DB_NAME);
      this.isConnected = true;

      console.log("✅ Connected to MongoDB successfully");

      // Create indexes for better performance
      await this.createIndexes();

      return this.db;
    } catch (error) {
      console.error("❌ MongoDB connection error:", error);
      throw error;
    }
  }

  async createIndexes() {
    try {
      // Index for videos collection
      await this.db.collection("videos").createIndex({ status: 1 });
      await this.db.collection("videos").createIndex({ created_at: -1 });

      // Index for analysis_jobs collection
      await this.db.collection("analysis_jobs").createIndex({ video_id: 1 });
      await this.db.collection("analysis_jobs").createIndex({ status: 1 });
      await this.db.collection("analysis_jobs").createIndex({ created_at: -1 });

      // Index for sentiment_results collection
      await this.db
        .collection("sentiment_results")
        .createIndex({ video_id: 1 });
      await this.db
        .collection("sentiment_results")
        .createIndex({ video_id: 1, timestamp: 1 });

      // Index for manual_annotations collection
      await this.db
        .collection("manual_annotations")
        .createIndex({ video_id: 1 });
      await this.db
        .collection("manual_annotations")
        .createIndex({ video_id: 1, type: 1 });
      await this.db
        .collection("manual_annotations")
        .createIndex({ created_at: -1 });

      console.log("📊 Database indexes created successfully");
    } catch (error) {
      console.error("⚠️ Error creating indexes:", error);
    }
  }

  async disconnect() {
    try {
      if (this.client) {
        await this.client.close();
        this.isConnected = false;
        console.log("🔌 Disconnected from MongoDB");
      }
    } catch (error) {
      console.error("❌ Error disconnecting from MongoDB:", error);
    }
  }

  async checkConnection() {
    try {
      if (!this.isConnected) {
        await this.connect();
      }

      // Ping the database
      await this.db.admin().ping();
      return { connected: true };
    } catch (error) {
      return { connected: false, reason: error.message };
    }
  }

  // Collection getters for easy access
  get videos() {
    return this.db.collection("videos");
  }

  get analysisJobs() {
    return this.db.collection("analysis_jobs");
  }

  get sentimentResults() {
    return this.db.collection("sentiment_results");
  }

  get manualAnnotations() {
    return this.db.collection("manual_annotations");
  }
}

// Create singleton instance
const database = new Database();

// Connect on startup
database.connect().catch(console.error);

// Graceful shutdown
process.on("SIGINT", async () => {
  await database.disconnect();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  await database.disconnect();
  process.exit(0);
});

export default database;
