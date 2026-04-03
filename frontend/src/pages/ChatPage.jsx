import { useCallback, useEffect, useRef, useState } from "react";
import SockJS from "sockjs-client";
import Stomp from "stompjs";
import api from "../api/api";

const unwrapResponse = (data) => data?.data ?? data;
const extractRoomId = (room) => room?.chatRoomId ?? room?.roomId ?? room?.id ?? null;
const extractRoomType = (room) => room?.roomType ?? room?.chatRoomType ?? null;

const fmtTime = (iso) =>
  new Date(iso).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", hour12: false });

const fmtDate = (iso) => {
  const target = new Date(iso);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (target.toDateString() === today.toDateString()) return "오늘";
  if (target.toDateString() === yesterday.toDateString()) return "어제";
  return target.toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" });
};

const isSameDay = (a, b) => new Date(a).toDateString() === new Date(b).toDateString();

export default function ChatPage({
  crew,
  postId,
  roomType = "GROUP_JOIN",
  roomId: initialRoomId,
  currentUser,
  isDm = false,
  dmTargetNickname,
  onBack,
}) {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [connected, setConnected] = useState(false);
  const [resolvedRoomId, setResolvedRoomId] = useState(initialRoomId ?? null);
  const [participants, setParticipants] = useState([]);
  const [showParticipants, setShowParticipants] = useState(false);
  const [isFullSize, setIsFullSize] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [showScrollBtn, setShowScrollBtn] = useState(false);

  const endRef = useRef(null);
  const msgListRef = useRef(null);
  const clientRef = useRef(null);
  const isConnectingRef = useRef(false);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const resolveRoomIdByPostId = useCallback(async () => {
    if (!postId) return null;
    const res = await api.get("/chat/rooms");
    const roomData = unwrapResponse(res.data);
    const rooms = Array.isArray(roomData?.content) ? roomData.content : Array.isArray(roomData) ? roomData : [];
    const matchedRoom = rooms.find((room) => extractRoomType(room) === roomType && String(room?.postId) === String(postId));
    return extractRoomId(matchedRoom);
  }, [postId, roomType]);

  useEffect(() => {
    if (isConnectingRef.current) return;

    const initChat = async () => {
      isConnectingRef.current = true;
      let currentRoomId = initialRoomId ?? null;
      const isTempDmId = typeof currentRoomId === "string" && currentRoomId.startsWith("dm-");

      try {
        if (isDm && (isTempDmId || !currentRoomId) && crew?.id) {
          const dmRes = await api.post(`/chat/rooms/dm/crew/${crew.id}`);
          currentRoomId = extractRoomId(unwrapResponse(dmRes.data));
        }

        if (!isDm && !currentRoomId && postId) {
          currentRoomId = await resolveRoomIdByPostId();
        }

        if (!currentRoomId || isTempDmId) {
          setConnected(false);
          return;
        }

        setResolvedRoomId(currentRoomId);

        const socket = new SockJS("http://localhost:8080/ws");
        const client = Stomp.over(socket);
        client.debug = null;
        clientRef.current = client;

        const token = localStorage.getItem("accessToken");
        client.connect(
          { Authorization: `Bearer ${token}` },
          async () => {
            setConnected(true);

            client.subscribe(`/topic/chat/${currentRoomId}`, (frame) => {
              try {
                const parsed = JSON.parse(frame.body);
                setMessages((prev) => [
                  ...prev,
                  {
                    ...parsed,
                    messageId: parsed.messageId ?? parsed.id ?? Date.now() + Math.random(),
                    content: parsed.content ?? parsed.message ?? "",
                    senderNickname: parsed.senderNickname ?? parsed.sender ?? parsed.nickname ?? "알 수 없음",
                    timestamp: parsed.timestamp ?? parsed.createdAt ?? new Date().toISOString(),
                  },
                ]);
              } catch (error) {
                console.error("메시지 파싱 실패:", error);
              }
            });

            try {
              const historyRes = await api.get(`/chat/rooms/${currentRoomId}/messages`);
              const historyData = unwrapResponse(historyRes.data);
              const history = Array.isArray(historyData?.content) ? historyData.content : [];
              setMessages(history.reverse());
            } catch (error) {
              console.error("메시지 조회 실패:", error);
            }

            try {
              await api.post(`/chat/rooms/${currentRoomId}/read`);
            } catch {}
          },
          (error) => {
            console.error("STOMP 연결 실패:", error);
            setConnected(false);
          },
        );
      } catch (error) {
        console.error("채팅 초기화 실패:", error);
      } finally {
        isConnectingRef.current = false;
      }
    };

    initChat();

    return () => {
      if (clientRef.current?.connected) clientRef.current.disconnect();
      clientRef.current = null;
      setConnected(false);
    };
  }, [crew?.id, initialRoomId, isDm, postId, resolveRoomIdByPostId]);

  useEffect(() => {
    if (!resolvedRoomId) return;
    api
      .get(`/chat/rooms/${resolvedRoomId}`)
      .then((res) => {
        const data = unwrapResponse(res.data);
        setParticipants(data?.participants || []);
      })
      .catch((error) => console.error("채팅방 상세 조회 실패:", error));
  }, [resolvedRoomId]);

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

  const handleSend = useCallback(() => {
    if (!inputText.trim() || !clientRef.current?.connected || !resolvedRoomId) return;
    try {
      setIsSending(true);
      clientRef.current.send(
        `/app/chat/${resolvedRoomId}`,
        {},
        JSON.stringify({
          type: "CHAT",
          roomId: resolvedRoomId,
          senderId: currentUser?.id,
          senderNickname: currentUser?.nickname,
          sender: currentUser?.nickname,
          content: inputText.trim(),
          message: inputText.trim(),
        }),
      );
      setInputText("");
    } catch (error) {
      console.error("메시지 전송 실패:", error);
    } finally {
      setIsSending(false);
    }
  }, [currentUser?.id, currentUser?.nickname, inputText, resolvedRoomId]);

  const isMe = (msg) => {
    if (!currentUser) return false;
    if (msg.senderId && currentUser.id) return msg.senderId === currentUser.id;
    return msg.senderNickname === currentUser.nickname;
  };

  const showDateDivider = (index) => {
    if (index === 0) return true;
    const prev = messages[index - 1];
    const curr = messages[index];
    if (!prev?.timestamp || !curr?.timestamp) return false;
    return !isSameDay(prev.timestamp, curr.timestamp);
  };

  const isContinuous = (index) => {
    if (index === 0 || index >= messages.length) return false;
    const prev = messages[index - 1];
    const curr = messages[index];
    if (!prev || !curr || prev.senderId !== curr.senderId) return false;
    const prevTime = new Date(prev.timestamp);
    const currTime = new Date(curr.timestamp);
    return prevTime.getFullYear() === currTime.getFullYear()
      && prevTime.getMonth() === currTime.getMonth()
      && prevTime.getDate() === currTime.getDate()
      && prevTime.getHours() === currTime.getHours()
      && prevTime.getMinutes() === currTime.getMinutes();
  };

  return (
    <div style={isFullSize ? s.fullWrapper : s.popupWrapper}>
      <div style={s.header}>
        <button
          style={s.backBtn}
          onClick={() => {
            if (resolvedRoomId) api.post(`/chat/rooms/${resolvedRoomId}/read`).catch(() => {});
            onBack?.();
          }}
        >
          ←
        </button>
        <div style={{ ...s.headerInfo, cursor: "pointer" }} onClick={() => setShowParticipants((v) => !v)}>
          <div style={s.roomTitle}>{isDm ? dmTargetNickname : crew?.title}</div>
          <div style={{ ...s.roomSub, color: connected ? "#22c55e" : "#9ca3af" }}>
            {connected ? `연결됨 · 참여자 ${participants.length}명` : "연결 중..."}
          </div>
        </div>
        <button style={s.sizeBtn} onClick={() => setIsFullSize((v) => !v)}>{isFullSize ? "축소" : "확대"}</button>
      </div>

      {showParticipants && (
        <div style={s.participantPopup}>
          <div style={s.participantHeader}>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#f0f0f0" }}>참여자 {participants.length}명</span>
            <button style={s.popupClose} onClick={() => setShowParticipants(false)}>닫기</button>
          </div>
          {participants.map((participant) => (
            <div key={participant.memberId} style={s.participantItem}>
              <div style={s.participantAvatar}>{participant.nickname?.slice(0, 1)}</div>
              <span style={{ fontSize: 13, color: "#f0f0f0" }}>{participant.nickname}</span>
              {participant.memberId === currentUser?.id && <span style={s.meTag}>나</span>}
            </div>
          ))}
        </div>
      )}

      <div style={s.msgList} ref={msgListRef}>
        {messages.length === 0 && <div style={s.emptyMsg}>{connected ? "첫 메시지를 보내보세요." : "채팅방에 연결 중입니다."}</div>}
        {messages.map((msg, index) => {
          const mine = isMe(msg);
          const system = msg.type === "ENTER" || msg.type === "LEAVE";
          const continuous = isContinuous(index);
          return (
            <div key={msg.messageId ?? index}>
              {showDateDivider(index) && msg.timestamp && (
                <div style={s.dateDivider}><span style={s.dateDividerText}>{fmtDate(msg.timestamp)}</span></div>
              )}
              {system ? (
                <div style={s.sysMsg}>{msg.senderNickname}님이 {msg.type === "ENTER" ? "입장" : "퇴장"}했습니다.</div>
              ) : (
                <div style={{ ...s.msgRow, flexDirection: mine ? "row-reverse" : "row", marginTop: continuous ? 2 : 8 }}>
                  {!mine && <div style={{ ...s.avatar, visibility: continuous ? "hidden" : "visible" }}>{msg.senderNickname?.slice(0, 1)}</div>}
                  <div style={{ ...s.msgGroup, alignItems: mine ? "flex-end" : "flex-start" }}>
                    {!mine && !continuous && <span style={s.senderName}>{msg.senderNickname}</span>}
                    <div style={s.bubbleRow}>
                      {mine && !isContinuous(index + 1) && <span style={s.time}>{fmtTime(msg.timestamp)}</span>}
                      <div style={{ ...s.bubble, background: mine ? "#1d4ed8" : "#1e293b", borderBottomRightRadius: mine ? 4 : 14, borderBottomLeftRadius: mine ? 14 : 4 }}>
                        {msg.content}
                      </div>
                      {!mine && !isContinuous(index + 1) && <span style={s.time}>{fmtTime(msg.timestamp)}</span>}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
        <div ref={endRef} />
      </div>

      {showScrollBtn && <button style={s.scrollBtn} onClick={() => endRef.current?.scrollIntoView({ behavior: "smooth" })}>맨 아래로</button>}

      <div style={s.inputArea}>
        <input
          style={s.input}
          placeholder={connected ? "메시지를 입력하세요" : "연결 중..."}
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          disabled={!connected}
        />
        <button
          onClick={handleSend}
          disabled={!connected || !inputText.trim() || isSending}
          style={{ ...s.sendBtn, background: connected && inputText.trim() && !isSending ? "#1d4ed8" : "#374151", cursor: connected && inputText.trim() && !isSending ? "pointer" : "not-allowed" }}
        >
          전송
        </button>
      </div>
    </div>
  );
}

const s = {
  popupWrapper: { position: "fixed", bottom: 80, right: 20, width: 360, height: 500, background: "#0d1117", borderRadius: 20, display: "flex", flexDirection: "column", boxShadow: "0 10px 30px rgba(0,0,0,0.5)", zIndex: 1000, overflow: "hidden", border: "1px solid rgba(255,255,255,0.1)" },
  fullWrapper: { position: "fixed", inset: 0, background: "#0d1117", display: "flex", flexDirection: "column", zIndex: 2000 },
  header: { display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", background: "#161b22", borderBottom: "1px solid rgba(255,255,255,0.06)" },
  backBtn: { background: "none", border: "none", color: "#9ca3af", fontSize: 18, cursor: "pointer" },
  sizeBtn: { background: "rgba(255,255,255,0.1)", border: "none", color: "#fff", padding: "4px 8px", borderRadius: 6, cursor: "pointer", fontSize: 12 },
  headerInfo: { flex: 1, overflow: "hidden" },
  roomTitle: { fontSize: 14, fontWeight: 700, color: "#f0f0f0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  roomSub: { fontSize: 11, marginTop: 2 },
  participantPopup: { position: "absolute", top: 52, right: 0, left: 0, background: "#161b22", zIndex: 20, maxHeight: 200, overflowY: "auto" },
  participantHeader: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 16px", borderBottom: "1px solid rgba(255,255,255,0.06)" },
  participantItem: { display: "flex", alignItems: "center", gap: 10, padding: "8px 16px" },
  participantAvatar: { width: 28, height: 28, borderRadius: "50%", background: "linear-gradient(135deg,#3b82f6,#8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: "#fff" },
  meTag: { fontSize: 11, color: "#60a5fa", background: "rgba(96,165,250,0.1)", padding: "2px 6px", borderRadius: 999 },
  popupClose: { background: "none", border: "none", color: "#6b7280", fontSize: 12, cursor: "pointer" },
  msgList: { flex: 1, overflowY: "auto", padding: 16, display: "flex", flexDirection: "column", gap: 8 },
  emptyMsg: { textAlign: "center", color: "#4b5563", fontSize: 13, marginTop: 20 },
  dateDivider: { display: "flex", alignItems: "center", margin: "12px 0" },
  dateDividerText: { fontSize: 11, color: "#4b5563", background: "#1e293b", padding: "3px 10px", borderRadius: 999, margin: "0 auto" },
  sysMsg: { textAlign: "center", fontSize: 11, color: "#6b7280", background: "rgba(255,255,255,0.04)", borderRadius: 8, padding: "4px 0" },
  msgRow: { display: "flex", alignItems: "flex-end", gap: 6 },
  avatar: { width: 28, height: 28, borderRadius: "50%", background: "linear-gradient(135deg,#3b82f6,#8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: "#fff" },
  msgGroup: { display: "flex", flexDirection: "column", gap: 3, maxWidth: "75%" },
  senderName: { fontSize: 11, color: "#9ca3af", marginLeft: 4 },
  bubbleRow: { display: "flex", alignItems: "flex-end", gap: 4 },
  bubble: { padding: "8px 12px", borderRadius: 14, fontSize: 13, color: "#fff", wordBreak: "break-word", lineHeight: 1.5 },
  time: { fontSize: 10, color: "#4b5563", paddingBottom: 2 },
  scrollBtn: { position: "absolute", bottom: 70, left: "50%", transform: "translateX(-50%)", background: "#1d4ed8", color: "#fff", border: "none", borderRadius: 999, padding: "6px 16px", fontSize: 12, cursor: "pointer" },
  inputArea: { display: "flex", padding: 12, background: "#161b22", gap: 8 },
  input: { flex: 1, background: "#0d1117", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 20, color: "#fff", padding: "8px 14px", outline: "none", fontSize: 13 },
  sendBtn: { border: "none", borderRadius: 999, minWidth: 56, height: 36, color: "#fff", fontSize: 12, display: "flex", alignItems: "center", justifyContent: "center" },
};
