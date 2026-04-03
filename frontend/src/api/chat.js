// api/chat.js
// WebSocket(STOMP) 채팅 연결 모듈
//
// ■ 사용 케이스별 채팅방 생성 엔드포인트
//   - 크루 그룹 채팅   : 크루 생성 시 자동 생성 → chatRoomId 사용
//   - 크루 1:1 문의    : POST /api/chat/dm/crew/{crewId}
//   - 티켓 양도 1:1   : POST /api/chat/dm/transfer/{postId}  ← 양도 요청 시 자동 생성
//
// ■ BE 설정 참고
//   WebSocketConfig.java : endpoint "/ws", appPrefix "/app", broker "/topic"
//   ChatController.java  : @MessageMapping("/chat/{roomId}")
//                          @SendTo("/topic/chat/{roomId}")
//
// ■ 의존성 설치 (BE 연동 시)
//   npm install @stomp/stompjs sockjs-client

// TODO: BE 연동 시 아래 두 줄 주석 해제
// import { Client } from "@stomp/stompjs";
// import SockJS from "sockjs-client";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";
const WS_URL   = `${BASE_URL}/ws`;

// ─────────────────────────────────────────────────────
// WebSocket 연결
// ─────────────────────────────────────────────────────
/**
 * STOMP 클라이언트 생성 및 연결
 * @param {{ token: string, onConnected: fn, onDisconnected: fn, onError: fn }} opts
 * @returns {Client|null}  stompClient (BE 연동 전 더미 모드에서는 null)
 */
export function connectSocket({ token, onConnected, onDisconnected, onError } = {}) {
  // TODO: BE 연동 시 주석 해제
  // const client = new Client({
  //   webSocketFactory: () => new SockJS(WS_URL),
  //   connectHeaders: { Authorization: `Bearer ${token}` },
  //   reconnectDelay: 3000,
  //   onConnect:     () => { console.log("[Chat] 연결 성공"); onConnected?.(); },
  //   onDisconnect:  () => { console.log("[Chat] 연결 종료"); onDisconnected?.(); },
  //   onStompError:  (frame) => { console.error("[Chat] STOMP 오류", frame); onError?.(frame); },
  // });
  // client.activate();
  // return client;

  console.warn("[chat.js] connectSocket: 더미 모드");
  return null;
}

/**
 * WebSocket 연결 해제
 * @param {Client} client
 */
export function disconnectSocket(client) {
  // TODO: BE 연동 시 주석 해제
  // client?.active && client.deactivate();
}

// ─────────────────────────────────────────────────────
// 메시지 구독 / 발행
// ─────────────────────────────────────────────────────
/**
 * 채팅방 구독 (메시지 수신)
 * @param {Client} client
 * @param {number} roomId
 * @param {(msg: ChatMessageDTO) => void} onMessage
 *
 * ChatMessageDTO: { id, senderId, senderNickname, content, sentAt,
 *                   type: "CHAT"|"ENTER"|"LEAVE" }
 */
export function subscribeToRoom(client, roomId, onMessage) {
  // TODO: BE 연동 시 주석 해제
  // return client.subscribe(`/topic/chat/${roomId}`, (frame) => {
  //   try { onMessage(JSON.parse(frame.body)); }
  //   catch (e) { console.error("[Chat] 파싱 오류", e); }
  // });

  console.warn("[chat.js] subscribeToRoom: 더미 모드", { roomId });
  return null;
}

// 메시지 발행 (전송)
export function sendMessage(client, roomId, payload) {
  // TODO: BE 연동 시 주석 해제
  // client?.active && client.publish({
  //   destination: `/app/chat/${roomId}`,
  //   body: JSON.stringify({ roomId, ...payload }),
  //   headers: { Authorization: `Bearer ${sessionStorage.getItem("accessToken")}` },
  // });

  console.warn("[chat.js] sendMessage: 더미 모드", { roomId, payload });
}

// ─────────────────────────────────────────────────────
// REST API (채팅방 생성 · 과거 메시지 조회)
// ─────────────────────────────────────────────────────
const authHeader = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${sessionStorage.getItem("accessToken")}`,
});

/**
 * 크루 1:1 문의 채팅방 생성 or 조회
 * @param {number} crewId
 * @returns {Promise<{ id: number }>}  chatRoomDTO
 *
 * TODO: BE 연동 - POST /api/chat/dm/crew/{crewId}
 * 이미 방이 있으면 기존 방 반환 (멱등성 보장)
 */
export async function createOrGetCrewDmRoom(crewId) {
  // TODO: BE 연동 시 주석 해제
  // const res = await fetch(`${BASE_URL}/api/chat/dm/crew/${crewId}`, {
  //   method: "POST", headers: authHeader(),
  // });
  // if (!res.ok) throw new Error("크루 문의 채팅방 생성 실패");
  // return res.json();

  console.warn("[chat.js] createOrGetCrewDmRoom: 더미 모드", { crewId });
  return { id: 9000 + crewId }; // 더미 roomId
}

/**
 * 티켓 양도 1:1 채팅방 생성 or 조회
 * @param {number} postId  양도 게시글 id
 * @returns {Promise<{ id: number }>}
 *
 * TODO: BE 연동 - POST /api/chat/dm/transfer/{postId}
 * 양도 요청(FR-T002) 시 자동 생성됨
 */
export async function createOrGetTransferDmRoom(postId) {
  // TODO: BE 연동 시 주석 해제
  // const res = await fetch(`${BASE_URL}/api/chat/dm/transfer/${postId}`, {
  //   method: "POST", headers: authHeader(),
  // });
  // if (!res.ok) throw new Error("양도 채팅방 생성 실패");
  // return res.json();

  console.warn("[chat.js] createOrGetTransferDmRoom: 더미 모드", { postId });
  return { id: 8000 + postId }; // 더미 roomId
}

/**
 * 과거 채팅 메시지 조회 (페이징)
 * @param {number} roomId
 * @param {number} page  0부터 시작
 * @returns {Promise<ChatMessageDTO[]>}
 *
 * TODO: BE 연동 - GET /api/chat/{roomId}/messages?page={page}&size=50
 */
export async function fetchChatHistory(roomId, page = 0) {
  // TODO: BE 연동 시 주석 해제
  // const res = await fetch(
  //   `${BASE_URL}/api/chat/${roomId}/messages?page=${page}&size=50`,
  //   { headers: authHeader() }
  // );
  // if (!res.ok) throw new Error("채팅 내역 조회 실패");
  // return res.json(); // ChatMessageDTO[]

  console.warn("[chat.js] fetchChatHistory: 더미 모드", { roomId, page });
  return [];
}
