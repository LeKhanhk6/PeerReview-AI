import express from 'express';
import { handleClientError, handleTelemetry } from '../controllers/telemetry.controller.js';

const router = express.Router();

router.post('/client-errors', handleClientError);
router.post('/telemetry', handleTelemetry);

export default router;
