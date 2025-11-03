import { Room, RoomEvent, Track } from 'livekit-client';
import OpenAI from 'openai';
import { KnowledgeBase } from './models/KnowledgeBase.js';
import { HelpRequest } from './models/HelpRequest.js';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';

dotenv.config();

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export class LiveKitAIAgent {
  constructor(roomUrl, token, callerIdentity) {
    this.roomUrl = roomUrl;
    this.token = token;
    this.callerIdentity = callerIdentity;
    this.room = null;
    this.conversationHistory = [];
    this.isProcessing = false;
  }

  async connect() {
    this.room = new Room({
      adaptiveStream: true,
      dynacast: true,
    });

    this.room.on(RoomEvent.TrackSubscribed, this.handleTrackSubscribed.bind(this));
    this.room.on(RoomEvent.Disconnected, this.handleDisconnected.bind(this));
    this.room.on(RoomEvent.ParticipantConnected, this.handleParticipantConnected.bind(this));

    await this.room.connect(this.roomUrl, this.token);
    console.log(`[AI Agent] Connected to room for caller: ${this.callerIdentity}`);
    await this.sendWelcomeMessage();
  }

  async sendWelcomeMessage() {
    const welcomeMsg = "Hello! I'm your AI assistant. How can I help you today?";
    console.log(`[AI Agent] Welcome: ${welcomeMsg}`);
    this.sendDataMessage({
      type: 'ai_response',
      text: welcomeMsg,
      timestamp: new Date().toISOString()
    });
  }

  handleParticipantConnected(participant) {
    console.log(`[AI Agent] Participant connected: ${participant.identity}`);
  }

  handleDisconnected() {
    console.log('[AI Agent] Disconnected from room');
  }

  handleTrackSubscribed(track, publication, participant) {
    if (track.kind === Track.Kind.Audio) {
      console.log(`[AI Agent] Subscribed to audio track from ${participant.identity}`);
    }
  }

  async processQuestion(question) {
    if (this.isProcessing) {
      console.log('[AI Agent] Already processing a question, please wait...');
      return;
    }

    this.isProcessing = true;
    console.log(`[AI Agent] Processing question: "${question}"`);

    try {
      const knowledge = KnowledgeBase.getAll();
      const context = this.buildContext(knowledge);
      const response = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: this.buildSystemPrompt(context)
          },
          ...this.conversationHistory,
          {
            role: 'user',
            content: question
          }
        ],
        max_tokens: 150,
        temperature: 0.3
      });

      const aiAnswer = response.choices[0].message.content.trim();
      console.log(`[AI Agent] Generated answer: "${aiAnswer}"`);

      this.conversationHistory.push(
        { role: 'user', content: question },
        { role: 'assistant', content: aiAnswer }
      );

      const needsEscalation = this.detectEscalation(aiAnswer);
      
      if (needsEscalation) {
        console.log('[AI Agent] ⚠️ Escalating to supervisor');
        await this.escalateToSupervisor(question, aiAnswer);
      }

      this.sendDataMessage({
        type: 'ai_response',
        text: aiAnswer,
        needsEscalation,
        timestamp: new Date().toISOString()
      });

      return { answer: aiAnswer, needsEscalation };
    } catch (error) {
      console.error('[AI Agent] Error processing question:', error);
      this.sendDataMessage({
        type: 'error',
        text: 'I apologize, I encountered an error. Let me connect you with a supervisor.',
        timestamp: new Date().toISOString()
      });
      await this.escalateToSupervisor(question, 'System error occurred');
    } finally {
      this.isProcessing = false;
    }
  }

  buildSystemPrompt(context) {
    return `# Identity
You are an AI assistant in a Human-in-the-Loop system.
You help customers by answering their questions accurately.
If you don't know the answer, say you'll check with a supervisor.

# Instructions
- Use clear, concise, and helpful language
- Keep responses brief (2-3 sentences max)
- If the answer is in the knowledge base, answer it directly
- If you're not confident, escalate by saying: "Let me check with my supervisor and get back to you."
- Never guess or make up information
- Be professional and helpful

# Knowledge Base
${context}`;  
  }

  buildContext(knowledge) {
    if (knowledge.length === 0) return 'No additional knowledge available yet.';
    return knowledge.map((entry, idx) => 
      `${idx + 1}. Q: ${entry.question}\n   A: ${entry.answer}`
    ).join('\n');
  }

  detectEscalation(answer) {
    const escalationPhrases = [
      'check with my supervisor',
      'get back to you',
      'let me find out',
      'not sure',
      'don\'t know',
      'ask my manager'
    ];
    
    const lowerAnswer = answer.toLowerCase();
    return escalationPhrases.some(phrase => lowerAnswer.includes(phrase));
  }

  async escalateToSupervisor(question, aiResponse) {
    const requestId = uuidv4();
    const helpRequest = new HelpRequest({
      id: requestId,
      question,
      caller: this.callerIdentity
    });
    
    HelpRequest.add(helpRequest);
    
    console.log(`[AI Agent] 🔔 Created help request ${requestId}`);
    console.log(`[AI Agent] 📧 Notifying supervisor: Need help with "${question}"`);
    this.sendDataMessage({
      type: 'escalation_created',
      requestId,
      question,
      timestamp: new Date().toISOString()
    });
  }

  sendDataMessage(data) {
    if (this.room && this.room.localParticipant) {
      const message = JSON.stringify(data);
      this.room.localParticipant.publishData(
        new TextEncoder().encode(message),
        { reliable: true }
      );
    }
  }

  async disconnect() {
    if (this.room) {
      await this.room.disconnect();
      console.log('[AI Agent] Disconnected');
    }
  }
}


export async function startAIAgentForCaller(roomName, callerIdentity, livekitUrl, token) {
  const agent = new LiveKitAIAgent(livekitUrl, token, callerIdentity);
  await agent.connect();
  return agent;
}
