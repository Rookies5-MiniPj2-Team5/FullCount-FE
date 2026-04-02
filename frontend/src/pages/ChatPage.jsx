import { useState, useEffect, useRef, useCallback } from "react";
import SockJS from "sockjs-client";
import Stomp from "stompjs";
import api from "../api/api";

const fmtTime = (iso) =>
  new Date(iso).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", hour12: false });

export default function ChatPage({
  crew,
  roomType = "GROUP",
  roomId: initialRoomId,
  currentUser,
  isDm = false,
  dmTargetNickname,
  onBack,
}) {
  const [messages,   setMessages]   = useState([]);
  const [inputText,  setInputText]  = useState("");
  const [connected,  setConnected]  = useState(false);
  const [roomId,     setRoomId]     = useState(initialRoomId);
  const [isFullSize, setIsFullSize] = useState(false);

  const endRef       = useRef(null);
  const clientRef    = useRef(null);
  // ✅ 핵심 수정 1: 이미 연결 시도 중인지 추적하는 플래그 (StrictMode 이중 실행 방지)
  const isConnecting = useRef(false);

  // ── 스크롤 하단 고정 ──────────────────────────────
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ── WebSocket 연결 ────────────────────────────────
  useEffect(() => {
    // ✅ 핵심 수정 2: 이미 연결 중이거나 연결된 상태면 중복 실행 방지
    if (isConnecting.current) return;

    const initChat = async () => {
      isConnecting.current = true;

      let currentRid = roomId;

      // 1:1 채팅방이 없으면 먼저 생성
      if (isDm && !currentRid) {
        try {
          const res = await api.post(`/api/chat/dm/crew/${crew.id}`);
          currentRid = res.data.id;
          setRoomId(currentRid);
        } catch (err) {
          console.error("DM 채팅방 생성 실패:", err);
          isConnecting.current = false;
          return;
        }
      }

      if (!currentRid) {
        isConnecting.current = false;
        return;
      }

      // ✅ 핵심 수정 3: SockJS 경로를 절대경로로 명시 (상대경로 "/ws"는 프론트 포트로 연결됨)
      const socket = new SockJS("http://localhost:8080/ws");
      const client = Stomp.over(socket);

      // 불필요한 STOMP 로그 끄기 (선택)
      client.debug = null;

      clientRef.current = client;

      client.connect(
        {},
        // ✅ 핵심 수정 4: onConnect 콜백 — 연결 완료 후에만 subscribe
        () => {
          console.log(`[Chat] 연결 성공 - roomId: ${currentRid}`);
          setConnected(true);

          client.subscribe(`/topic/chat/${currentRid}`, (frame) => {
            try {
              const newMessage = JSON.parse(frame.body);
              console.log("[Chat] Received:", newMessage);

              // ✅ 데이터 정규화: content/message, sender/senderNickname 등 대응
              const normalizedMsg = {
                ...newMessage,
                content: newMessage.content || newMessage.message,
                senderNickname: newMessage.senderNickname || newMessage.sender,
                timestamp: newMessage.timestamp || new Date().toISOString(),
              };
              setMessages((prev) => [...prev, normalizedMsg]);
            } catch (e) {
              console.error("[Chat] 메시지 파싱 오류:", e);
            }
          });

          // 과거 메시지 불러오기
          // TODO: BE 연동 - GET /api/chat/{roomId}/messages
          // api.get(`/api/chat/${currentRid}/messages`)
          //   .then(res => setMessages(res.data))
          //   .catch(err => console.error("메시지 조회 실패:", err));
        },
        // ✅ 핵심 수정 5: onError 콜백 추가 — 에러 시 플래그 해제
        (error) => {
          console.error("[Chat] STOMP 연결 실패:", error);
          setConnected(false);
          isConnecting.current = false;
        }
      );
    };

    initChat();

    // ✅ 핵심 수정 6: cleanup — 연결된 상태일 때만 disconnect
    return () => {
      if (clientRef.current && clientRef.current.connected) {
        clientRef.current.disconnect(() => {
          console.log("[Chat] 연결 해제");
        });
      }
      clientRef.current  = null;
      isConnecting.current = false;
      setConnected(false);
    };
  }, [roomId, isDm, crew?.id]); // crew.id가 바뀌면 재연결

  // ── 메시지 전송 ──────────────────────────────────
  const handleSend = useCallback(() => {
    // ✅ clientRef.current.connected 로 실제 연결 상태 이중 확인
    if (!inputText.trim() || !clientRef.current?.connected) {
      console.warn("[Chat] 연결되지 않아 전송 불가");
      return;
    }

    const chatMsg = {
      type: "CHAT",
      roomId,
      senderId:       currentUser?.id,
      senderNickname: currentUser?.nickname,
      sender:         currentUser?.nickname, // e.g. 대응
      content:        inputText.trim(),
      message:        inputText.trim(),      // e.g. 대응
    };

    try {
      console.log("[Chat] Sending:", chatMsg);
      // NOTE: 백엔드 설정에 따라 /app/chat/${roomId} 또는 /app/chat/send 가 사용됩니다.
      // 현재는 기존 코드의 경로를 유지하되 로그를 통해 확인 가능하게 합니다.
      clientRef.current.send(
        `/app/chat/${roomId}`,
        {},
        JSON.stringify(chatMsg)
      );
      setInputText("");
    } catch (err) {
      console.error("[Chat] 전송 에러:", err);
    }
  }, [inputText, roomId, currentUser]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const isMe        = (msg) => msg.senderId === currentUser?.id;
  const accentColor = isDm ? "#7c3aed" : "#1d4ed8";

  return (
    <div style={isFullSize ? s.fullWrapper : s.popupWrapper}>

      {/* ══ 헤더 ══ */}
      <div style={s.header}>
        <button style={s.backBtn} onClick={onBack}>✕</button>

        <div style={s.headerInfo}>
          <div style={s.roomTitle}>
            {isDm ? `${dmTargetNickname}님` : crew?.title}
          </div>
          <div style={{ ...s.roomSub, color: connected ? "#22c55e" : "#9ca3af" }}>
            {connected ? "● 연결됨" : "○ 연결 중..."}
          </div>
        </div>

        {/* 확대/축소 토글 */}
        <button style={s.sizeBtn} onClick={() => setIsFullSize((v) => !v)}>
          {isFullSize ? "↘" : "↖"}
        </button>
      </div>

      {/* ══ 메시지 목록 ══ */}
      <div style={s.msgList}>
        {messages.length === 0 && (
          <div style={s.emptyMsg}>
            {connected ? "첫 메시지를 보내보세요 ⚾" : "연결 중..."}
          </div>
        )}

        {messages.map((msg, idx) => {
          const mine = isMe(msg);
          const isSystem = msg.type === "ENTER" || msg.type === "LEAVE";

          if (isSystem) {
            return (
              <div key={msg.id || idx} style={s.sysMsg}>
                {msg.senderNickname}님이 {msg.type === "ENTER" ? "입장" : "퇴장"}했습니다.
              </div>
            );
          }

          return (
            <div
              key={msg.id || idx}
              style={{ ...s.msgRow, flexDirection: mine ? "row-reverse" : "row" }}
            >
              {!mine && (
                <div style={s.avatar}>
                  {msg.senderNickname?.slice(0, 1)}
                </div>
              )}
              <div style={{ ...s.msgGroup, alignItems: mine ? "flex-end" : "flex-start" }}>
                {!mine && (
                  <span style={s.senderName}>{msg.senderNickname}</span>
                )}
                <div style={s.bubbleRow}>
                  {mine  && <span style={s.time}>{fmtTime(msg.timestamp)}</span>}
                  <div
                    style={{
                      ...s.bubble,
                      background: mine ? accentColor : "#1e293b",
                      borderBottomRightRadius: mine ? 4 : 14,
                      borderBottomLeftRadius:  mine ? 14 : 4,
                    }}
                  >
                    {msg.content}
                  </div>
                  {!mine && <span style={s.time}>{fmtTime(msg.timestamp)}</span>}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>

      {/* ══ 입력창 ══ */}
      <div style={s.inputArea}>
        <input
          style={s.input}
          placeholder={connected ? "채팅 입력... (Enter = 전송)" : "연결 중..."}
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={!connected}
        />
        <button
          onClick={handleSend}
          disabled={!connected || !inputText.trim()}
          style={{
            ...s.sendBtn,
            background: connected && inputText.trim() ? accentColor : "#374151",
            cursor: connected && inputText.trim() ? "pointer" : "not-allowed",
          }}
        >
          ➤
        </button>
      </div>
    </div>
  );
}

// ─── 스타일 ────────────────────────────────────────────
const s = {
  popupWrapper: {
    position: "fixed", bottom: "80px", right: "20px",
    width: "360px", height: "500px",
    background: "#0d1117", borderRadius: "20px",
    display: "flex", flexDirection: "column",
    boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
    zIndex: 1000, overflow: "hidden",
    border: "1px solid rgba(255,255,255,0.1)",
  },
  fullWrapper: {
    position: "fixed", top: 0, left: 0,
    width: "100vw", height: "100vh",
    background: "#0d1117",
    display: "flex", flexDirection: "column",
    zIndex: 2000,
  },
  header:     { display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", background: "#161b22", borderBottom: "1px solid rgba(255,255,255,0.06)", flexShrink: 0 },
  backBtn:    { background: "none", border: "none", color: "#9ca3af", fontSize: 18, cursor: "pointer", padding: "4px 6px" },
  sizeBtn:    { background: "rgba(255,255,255,0.1)", border: "none", color: "#fff", padding: "4px 8px", borderRadius: 6, cursor: "pointer", fontSize: 14, flexShrink: 0 },
  headerInfo: { flex: 1, overflow: "hidden" },
  roomTitle:  { fontSize: 14, fontWeight: 700, color: "#f0f0f0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  roomSub:    { fontSize: 11, marginTop: 2 },

  msgList:    { flex: 1, overflowY: "auto", padding: 16, display: "flex", flexDirection: "column", gap: 8 },
  emptyMsg:   { textAlign: "center", color: "#4b5563", fontSize: 13, marginTop: 20 },
  sysMsg:     { textAlign: "center", fontSize: 11, color: "#6b7280", background: "rgba(255,255,255,0.04)", borderRadius: 8, padding: "4px 0" },

  msgRow:     { display: "flex", alignItems: "flex-end", gap: 6 },
  avatar:     { width: 28, height: 28, borderRadius: "50%", background: "linear-gradient(135deg,#3b82f6,#8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: "#fff", flexShrink: 0 },
  msgGroup:   { display: "flex", flexDirection: "column", gap: 3, maxWidth: "75%" },
  senderName: { fontSize: 11, color: "#9ca3af", marginLeft: 4 },
  bubbleRow:  { display: "flex", alignItems: "flex-end", gap: 4 },
  bubble:     { padding: "8px 12px", borderRadius: 14, fontSize: 13, color: "#fff", wordBreak: "break-word", lineHeight: 1.5 },
  time:       { fontSize: 10, color: "#4b5563", flexShrink: 0, paddingBottom: 2 },

  inputArea:  { display: "flex", padding: 12, background: "#161b22", gap: 8, flexShrink: 0 },
  input:      { flex: 1, background: "#0d1117", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 20, color: "#fff", padding: "8px 14px", outline: "none", fontSize: 13, fontFamily: "inherit" },
  sendBtn:    { border: "none", borderRadius: "50%", width: 36, height: 36, color: "#fff", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "background 0.2s" },
};