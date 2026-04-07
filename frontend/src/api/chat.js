import api from './api';

// ─────────────────────────────────────────────────────────────────────────────
// 📌 NOTE: STOMP/WebSocket 연결은 이 파일에서 관리하지 않습니다.
//    실시간 채팅  → ChatPage.jsx 내부 STOMP 클라이언트
//    실시간 알림  → GlobalChatListener.jsx
//    라이브 응원  → utils/stompLiveClient.js (createLiveCheerClient 팩토리)
// ─────────────────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────────────
// [REST] 채팅방 목록 / 상세 / 생성
// ─────────────────────────────────────────────────────────────────────────────

/**
 * 내 채팅방 목록 조회 (페이징)
 * GET /api/chat/rooms?page={page}&size={size}&sort=createdAt,desc
 */
export const fetchMyChatRooms = (page = 0, size = 10) =>
  api.get('/chat/rooms', {
    params: {
      page,
      size,
      sort: 'createdAt,desc',
    },
  });

/**
 * 채팅방 상세 조회 (참여자 목록 포함)
 * GET /api/chat/rooms/{roomId}
 */
export const fetchChatRoomDetail = (roomId) =>
  api.get(`/chat/rooms/${roomId}`);

/**
 * 직관 모임(메이트/크루) 그룹 채팅방 참여 or 생성
 * POST /api/chat/rooms?postId={postId}&type=GROUP_JOIN
 */
export const createOrGetMeetupGroupJoinRoom = (postId) =>
  api.post('/chat/rooms', null, {
    params: {
      postId,
      type: 'GROUP_JOIN',
    },
  });

/**
 * 크루 1:1 문의 채팅방 생성 or 조회
 * POST /api/chat/rooms/dm/crew/{crewId}
 * @param {number} crewId
 */
export const createOrGetCrewDmRoom = (crewId) =>
  api.post(`/chat/rooms/dm/crew/${crewId}`);

/**
 * 닉네임 기반 1:1 DM 채팅방 생성 or 조회
 * POST /api/chat/rooms/dm  { targetNickname }
 * @param {string} nickname - 상대방 닉네임
 */
export const createOrGetDmByNickname = (nickname) =>
  api.post('/chat/rooms/dm', { targetNickname: nickname });

/**
 * 티켓 양도 1:1 문의 채팅방 생성 or 조회
 * POST /api/chat/rooms/transfer/{postId}
 * @param {number} postId - 티켓 양도 게시글 ID
 */
export const createOrGetTransferDmRoom = (postId) =>
  api.post(`/chat/rooms/transfer/${postId}`);

// ─────────────────────────────────────────────────────────────────────────────
// [REST] 채팅 메시지
// ─────────────────────────────────────────────────────────────────────────────

/**
 * 채팅방 과거 메시지 목록 조회 (페이징, 최신순)
 * GET /api/chat/rooms/{roomId}/messages?page={page}
 * @param {number} roomId
 * @param {number} page - 0-indexed
 */
export const fetchChatHistory = (roomId, page = 0) =>
  api.get(`/chat/rooms/${roomId}/messages`, { params: { page } });

/**
 * 채팅방 읽음 처리
 * POST /api/chat/rooms/{roomId}/read
 * @param {number} roomId
 */
export const markRoomAsRead = (roomId) =>
  api.post(`/chat/rooms/${roomId}/read`);

/**
 * 채팅방 나가기
 * DELETE /api/chat/rooms/{roomId}/leave
 * @param {number} roomId
 */
export const leaveChatRoom = (roomId) =>
  api.delete(`/chat/rooms/${roomId}/leave`);
