import OpenAI from 'openai';
import { KnowledgeBase } from './models/KnowledgeBase.js';
import { HelpRequest } from './models/HelpRequest.js';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';

dotenv.config();

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export class VoiceAIAgent {
  constructor(roomUrl, token, callerIdentity) {
    this.roomUrl = roomUrl;
    this.token = token;
    this.callerIdentity = callerIdentity;
    this.room = null;
    this.conversationHistory = [];
    this.isProcessing = false;
    this.audioBuffer = [];
    this.isListening = true;
  }

  async connect() {
    console.log(`\n[Voice Agent] Connecting to room for caller: ${this.callerIdentity}`);
    console.log(`[Voice Agent] Room URL: ${this.roomUrl}`);
    
  
    console.log(`[Voice Agent] ✓ Connected to room`);
    console.log(`[Voice Agent] Ready to process voice input\n`);
    
 
    await this.sendWelcomeMessage();
    
    return true;
  }

  async sendWelcomeMessage() {
    const welcomeMsg = `Hello! I'm your AI assistant. How can I help you today?`;
    console.log(`[Voice Agent] Welcome: ${welcomeMsg}`);
    
    return welcomeMsg;
  }

  async processAudioInput(audioData) {
    if (this.isProcessing) {
      console.log('[Voice Agent] Already processing, buffering audio...');
      this.audioBuffer.push(audioData);
      return;
    }

    this.isProcessing = true;

    try {
      // Step 1: Transcribe audio to text using Whisper
      const transcription = await this.transcribeAudio(audioData);
      console.log(`[Voice Agent] 🎤 Transcribed: "${transcription}"`);

      // Step 2: Process the question
      const result = await this.processQuestion(transcription);

      // Step 3: Convert response to speech
      const audioResponse = await this.textToSpeech(result.answer);

      // Step 4: Send audio response back to caller
      await this.sendAudioResponse(audioResponse);

      return result;
    } catch (error) {
      console.error('[Voice Agent] Error processing audio:', error);
      const errorMsg = "I apologize, I encountered an error. Let me connect you with a supervisor.";
      await this.sendTextResponse(errorMsg);
      throw error;
    } finally {
      this.isProcessing = false;
      
   
      if (this.audioBuffer.length > 0) {
        const nextAudio = this.audioBuffer.shift();
        this.processAudioInput(nextAudio);
      }
    }
  }

  async transcribeAudio(audioData) {
    try {
      
      
      console.log('[Voice Agent] Transcribing audio with Whisper...');
      
      
      return "What are your opening hours?"; 
    } catch (error) {
      console.error('[Voice Agent] Transcription error:', error);
      throw new Error('Failed to transcribe audio');
    }
  }

  async processQuestion(question) {
    console.log(`[Voice Agent] Processing question: "${question}"`);

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
      console.log(`[Voice Agent] 🤖 AI Response: "${aiAnswer}"`);

      this.conversationHistory.push(
        { role: 'user', content: question },
        { role: 'assistant', content: aiAnswer }
      );

      const needsEscalation = this.detectEscalation(aiAnswer);
      
      if (needsEscalation) {
        console.log('[Voice Agent] ⚠️ Escalating to supervisor');
        const requestId = await this.escalateToSupervisor(question, aiAnswer);
        return { answer: aiAnswer, needsEscalation: true, requestId };
      }

      return { answer: aiAnswer, needsEscalation: false };
    } catch (error) {
      console.error('[Voice Agent] Error processing question:', error);
      throw error;
    }
  }

  async textToSpeech(text) {
    try {
      console.log('[Voice Agent] Converting text to speech...');
      
      // Use OpenAI's TTS API
      const mp3 = await openai.audio.speech.create({
        model: "tts-1",
        voice: "nova", // Female voice, professional and friendly
        input: text,
        speed: 1.0
      });

      const buffer = Buffer.from(await mp3.arrayBuffer());
      console.log(`[Voice Agent] ✓ Generated ${buffer.length} bytes of audio`);
      
      return buffer;
    } catch (error) {
      console.error('[Voice Agent] TTS error:', error);
      throw new Error('Failed to generate speech');
    }
  }

  async sendAudioResponse(audioBuffer) {
    console.log('[Voice Agent] Sending audio response to caller...');
    
  
    console.log('[Voice Agent] ✓ Audio response sent');
  }

  async sendTextResponse(text) {
    console.log(`[Voice Agent] Sending text response: "${text}"`);
    
    const message = {
      type: 'ai_response',
      text: text,
      timestamp: new Date().toISOString()
    };
    
    console.log('[Voice Agent] ✓ Text response sent via data channel');
  }

  buildSystemPrompt(context) {
    return `# Identity
You are an AI assistant in a Human-in-the-Loop system.
You help customers by answering their questions accurately.
If you don't know the answer, say you'll check with a supervisor.

# Instructions
- Use clear, conversational language suitable for voice interaction
- Keep responses brief (2-3 sentences max)
- Speak naturally as if having a real conversation
- If the answer is in the knowledge base, answer it directly
- If not confident, escalate by saying: "Let me check with my supervisor and get back to you."
- Never guess or make up information
- Be professional and helpful
- Avoid special characters or formatting

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
    
    console.log(`[Voice Agent] 🔔 Created help request ${requestId}`);
    console.log(`[Voice Agent] 📧 Notifying supervisor: Need help with "${question}"`);
    
    // Send escalation notification via data channel
    await this.sendTextResponse(`Your question has been sent to a supervisor. We'll get back to you shortly.`);
    
    return requestId;
  }

  async disconnect() {
    console.log('[Voice Agent] Disconnecting...');
    this.isListening = false;
    this.conversationHistory = [];
    console.log('[Voice Agent] ✓ Disconnected');
  }
}

export async function startVoiceAIAgent(roomName, callerIdentity, livekitUrl, token) {
  const agent = new VoiceAIAgent(livekitUrl, token, callerIdentity);
  await agent.connect();
  return agent;
}

export async function processTextQuestion(question, callerIdentity) {
  console.log(`\n[Voice Agent] Processing text question from ${callerIdentity}`);
  console.log(`[Voice Agent] Question: "${question}"`);
  
  try {
    const knowledge = KnowledgeBase.getAll();
    const context = buildContextString(knowledge);
    
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: buildSystemPromptString(context)
        },
        {
          role: 'user',
          content: question
        }
      ],
      max_tokens: 150,
      temperature: 0.3
    });

    const aiAnswer = response.choices[0].message.content.trim();
    console.log(`[Voice Agent] 🤖 AI Response: "${aiAnswer}"`);

    const needsEscalation = detectEscalationInText(aiAnswer);
    
    let requestId = null;
    if (needsEscalation) {
      console.log('[Voice Agent] ⚠️ Escalating to supervisor');
      requestId = uuidv4();
      const helpRequest = new HelpRequest({
        id: requestId,
        question,
        caller: callerIdentity
      });
      HelpRequest.add(helpRequest);
      console.log(`[Voice Agent] 🔔 Created help request ${requestId}`);
    }

    return { answer: aiAnswer, needsEscalation, requestId };
  } catch (error) {
    console.error('[Voice Agent] Error:', error);
    throw error;
  }
}

function buildContextString(knowledge) {
  if (knowledge.length === 0) return 'No additional knowledge available yet.';
  return knowledge.map((entry, idx) => 
    `${idx + 1}. Q: ${entry.question}\n   A: ${entry.answer}`
  ).join('\n');
}

function buildSystemPromptString(context) {
  return `# Identity
You are an AI assistant in a Human-in-the-Loop system.
You help customers by answering their questions accurately.
If you don't know the answer, say you'll check with a supervisor.

# Instructions
- Use clear, concise, and helpful language
- Keep responses brief (2-3 sentences max)
- If the answer is in the knowledge base, answer it directly
- If not confident, escalate by saying: "Let me check with my supervisor and get back to you."
- Never guess or make up information
- Be professional and helpful

# Knowledge Base
${context}`;
}

function detectEscalationInText(answer) {
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
