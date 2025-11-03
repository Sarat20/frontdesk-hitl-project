import React, { useState } from 'react';
import VoiceCallerInterface from './VoiceCallerInterface';
import CallerInterface from './CallerInterface';
import SupervisorPanel from './SupervisorPanel';

export default function MainApp() {
  const [view, setView] = useState('home');

  if (view === 'caller') {
    return (
      <div>
        <div className="text-white p-4 shadow-lg border-b-2" style={{background: 'linear-gradient(to right, #8ABEB9, #1D546C)', borderColor: '#1D546C'}}>
          <div className="max-w-4xl mx-auto flex justify-between items-center">
            <div>
              <h1 className="text-xl font-bold">Voice Call Interface</h1>
              <p className="text-xs" style={{color: '#B7E5CD'}}>Human-in-the-Loop AI System</p>
            </div>
            <button
              onClick={() => setView('home')}
              className="bg-white hover:bg-gray-100 px-4 py-2 rounded-lg transition duration-200 font-bold" style={{color: '#1D546C'}}
            >
              ← Back
            </button>
          </div>
        </div>
        <VoiceCallerInterface />
      </div>
    );
  }

  if (view === 'caller-text') {
    return (
      <div>
        <div className="text-white p-4 shadow-lg" style={{backgroundColor: '#8ABEB9'}}>
          <div className="max-w-4xl mx-auto flex justify-between items-center">
            <h1 className="text-xl font-bold">Text Chat (Legacy)</h1>
            <button
              onClick={() => setView('home')}
              className="hover:bg-gray-800 px-4 py-2 rounded-lg transition duration-200" style={{backgroundColor: '#1D546C'}}
            >
              ← Back to Home
            </button>
          </div>
        </div>
        <CallerInterface />
      </div>
    );
  }

  if (view === 'supervisor') {
    return (
      <div>
        <div className="text-white p-4 shadow-lg border-b-2" style={{background: 'linear-gradient(to right, #8ABEB9, #1D546C)', borderColor: '#1D546C'}}>
          <div className="max-w-4xl mx-auto flex justify-between items-center">
            <div>
              <h1 className="text-xl font-bold">Supervisor Dashboard</h1>
              <p className="text-xs" style={{color: '#B7E5CD'}}>Answer escalated questions</p>
            </div>
            <button
              onClick={() => setView('home')}
              className="bg-white hover:bg-gray-100 px-4 py-2 rounded-lg transition duration-200 font-bold" style={{color: '#1D546C'}}
            >
              ← Back
            </button>
          </div>
        </div>
        <SupervisorPanel />
      </div>
    );
  }

  
  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-6">
      <div className="max-w-5xl w-full">
        <div className="text-center mb-12 border-b-2 pb-8" style={{borderColor: '#8ABEB9'}}>
          <h1 className="text-5xl font-bold text-black mb-4">
            Human-in-the-Loop AI System
          </h1>
          <p className="text-2xl font-semibold mb-2" style={{color: '#1D546C'}}>Frontdesk Engineering Test Demo</p>
          <p className="text-gray-600">Real-time Voice AI with Supervisor Escalation & Knowledge Learning</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Voice Caller Card */}
          <div className="bg-white border-2 rounded-xl shadow-2xl p-8 transform transition duration-300 hover:scale-105" style={{borderColor: '#8ABEB9'}}>
            <div className="text-center mb-6">
              <div className="text-6xl mb-4">🎤</div>
              <h2 className="text-2xl font-bold text-black mb-3">Customer Interface</h2>
              <p className="text-gray-700 font-semibold mb-2">Voice Call with AI Agent</p>
              <span className="inline-block px-3 py-1 text-white text-xs font-bold rounded-full" style={{backgroundColor: '#8ABEB9'}}>
                GROQ AI - LLAMA 3.3 70B
              </span>
            </div>
            <button
              onClick={() => setView('caller')}
              className="w-full text-white font-bold py-4 px-6 rounded-lg transition duration-200 transform hover:translate-y-[-2px]" style={{backgroundColor: '#8ABEB9'}} onMouseEnter={(e) => e.target.style.backgroundColor = '#1D546C'} onMouseLeave={(e) => e.target.style.backgroundColor = '#8ABEB9'}
            >
              📞 Start Voice Call
            </button>
            <div className="mt-4 p-4 rounded-lg" style={{backgroundColor: '#B7E5CD', border: '1px solid #8ABEB9'}}>
              <p className="text-sm font-bold text-black mb-2">✅ Features:</p>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>• Real-time voice conversation</li>
                <li>• Automatic speech recognition</li>
                <li>• AI-powered responses</li>
                <li>• Smart supervisor escalation</li>
                <li>• LiveKit voice technology</li>
              </ul>
            </div>
          </div>

          {/* Supervisor Card */}
          <div className="bg-white border-2 rounded-xl shadow-2xl p-8 transform transition duration-300 hover:scale-105" style={{borderColor: '#1D546C'}}>
            <div className="text-center mb-6">
              <div className="text-6xl mb-4">👨‍💼</div>
              <h2 className="text-2xl font-bold text-black mb-3">Supervisor Dashboard</h2>
              <p className="text-gray-700 font-semibold mb-2">Answer Escalated Questions</p>
              <span className="inline-block px-3 py-1 text-white text-xs font-bold rounded-full" style={{backgroundColor: '#1D546C'}}>
                HUMAN-IN-THE-LOOP
              </span>
            </div>
            <button
              onClick={() => setView('supervisor')}
              className="w-full text-white font-bold py-4 px-6 rounded-lg transition duration-200 transform hover:translate-y-[-2px]" style={{backgroundColor: '#1D546C'}} onMouseEnter={(e) => e.target.style.backgroundColor = '#8ABEB9'} onMouseLeave={(e) => e.target.style.backgroundColor = '#1D546C'}
            >
              📊 Open Dashboard
            </button>
            <div className="mt-4 p-4 rounded-lg" style={{backgroundColor: '#B7E5CD', border: '1px solid #8ABEB9'}}>
              <p className="text-sm font-bold text-black mb-2">✅ Features:</p>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>• View pending escalations</li>
                <li>• Answer customer questions</li>
                <li>• Update knowledge base</li>
                <li>• Monitor system stats</li>
                <li>• Real-time updates</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-12 bg-white border-2 rounded-xl shadow-lg p-8" style={{borderColor: '#8ABEB9'}}>
          <h3 className="text-2xl font-bold mb-6 text-center border-b-2 pb-4" style={{color: '#1D546C', borderColor: '#8ABEB9'}}>
            🔄 System Workflow
          </h3>
          <div className="grid md:grid-cols-4 gap-6 text-center">
            <div className="p-4 rounded-lg" style={{backgroundColor: '#B7E5CD', border: '1px solid #8ABEB9'}}>
              <div className="text-4xl mb-3 font-bold" style={{color: '#1D546C'}}>1</div>
              <p className="text-sm text-gray-800 font-semibold">Customer starts voice call</p>
            </div>
            <div className="p-4 rounded-lg" style={{backgroundColor: '#B7E5CD', border: '1px solid #8ABEB9'}}>
              <div className="text-4xl mb-3 font-bold" style={{color: '#1D546C'}}>2</div>
              <p className="text-sm text-gray-800 font-semibold">AI attempts to answer</p>
            </div>
            <div className="p-4 rounded-lg" style={{backgroundColor: '#B7E5CD', border: '1px solid #8ABEB9'}}>
              <div className="text-4xl mb-3 font-bold" style={{color: '#1D546C'}}>3</div>
              <p className="text-sm text-gray-800 font-semibold">Unknown? Escalates to supervisor</p>
            </div>
            <div className="p-4 rounded-lg" style={{backgroundColor: '#B7E5CD', border: '1px solid #8ABEB9'}}>
              <div className="text-4xl mb-3 font-bold" style={{color: '#1D546C'}}>4</div>
              <p className="text-sm text-gray-800 font-semibold">Supervisor answers, AI learns</p>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center p-6 rounded-lg" style={{backgroundColor: '#B7E5CD', border: '1px solid #8ABEB9'}}>
          <p className="text-sm text-gray-800 font-semibold">Tech Stack: React + Node.js + Express + Groq AI (Llama 3.3) + LiveKit Voice</p>
          <p className="mt-2 text-sm text-gray-700">🚀 Scalable • 🧠 Self-learning • 👥 Human-supervised • 🎤 Real-time Voice</p>
        </div>
      </div>
    </div>
  );
}
