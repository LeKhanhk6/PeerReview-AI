import express from 'express';
import { getHealthStatus } from '../controllers/health.controller.js';

const router = express.Router();

// GET /api/health
router.get('/health', getHealthStatus);

export default router;
