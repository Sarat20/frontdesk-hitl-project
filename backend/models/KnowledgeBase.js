import { loadData, saveData } from '../db.js';

let knowledge = [];
let helpRequests = [];

async function initializeData() {
  const data = await loadData();
  knowledge = data.knowledge || [];
  helpRequests = data.helpRequests || [];
  console.log('[KnowledgeBase] Loaded', knowledge.length, 'entries from database');
}

function persistData() {
  saveData({ knowledge, helpRequests });
}

export const initKnowledgeBase = initializeData;

export class KnowledgeBase {
  static findAnswer(question) {
    const q = question.toLowerCase();
    return knowledge.find((entry) =>
      q.includes(entry.question.toLowerCase())
    )?.answer || null;
  }

  static addEntry(question, answer) {
    knowledge.push({ question, answer });
    persistData();
    console.log('[KnowledgeBase] Saved entry to Firebase');
  }

  static getAll() {
    return knowledge;
  }
}
