# Human-in-the-Loop AI Supervisor (Frontdesk Engineering Test)

## Overview
This project is a simulated AI receptionist system ("Luna AI") that escalates unknown questions to a human supervisor, learns answers, and improves over time. It's built full-stack with React (Vite) on the frontend and Express (Node.js) on the backend.

## Features
- **AI Agent**: Answers salon questions using prompt engineering + OpenAI API. Escalates only if not confident.
- **Help Requests**: Tracks pending/resolved/unresolved requests (with full lifecycle and timeout).
- **Supervisor Panel**: Simple admin panel to answer escalations and see full request history.
- **Knowledge Base**: Self-learning. All supervisor responses are saved and considered in future AI answers.
- **LiveKit Integration**: Video room support (simulated, for demo).
- **Prompt Engineering**: Modular AI prompts with business identity, examples, context, and instructions.
- **Simulation Logging**: All 'texts' to supervisors/customers are echoed in backend logs for demo.

## Getting Started
### Prerequisites
- Node.js v18+
- OpenAI API key ([.env] BACKEND: `OPENAI_API_KEY=sk-...`)
- (Optional) LiveKit API key/URL (for real video integration)

### Backend Setup
```bash
cd backend
npm install
# .env with OPENAI_API_KEY (and optional LIVEKIT creds) in backend dir
npm start
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
# Browse to http://localhost:5173
```

### Project Structure
- Backend: `/backend`
  - `app.js`: Express server entry
  - `controllers/agentController.js`: AI handling/escalation logic
  - `aiAgent.js`: The AI w/ prompt engineering
  - `models/`: In-memory data (ready for swap-out to DB)
  - `routes/`: API surface
- Frontend: `/frontend`
  - `src/App.jsx`: Main app
  - `src/components/HelpRequestList.jsx`: Supervisor help request panel + history
  - `src/components/KnowledgeBase.jsx`: Learned Q&A
  - `src/components/LiveKitCall.jsx`: Simulated call support (demo only)

## Design & Architecture Notes
- **Separation**: Agent logic (AI), help request state, and text-back flows modularized for easy future growth.
- **Scaling**: Swap in DB where in-memory used. All methods rely on static class functions for compatibility.
- **Prompting**: See `backend/aiAgent.js` for system prompt; includes salon info, instructions, and examples. Structured for least-hallucination.
- **Timeout Handling**: Every unresolved request is marked 'Unresolved' 5min+ after creation.
- **Extensibility**: Adding SMS/webhook/Twilio would be 1-2 added functions only!

## Why These Decisions?
- **In-Memory DB**: Demo simplicity, but future-proofed by using class wrappers for easy migration.
- **Console 'Texts'**: Compliant with spec (no Twilio needed), but easily upgradable.
- **Clear Prompt Engineering**: Deliberately explicit/role-based to minimize AI error rate in ambiguous domain.
- **Supervisor UI**: Simple table + list—minimal effort for maximal clarity.

## Demo Steps
1. Run both frontend and backend.
2. Use 'Start Call' (simulated) or POST to `/api/agent/receive-call` with a question (try both known/unknown).
3. View pending requests in Supervisor panel.
4. Provide new answer > watch AI learn and Knowledge Base update instantly.
5. All requests (incl. resolved/unresolved) visible in "History" toggle.

## What Would I Improve Next?
- Switch to a true DB (SQLite or DynamoDB, easy swap).
- Add role-based supervisor login/auth.
- Use webhooks/SMS for live supervisor and customer notifications.
- More sophisticated prompt evals and versioning.
- Automated test coverage.

---
Project by [Frontdesk Engineering Test] — October 2025.
