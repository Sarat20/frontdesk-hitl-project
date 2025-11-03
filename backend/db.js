import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let db;

try {
  const serviceAccount = JSON.parse(
    readFileSync(path.join(__dirname, 'firebase-key.json'), 'utf8')
  );

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });

  db = admin.firestore();
  console.log('✓ Firebase connected successfully');
} catch (error) {
  console.error('❌ Firebase initialization error:', error.message);
  console.error('Make sure firebase-key.json exists in backend folder');
  process.exit(1);
}

export async function loadData() {
  try {
    const knowledgeDoc = await db.collection('system').doc('knowledge').get();
    const requestsDoc = await db.collection('system').doc('helpRequests').get();

    const knowledge = knowledgeDoc.exists ? knowledgeDoc.data().items || [] : [];
    const helpRequests = requestsDoc.exists ? requestsDoc.data().items || [] : [];

    console.log(`[Firebase] Loaded ${knowledge.length} knowledge entries, ${helpRequests.length} help requests`);

    return { knowledge, helpRequests };
  } catch (error) {
    console.error('[Firebase] Error loading data:', error);
    return { knowledge: [], helpRequests: [] };
  }
}

export async function saveData(data) {
  try {
    const batch = db.batch();

    const knowledgeRef = db.collection('system').doc('knowledge');
    batch.set(knowledgeRef, {
      items: data.knowledge || [],
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    const requestsRef = db.collection('system').doc('helpRequests');
    batch.set(requestsRef, {
      items: data.helpRequests || [],
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    await batch.commit();
    console.log('[Firebase] ✓ Data saved successfully');
  } catch (error) {
    console.error('[Firebase] Error saving data:', error);
  }
}
