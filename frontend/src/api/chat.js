// api/chat.js
import api from "./api";

/**
 * 닉네임으로 유저 ID를 조회한 뒤 1:1 채팅방 생성 or 조회
 * authorId가 없는 경우의 공통 폴백 유틸
 * @param {string} nickname - 상대방 닉네임
 * @returns {Promise<any>} - 채팅방 객체 { id, ... }
 */
export async function createOrGetDmByNickname(nickname) {
  if (!nickname) throw new Error("닉네임이 필요합니다.");

  // 1. 닉네임 → userId 조회
  const searchRes = await api.get(`/users/search?nickname=${encodeURIComponent(nickname)}`);
  const userData = searchRes.data?.data || searchRes.data;
  const userId = userData?.id || userData?.userId;

  if (!userId) {
    throw new Error(`닉네임(${nickname})에 해당하는 유저를 찾을 수 없습니다.`);
  }

  // 2. userId로 DM 방 생성/조회
  return createOrGetDirectDmRoom(userId);
}

/**
 * 크루 1:1 문의 채팅방 생성 or 조회
 * @param {number} crewId
 * @param {number} authorId (Fallback용)
 */
export async function createOrGetCrewDmRoom(crewId, authorId) {
  try {
    // @PostMapping("/dm/crew/{crewId}")
    const res = await api.post(`/chat/rooms/dm/crew/${crewId}`);
    return res.data.data || res.data;
  } catch (err) {
    if (authorId) return createOrGetDirectDmRoom(authorId);
    throw err;
  }
}

/**
 * 특정 사용자와의 1:1 채팅방 생성 or 조회 (가장 확실한 1:1 방식)
 * @param {number} targetUserId
 * @returns {Promise<any>}
 */
export async function createOrGetDirectDmRoom(targetUserId) {
  // TicketTransferBoard.jsx에서 사용하는 검증된 엔드포인트
  const res = await api.post(`/chat/rooms/dm/user/${targetUserId}`);
  return res.data.data || res.data;
}

/**
 * 티켓 양도 1:1 채팅방 생성 or 조회
 * @param {number} ticketAuthorId
 * @returns {Promise<any>}
 */
export async function createOrGetTransferDmRoom(ticketAuthorId) {
  return createOrGetDirectDmRoom(ticketAuthorId);
}

export async function createOrGetMeetupDmRoom(postId, authorId) {
  console.log('DM Room Args:', { postId, authorId });

  if (!postId && !authorId) {
    throw new Error('postId 또는 authorId가 필요합니다.');
  }

  // authorId가 있으면 가장 신뢰도 높은 DM 방식으로 직접 시도
  if (authorId) {
    try {
      console.log('API Request: POST /chat/rooms/dm/user/' + authorId);
      return await createOrGetDirectDmRoom(authorId);
    } catch (err) {
      console.error('직접 DM 생성 실패:', err);
      throw err;
    }
  }

  // authorId 없을 때만 meetup 전용 엔드포인트 시도
  try {
    console.log('API Request: POST /chat/rooms/dm/meetup/' + postId);
    const res = await api.post(`/chat/rooms/dm/meetup/${postId}`, { postId });
    return res.data.data || res.data;
  } catch (err) {
    console.error('모집글 전용 DM 생성 실패:', err);
    throw err;
  }
}

/**
 * 과거 채팅 메시지 조회 (페이징)
 * @param {number} roomId
 * @param {number} page
 * @returns {Promise<any>}
 */
export async function fetchChatHistory(roomId, page = 0) {
  const res = await api.get(`/chat/rooms/${roomId}/messages?page=${page}&size=50`);
  return res.data.data || res.data;
}

/**
 * 채팅방 참여자 조회
 * @param {number} roomId
 */
export async function fetchChatParticipants(roomId) {
  const res = await api.get(`/chat/${roomId}`);
  return res.data.data || res.data;
}

/**
 * 메시지 읽음 처리
 * @param {number} roomId
 */
export async function markAsRead(roomId) {
  return api.post(`/chat/rooms/${roomId}/read`);
}
