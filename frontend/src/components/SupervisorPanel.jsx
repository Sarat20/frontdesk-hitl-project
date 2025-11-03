import React, { useState, useEffect } from 'react';
import HelpRequestList from './HelpRequestList';
import KnowledgeBase from './KnowledgeBase';


export default function SupervisorPanel() {
  const [requests, setRequests] = useState([]);
  const [knowledge, setKnowledge] = useState([]);
  const [stats, setStats] = useState({
    pending: 0,
    resolved: 0,
    unresolved: 0,
    total: 0
  });

  const fetchRequests = async () => {
    const res = await fetch('/api/supervisor/pending');
    if (res.ok) {
      const data = await res.json();
      setRequests(data);
    }
  };

  const fetchKnowledge = async () => {
    const res = await fetch('/api/knowledge');
    if (res.ok) {
      const data = await res.json();
      setKnowledge(data);
    }
  };

  const fetchStats = async () => {
    const res = await fetch('/api/supervisor/all');
    if (res.ok) {
      const allRequests = await res.json();
      const stats = {
        total: allRequests.length,
        pending: allRequests.filter(r => r.status === 'Pending').length,
        resolved: allRequests.filter(r => r.status === 'Resolved').length,
        unresolved: allRequests.filter(r => r.status === 'Unresolved').length
      };
      setStats(stats);
    }
  };

  useEffect(() => {
    fetchRequests();
    fetchKnowledge();
    fetchStats();
    const interval = setInterval(() => {
      fetchRequests();
      fetchStats();
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const refreshAll = () => {
    fetchRequests();
    fetchKnowledge();
    fetchStats();
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8 border-b-2 pb-4" style={{borderColor: '#8ABEB9'}}>
        <h1 className="text-3xl font-bold text-black mb-2">Supervisor Dashboard</h1>
        <p className="text-lg font-semibold" style={{color: '#1D546C'}}>Human-in-the-Loop AI System - Frontdesk Test</p>
        <p className="text-sm text-gray-600 mt-1">Answer escalated questions and update knowledge base</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="rounded-lg p-4" style={{backgroundColor: '#B7E5CD', border: '2px solid #8ABEB9'}}>
          <div className="text-sm font-bold" style={{color: '#1D546C'}}>⏳ PENDING</div>
          <div className="text-3xl font-bold" style={{color: '#1D546C'}}>{stats.pending}</div>
        </div>
        <div className="rounded-lg p-4" style={{backgroundColor: '#B7E5CD', border: '1px solid #8ABEB9'}}>
          <div className="text-gray-800 text-sm font-bold">✅ RESOLVED</div>
          <div className="text-3xl font-bold text-gray-800">{stats.resolved}</div>
        </div>
        <div className="rounded-lg p-4" style={{backgroundColor: '#B7E5CD', border: '1px solid #8ABEB9'}}>
          <div className="text-gray-700 text-sm font-bold">❌ UNRESOLVED</div>
          <div className="text-3xl font-bold text-gray-800">{stats.unresolved}</div>
        </div>
        <div className="rounded-lg p-4" style={{backgroundColor: '#B7E5CD', border: '1px solid #8ABEB9'}}>
          <div className="text-gray-700 text-sm font-bold">📊 TOTAL</div>
          <div className="text-3xl font-bold text-black">{stats.total}</div>
        </div>
      </div>

      {/* Help Requests Section */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-8" style={{border: '2px solid #8ABEB9'}}>
        <HelpRequestList requests={requests} refresh={refreshAll} />
      </div>

      {/* Knowledge Base Section */}
      <div className="bg-white rounded-lg shadow-lg p-6" style={{border: '2px solid #1D546C'}}>
        <KnowledgeBase knowledge={knowledge} />
        <div className="mt-4 p-4 rounded-lg" style={{backgroundColor: '#B7E5CD', border: '1px solid #8ABEB9'}}>
          <p className="text-sm text-gray-800">
            💡 <strong>System Behavior:</strong> When you answer a pending request, the AI automatically learns from your response and adds it to the knowledge base. Future similar questions will be answered instantly without escalation.
          </p>
        </div>
      </div>
    </div>
  );
}
