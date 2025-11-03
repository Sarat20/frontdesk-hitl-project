import React, { useState, useEffect, useRef } from 'react';
import { Room, RoomEvent, Track, LocalAudioTrack, createLocalAudioTrack } from 'livekit-client';

export default function VoiceCallerInterface() {
  const [callerName, setCallerName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isCallActive, setIsCallActive] = useState(false);
  const [conversation, setConversation] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [requestId, setRequestId] = useState(null);
  const [backendStatus, setBackendStatus] = useState('checking');
  const [room, setRoom] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [textInput, setTextInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const conversationEndRef = useRef(null);
  const localAudioTrackRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const recognitionRef = useRef(null);
  const isCallActiveRef = useRef(false);


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
    const interval = setInterval(checkBackend, 10000);
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
            addMessage('system', '✅ Supervisor has responded!');
            addMessage('ai', data.answer);
            setRequestId(null);
          }
        }
      } catch (error) {
        console.error('Error checking request status:', error);
      }
    }, 3000);

    return () => clearInterval(pollInterval);
  }, [requestId, isCallActive]);

  
  useEffect(() => {
    return () => {
      if (room) {
        room.disconnect();
      }
      if (localAudioTrackRef.current) {
        try {
          localAudioTrackRef.current.stop();
        } catch (e) {
          console.log('Audio track already stopped');
        }
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        try {
          audioContextRef.current.close();
        } catch (e) {
          console.log('AudioContext already closed');
        }
      }
    };
  }, [room]);

  const addMessage = (sender, text) => {
    setConversation(prev => [...prev, {
      sender,
      text,
      timestamp: new Date().toISOString()
    }]);
  };

  const startVoiceCall = async () => {
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

    setIsConnecting(true);
    setIsLoading(true);

    try {
   
      const response = await fetch('/api/agent/initiate-call', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          caller: callerName,
          phoneNumber: phoneNumber || 'N/A'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to get LiveKit token');
      }

      const { token, roomName } = await response.json();
      console.log('✓ LiveKit token received, connecting to room:', roomName);

      
      const newRoom = new Room({
        adaptiveStream: true,
        dynacast: true,
        audioCaptureDefaults: {
          autoGainControl: true,
          echoCancellation: true,
          noiseSuppression: true,
        },
      });

      newRoom.on(RoomEvent.Connected, () => {
        console.log('✓ Connected to LiveKit room');
        addMessage('system', '📞 Call connected! You can now speak with the AI.');
        setIsCallActive(true);
        isCallActiveRef.current = true;
        setIsConnecting(false);
        setIsLoading(false);
      });

      newRoom.on(RoomEvent.Disconnected, () => {
        console.log('Disconnected from room');
        if (isCallActive) {
          addMessage('system', '📵 Call ended.');
        }
        setIsCallActive(false);
        isCallActiveRef.current = false;
        setIsConnecting(false);
        setRoom(null);
      });

      newRoom.on(RoomEvent.DataReceived, (payload, participant) => {
        try {
          const decoder = new TextDecoder();
          const message = JSON.parse(decoder.decode(payload));
          console.log('Data received:', message);

          if (message.type === 'ai_response') {
            addMessage('ai', message.text);
          } else if (message.type === 'escalation_created') {
            setRequestId(message.requestId);
            addMessage('system', '⏳ Your question has been escalated to a supervisor.');
          } else if (message.type === 'transcription') {
            addMessage('user', message.text);
          }
        } catch (error) {
          console.error('Error processing data:', error);
        }
      });

      newRoom.on(RoomEvent.TrackSubscribed, (track, publication, participant) => {
        console.log('Track subscribed:', track.kind, 'from', participant.identity);
        
        if (track.kind === Track.Kind.Audio) {
          const audioElement = track.attach();
          document.body.appendChild(audioElement);
          audioElement.play();
          console.log('✓ AI audio track playing');
        }
      });

      newRoom.on(RoomEvent.TrackUnsubscribed, (track) => {
        track.detach().forEach(element => element.remove());
      });

    
      const livekitUrl = import.meta.env.VITE_LIVEKIT_URL;
      await newRoom.connect(livekitUrl, token);
      setRoom(newRoom);

      
      const audioTrack = await createLocalAudioTrack({
        autoGainControl: true,
        echoCancellation: true,
        noiseSuppression: true,
      });
      
      localAudioTrackRef.current = audioTrack;
      await newRoom.localParticipant.publishTrack(audioTrack);
      console.log('✓ Local audio track published');

      
      setupAudioLevelMonitoring(audioTrack);

      addMessage('ai', `Hello ${callerName}! I'm your AI assistant. How can I help you today?`);
      addMessage('system', '🎤 Voice recognition active - Start speaking!');
      

      setTimeout(() => {
        startSpeechRecognition();
      }, 1000);

    } catch (error) {
      console.error('Error starting voice call:', error);
      addMessage('error', `❌ Failed to start call: ${error.message}`);
      setIsConnecting(false);
      setIsLoading(false);
    }
  };

  const setupAudioLevelMonitoring = (audioTrack) => {
    try {
      const stream = new MediaStream([audioTrack.mediaStreamTrack]);
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const analyser = audioContext.createAnalyser();
      const microphone = audioContext.createMediaStreamSource(stream);
      
      analyser.smoothingTimeConstant = 0.8;
      analyser.fftSize = 1024;
      
      microphone.connect(analyser);
      
      audioContextRef.current = audioContext;
      analyserRef.current = analyser;

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      
      const updateLevel = () => {
        if (analyserRef.current && isCallActive) {
          analyser.getByteFrequencyData(dataArray);
          const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
          setAudioLevel(Math.min(100, average));
          requestAnimationFrame(updateLevel);
        }
      };
      
      updateLevel();
    } catch (error) {
      console.error('Error setting up audio monitoring:', error);
    }
  };

  const toggleMute = async () => {
    if (localAudioTrackRef.current) {
      const newMutedState = !isMuted;
      if (localAudioTrackRef.current.mute && localAudioTrackRef.current.unmute) {
        if (newMutedState) {
          await localAudioTrackRef.current.mute();
        } else {
          await localAudioTrackRef.current.unmute();
        }
      } else if (localAudioTrackRef.current.mediaStreamTrack) {
        localAudioTrackRef.current.mediaStreamTrack.enabled = !newMutedState;
      }
      setIsMuted(newMutedState);
      addMessage('system', newMutedState ? '🔇 Microphone muted' : '🔊 Microphone unmuted');
    }
  };

  const endCall = async () => {
    if (room) {
      await room.disconnect();
    }
    if (localAudioTrackRef.current) {
      localAudioTrackRef.current.stop();
      localAudioTrackRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      try {
        await audioContextRef.current.close();
      } catch (error) {
        console.log('AudioContext already closed');
      }
      audioContextRef.current = null;
    }
    setIsCallActive(false);
    isCallActiveRef.current = false;
    setRoom(null);
    setRequestId(null);
    setConversation([]);
    setTextInput('');
    setIsListening(false);
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    addMessage('system', 'Call ended. Thank you!');
  };

  const startSpeechRecognition = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      addMessage('error', 'Speech recognition not supported in this browser. Please use Chrome or Edge.');
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      console.log('Speech recognition started');
      setIsListening(true);
    };

    recognition.onresult = (event) => {
      let interim = '';
      let final = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          final += transcript;
        } else {
          interim += transcript;
        }
      }

      if (interim) {
        setInterimTranscript(interim);
      }

      if (final) {
        console.log('Final transcript:', final);
        setInterimTranscript('');
        processSpokenQuestion(final.trim());
      }
    };

    recognition.onerror = (event) => {
      console.log('Speech recognition error:', event.error);
     
      if (event.error === 'no-speech' || event.error === 'aborted') {
        return;
      }
      
      
      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        addMessage('error', '❌ Microphone access denied. Please allow microphone access and refresh.');
        setIsListening(false);
      } else if (event.error === 'network') {
        addMessage('error', '⚠️ Network error. Check your internet connection.');
      }
    };

    recognition.onend = () => {
      console.log('Speech recognition ended');
      setIsListening(false);
      if (isCallActiveRef.current) {
        console.log('Restarting speech recognition...');
        setTimeout(() => {
          if (isCallActiveRef.current) {
            startSpeechRecognition();
          }
        }, 500);
      }
    };

    try {
      recognition.start();
      recognitionRef.current = recognition;
    } catch (error) {
      console.error('Failed to start speech recognition:', error);
      addMessage('error', 'Failed to start speech recognition');
    }
  };

  const processSpokenQuestion = async (question) => {
    if (!question || isSending) return;

    addMessage('user', question);
    setIsSending(true);

    try {
      const response = await fetch('/api/agent/voice-transcription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          caller: callerName,
          transcription: question,
          roomName: room?.name || 'unknown'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to process question');
      }

      const data = await response.json();
      addMessage('ai', data.response);

      if (data.needsEscalation && data.requestId) {
        setRequestId(data.requestId);
        addMessage('system', '⏳ Your question has been escalated to a supervisor. We\'ll get back to you shortly.');
      }
    } catch (error) {
      console.error('Error processing spoken question:', error);
      addMessage('error', `Failed to process question: ${error.message}`);
    } finally {
      setIsSending(false);
    }
  };

  const sendTextMessage = async () => {
    if (!textInput.trim() || isSending) return;

    const question = textInput.trim();
    addMessage('user', question);
    setTextInput('');
    setIsSending(true);

    try {
      const response = await fetch('/api/agent/voice-transcription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          caller: callerName,
          transcription: question,
          roomName: room?.name || 'unknown'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to process question');
      }

      const data = await response.json();
      addMessage('ai', data.response);

      if (data.needsEscalation && data.requestId) {
        setRequestId(data.requestId);
        addMessage('system', '⏳ Your question has been escalated to a supervisor.');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      addMessage('error', `Failed to send message: ${error.message}`);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendTextMessage();
    }
  };

  if (!isCallActive) {
    return (
      <div className="max-w-2xl mx-auto mt-10 p-8 bg-white border-4 border-black rounded-lg shadow-2xl">
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
            {backendStatus === 'connected' ? 'Backend Connected - Voice Calls Ready' :
             backendStatus === 'disconnected' ? 'Backend Disconnected - Start backend server (cd backend && node app.js)' :
             backendStatus === 'error' ? 'Backend Error - Check console' :
             'Checking backend connection...'}
          </span>
        </div>

        <div className="text-center mb-8 border-b-2 pb-6" style={{borderColor: '#8ABEB9'}}>
          <h1 className="text-3xl font-bold text-black mb-2">Human-in-the-Loop AI System</h1>
          <p className="text-lg font-semibold" style={{color: '#1D546C'}}>Frontdesk Engineering Test Demo</p>
          <p className="text-sm text-gray-600 mt-2">Real-time Voice AI with Supervisor Escalation</p>
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
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent" style={{focusRingColor: '#8ABEB9'}}
            />
          </div>

          <button
            onClick={startVoiceCall}
            disabled={isLoading}
            className="w-full disabled:bg-gray-400 text-white font-bold py-3 px-6 rounded-lg transition duration-200 transform hover:scale-105 flex items-center justify-center gap-2" style={{backgroundColor: '#8ABEB9'}} onMouseEnter={(e) => !isLoading && (e.target.style.backgroundColor = '#1D546C')} onMouseLeave={(e) => !isLoading && (e.target.style.backgroundColor = '#8ABEB9')}
          >
            {isLoading ? (
              <>
                <span className="animate-spin">⏳</span>
                <span>Connecting...</span>
              </>
            ) : (
              <>
                <span>📞</span>
                <span>Start Voice Call</span>
              </>
            )}
          </button>
        </div>

        <div className="mt-6 p-4 rounded-lg" style={{backgroundColor: '#B7E5CD', border: '1px solid #8ABEB9'}}>
          <h3 className="font-bold mb-3 text-lg" style={{color: '#1D546C'}}>📋 System Features</h3>
          <ul className="text-sm text-gray-800 space-y-2">
            <li className="flex items-start gap-2">
              <span className="font-bold">•</span>
              <span><strong>Voice AI Agent:</strong> Real-time conversation with Groq AI (Llama 3.3)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold">•</span>
              <span><strong>Smart Escalation:</strong> Unknown questions escalate to human supervisor</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold">•</span>
              <span><strong>Live Updates:</strong> Supervisor answers appear in active call</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold">•</span>
              <span><strong>Knowledge Learning:</strong> AI learns from supervisor responses</span>
            </li>
          </ul>
        </div>

        <div className="mt-4 p-4 rounded-lg" style={{backgroundColor: '#B7E5CD', border: '1px solid #8ABEB9'}}>
          <h3 className="font-bold text-black mb-2">💡 Test Instructions</h3>
          <ol className="text-sm text-gray-800 space-y-1 list-decimal list-inside">
            <li>Start voice call and speak your question</li>
            <li>If AI doesn't know, it escalates to supervisor</li>
            <li>Open <strong>Supervisor Dashboard</strong> in new tab</li>
            <li>Answer the question there</li>
            <li>See answer appear in this call instantly</li>
          </ol>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto mt-10 p-6 bg-white rounded-lg shadow-2xl" style={{border: '2px solid #1D546C'}}>
      <div className="flex items-center justify-between mb-6 pb-4 border-b">
        <div>
          <h2 className="text-2xl font-bold" style={{color: '#1D546C'}}>🎤 Active Voice Call</h2>
          <p className="text-sm text-gray-700 font-semibold">Caller: {callerName}</p>
          <p className="text-xs" style={{color: '#8ABEB9'}}>AI Agent: Groq Llama 3.3 70B</p>
        </div>
        <button
          onClick={endCall}
          className="text-white font-bold py-2 px-6 rounded-lg transition duration-200" style={{backgroundColor: '#1D546C'}} onMouseEnter={(e) => e.target.style.backgroundColor = '#8ABEB9'} onMouseLeave={(e) => e.target.style.backgroundColor = '#1D546C'}
        >
          📵 End Call
        </button>
      </div>

      {/* Audio Level Indicator */}
      <div className="mb-4 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">
            {isMuted ? '🔇 Microphone Muted' : '🎤 Microphone Active'}
          </span>
          <button
            onClick={toggleMute}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              isMuted 
                ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                : 'bg-green-100 text-green-700 hover:bg-green-200'
            }`}
          >
            {isMuted ? 'Unmute' : 'Mute'}
          </button>
        </div>
        {!isMuted && (
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <div 
              className="bg-green-500 h-2 transition-all duration-100"
              style={{ width: `${audioLevel}%` }}
            />
          </div>
        )}
      </div>

      {/* Conversation Display */}
      <div className="bg-gray-50 rounded-lg p-4 h-80 overflow-y-auto mb-4 space-y-3">
        {conversation.length === 0 && (
          <div className="text-center text-gray-500 mt-20">
            <p className="text-lg">🎤 {isListening ? 'Listening... Speak now!' : 'Starting voice recognition...'}</p>
            <p className="text-sm mt-2">Your speech is being transcribed in real-time</p>
          </div>
        )}
        {interimTranscript && (
          <div className="flex justify-end">
            <div className="max-w-xs lg:max-w-md px-4 py-3 rounded-lg bg-gray-300 text-gray-700 rounded-br-none opacity-70">
              <div className="text-xs font-semibold mb-1">🎤 You (speaking...)</div>
              <div className="text-sm italic">{interimTranscript}</div>
            </div>
          </div>
        )}
        {conversation.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xs lg:max-w-md px-4 py-3 rounded-lg ${
                msg.sender === 'user'
                  ? 'bg-sky-500 text-white rounded-br-none'
                  : msg.sender === 'ai'
                  ? 'bg-gray-600 text-white rounded-bl-none'
                  : msg.sender === 'system'
                  ? 'bg-sky-50 text-sky-900 border-2 border-sky-300'
                  : 'bg-gray-200 text-gray-900 border-2 border-gray-400'
              }`}
            >
              <div className="text-xs font-semibold mb-1 opacity-75">
                {msg.sender === 'user' ? '🎤 You' : msg.sender === 'ai' ? '🤖 AI Agent' : '📋 System'}
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

      {/* Voice Status */}
      <div className="mt-4 p-4 bg-gray-50 border-2 border-gray-300 rounded-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${isListening ? 'bg-sky-500 animate-pulse' : 'bg-gray-400'}`}></div>
            <div>
              <p className="text-sm font-semibold text-gray-800">
                {isListening ? '🎤 Voice Recognition Active' : '⏸️ Voice Recognition Paused'}
              </p>
              <p className="text-xs text-gray-600">
                {isListening ? 'Speak naturally - I\'m listening!' : 'Reconnecting...'}
              </p>
            </div>
          </div>
          {isSending && (
            <div className="flex items-center gap-2 text-sm text-gray-800">
              <div className="animate-spin">⏳</div>
              <span>Processing...</span>
            </div>
          )}
        </div>
      </div>

      {/* Manual Text Input (Fallback) */}
      <details className="mt-4">
        <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-800">
          📝 Or type your question manually
        </summary>
        <div className="mt-2 flex gap-2">
          <input
            type="text"
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your question here..."
            disabled={isSending}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100 text-sm"
          />
          <button
            onClick={sendTextMessage}
            disabled={isSending || !textInput.trim()}
            className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white font-medium py-2 px-6 rounded-lg transition duration-200 text-sm"
          >
            {isSending ? '...' : 'Send'}
          </button>
        </div>
      </details>

      {requestId && (
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center gap-2">
          <div className="animate-pulse">⏳</div>
          <p className="text-sm text-yellow-800">
            Waiting for supervisor response... (Request ID: {requestId.slice(0, 8)})
          </p>
        </div>
      )}

      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-800">
          💡 <strong>Tip:</strong> Speak clearly and pause briefly after each question. The AI will respond automatically!
        </p>
      </div>
    </div>
  );
}
