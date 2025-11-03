import { loadData, saveData } from '../db.js';

let helpRequests = [];
let knowledge = [];

async function initializeData() {
  const data = await loadData();
  helpRequests = data.helpRequests || [];
  knowledge = data.knowledge || [];
  console.log('[HelpRequest] Loaded', helpRequests.length, 'requests from database');
}

function persistData() {
  saveData({ knowledge, helpRequests });
}

export const initHelpRequests = initializeData;

export class HelpRequest {
  constructor({ id, question, caller }) {
    this.id = id;
    this.question = question;
    this.caller = caller;
    this.status = 'Pending';
    this.answer = null;
    this.createdAt = new Date();
    this.resolvedAt = null;
  }

  static getAll() {
    return helpRequests;
  }

  static getPending() {
    return helpRequests.filter((r) => r.status === 'Pending');
  }

  static add(request) {
    helpRequests.push(request);
    persistData();
    console.log('[HelpRequest] Saved new request to Firebase');
  }

  static resolve(id, answer) {
    const req = helpRequests.find((r) => r.id === id);
    if (req) {
      req.answer = answer;
      req.status = 'Resolved';
      req.resolvedAt = new Date();
      persistData();
      console.log('[HelpRequest] Saved resolved request to Firebase');
    }
  }

  static timeoutUnresolved() {
    const now = new Date();
    let updated = false;
    helpRequests.forEach((req) => {
      if (req.status === 'Pending' && now - req.createdAt > 5 * 60 * 1000) {
        req.status = 'Unresolved';
        req.resolvedAt = new Date();
        updated = true;
      }
    });
    if (updated) {
      persistData();
      console.log('[HelpRequest] Saved timeout updates to Firebase');
    }
  }
}
