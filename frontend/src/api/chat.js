import api from './api';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';
const WS_URL = `${BASE_URL}/ws`;

export function connectSocket() {
  console.warn('[chat.js] connectSocket: mock mode', { WS_URL });
  return null;
}

export function disconnectSocket() {}

export function subscribeToRoom(client, roomId) {
  console.warn('[chat.js] subscribeToRoom: mock mode', { client, roomId });
  return null;
}

export function sendMessage(client, roomId, payload) {
  console.warn('[chat.js] sendMessage: mock mode', { client, roomId, payload });
}

export async function createOrGetCrewDmRoom(crewId) {
  console.warn('[chat.js] createOrGetCrewDmRoom: mock mode', { crewId });
  return { id: 9000 + crewId };
}

export async function createOrGetTransferDmRoom(postId) {
  console.warn('[chat.js] createOrGetTransferDmRoom: mock mode', { postId });
  return { id: 8000 + postId };
}

export async function fetchChatHistory(roomId, page = 0) {
  console.warn('[chat.js] fetchChatHistory: mock mode', { roomId, page });
  return [];
}

export const createOrGetMeetupGroupJoinRoom = (postId) =>
  api.post('/chat/rooms', null, {
    params: {
      postId,
      type: 'GROUP_JOIN',
    },
  });
