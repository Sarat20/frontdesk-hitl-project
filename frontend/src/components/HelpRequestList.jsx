import React, { useState } from 'react';

export default function HelpRequestList({ requests, refresh }) {
  const [answers, setAnswers] = useState({});
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState([]);

  const handleChange = (id, value) => {
    setAnswers({ ...answers, [id]: value });
  };

  const submitAnswer = async (id) => {
    if (!answers[id]) {
      alert('Please enter an answer before submitting.');
      return;
    }
    await fetch('/api/supervisor/submit-answer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, answer: answers[id] }),
    });
    alert('Answer submitted!');
    setAnswers({ ...answers, [id]: '' });
    refresh();
  };

  const fetchHistory = async () => {
    const res = await fetch('/api/supervisor/all');
    if (res.ok) {
      setHistory(await res.json());
    } else {
      alert('Failed to fetch request history.');
    }
  };

  const toggleHistory = () => {
    if (!showHistory) fetchHistory();
    setShowHistory(!showHistory);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-semibold">Pending Help Requests</h2>
        <button
          onClick={toggleHistory}
          className="text-sm px-3 py-1 bg-gray-300 rounded hover:bg-gray-400"
        >
          {showHistory ? 'Hide History' : 'View All Requests (History)'}
        </button>
      </div>
      {showHistory ? (
        <div className="border rounded p-4 bg-gray-50">
          <h3 className="mb-2 font-bold">All Requests (Resolved, Unresolved & Pending)</h3>
          {history.length === 0 ? (
            <p>No requests yet.</p>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b font-medium">
                  <th>ID</th>
                  <th>Caller</th>
                  <th>Question</th>
                  <th>Status</th>
                  <th>Answer</th>
                  <th>Resolved At</th>
                </tr>
              </thead>
              <tbody>
                {history.map(r => (
                  <tr key={r.id} className="border-b">
                    <td>{r.id}</td>
                    <td>{r.caller}</td>
                    <td>{r.question}</td>
                    <td>{r.status}</td>
                    <td>{r.answer || '-'}</td>
                    <td>{r.resolvedAt ? new Date(r.resolvedAt).toLocaleString() : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      ) : (
        requests.length === 0 ? (
          <p>No pending help requests.</p>
        ) : (
          requests.map(({ id, question, caller }) => (
            <div key={id} className="mb-6 p-4 border rounded shadow-lg">
              <p><strong>Caller:</strong> {caller}</p>
              <p><strong>Question:</strong> {question}</p>
              <textarea
                className="mt-2 w-full border rounded p-2"
                rows="3"
                placeholder="Type your answer here"
                value={answers[id] || ''}
                onChange={e => handleChange(id, e.target.value)}
              />
              <button
                className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                onClick={() => submitAnswer(id)}
              >
                Submit Answer
              </button>
            </div>
          ))
        )
      )}
    </div>
  );
}
