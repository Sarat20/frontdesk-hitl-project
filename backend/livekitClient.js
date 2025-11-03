import { AccessToken } from 'livekit-server-sdk';
import dotenv from 'dotenv';

dotenv.config();

export async function createTokenForAgent(roomName, identity) {
  const { LIVEKIT_API_KEY, LIVEKIT_API_SECRET } = process.env;

  console.log('\n[LiveKit Debug] Using API KEY:', LIVEKIT_API_KEY);

  console.log('[LiveKit Debug] Creating token for room:', roomName, ', identity:', identity);

  const ttl = 86400;

  const token = new AccessToken(
    LIVEKIT_API_KEY,
    LIVEKIT_API_SECRET,
    { 
      identity,
      ttl
    }
  );
  
  token.addGrant({ 
    roomJoin: true,
    room: roomName,
    canPublish: true,
    canSubscribe: true,
    canPublishData: true
  });

  let jwt;
  try {
    jwt = await token.toJwt();
    console.log('[LiveKit Debug] JWT Token:', jwt.slice(0, 40) + '...');
  } catch (err) {
    console.error('[LiveKit Debug] Token Generation Error:', err);
    throw err;
  }

  return jwt;
}