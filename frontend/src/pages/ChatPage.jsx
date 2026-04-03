import { useState, useEffect, useRef, useCallback } from "react";
import SockJS from "sockjs-client";
import Stomp from "stompjs";
import api from "../api/api";

const fmtTime = (iso) =>
  new Date(iso).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", hour12: false });

const fmtDate = (iso) => {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  if (d.toDateString() === today.toDateString()) return "오늘";
  if (d.toDateString() === yesterday.toDateString()) return "어제";
  return d.toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" });
};

const isSameDay = (a, b) =>
  new Date(a).toDateString() === new Date(b).toDateString();

export default function ChatPage({
  crew,
  roomType = "GROUP",
  roomId: initialRoomId,
  currentUser,
  isDm = false,
  dmTargetNickname,
  onBack,
}) {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [connected, setConnected] = useState(false);
  const [roomId, setRoomId] = useState(initialRoomId);
  const [isFullSize, setIsFullSize] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [participants, setParticipants] = useState([]);
  const [showParticipants, setShowParticipants] = useState(false);

  const endRef = useRef(null);
  const clientRef = useRef(null);
  const isConnecting = useRef(false);
  const msgListRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (isConnecting.current) return;

    const initChat = async () => {
      isConnecting.current = true;

      let currentRid = roomId;

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

      const socket = new SockJS("http://localhost:8080/ws");
      const client = Stomp.over(socket);
      client.debug = null;
      clientRef.current = client;

      client.connect(
        {},
        () => {
          console.log(`[Chat] 연결 성공 - roomId: ${currentRid}`);
          setConnected(true);

          client.subscribe(`/topic/chat/${currentRid}`, (frame) => {
            try {
              const newMessage = JSON.parse(frame.body);
              console.log("[Chat] Received:", newMessage);
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

          api.get(`/chat/rooms/${currentRid}/messages`)
            .then(res => {
              const messages = res.data.data?.content || [];
              setMessages(messages.reverse());
            })
            .catch(err => console.error("메시지 조회 실패:", err));
        },
        (error) => {
          console.error("[Chat] STOMP 연결 실패:", error);
          setConnected(false);
          isConnecting.current = false;
        }
      );
    };

    initChat();

    return () => {
      if (clientRef.current && clientRef.current.connected) {
        clientRef.current.disconnect(() => console.log("[Chat] 연결 해제"));
      }
      clientRef.current = null;
      isConnecting.current = false;
      setConnected(false);
    };
  }, [roomId, isDm, crew?.id]);

  useEffect(() => {
    const el = msgListRef.current;
    if (!el) return;
    const handleScroll = () => {
      const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 100;
      setShowScrollBtn(!isNearBottom);
    };
    el.addEventListener("scroll", handleScroll);
    return () => el.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (!roomId) return;
    api.get(`/chat/rooms/${roomId}`)
      .then(res => {
        const data = res.data.data;
        setParticipants(data?.participants || []);
      })
      .catch(err => console.error("참여자 조회 실패:", err));
  }, [roomId]);

  const handleSend = useCallback(() => {
    if (!inputText.trim() || !clientRef.current?.connected) {
      console.warn("[Chat] 연결되지 않아 전송 불가");
      return;
    }
    const chatMsg = {
      type: "CHAT",
      roomId,
      senderId: currentUser?.id,
      senderNickname: currentUser?.nickname,
      sender: currentUser?.nickname,
      content: inputText.trim(),
      message: inputText.trim(),
    };
    try {
      setIsSending(true);
      clientRef.current.send(`/app/chat/${roomId}`, {}, JSON.stringify(chatMsg));
      setInputText("");
    } catch (err) {
      console.error("[Chat] 전송 에러:", err);
    } finally {
      setIsSending(false);
    }
  }, [inputText, roomId, currentUser]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const isMe = (msg) => msg.senderId === currentUser?.id;
  const accentColor = isDm ? "#7c3aed" : "#1d4ed8";

  // 날짜 구분선 표시 여부
  const showDateDivider = (idx) => {
    if (idx === 0) return true;
    const prev = messages[idx - 1];
    const curr = messages[idx];
    if (!prev?.timestamp || !curr?.timestamp) return false;
    return !isSameDay(prev.timestamp, curr.timestamp);
  };

  // 연속 메시지 여부 (같은 사람이 연속으로 보낸 경우)
  const isContinuous = (idx) => {
    if (idx === 0 || idx >= messages.length) return false;
    const prev = messages[idx - 1];
    const curr = messages[idx];
    if (!prev || !curr) return false;
    if (prev.senderId !== curr.senderId) return false;
    const prevTime = new Date(prev.timestamp);
    const currTime = new Date(curr.timestamp);
    return (
      prevTime.getFullYear() === currTime.getFullYear() &&
      prevTime.getMonth() === currTime.getMonth() &&
      prevTime.getDate() === currTime.getDate() &&
      prevTime.getHours() === currTime.getHours() &&
      prevTime.getMinutes() === currTime.getMinutes()
    );
  };

  return (
    <div style={isFullSize ? s.fullWrapper : s.popupWrapper}>

      {/* ══ 헤더 ══ */}
      <div style={s.header}>
        <button style={s.backBtn} onClick={onBack}>✕</button>
        <div
          style={{ ...s.headerInfo, cursor: "pointer" }}
          onClick={() => setShowParticipants((v) => !v)}
        >
          <div style={s.roomTitle}>
            {isDm ? `${dmTargetNickname}님` : crew?.title}
          </div>
          <div style={{ ...s.roomSub, color: connected ? "#22c55e" : "#9ca3af" }}>
            {connected ? `● 연결됨 · 참여자 ${participants.length}명` : "○ 연결 중..."}
          </div>
        </div>
        <button style={s.sizeBtn} onClick={() => setIsFullSize((v) => !v)}>
          {isFullSize ? "↘" : "↖"}
        </button>
      </div>

      {/* ══ 참여자 목록 팝업 ══ */}
      {showParticipants && (
        <div style={s.participantPopup}>
          <div style={s.participantHeader}>
            <span style={{ fontSize: "13px", fontWeight: 700, color: "#f0f0f0" }}>
              참여자 {participants.length}명
            </span>
            <button style={s.popupClose} onClick={() => setShowParticipants(false)}>✕</button>
          </div>
          {participants.map((p) => (
            <div key={p.memberId} style={s.participantItem}>
              <div style={s.participantAvatar}>{p.nickname?.slice(0, 1)}</div>
              <span style={{ fontSize: "13px", color: "#f0f0f0" }}>{p.nickname}</span>
              {p.memberId === currentUser?.id && (
                <span style={s.meTag}>나</span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ══ 메시지 목록 ══ */}
      <div style={s.msgList} ref={msgListRef}>
        {messages.length === 0 && (
          <div style={s.emptyMsg}>
            {connected
              ? <><div style={{ fontSize: "28px", marginBottom: "8px" }}>⚾</div><div>첫 번째 메시지를 남겨보세요!</div></>
              : <><div style={{ fontSize: "28px", marginBottom: "8px" }}>🔄</div><div>채팅방에 연결 중...</div></>
            }
          </div>
        )}

        {messages.map((msg, idx) => {
          const mine = isMe(msg);
          const isSystem = msg.type === "ENTER" || msg.type === "LEAVE";
          const continuous = isContinuous(idx);

          return (
            <div key={msg.messageId || idx}>
              {/* 날짜 구분선 */}
              {showDateDivider(idx) && msg.timestamp && (
                <div style={s.dateDivider}>
                  <span style={s.dateDividerText}>{fmtDate(msg.timestamp)}</span>
                </div>
              )}

              {/* 시스템 메시지 */}
              {isSystem ? (
                <div style={s.sysMsg}>
                  {msg.senderNickname}님이 {msg.type === "ENTER" ? "입장" : "퇴장"}했습니다.
                </div>
              ) : (
                <div
                  style={{
                    ...s.msgRow,
                    flexDirection: mine ? "row-reverse" : "row",
                    marginTop: continuous ? "2px" : "8px",
                  }}
                >
                  {/* 아바타 - 연속 메시지면 숨김 */}
                  {!mine && (
                    <div style={{ ...s.avatar, visibility: continuous ? "hidden" : "visible" }}>
                      {msg.senderNickname?.slice(0, 1)}
                    </div>
                  )}

                  <div style={{ ...s.msgGroup, alignItems: mine ? "flex-end" : "flex-start" }}>
                    {/* 닉네임 - 연속 메시지면 숨김 */}
                    {!mine && !continuous && (
                      <span style={s.senderName}>{msg.senderNickname}</span>
                    )}
                    <div style={s.bubbleRow}>
                      {mine && !isContinuous(idx + 1) && <span style={s.time}>{fmtTime(msg.timestamp)}</span>}
                      <div
                        style={{
                          ...s.bubble,
                          background: mine ? accentColor : "#1e293b",
                          borderBottomRightRadius: mine ? 4 : 14,
                          borderBottomLeftRadius: mine ? 14 : 4,
                        }}
                      >
                        {msg.content}
                      </div>
                      {!mine && !isContinuous(idx + 1) && <span style={s.time}>{fmtTime(msg.timestamp)}</span>}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
        <div ref={endRef} />
      </div>

      {showScrollBtn && (
        <button
          style={s.scrollBtn}
          onClick={() => endRef.current?.scrollIntoView({ behavior: "smooth" })}
        >
          ↓
        </button>
      )}

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
          disabled={!connected || !inputText.trim() || isSending}
          style={{
            ...s.sendBtn,
            background: connected && inputText.trim() && !isSending ? accentColor : "#374151",
            cursor: connected && inputText.trim() && !isSending ? "pointer" : "not-allowed",
          }}
        >
          {isSending ? "..." : "➤"}
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
  sendBtn: { border: "none", borderRadius: "50%", width: 36, height: 36, color: "#fff", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "background 0.2s" },
  scrollBtn: {
    position: "absolute",
    bottom: "70px",
    left: "50%",
    transform: "translateX(-50%)",
    background: "#1d4ed8",
    color: "#fff",
    border: "none",
    borderRadius: "999px",
    padding: "6px 16px",
    fontSize: "12px",
    cursor: "pointer",
    zIndex: 10,
    boxShadow: "0 2px 8px rgba(0,0,0,0.4)",
  },
  participantPopup: {
    position: "absolute",
    top: "52px",
    right: 0,
    left: 0,
    background: "#161b22",
    borderBottom: "1px solid rgba(255,255,255,0.08)",
    zIndex: 20,
    maxHeight: "200px",
    overflowY: "auto",
  },
  participantHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "10px 16px",
    borderBottom: "1px solid rgba(255,255,255,0.06)",
  },
  participantItem: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "8px 16px",
  },
  participantAvatar: {
    width: 28, height: 28,
    borderRadius: "50%",
    background: "linear-gradient(135deg,#3b82f6,#8b5cf6)",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: 12, color: "#fff", flexShrink: 0,
  },
  meTag: {
    fontSize: "11px",
    color: "#60a5fa",
    background: "rgba(96,165,250,0.1)",
    padding: "2px 6px",
    borderRadius: "999px",
  },
  popupClose: {
    background: "none",
    border: "none",
    color: "#6b7280",
    fontSize: "14px",
    cursor: "pointer",
    padding: "4px 6px",
    fontFamily: "inherit",
  },
  header: { display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", background: "#161b22", borderBottom: "1px solid rgba(255,255,255,0.06)", flexShrink: 0 },
  backBtn: { background: "none", border: "none", color: "#9ca3af", fontSize: 18, cursor: "pointer", padding: "4px 6px" },
  sizeBtn: { background: "rgba(255,255,255,0.1)", border: "none", color: "#fff", padding: "4px 8px", borderRadius: 6, cursor: "pointer", fontSize: 14, flexShrink: 0 },
  headerInfo: { flex: 1, overflow: "hidden" },
  roomTitle: { fontSize: 14, fontWeight: 700, color: "#f0f0f0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  roomSub: { fontSize: 11, marginTop: 2 },
  dateDivider: {
    display: "flex", alignItems: "center",
    margin: "12px 0",
  },
  dateDividerText: {
    fontSize: "11px", color: "#4b5563",
    background: "#1e293b",
    padding: "3px 10px", borderRadius: "999px",
    margin: "0 auto",
  },
  msgList: { flex: 1, overflowY: "auto", padding: 16, display: "flex", flexDirection: "column", gap: 8 },
  emptyMsg: { textAlign: "center", color: "#4b5563", fontSize: 13, marginTop: 20 },
  sysMsg: { textAlign: "center", fontSize: 11, color: "#6b7280", background: "rgba(255,255,255,0.04)", borderRadius: 8, padding: "4px 0" },

  msgRow: { display: "flex", alignItems: "flex-end", gap: 6 },
  avatar: { width: 28, height: 28, borderRadius: "50%", background: "linear-gradient(135deg,#3b82f6,#8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: "#fff", flexShrink: 0 },
  msgGroup: { display: "flex", flexDirection: "column", gap: 3, maxWidth: "75%" },
  senderName: { fontSize: 11, color: "#9ca3af", marginLeft: 4 },
  bubbleRow: { display: "flex", alignItems: "flex-end", gap: 4 },
  bubble: { padding: "8px 12px", borderRadius: 14, fontSize: 13, color: "#fff", wordBreak: "break-word", lineHeight: 1.5 },
  time: { fontSize: 10, color: "#4b5563", flexShrink: 0, paddingBottom: 2 },

  inputArea: { display: "flex", padding: 12, background: "#161b22", gap: 8, flexShrink: 0 },
  input: { flex: 1, background: "#0d1117", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 20, color: "#fff", padding: "8px 14px", outline: "none", fontSize: 13, fontFamily: "inherit" },
};