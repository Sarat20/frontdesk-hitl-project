import { KnowledgeBase } from '../models/KnowledgeBase.js';
import { HelpRequest } from '../models/HelpRequest.js';
import { v4 as uuidv4 } from 'uuid';
import { createTokenForAgent } from '../livekitClient.js';
import { aiGenerateAnswer } from '../aiAgent.js';

export const receiveCall = async (req, res) => {
  try {
    const { caller, question } = req.body;
    
   
    if (!caller || !question) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        details: 'Both caller and question are required' 
      });
    }

    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`[Agent] 📞 Incoming call from: ${caller}`);
    console.log(`[Agent] 💬 Question: "${question}"`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    
    const knowledge = KnowledgeBase.getAll();
    console.log(`[Agent] 📚 Knowledge base has ${knowledge.length} entries`);

   
    const aiAnswer = await aiGenerateAnswer(question, knowledge);
    const escalationNeeded = /check with my supervisor|get back to you/i.test(aiAnswer);

    console.log(`[Agent] 🤖 AI Response: "${aiAnswer}"`);
    console.log(`[Agent] 🔍 Escalation needed: ${escalationNeeded}`);

    if (!escalationNeeded) {
      console.log(`[Agent] ✅ DIRECT ANSWER - Sending to customer\n`);
      return res.json({ response: aiAnswer });
    }
    
    
    const id = uuidv4();
    const reqObj = new HelpRequest({ id, question, caller });
    HelpRequest.add(reqObj);
    console.log(`[Agent] ⚠️ ESCALATING to supervisor`);
    console.log(`[Agent] 🆔 Request ID: ${id}`);
    console.log(`[Supervisor] 🔔 New pending request from ${caller}\n`);
    
    return res.json({
      response: aiAnswer, 
      requestId: id,
    });
  } catch (error) {
    console.error('[Agent] ❌ Error in receiveCall:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error.message,
      hint: 'Check if OpenAI API key is valid in backend/.env'
    });
  }
};

export const followUpWithCaller = (req, res) => {
  const { requestId, answer } = req.body;
  const reqObj = HelpRequest.getAll().find((r) => r.id === requestId);

  if (!reqObj) return res.status(404).json({ error: 'Request not found' });

  KnowledgeBase.addEntry(reqObj.question, answer);
  HelpRequest.resolve(requestId, answer);

  console.log(`Text to caller (${reqObj.caller}): ${answer}`);
  res.json({ success: true });
};

export const initiateLiveKitCall = async (req, res) => {
  const { caller, phoneNumber } = req.body;
  
  if (!caller) {
    return res.status(400).json({ 
      error: 'Missing required field',
      details: 'Caller name is required' 
    });
  }

  
  const roomName = `hitl-demo-${caller.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`;

  try {
    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`[LiveKit] 📞 Initiating voice call`);
    console.log(`[LiveKit] 👤 Caller: ${caller}`);
    console.log(`[LiveKit] 📱 Phone: ${phoneNumber || 'N/A'}`);
    console.log(`[LiveKit] 🏠 Room: ${roomName}`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);


    const callerToken = await createTokenForAgent(roomName, caller);
    console.log(`[LiveKit] ✓ Caller token generated`);

    
    const agentIdentity = 'luna-ai-agent';
    const agentToken = await createTokenForAgent(roomName, agentIdentity);
    console.log(`[LiveKit] ✓ AI agent token generated`);


    const livekitUrl = process.env.LIVEKIT_URL;
    console.log(`[LiveKit] 🤖 Starting AI agent...`);
    
   

    console.log(`[LiveKit] ✓ Voice call setup complete\n`);

    res.json({ 
      token: callerToken, 
      roomName,
      livekitUrl,
      message: 'Voice call initiated successfully'
    });
  } catch (error) {
    console.error('[LiveKit] ✗ Voice call setup error:', error);
    res.status(500).json({ 
      error: 'LiveKit integration failed', 
      details: error.message,
      hint: 'Check LIVEKIT_URL, LIVEKIT_API_KEY, and LIVEKIT_API_SECRET in backend/.env'
    });
  }
};


export const processVoiceTranscription = async (req, res) => {
  try {
    console.log('[Voice] Received request body:', JSON.stringify(req.body));
    
    const { caller, transcription, roomName } = req.body;
    
    if (!caller || !transcription) {
      console.log('[Voice] ❌ Missing required fields');
      return res.status(400).json({ 
        error: 'Missing required fields',
        details: 'Both caller and transcription are required' 
      });
    }

    console.log(`\n[Voice] 🎤 Transcription from ${caller}: "${transcription}"`);

   
    console.log('[Voice] Getting knowledge base...');
    const knowledge = KnowledgeBase.getAll();
    console.log(`[Voice] 📚 Knowledge base has ${knowledge.length} entries`);

    console.log('[Voice] Calling aiGenerateAnswer...');
    const aiAnswer = await aiGenerateAnswer(transcription, knowledge);
    console.log('[Voice] AI answer received:', aiAnswer);
    
    const escalationNeeded = /check with my supervisor|get back to you/i.test(aiAnswer);
    console.log('[Voice] Escalation check:', escalationNeeded);

    console.log(`[Voice] 🤖 Response: "${aiAnswer}"`);
    console.log(`[Voice] 🔍 Escalation: ${escalationNeeded}\n`);

    let requestId = null;
    if (escalationNeeded) {
      console.log('[Voice] Creating escalation request...');
      
      requestId = uuidv4();
      const helpRequest = new HelpRequest({
        id: requestId,
        question: transcription,
        caller: caller
      });
      HelpRequest.add(helpRequest);
      console.log(`[Voice] ⚠️ Escalated - Request ID: ${requestId}`);
    }

    console.log('[Voice] Sending response...');
    const response = {
      response: aiAnswer,
      needsEscalation: escalationNeeded,
      requestId: requestId
    };
    console.log('[Voice] Response object:', JSON.stringify(response));
    
    res.json(response);
    console.log('[Voice] ✓ Response sent successfully');
  } catch (error) {
    console.error('[Voice] ✗ CRITICAL ERROR:', error.message);
    console.error('[Voice] Error name:', error.name);
    console.error('[Voice] Error stack:', error.stack);
    console.error('[Voice] Full error object:', error);
    
    res.status(500).json({ 
      error: 'Failed to process voice input',
      details: error.message,
      errorName: error.name,
      stack: error.stack
    });
  }
};

export const checkRequestStatus = (req, res) => {
  const { requestId } = req.params;
  const reqObj = HelpRequest.getAll().find((r) => r.id === requestId);

  if (!reqObj) {
    return res.status(404).json({ error: 'Request not found' });
  }

  res.json({
    id: reqObj.id,
    status: reqObj.status,
    answer: reqObj.answer,
    question: reqObj.question,
    caller: reqObj.caller
  });
};
