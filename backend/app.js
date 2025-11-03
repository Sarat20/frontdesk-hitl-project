import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import agentRoutes from './routes/agentRoutes.js';
import supervisorRoutes from './routes/supervisorRoutes.js';
import { KnowledgeBase, initKnowledgeBase } from './models/KnowledgeBase.js';
import { HelpRequest, initHelpRequests } from './models/HelpRequest.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use('/api/agent', agentRoutes);
app.use('/api/supervisor', supervisorRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'HITL System Backend',
    openaiConfigured: !!process.env.OPENAI_API_KEY,
    groqConfigured: !!process.env.GROQ_API_KEY,
    livekitConfigured: !!process.env.LIVEKIT_URL
  });
});

app.get('/api/knowledge', (req, res) => {
  res.json(KnowledgeBase.getAll());
});


setInterval(() => {
  HelpRequest.timeoutUnresolved();
  console.log('[System] Timeout worker ran - unresolved requests updated');
}, 60 * 1000);

const PORT = process.env.PORT || 4000;

async function startServer() {
  console.log('\n╔════════════════════════════════════════════════╗');
  console.log('║   HITL System Backend      ║');
  console.log('╚════════════════════════════════════════════════╝\n');
  
  await initKnowledgeBase();
  await initHelpRequests();
  
  app.listen(PORT, () => {
    console.log(`\n✓ Server running on port ${PORT}`);
    console.log(`✓ Health check: http://localhost:${PORT}/api/health`);
    console.log(`✓ Knowledge base: http://localhost:${PORT}/api/knowledge`);
    console.log(`\n✓ Groq API Key: ${process.env.GROQ_API_KEY ? '✓ Configured (Free AI)' : '✗ Not configured'}`);
    console.log(`✓ OpenAI API Key: ${process.env.OPENAI_API_KEY ? '✓ Configured (Fallback)' : '✗ Not configured'}`);
    console.log(`✓ LiveKit URL: ${process.env.LIVEKIT_URL ? '✓ Configured' : '✗ Not configured'}`);
    console.log('\n[System] Ready to receive calls! 📞\n');
  });
}

startServer().catch(error => {
  console.error('❌ Failed to start server:', error);
  process.exit(1);
});
