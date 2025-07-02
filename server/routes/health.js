import express from 'express';
import { S3Service } from '../services/s3Service.js';

const router = express.Router();
const s3Service = new S3Service();

router.get('/', async (req, res) => {
  try {
    const s3Status = await s3Service.checkConnection();
    
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: 'connected',
        s3: s3Status.connected ? 'connected' : 'disconnected',
        s3_reason: s3Status.reason || null
      },
      environment: process.env.NODE_ENV || 'development'
    });
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      error: error.message
    });
  }
});

export default router;