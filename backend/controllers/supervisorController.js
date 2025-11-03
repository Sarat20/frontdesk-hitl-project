import { HelpRequest } from '../models/HelpRequest.js';
import { KnowledgeBase } from '../models/KnowledgeBase.js';

export const getPendingRequests = (req, res) => {
  res.json(HelpRequest.getPending());
};

export const getAllRequests = (req, res) => {
  res.json(HelpRequest.getAll());
};

export const submitAnswer = (req, res) => {
  const { id, answer } = req.body;
  const request = HelpRequest.getAll().find((r) => r.id === id);

  if (!request) return res.status(404).json({ error: 'Not found' });

  KnowledgeBase.addEntry(request.question, answer);
  HelpRequest.resolve(id, answer);
  console.log(`Supervisor answered request ${id}: ${answer}`);
  res.json({ success: true });
};
