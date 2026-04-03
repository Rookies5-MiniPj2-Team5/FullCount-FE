import api from './api';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';
const WS_URL = `${BASE_URL}/ws`;

// ─────────────────────────────────────────────────────
// [SOCKET] 실시간 통신 관련 (STOMP 등)
// ─────────────────────────────────────────────────────

export function connectSocket() {
  // TODO: 실제 연결 로직 (new Client 등) 구현 시 수정
  console.warn('[chat.js] connectSocket: mock mode', { WS_URL });
  return null;
}

export function disconnectSocket() {
  console.log('[chat.js] disconnectSocket');
}

export function subscribeToRoom(client, roomId) {
  console.warn('[chat.js] subscribeToRoom: mock mode', { client, roomId });
  return null;
}

/**
 * 메시지 발행 (전송)
 * 중복 선언된 함수를 하나로 통합하고 주석을 유지했습니다.
 */
export function sendMessage(client, roomId, payload) {
  // TODO: BE 연동 시 아래 주석 해제
  /*
  client?.active && client.publish({
    destination: `/app/chat/${roomId}`,
    body: JSON.stringify({ roomId, ...payload }),
    headers: { Authorization: `Bearer ${sessionStorage.getItem("accessToken")}` },
  });
  */

  console.warn("[chat.js] sendMessage: 더미 모드", { roomId, payload });
}

// ─────────────────────────────────────────────────────
// [REST API] 채팅방 생성 · 과거 메시지 조회
// ─────────────────────────────────────────────────────

/**
 * 공통 인증 헤더 (필요 시 api 인스턴스 대신 fetch 사용 시 활용)
 */
const authHeader = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${sessionStorage.getItem("accessToken")}`,
});

/**
 * 크루 1:1 문의 채팅방 생성 or 조회
 * @param {number} crewId
 * @returns {Promise<{ id: number }>} chatRoomDTO
 * * TODO: BE 연동 - POST /api/chat/dm/crew/{crewId}
 */
export async function createOrGetCrewDmRoom(crewId) {
  console.warn('[chat.js] createOrGetCrewDmRoom: mock mode', { crewId });
  return { id: 9000 + crewId };
}

/**
 * 티켓 양도 1:1 문의 채팅방 생성 or 조회
 * @param {number} postId
 */
export async function createOrGetTransferDmRoom(postId) {
  console.warn('[chat.js] createOrGetTransferDmRoom: mock mode', { postId });
  return { id: 8000 + postId };
}

/**
 * 채팅방 과거 메시지 목록 조회
 */
export async function fetchChatHistory(roomId, page = 0) {
  console.warn('[chat.js] fetchChatHistory: mock mode', { roomId, page });
  return [];
}

/**
 * 직관 모임(메이트/크루) 그룹 채팅방 참여/생성
 */
export const createOrGetMeetupGroupJoinRoom = (postId) =>
  api.post('/chat/rooms', null, {
    params: {
      postId,
      type: 'GROUP_JOIN',
    },
  });