import sqlite3 from 'sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dbPath = process.env.DATABASE_PATH || join(__dirname, '../data/sentiment_analysis.db');
const dbDir = dirname(dbPath);

// Ensure data directory exists
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new sqlite3.Database(dbPath);

// Initialize database tables
db.serialize(() => {
  // Videos table
  db.run(`
    CREATE TABLE IF NOT EXISTS videos (
      id TEXT PRIMARY KEY,
      filename TEXT NOT NULL,
      original_filename TEXT NOT NULL,
      file_size INTEGER NOT NULL,
      duration REAL,
      s3_url TEXT,
      local_path TEXT,
      status TEXT DEFAULT 'uploaded',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Sentiment analysis results table
  db.run(`
    CREATE TABLE IF NOT EXISTS sentiment_results (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      video_id TEXT NOT NULL,
      timestamp TEXT NOT NULL,
      sentiment TEXT NOT NULL,
      confidence REAL NOT NULL,
      frame_path TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (video_id) REFERENCES videos (id)
    )
  `);

  // Analysis jobs table
  db.run(`
    CREATE TABLE IF NOT EXISTS analysis_jobs (
      id TEXT PRIMARY KEY,
      video_id TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      progress INTEGER DEFAULT 0,
      error_message TEXT,
      started_at DATETIME,
      completed_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (video_id) REFERENCES videos (id)
    )
  `);
});

export default db;