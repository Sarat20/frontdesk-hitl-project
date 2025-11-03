import React, { useState, useEffect, useRef } from 'react';

export default function CallerInterface() {
  const [callerName, setCallerName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isCallActive, setIsCallActive] = useState(false);
  const [question, setQuestion] = useState('');
  const [conversation, setConversation] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [requestId, setRequestId] = useState(null);
  const [backendStatus, setBackendStatus] = useState('checking');
  const conversationEndRef = useRef(null);

  
  useEffect(() => {
    const checkBackend = async () => {
      try {
        const response = await fetch('/api/health');
        if (response.ok) {
          setBackendStatus('connected');
        } else {
          setBackendStatus('error');
        }
      } catch (error) {
        setBackendStatus('disconnected');
      }
    };
    checkBackend();
    const interval = setInterval(checkBackend, 10000); // Check every 10 seconds
    return () => clearInterval(interval);
  }, []);

  
  useEffect(() => {
    conversationEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation]);

  useEffect(() => {
    if (!requestId || !isCallActive) return;

    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`/api/agent/check-request/${requestId}`);
        if (response.ok) {
          const data = await response.json();
          if (data.status === 'Resolved' && data.answer) {
           
            addMessage('ai', `Great news! Here's the answer: ${data.answer}`);
            setRequestId(null);
          }
        }
      } catch (error) {
        console.error('Error checking request status:', error);
      }
    }, 3000); 

    return () => clearInterval(pollInterval);
  }, [requestId, isCallActive]);

  const startCall = async () => {
    if (!callerName.trim()) {
      alert('Please enter your name');
      return;
    }

    try {
      const healthCheck = await fetch('/api/health');
      if (!healthCheck.ok) {
        alert('⚠️ Backend server is not responding. Please make sure:\n\n1. Open terminal in backend folder\n2. Run: node app.js\n3. Wait for "Server running on port 4000"\n4. Then try again');
        return;
      }
      console.log('✓ Backend connection verified');
    } catch (error) {
      alert('❌ Cannot connect to backend server!\n\nPlease start the backend:\n\n1. Open terminal\n2. cd backend\n3. node app.js\n\nThen refresh this page and try again.');
      return;
    }

    setIsCallActive(true);
    addMessage('ai', `Hello ${callerName}! I'm your AI assistant. How can I help you today?`);
  };

  const endCall = () => {
    setIsCallActive(false);
    setConversation([]);
    setRequestId(null);
    addMessage('system', 'Call ended. Thank you!');
  };

  const addMessage = (sender, text) => {
    setConversation(prev => [...prev, {
      sender,
      text,
      timestamp: new Date().toISOString()
    }]);
  };

  const askQuestion = async () => {
    if (!question.trim()) {
      alert('Please enter a question');
      return;
    }

    addMessage('user', question);
    setIsLoading(true);

    try {
      const response = await fetch('/api/agent/receive-call', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          caller: callerName,
          question: question,
          phoneNumber: phoneNumber || 'N/A'
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Backend error:', response.status, errorText);
        
        if (response.status === 404) {
          throw new Error('Backend server not found. Make sure backend is running on port 4000.');
        } else if (response.status === 500) {
          throw new Error('Backend server error. Check your OpenAI API key in backend/.env file.');
        } else {
          throw new Error(`Backend error (${response.status}): ${errorText}`);
        }
      }

      const data = await response.json();
      
      addMessage('ai', data.response);

      if (data.requestId) {
        setRequestId(data.requestId);
        addMessage('system', '⏳ Your question has been escalated to a supervisor. You\'ll receive a response shortly.');
      }

      setQuestion(''); 
    } catch (error) {
      console.error('Error asking question:', error);
      
      
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        addMessage('error', '❌ Cannot connect to backend server. Please make sure:\n1. Backend server is running (cd backend && node app.js)\n2. Server shows "Server running on port 4000"');
      } else if (error.message.includes('OpenAI') || error.message.includes('API key')) {
        addMessage('error', '❌ OpenAI API error. Please check your OPENAI_API_KEY in backend/.env file.');
      } else {
        addMessage('error', `❌ Error: ${error.message}\n\nPlease check backend terminal for details.`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      askQuestion();
    }
  };

  if (!isCallActive) {
    return (
      <div className="max-w-2xl mx-auto mt-10 p-6 bg-white rounded-lg shadow-xl">
        {/* Backend Status Indicator */}
        <div className={`mb-4 p-3 rounded-lg flex items-center gap-2 ${
          backendStatus === 'connected' ? 'bg-green-100 text-green-800' :
          backendStatus === 'disconnected' ? 'bg-red-100 text-red-800' :
          backendStatus === 'error' ? 'bg-yellow-100 text-yellow-800' :
          'bg-gray-100 text-gray-800'
        }`}>
          <span className="text-xl">
            {backendStatus === 'connected' ? '✅' :
             backendStatus === 'disconnected' ? '❌' :
             backendStatus === 'error' ? '⚠️' : '⏳'}
          </span>
          <span className="text-sm font-medium">
            {backendStatus === 'connected' ? 'Backend Connected' :
             backendStatus === 'disconnected' ? 'Backend Disconnected - Start backend server (cd backend && node app.js)' :
             backendStatus === 'error' ? 'Backend Error - Check console' :
             'Checking backend connection...'}
          </span>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2" style={{color: '#1D546C'}}>☎️ AI Phone Assistant</h1>
          <p className="text-gray-600">Human-in-the-Loop Demo</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Your Name *
            </label>
            <input
              type="text"
              value={callerName}
              onChange={(e) => setCallerName(e.target.value)}
              placeholder="Enter your name"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phone Number (Optional)
            </label>
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="(555) 123-4567"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          <button
            onClick={startCall}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg transition duration-200 transform hover:scale-105"
          >
            📞 Start Call
          </button>
        </div>

        <div className="mt-6 p-4 bg-purple-50 rounded-lg">
          <h3 className="font-semibold text-purple-800 mb-2">Try asking:</h3>
          <ul className="text-sm text-gray-700 space-y-1">
            <li>• Ask any general knowledge question</li>
            <li>• Try questions about movies, history, science</li>
            <li>• Ask about technical topics</li>
            <li>• If the AI doesn't know, it will escalate to a supervisor</li>
          </ul>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto mt-10 p-6 bg-white rounded-lg shadow-xl">
      <div className="flex items-center justify-between mb-6 pb-4 border-b">
        <div>
          <h2 className="text-2xl font-bold text-purple-600">Call in Progress</h2>
          <p className="text-sm text-gray-600">Caller: {callerName}</p>
        </div>
        <button
          onClick={endCall}
          className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded-lg transition duration-200"
        >
          📵 End Call
        </button>
      </div>

     
      <div className="bg-gray-50 rounded-lg p-4 h-96 overflow-y-auto mb-4 space-y-3">
        {conversation.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xs lg:max-w-md px-4 py-3 rounded-lg ${
                msg.sender === 'user'
                  ? 'bg-purple-600 text-white rounded-br-none'
                  : msg.sender === 'ai'
                  ? 'bg-blue-500 text-white rounded-bl-none'
                  : msg.sender === 'system'
                  ? 'bg-yellow-100 text-yellow-800 border border-yellow-300'
                  : 'bg-red-100 text-red-800 border border-red-300'
              }`}
            >
              <div className="text-xs font-semibold mb-1 opacity-75">
                {msg.sender === 'user' ? 'You' : msg.sender === 'ai' ? 'AI Agent' : 'System'}
              </div>
              <div className="text-sm">{msg.text}</div>
              <div className="text-xs mt-1 opacity-70">
                {new Date(msg.timestamp).toLocaleTimeString()}
              </div>
            </div>
          </div>
        ))}
        <div ref={conversationEndRef} />
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type your question here..."
          disabled={isLoading}
          className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100"
        />
        <button
          onClick={askQuestion}
          disabled={isLoading || !question.trim()}
          className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white font-bold py-3 px-8 rounded-lg transition duration-200"
        >
          {isLoading ? '...' : 'Send'}
        </button>
      </div>

      {requestId && (
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center gap-2">
          <div className="animate-pulse">⏳</div>
          <p className="text-sm text-yellow-800">
            Waiting for supervisor response... (Request ID: {requestId.slice(0, 8)})
          </p>
        </div>
      )}
    </div>
  );
}
