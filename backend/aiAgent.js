import OpenAI from "openai";
import Groq from "groq-sdk";
import dotenv from "dotenv";

dotenv.config();

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY || "" });

const SYSTEM_PROMPT = `
# Identity
You are an AI assistant in a Human-in-the-Loop system.
You answer questions to the best of your knowledge.
If you truly don't know something, say you'll check with a supervisor.

# Instructions
- Answer all questions helpfully and accurately
- Answer from your training knowledge
- Only escalate if you genuinely don't know the answer
- Be friendly, professional, and conversational
- Keep responses brief (2-3 sentences)
`;

export async function aiGenerateAnswer(question, knowledge = []) {
  let kbSection = "";
  if (knowledge.length > 0) {
    kbSection = "\n# Learned Knowledge Base\n" +
      knowledge.map((e, idx) => `${idx + 1}. Q: ${e.question}\n   A: ${e.answer}`).join("\n\n") + '\n';
  }

  // Check knowledge base first
  const lowerQuestion = question.toLowerCase();
  for (const entry of knowledge) {
    if (lowerQuestion.includes(entry.question.toLowerCase()) || 
        entry.question.toLowerCase().includes(lowerQuestion)) {
      console.log('[AI Agent] ✓ Answered from knowledge base');
      return entry.answer;
    }
  }

  const systemPromptWithKB = SYSTEM_PROMPT + kbSection;
  
  if (process.env.GROQ_API_KEY) {
    try {
      console.log('[AI Agent] Calling Groq API (Free)...');
      console.log('[AI Agent] Model: llama-3.3-70b-versatile');
      console.log('[AI Agent] Question:', question);
      
      const response = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [
          { 
            role: "system", 
            content: systemPromptWithKB 
          },
          { 
            role: "user", 
            content: question 
          }
        ],
        max_tokens: 150,
        temperature: 0.3
      });
      
      if (
        response.choices &&
        response.choices[0] &&
        response.choices[0].message &&
        response.choices[0].message.content
      ) {
        console.log('[AI Agent] ✓ Answered via Groq (Free AI)');
        return response.choices[0].message.content.trim();
      }
    } catch (error) {
      console.error('[AI Agent] ❌ Groq API Error:', error.message);
      console.log('[AI Agent] Trying OpenAI...');
    }
  }
  
  if (process.env.OPENAI_API_KEY) {
    try {
      console.log('[AI Agent] Calling OpenAI API...');
      console.log('[AI Agent] Model: gpt-3.5-turbo');
      
      const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          { 
            role: "system", 
            content: systemPromptWithKB 
          },
          { 
            role: "user", 
            content: question 
          }
        ],
        max_tokens: 100,
        temperature: 0.3
      });
      
      if (
        response.choices &&
        response.choices[0] &&
        response.choices[0].message &&
        response.choices[0].message.content
      ) {
        console.log('[AI Agent] ✓ Answered via OpenAI');
        return response.choices[0].message.content.trim();
      }
    } catch (error) {
      console.error('[AI Agent] ❌ OpenAI API Error:', error.message);
    }
  }
  
  console.log('[AI Agent] ⚠️ No AI service available - escalating to supervisor');
  return "Let me check with my supervisor and get back to you on that.";
}

