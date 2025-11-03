import express from 'express';
import { receiveCall, followUpWithCaller, initiateLiveKitCall, checkRequestStatus, processVoiceTranscription } from '../controllers/agentController.js';

const router = express.Router();

// Text-based call endpoint (legacy/fallback)
router.post('/receive-call', receiveCall);

// Voice call endpoints
router.post('/initiate-call', initiateLiveKitCall);
router.post('/voice-transcription', processVoiceTranscription);

// Common endpoints
router.post('/follow-up', followUpWithCaller);
router.get('/check-request/:requestId', checkRequestStatus);

export default router;
