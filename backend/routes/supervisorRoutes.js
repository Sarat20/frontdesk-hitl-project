import express from 'express';
import { getPendingRequests, getAllRequests, submitAnswer } from '../controllers/supervisorController.js';

const router = express.Router();

router.get('/pending', getPendingRequests);
router.get('/all', getAllRequests);
router.post('/submit-answer', submitAnswer);

export default router;
