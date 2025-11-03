import React, { useState } from 'react';
import { Room } from 'livekit-client';

function LiveKitCall() {
  const [token, setToken] = useState('');
  const [roomName, setRoomName] = useState('');
  const [room, setRoom] = useState(null);

  const joinRoom = async (token, roomName) => {
    console.log('LiveKit URL from env:', import.meta.env.VITE_LIVEKIT_URL);
    console.log('Attempting to join room:', roomName);
    console.log('Token length:', token?.length);

    const newRoom = new Room({
     
      adaptiveStream: true,
      dynacast: true,
      publishDefaults: {
        videoSimulcastLayers: [
          { quality: 'low', width: 320, height: 240 },
          { quality: 'medium', width: 640, height: 480 },
          { quality: 'high', width: 1280, height: 720 },
        ],
      },
    });

    newRoom.on('disconnected', () => {
      console.log('Disconnected from room');
      setRoom(null);
    });

    newRoom.on('connected', () => {
      console.log('Successfully connected to room:', roomName);
    });

    newRoom.on('reconnecting', () => {
      console.warn('Reconnecting to room...');
    });

    newRoom.on('reconnected', () => {
      console.log('Reconnected to room');
    });

    try {
      await newRoom.connect(
        import.meta.env.VITE_LIVEKIT_URL,
        token,
        {
          autoSubscribe: true,
        }
      );
      setRoom(newRoom);
      console.log(`Successfully joined LiveKit room: ${roomName}`);
    } catch (error) {
      console.error('Error joining LiveKit room:', error);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        name: error.name
      });
      alert(`Failed to connect to LiveKit: ${error.message}`);
    }
  };

  const startCall = async () => {
    try {
      const response = await fetch('/api/agent/initiate-call', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ caller: 'TestUser' }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || err.details || 'Failed to initiate call');
      }

      const data = await response.json();
      setToken(data.token);
      setRoomName(data.roomName);

      joinRoom(data.token, data.roomName);
    } catch (error) {
      console.error('Error starting call:', error);
      alert(`Failed to start call: ${error.message}`);
    }
  };

  return (
    <div className="mt-8 p-4 border rounded">
      <button
        onClick={startCall}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Start LiveKit Call
      </button>
      {room && <p>Connected to room: {roomName}</p>}
    </div>
  );
}

export default LiveKitCall;
