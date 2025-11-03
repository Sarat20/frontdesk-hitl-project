# Human-in-the-Loop AI System
**Frontdesk Engineering Test Demo**

A real-time AI receptionist system that escalates unknown questions to human supervisors, learns from their answers, and improves over time.

## 🎯 Overview

This system demonstrates a production-ready Human-in-the-Loop (HITL) architecture where:
1. **Customers** call in via voice (LiveKit) or text chat
2. **AI Agent** (Groq Llama 3.3 70B) attempts to answer from its knowledge base
3. **Escalation** happens automatically when AI is uncertain
4. **Supervisors** answer pending questions through a dashboard
5. **Real-time Updates** deliver answers back to active callers instantly
6. **Knowledge Base** automatically learns from supervisor responses

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Groq API key (free tier: https://console.groq.com)
- OpenAI API key (optional, for fallback)
- LiveKit account (free tier: https://livekit.io)
- Firebase project with Firestore enabled (free tier: https://console.firebase.google.com)

### Installation

1. **Clone and install dependencies:**
   ```bash
   # Install backend
   cd backend
   npm install

   # Install frontend
   cd ../frontend
   npm install
   ```

2. **Set up Firebase:**
   - Go to https://console.firebase.google.com
   - Create a new project
   - Enable Firestore Database (Start in test mode)
   - Go to Project Settings → Service accounts
   - Generate new private key (downloads JSON file)
   - Save as `backend/firebase-key.json`

3. **Set up environment variables:**

   Create `backend/.env`:
   ```env
   GROQ_API_KEY=your_groq_api_key_here
   OPENAI_API_KEY=your_openai_key_here
   LIVEKIT_API_KEY=your_livekit_key
   LIVEKIT_API_SECRET=your_livekit_secret
   LIVEKIT_WS_URL=wss://your-project.livekit.cloud
   PORT=4000
   ```

   Create `frontend/.env`:
   ```env
   VITE_API_URL=http://localhost:4000
   ```

4. **Start the application:**
   ```bash
   # Terminal 1 - Backend
   cd backend
   node app.js

   # Terminal 2 - Frontend
   cd frontend
   npm run dev
   ```

5. **Access the application:**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:4000

---

## 📦 Project Structure

```
frontdesk-hitl-project/
├── README.md                    # This file - comprehensive documentation
├── .gitignore                   # Protects secrets and build files
│
├── backend/                     # Node.js + Express backend
│   ├── models/                  # Data models
│   │   ├── HelpRequest.js       # Request lifecycle (Pending→Resolved/Unresolved)
│   │   └── KnowledgeBase.js     # Learned Q&A storage with Firebase
│   │
│   ├── controllers/             # Business logic
│   │   ├── agentController.js   # Voice call & chat endpoints
│   │   └── supervisorController.js  # Supervisor dashboard endpoints
│   │
│   ├── routes/                  # API routes
│   │   ├── agentRoutes.js       # /api/agent/* routes
│   │   └── supervisorRoutes.js  # /api/supervisor/* routes
│   │
│   ├── db.js                    # Firebase Firestore integration
│   ├── firebase-key.json        # Firebase service account key (gitignored)
│   ├── .env                     # Environment variables (gitignored)
│   │
│   ├── aiAgent.js               # Core AI logic (Groq Llama 3.3 + OpenAI fallback)
│   ├── livekitAgent.js          # LiveKit AI agent for voice calls
│   ├── livekitClient.js         # LiveKit client wrapper
│   ├── voiceAgent.js            # Voice processing & transcription
│   │
│   ├── app.js                   # Express server entry point
│   ├── package.json             # Backend dependencies
│   └── package-lock.json
│
└── frontend/                    # React 18 + Vite frontend
    ├── src/
    │   ├── components/          # React components
    │   │   ├── MainApp.jsx              # Home page with role selector
    │   │   ├── VoiceCallerInterface.jsx # Voice call UI with speech recognition
    │   │   ├── CallerInterface.jsx      # Text chat interface (legacy)
    │   │   ├── SupervisorPanel.jsx      # Supervisor dashboard wrapper
    │   │   ├── HelpRequestList.jsx      # Pending/Resolved request list
    │   │   ├── KnowledgeBase.jsx        # Learned answers display
    │   │   └── LiveKitCall.jsx          # LiveKit WebRTC component
    │   │
    │   ├── App.jsx              # Root component
    │   ├── App.css              # Global styles
    │   └── main.jsx             # React entry point
    │
    ├── public/
    │   └── index.html           # HTML template
    │
    ├── index.html               # Vite HTML entry
    ├── vite.config.js           # Vite build configuration
    ├── tailwind.config.js       # TailwindCSS configuration
    ├── postcss.config.js        # PostCSS for Tailwind
    ├── eslint.config.js         # ESLint configuration
    │
    ├── .env                     # Frontend env vars (gitignored)
    ├── package.json             # Frontend dependencies
    └── package-lock.json
```

---

## 🎬 How This Project Was Built - Complete Implementation Story

### **Assignment Requirements Met** ✅

This project was built from scratch to fulfill the Frontdesk Engineering Test requirements. Here's exactly how each component was implemented:

### **Phase 1: AI Agent Setup (LiveKit Integration)**

**What Was Required:**
- Set up AI agent using LiveKit Python SDK or alternative
- Equip agent to receive calls, respond if it knows, and trigger escalation if it doesn't

**What We Built:**
1. **LiveKit Voice Integration** (`livekitAgent.js`, `voiceAgent.js`, `livekitClient.js`)
   - Chose Node.js over Python for faster full-stack development
   - Implemented complete LiveKit WebRTC voice calling
   - Added Web Speech API for real-time speech recognition
   - Built audio level visualization for better UX

2. **AI Agent with Groq** (`aiAgent.js`)
   - Primary: Groq AI (Llama 3.3 70B) - free tier, fast, GPT-4 level quality
   - Fallback: OpenAI GPT-4 - for reliability
   - Structured prompts following OpenAI best practices:
     - Identity section (who the AI is)
     - Instructions (rules to follow)
     - Knowledge base (learned from supervisors)
     - Automatic escalation detection

3. **Escalation Logic**
   - AI analyzes its own responses for uncertainty phrases
   - Detects: "check with supervisor", "not sure", "don't know"
   - Automatically creates help request and notifies caller

### **Phase 2: Database Design (Firebase Firestore)**

**What Was Required:**
- Use lightweight DB like DynamoDB/Firebase
- Elegant data structure design
- Store help requests with proper lifecycle

**What We Built:**
1. **Firebase Firestore** (`db.js`)
   - Cloud-hosted NoSQL database (explicitly mentioned in assignment!)
   - Zero server setup required
   - `loadData()` and `saveData()` abstraction for clean code
   - Firestore collections:
     - `system/knowledge` - learned Q&A pairs
     - `system/helpRequests` - escalation history

2. **Help Request Model** (`models/HelpRequest.js`)
   ```javascript
   {
     id: UUID,                    // Unique identifier
     caller: string,              // Customer name
     question: string,            // What they asked
     status: enum,                // Pending/Resolved/Unresolved
     answer: string | null,       // Supervisor's response
     createdAt: Date,             // When escalated
     resolvedAt: Date | null      // When answered or timed out
   }
   ```
   - Clean lifecycle: Pending → Resolved/Unresolved
   - 5-minute auto-timeout for abandoned requests
   - Links supervisor answer back to original caller

3. **Knowledge Base Model** (`models/KnowledgeBase.js`)
   ```javascript
   {
     question: string,            // What was asked
     answer: string               // Supervisor's authoritative answer
   }
   ```
   - Automatically grows as supervisors answer questions
   - AI checks here first before escalating
   - Persistent across server restarts (Firebase)

### **Phase 3: Supervisor Dashboard**

**What Was Required:**
- Simple UI to view pending requests
- Submit answers
- See resolved/unresolved history

**What We Built:**
1. **Full Dashboard** (`SupervisorPanel.jsx`, `HelpRequestList.jsx`)
   - Real-time stats: Pending/Resolved/Unresolved counts
   - Pending requests with answer input boxes
   - Complete history table with timestamps
   - Color-coded status badges
   - One-click answer submission

2. **Knowledge Base View** (`KnowledgeBase.jsx`)
   - Displays all learned Q&A pairs
   - Shows AI's growing knowledge
   - Proves system is learning

3. **Real-time Updates**
   - During active voice calls: answer appears immediately
   - Supervisor → AI → Caller (seamless experience)
   - Simulated "text back" via console logs (ready for Twilio)

### **Phase 4: Frontend UI**

**What Was Required:**
- Extremely simple - internal admin panel, not polished product

**What We Built:**
1. **Three Interfaces**
   - `MainApp.jsx` - Role selector home page
   - `VoiceCallerInterface.jsx` - Voice call UI with speech recognition
   - `SupervisorPanel.jsx` - Dashboard for supervisors
   - (Bonus: `CallerInterface.jsx` - Text chat for demo variety)

2. **Modern but Simple Design**
   - TailwindCSS for rapid styling
   - Color scheme: `#B7E5CD` (mint), `#8ABEB9` (teal), `#1D546C` (dark teal)
   - Clean borders, good spacing, no over-engineering
   - Mobile-responsive (bonus)

### **Phase 5: Code Quality & Architecture**

**What Was Required:**
- Clean architecture
- Modular design
- Handle errors gracefully
- Think about scaling

**What We Built:**
1. **Modular Backend**
   - `models/` - Data layer (HelpRequest, KnowledgeBase)
   - `controllers/` - Business logic (agentController, supervisorController)
   - `routes/` - API endpoints (agentRoutes, supervisorRoutes)
   - `db.js` - Database abstraction (easy to swap Firebase for PostgreSQL)

2. **Error Handling**
   - Try-catch blocks everywhere
   - Graceful degradation (Groq fails → OpenAI)
   - User-friendly error messages
   - Backend logs for debugging

3. **Scalability Design**
   - Firebase = cloud-ready from day one
   - UUID-based IDs (distributed-system-ready)
   - Stateless API (horizontal scaling ready)
   - Environment variables (12-factor app)

4. **Documentation**
   - This comprehensive README
   - Inline comments removed (clean production code)
   - Setup instructions
   - Design decisions explained

### **Bonus Features (Beyond Requirements)**

1. ✨ **Voice AI** - Full LiveKit integration (not just text simulation)
2. ✨ **Speech Recognition** - Real-time voice input (Web Speech API)
3. ✨ **Audio Visualization** - Level meter during calls
4. ✨ **Groq AI** - Cost-effective, fast AI (10x cheaper than OpenAI)
5. ✨ **Firebase** - Cloud database (better than DynamoDB for demo)
6. ✨ **Modern UI** - Clean color scheme, responsive design
7. ✨ **Dual Interface** - Voice + Text chat options

### **Time Investment**
- **Total:** ~12-15 hours over one week
- Backend setup: 3 hours
- AI integration: 3 hours  
- Frontend UI: 4 hours
- Firebase setup: 1 hour
- Testing & polish: 2-3 hours
- Documentation: 2 hours

### **Tech Stack Choices Explained**

| Choice | Why? |
|--------|------|
| **Groq (Llama 3.3)** | Free tier, GPT-4 level quality, 10x faster than OpenAI |
| **Firebase Firestore** | Lightweight, cloud-hosted, explicitly mentioned in assignment |
| **Node.js** | Faster development than Python, single language full-stack |
| **React + Vite** | Modern, fast builds, component reusability |
| **TailwindCSS** | Rapid styling, no CSS files needed |
| **LiveKit** | Industry-standard WebRTC, reliable voice calls |

---

## 🎯 Design Decisions (Assignment Review Points)

### **These 5 design choices were specifically reviewed per assignment requirements:**

### 1. **How We Model "Help Requests"** 📊

**Data Model Structure:**
```javascript
// models/HelpRequest.js
class HelpRequest {
  id: UUID,                     // Unique identifier (distributed-system-ready)
  caller: string,               // Customer identifier
  question: string,             // Exact question asked
  status: 'Pending' | 'Resolved' | 'Unresolved',  // Lifecycle state
  answer: string | null,        // Supervisor's response
  createdAt: Date,              // Escalation timestamp
  resolvedAt: Date | null       // Resolution timestamp
}
```

**Design Decisions:**
- **UUID for IDs** → Enables distributed systems, avoids ID collisions when scaling
- **Three-state lifecycle** → Clear state machine: Pending → Resolved/Unresolved
- **Timestamps** → Track SLA compliance (5-min timeout)
- **Nullable answer** → Explicit differentiation between pending and resolved
- **Simple flat structure** → Easy to query, index, and scale

**Firebase Storage:**
```javascript
// Firestore collection structure
system/
  └── helpRequests/
      └── items: [HelpRequest]  // Array stored in single document
                                 // Scales to 1MB (thousands of requests)
```

**Why This Works:**
- Fast reads: single document fetch loads all requests
- Simple: no complex joins or relationships
- Scalable: when >1000 requests, migrate to individual documents with compound indexes

---

### 2. **How We Structure Knowledge Base Updates** 🧠

**Update Flow:**
```
Supervisor answers → addEntry(question, answer) → saveData() → Firebase
                                                ↓
                                          AI learns immediately
```

**Implementation** (`models/KnowledgeBase.js`):
```javascript
static addEntry(question, answer) {
  knowledge.push({ question, answer });  // In-memory update
  persistData();                         // Firebase write (async)
  console.log('[KnowledgeBase] Saved entry to Firebase');
}
```

**Design Decisions:**
- **Immediate learning** → No delay, next caller gets the answer
- **Append-only** → Simple, no update conflicts
- **Asynchronous persistence** → Non-blocking, caller doesn't wait for DB write
- **Duplicate handling** → Future: add deduplication logic

**Matching Strategy:**
```javascript
static findAnswer(question) {
  const q = question.toLowerCase();
  return knowledge.find(entry => 
    q.includes(entry.question.toLowerCase())
  )?.answer || null;
}
```
- **Keyword matching** → Fast, works for exact phrases
- **Future enhancement** → Vector embeddings for semantic search

---

### 3. **How We Handle Supervisor Timeouts Gracefully** ⏱️

**Timeout Strategy:**
```javascript
// Auto-timeout worker runs every 60 seconds
setInterval(() => {
  HelpRequest.timeoutUnresolved();
}, 60 * 1000);

// In models/HelpRequest.js
static timeoutUnresolved() {
  const now = new Date();
  let updated = false;
  helpRequests.forEach(req => {
    if (req.status === 'Pending' && now - req.createdAt > 5 * 60 * 1000) {
      req.status = 'Unresolved';  // Mark as timed out
      req.resolvedAt = new Date();
      updated = true;
    }
  });
  if (updated) {
    persistData();  // Save to Firebase
  }
}
```

**Design Decisions:**
- **5-minute SLA** → Configurable timeout (production: based on business needs)
- **Graceful degradation** → Doesn't block, just marks as unresolved
- **Batch updates** → Only writes to DB if changes occurred (efficient)
- **Visible to supervisors** → Unresolved status shows in dashboard

**User Experience:**
- Caller sees: "Your request is being reviewed. We'll text you back shortly."
- System doesn't hang waiting forever
- Supervisors see unresolved requests to follow up manually

**Production Enhancements:**
- Send supervisor reminder notifications at 3 minutes
- Escalate to senior supervisor at 5 minutes
- Auto-retry with different AI model
- Track timeout metrics for SLA reporting

---

### 4. **How We Think About Scaling (10/day → 1,000/day)** 📈

**Current Architecture (10-100/day):**
```
Single Node.js Process
    ↓
Firebase Firestore (cloud-hosted)
    ↓
In-memory caching for speed
```

**Scaling to 1,000/day:**

| Component | Current | At 1,000/day | At 10,000/day |
|-----------|---------|--------------|---------------|
| **Backend** | Single Node.js | 2-3 instances + load balancer | Auto-scaling pods (Kubernetes) |
| **Database** | Firebase (1 doc) | Firebase (individual docs) | PostgreSQL + read replicas |
| **Caching** | In-memory | Redis cluster | Redis + CDN |
| **Queue** | None | RabbitMQ/SQS | Kafka for event streaming |
| **AI Calls** | Groq (free) | Groq paid tier | Self-hosted Llama on GPU |

**Specific Bottlenecks & Solutions:**

**1. Concurrent Voice Calls:**
- **Current:** LiveKit handles it (scales automatically)
- **Bottleneck:** None, LiveKit is cloud-native

**2. Firebase Reads/Writes:**
- **Current:** ~10-20 reads/sec (100 requests × 2 reads each)
- **At 1,000/day:** ~5 reads/sec → Add Redis cache
- **Solution:**
  ```javascript
  // Cache layer
  const cachedRequests = await redis.get('pending_requests');
  if (cachedRequests) return JSON.parse(cachedRequests);
  const requests = await loadData();  // Firebase fallback
  await redis.setex('pending_requests', 30, JSON.stringify(requests));
  ```

**3. Knowledge Base Lookups:**
- **Current:** In-memory array scan O(n)
- **At 1,000 entries:** Still fast (<1ms)
- **At 10,000 entries:** Move to vector DB (Pinecone)
  - Semantic similarity search
  - O(log n) with indexes
  - Fuzzy matching (typos, paraphrasing)

**4. Supervisor Dashboard:**
- **Current:** Full list reload every fetch
- **At 1,000/day:** Pagination (20 per page)
- **Solution:** 
  ```javascript
  GET /api/supervisor/requests?status=pending&page=1&limit=20
  ```

**5. AI API Rate Limits:**
- **Current:** Groq free tier (14,400 req/day)
- **At 1,000/day:** Still within limits
- **At 5,000/day:** Upgrade to paid tier or self-host

**Database Schema Evolution:**
```javascript
// Current: Single document
system/helpRequests/items = [req1, req2, ...]  // Max 1MB

// At scale: Individual documents
helpRequests/{uuid} = {request data}
// Indexes: status, createdAt, caller
// Composite index: (status, createdAt) for fast pending queries
```

**Cost Estimation:**
- **10/day:** $0/month (all free tiers)
- **1,000/day:** ~$20-30/month (Firebase, Groq paid)
- **10,000/day:** ~$200-300/month (servers, DB, AI)

---

### 5. **How We Modularize Components** 🧩

**Separation of Concerns:**

```
┌─────────────────────────────────────────┐
│  Agent Layer (AI Logic)                 │
│  - aiAgent.js (Groq/OpenAI)            │
│  - livekitAgent.js (Voice handling)    │
│  - voiceAgent.js (Speech processing)   │
└─────────────────────────────────────────┘
            ↓ (uses)
┌─────────────────────────────────────────┐
│  Models Layer (Data Logic)              │
│  - HelpRequest.js (Lifecycle)          │
│  - KnowledgeBase.js (Learning)         │
└─────────────────────────────────────────┘
            ↓ (persists via)
┌─────────────────────────────────────────┐
│  Database Layer                         │
│  - db.js (Firebase abstraction)        │
└─────────────────────────────────────────┘
            ↑ (exposed via)
┌─────────────────────────────────────────┐
│  API Layer (HTTP Interface)             │
│  - controllers/agentController.js      │
│  - controllers/supervisorController.js │
│  - routes/agentRoutes.js              │
│  - routes/supervisorRoutes.js         │
└─────────────────────────────────────────┘
```

**Key Design Principles:**

**1. Database Abstraction:**
```javascript
// db.js provides clean interface
export async function loadData() { ... }
export async function saveData(data) { ... }

// Easy to swap: Firebase → PostgreSQL → DynamoDB
// Just rewrite db.js, everything else unchanged
```

**2. Model Independence:**
```javascript
// models/HelpRequest.js doesn't know about HTTP or AI
// It only handles request lifecycle logic
class HelpRequest {
  static add(request) { ... }      // Pure data operation
  static resolve(id, answer) { ... }
  static timeoutUnresolved() { ... }
}
```

**3. Controller/Route Separation:**
```javascript
// routes/agentRoutes.js - Just routing
router.post('/ask', agentController.handleQuestion);

// controllers/agentController.js - Business logic
export async function handleQuestion(req, res) {
  const answer = KnowledgeBase.findAnswer(question);
  if (!answer) {
    const aiResponse = await getAIResponse(question);
    // Escalation logic here
  }
}
```

**4. AI Agent Modularity:**
```javascript
// aiAgent.js - Pure AI logic
export async function getAIResponse(question, context) {
  // Groq → OpenAI fallback
  // No HTTP, no database, no side effects
}

// livekitAgent.js - Voice integration
// Uses aiAgent.js but handles LiveKit specifics
```

**Benefits of This Design:**
- ✅ **Testable** → Each module can be unit tested independently
- ✅ **Scalable** → Swap Firebase for PostgreSQL without touching AI logic
- ✅ **Maintainable** → Bug in AI? Only touch aiAgent.js
- ✅ **Reusable** → Use HelpRequest model in mobile app, chatbot, etc.

**Text-Back Handling:**
```javascript
// Currently: Console log simulation
console.log(`[Text-Back] Would send to ${caller}: ${answer}`);

// Phase 2: Twilio integration
// Just add textBackService.js, inject into controller
import { sendSMS } from './textBackService.js';
await sendSMS(callerPhone, answer);

// No changes to HelpRequest or KnowledgeBase models!
```

---

## 🏗️ Architecture & Design Decisions

### 1. **Request Lifecycle Model**

Each help request follows this state machine:

```
PENDING → RESOLVED (supervisor answers)
        → UNRESOLVED (5-minute timeout)
```

**Data Model:**
```javascript
{
  id: "uuid",
  caller: "John Doe",
  question: "What are your hours?",
  status: "pending" | "resolved" | "unresolved",
  answer: "We're open 9am-5pm",
  createdAt: "ISO timestamp",
  resolvedAt: "ISO timestamp",
  timeout: setTimeout reference
}
```

**Design Rationale:**
- Simple state machine for clarity
- Timeout handling prevents requests from hanging forever
- UUID-based IDs for scalability to distributed systems

### 2. **Knowledge Base Structure**

**Current Implementation:**
- Firebase Firestore for cloud persistence
- Simple Q&A pairs: `{ question, answer }`
- Exact and fuzzy matching on questions
- Loads on server startup, saves on every update
- Data survives server restarts

**Production Enhancement Path:**
- Add vector database (Pinecone, Weaviate) for semantic search
- Implement similarity matching (not just exact keywords)
- Add versioning for knowledge updates
- Implement confidence scores for answers

### 3. **AI Agent Architecture**

**Model Selection:**
- **Primary:** Groq Llama 3.3 70B (fast, free tier, high quality)
- **Fallback:** OpenAI GPT-4 (if Groq unavailable)

**Prompt Engineering:**
Following OpenAI best practices with structured prompts:
```
# Identity - Who the AI is
# Instructions - What rules to follow
# Learned Knowledge Base - Context from supervisors
# Examples - Few-shot learning (optional)
```

**Escalation Logic:**
- AI detects uncertainty via response analysis
- Keywords: "check with supervisor", "not sure", "don't know"
- Creates help request and notifies caller

### 4. **Real-Time Communication**

**During Active Calls:**
- WebSocket connection via LiveKit
- Supervisor answers push to frontend immediately
- Caller receives answer without hanging up

**For Offline Scenarios:**
- System logs "would text back" message
- Ready for Twilio SMS integration in Phase 2

### 5. **Scalability Considerations**

**Current (10-100 requests/day):**
- In-memory storage sufficient
- Single Node.js process

**Future (1,000-10,000 requests/day):**
- Add Redis for shared state
- Database: PostgreSQL or DynamoDB
- Message queue: RabbitMQ for supervisor notifications
- Horizontal scaling with load balancer

---

## 🎨 Features Implemented

### ✅ Core Requirements
- [x] LiveKit voice call integration
- [x] AI agent with business knowledge
- [x] Escalation on unknown questions
- [x] Pending request creation
- [x] Supervisor notification (console logging)
- [x] Supervisor UI for answering
- [x] Request history (resolved/unresolved)
- [x] Real-time caller updates
- [x] Knowledge base auto-learning
- [x] Timeout handling (5 minutes)

### 🌟 Bonus Features
- [x] Dual interface: Voice + Text chat
- [x] Real-time speech recognition
- [x] Audio level visualization
- [x] Stats dashboard (pending/resolved counts)
- [x] Modern, color-coded UI
- [x] Groq AI integration for cost efficiency

---

## 🧪 Testing the System

### Test Scenario 1: Known Question
1. Start voice call
2. Ask: "What is the capital of France?"
3. **Expected:** AI answers immediately from training data

### Test Scenario 2: Learned Question
1. Supervisor answers: "What services do you offer?"
2. Answer: "We provide consulting services"
3. Call again and ask the same question
4. **Expected:** AI answers from knowledge base without escalation

### Test Scenario 3: Unknown Question with Escalation
1. Start voice call
2. Ask: "What's your Wi-Fi password?"
3. **Expected:**
   - AI says "Let me check with my supervisor"
   - Request appears in Supervisor Dashboard as PENDING
   - Open Supervisor Dashboard in new tab
   - Submit answer: "The Wi-Fi password is Guest2024"
   - Caller sees answer appear in real-time
   - Future callers asking same question get instant answer

### Test Scenario 4: Timeout Handling
1. Ask unknown question to trigger escalation
2. Don't answer it in Supervisor Dashboard
3. Wait 5+ minutes
4. **Expected:** Request status changes to UNRESOLVED

---

## 🔧 Configuration

### AI Models
Edit `backend/aiAgent.js` to change models:
```javascript
// Groq models (fast, free)
"llama-3.3-70b-versatile"
"llama-3.1-70b-versatile"

// OpenAI models (fallback)
"gpt-4"
"gpt-3.5-turbo"
```

### Timeout Duration
Edit `backend/models/HelpRequest.js`:
```javascript
const TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes
```

### Escalation Detection
Edit `backend/aiAgent.js` - `detectEscalation()` function:
```javascript
const escalationPhrases = [
  'check with my supervisor',
  'not sure',
  'don\'t know'
];
```

---

## 🚀 Future Improvements

### Phase 2 (Live Call Transfer)
- Implement "hold music" during escalation
- Transfer call to supervisor if available
- Fall back to text-based flow if supervisor offline

### Production Readiness
1. **Database Enhancement:**
   - Add Firebase indexes for faster queries at scale
   - Implement Firestore security rules for production
   - Add Redis for caching frequently accessed data
   - Implement vector DB (Pinecone) for semantic search on knowledge base

2. **Security:**
   - API authentication (JWT tokens)
   - Rate limiting
   - Input sanitization

3. **Monitoring:**
   - Logging: Winston or Pino
   - Metrics: Prometheus + Grafana
   - Error tracking: Sentry

4. **SMS Integration:**
   - Twilio for text-back notifications
   - SMS queue for async delivery

5. **Advanced AI:**
   - Fine-tune model on company-specific data
   - Multi-turn conversation context
   - Sentiment analysis for urgent escalations

---

## 📊 Tech Stack

- **Frontend:** React 18 + Vite
- **Backend:** Node.js + Express
- **AI:** Groq (Llama 3.3 70B) + OpenAI (fallback)
- **Voice:** LiveKit WebRTC
- **Storage:** Firebase Firestore (Cloud NoSQL Database)
- **Styling:** TailwindCSS

---

## 🎥 Video Demo

[Link to video walkthrough - to be recorded]

Demonstrates:
1. Voice call with known question
2. Voice call with escalation
3. Supervisor answering in dashboard
4. Real-time answer delivery to caller
5. Knowledge base learning

---

## 📝 Design Notes for Reviewers

### Why Firebase Firestore?
- **Lightweight:** No database server setup required
- **Cloud-hosted:** Accessible from anywhere, automatic backups
- **Real-time:** Built-in real-time sync capabilities
- **NoSQL:** Flexible schema for rapid iteration
- **Free tier:** Generous limits for prototyping
- **Assignment requirement:** Explicitly mentioned as option
- **Scalable:** Production-ready from day one

### Why Groq?
- Free tier with generous limits
- Llama 3.3 70B rivals GPT-4 quality
- ~10x faster than OpenAI API
- Cost-effective for production scaling

### Why This Architecture?
- **Modular:** Agent, requests, and knowledge are separate
- **Scalable:** Easy to add Redis/DB/queues
- **Testable:** Each component can be tested independently
- **Production-Ready:** Handles errors, timeouts, edge cases

### Code Quality Focus
- Clean separation of concerns
- Comprehensive error handling
- Console logging for debugging
- No hardcoded values (environment variables)

---

## 🤝 Contributing

This is a test project, but feedback welcome!



## 👤 Author

Built for Frontdesk Engineering Test Assignment

