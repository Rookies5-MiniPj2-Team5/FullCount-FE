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
  const [isActing, setIsActing] = useState(false);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [transfer, setTransfer] = useState(null);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);

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
            } catch { }
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

  useEffect(() => {
    if (!resolvedRoomId || roomType !== "ONE_ON_ONE") return;
    const fetchTransfer = async () => {
      try {
        const res = await api.get(`/transfers/room/${resolvedRoomId}`);
        const data = res.data?.data ?? res.data;
        if (data && data.id) setTransfer(data);  // status 대신 id로 체크
      } catch {
        // Transfer 없으면 null 유지
      }
    };
    fetchTransfer();
  }, [resolvedRoomId, roomType]);

  const handleTransferAction = useCallback(async (action) => {
    if (isActing) return;
    setIsActing(true);
    try {
      const endpoints = {
        request: () => api.post(`/transfers/room/${resolvedRoomId}/request`),
        pay: () => api.post(`/transfers/${transfer?.id}/pay`),
        ticketSent: () => api.post(`/transfers/${transfer?.id}/ticket-sent`),
        confirm: () => api.post(`/transfers/${transfer?.id}/confirm`),
        cancel: () => api.post(`/transfers/${transfer?.id}/cancel`),
      };
      await endpoints[action]();

      await new Promise(resolve => setTimeout(resolve, 500));

      const res = await api.get(`/transfers/room/${resolvedRoomId}`);
      const data = res.data.data ?? res.data;
      if (data && data.id) {
        setTransfer(data);
      }
    } catch (err) {
      alert(err.response?.data?.message || "처리에 실패했습니다.");
    } finally {
      setIsActing(false);
    }
  }, [transfer, resolvedRoomId, isActing]);

  const handleLeave = useCallback(async () => {
    if (!resolvedRoomId) return;

    const isOneOnOne = roomType === "ONE_ON_ONE";
    const confirmMsg = isOneOnOne
      ? "거래가 완료되거나 취소된 경우에만 나갈 수 있습니다. 나가시겠습니까?"
      : "채팅방을 나가시겠습니까?";

    if (!window.confirm(confirmMsg)) return;

    try {
      await api.delete(`/chat/rooms/${resolvedRoomId}/leave`);
      onBack?.();
    } catch (err) {
      if (err.response?.status === 400) {
        alert("거래 진행 중에는 채팅방을 나갈 수 없습니다.");
      } else {
        alert("나가기에 실패했습니다.");
      }
    }
  }, [resolvedRoomId, roomType, onBack]);

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

  const getStatusInfo = (status) => {
    switch(status) {
      case "REQUESTED": return { label: "양도 요청됨", step: 1, color: "#eab308" };
      case "PAYMENT_COMPLETED": return { label: "결제 완료", step: 2, color: "#3b82f6" };
      case "TICKET_SENT": return { label: "티켓 발송됨", step: 3, color: "#8b5cf6" };
      case "COMPLETED": return { label: "인수 확정 (종료)", step: 4, color: "#22c55e" };
      case "CANCELLED": return { label: "거래 취소", step: 0, color: "#ef4444" };
      default: return { label: "진행 전", step: 0, color: "#9ca3af" };
    }
  };

  const renderTransferMiniBar = () => {
    if (roomType !== "ONE_ON_ONE") return null;
    
    // participants[0] is guaranteed to be the initiator(seller) per ChatRoomService logic
    const presumedSellerId = participants[0]?.memberId;
    const isSeller = transfer ? transfer.sellerId === currentUser?.id : presumedSellerId === currentUser?.id;

    if (!transfer) {
      return (
        <div style={s.miniBar}>
          <div style={s.miniBarLeft}>
            <span style={s.safeIcon}>🛡️</span>
            <div>
              <div style={s.miniBarTitle}>안전 거래 시스템</div>
              <div style={s.miniBarSub}>사기 방지를 위해 에스크로를 이용하세요</div>
            </div>
          </div>
          <button style={s.primaryActionBtn} onClick={() => setIsTransferModalOpen(true)}>
             {isSeller ? "거래 진행 대기" : "거래 신청"}
          </button>
        </div>
      );
    }
    
    const info = getStatusInfo(transfer.status);
    
    return (
      <div style={s.miniBar} onClick={() => setIsTransferModalOpen(true)}>
        <div style={s.miniBarLeft}>
          <span style={s.safeIcon}>🔒</span>
          <div>
            <div style={s.miniBarTitle}>FullCount 안전 결제</div>
            <div style={{ ...s.miniBarSub, color: info.color }}>상태: {info.label}</div>
          </div>
        </div>
        <button style={s.viewModalBtn}>상세 확인</button>
      </div>
    );
  };

  const renderTransferModal = () => {
    if (!isTransferModalOpen || roomType !== "ONE_ON_ONE") return null;
    
    const presumedSellerId = participants[0]?.memberId;
    const isSeller = transfer ? transfer.sellerId === currentUser?.id : presumedSellerId === currentUser?.id;
    const isBuyer = transfer ? transfer.buyerId === currentUser?.id : presumedSellerId !== currentUser?.id;
    const info = getStatusInfo(transfer?.status);
    
    return (
      <div style={s.modalOverlay}>
        <div style={s.modalContent}>
          <div style={s.modalHeader}>
            <span style={s.modalTitle}>🔒 안전 거래 영수증</span>
            <button style={s.modalClose} onClick={() => setIsTransferModalOpen(false)}>✕</button>
          </div>
          
          <div style={s.trustBanner}>
            <span style={{fontSize: 16}}>🛡️</span>
            <span style={{fontSize: 12, lineHeight: 1.4}}>
              결제 대금은 구매 확정 전까지 <b>스마트 에스크로</b>에 안전하게 보관됩니다.
            </span>
          </div>

          {!transfer ? (
             <div style={s.modalBody}>
               <div style={s.receiptRow}>상태 <span style={{color: "#9ca3af"}}>거래 전 문의 단계</span></div>
               <div style={s.receiptDash}></div>
               
               {isSeller ? (
                 <div style={{fontSize: 13, color: "#9ca3af", textAlign: "center", margin: "14px 0", lineHeight: 1.6}}>
                   구매자의 안전 거래(에스크로) 요청을 기다리는 중입니다.<br/>양도 조건 합의를 진행해주세요.
                 </div>
               ) : (
                 <>
                   <div style={{fontSize: 13, color: "#9ca3af", textAlign: "center", margin: "14px 0", lineHeight: 1.6}}>
                     판매자와 티켓 양도에 대한 대화가 완료되었다면<br/>아래 버튼을 눌러 거래를 요청하세요.
                   </div>
                   <button style={s.actionBtnHighlight} disabled={isActing} onClick={() => handleTransferAction("request")}>
                     {isActing ? "요청 중..." : "🤝 양도 요청 시작하기"}
                   </button>
                 </>
               )}
             </div>
          ) : (
            <div style={s.modalBody}>
               <div style={s.amountDisplay}>
                 <div style={s.amountLabel}>총 타겟 금액 (에스크로 예치액)</div>
                 <div style={s.amountValue}>{transfer.price?.toLocaleString()} P</div>
               </div>
               
               <div style={s.receiptDash}></div>
               
               <div style={s.receiptRow}><span>거래 번호</span> <span>#FC-TR-{transfer.id}</span></div>
               <div style={s.receiptRow}><span>판매자 (양도)</span> <span>{transfer.sellerNickname}</span></div>
               <div style={s.receiptRow}><span>구매자 (양수)</span> <span>{transfer.buyerNickname}</span></div>
               <div style={s.receiptRow}><span>게시물</span> <span style={{maxWidth: 150, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis"}}>{transfer.postTitle}</span></div>
               
               <div style={s.receiptDash}></div>
               
               <div style={{ display: "flex", alignItems: "center", margin: "14px 0 10px 0" }}>
                 {[ 
                   { step: 1, text: "요청" }, 
                   { step: 2, text: "결제" }, 
                   { step: 3, text: "발송" }, 
                   { step: 4, text: "확정" } 
                 ].map((sObj, idx, arr) => {
                   const isActive = info.step === sObj.step;
                   const isPast = info.step > sObj.step;
                   const isCancelled = transfer?.status === "CANCELLED";
                   
                   let circleColor = "#374151";
                   if (isCancelled && (isActive || (info.step === 0 && sObj.step === 1))) circleColor = "#ef4444";
                   else if (isPast || isActive) circleColor = "#3b82f6";
                   
                   return (
                     <div key={idx} style={{ display: "flex", alignItems: "center", flex: idx === arr.length - 1 ? "none" : 1 }}>
                       <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, position: "relative", zIndex: 2 }}>
                         <div style={{...s.stepCircle, background: circleColor, boxShadow: isActive ? `0 0 10px ${circleColor}` : "none"}}>
                           {isPast ? "✓" : sObj.step}
                         </div>
                         <span style={{...s.stepText, color: (isActive || isPast) ? "#f1f5f9" : "#64748b", fontWeight: isActive ? "bold" : "normal"}}>
                           {sObj.text}
                         </span>
                       </div>
                       {idx < arr.length - 1 && (
                         <div style={{ flex: 1, height: 2, background: isPast ? "#3b82f6" : "#374151", margin: "0 8px", transform: "translateY(-10px)" }} />
                       )}
                     </div>
                   );
                 })}
               </div>
               
               <div style={s.actionArea}>
                 {transfer.status === "REQUESTED" && isBuyer && (
                   <button style={s.actionBtnHighlight} disabled={isActing} onClick={() => handleTransferAction("pay")}>
                     {isActing ? "처리 중..." : "결제하기 (에스크로 예치)"}
                   </button>
                 )}
                 {transfer.status === "PAYMENT_COMPLETED" && isSeller && (
                   <button style={s.actionBtnHighlight} disabled={isActing} onClick={() => handleTransferAction("ticketSent")}>
                     {isActing ? "처리 중..." : "티켓 발송 완료 처리"}
                   </button>
                 )}
                 {transfer.status === "TICKET_SENT" && isBuyer && (
                   <button style={s.actionBtnSuccess} disabled={isActing} onClick={() => handleTransferAction("confirm")}>
                     {isActing ? "처리 중..." : "구매 확정 (에스크로 해제)"}
                   </button>
                 )}
                 
                 {transfer.status === "REQUESTED" && isSeller && (
                   <div style={s.waitingText}>구매자의 결제를 기다리는 중입니다...</div>
                 )}
                 {transfer.status === "PAYMENT_COMPLETED" && isBuyer && (
                   <div style={s.waitingText}>판메자의 티켓 발송(앱 확인)을 기다리는 중...</div>
                 )}
                 {transfer.status === "TICKET_SENT" && isSeller && (
                   <div style={s.waitingText}>구매자의 수령 확정을 기다리는 중입니다...</div>
                 )}
                 {transfer.status === "COMPLETED" && (
                   <div style={s.successText}>🎉 거래가 안전하게 완료되었습니다.</div>
                 )}
                 {transfer.status === "CANCELLED" && (
                   <div style={s.errorText}>거래가 무효화/취소되었습니다.</div>
                 )}
                 
                 {["REQUESTED", "PAYMENT_COMPLETED", "TICKET_SENT"].includes(transfer.status) && (
                   <button style={s.cancelTxtBtn} disabled={isActing} onClick={() => handleTransferAction("cancel")}>
                     거래 무효화 (취소)
                   </button>
                 )}
               </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div style={isFullSize ? s.fullWrapper : s.popupWrapper}>
      <div style={s.header}>
        <button
          style={s.backBtn}
          onClick={() => {
            if (resolvedRoomId) api.post(`/chat/rooms/${resolvedRoomId}/read`).catch(() => { });
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
        <button style={s.leaveBtn} onClick={handleLeave}>나가기</button>
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

      {renderTransferMiniBar()}
      {renderTransferModal()}

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
  popupWrapper: { position: "fixed", bottom: 80, right: 20, width: 380, height: 600, background: "#0d1117", borderRadius: 20, display: "flex", flexDirection: "column", boxShadow: "0 10px 30px rgba(0,0,0,0.5)", zIndex: 1000, overflow: "hidden", border: "1px solid rgba(255,255,255,0.1)" },
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
  leaveBtn: { background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)", color: "#ef4444", padding: "4px 8px", borderRadius: 6, cursor: "pointer", fontSize: 12 },
  modalOverlay: { position: "absolute", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center" },
  modalContent: { width: "92%", maxHeight: "95%", background: "linear-gradient(145deg, #1e293b, #0f172a)", borderRadius: 20, boxShadow: "0 25px 50px -12px rgba(0,0,0,0.7)", border: "1px solid rgba(255,255,255,0.1)", display: "flex", flexDirection: "column", overflow: "hidden" },
  modalHeader: { flexShrink: 0, display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 16px", borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(0,0,0,0.2)" },
  modalTitle: { fontSize: 16, fontWeight: 700, color: "#fff" },
  modalClose: { background: "none", border: "none", color: "#9ca3af", fontSize: 18, cursor: "pointer", padding: "0 4px" },
  trustBanner: { flexShrink: 0, display: "flex", alignItems: "center", gap: 8, padding: "10px 16px", background: "rgba(34, 197, 94, 0.1)", borderBottom: "1px solid rgba(34, 197, 94, 0.2)", color: "#22c55e" },
  modalBody: { padding: "16px", display: "flex", flexDirection: "column", gap: 10, overflowY: "auto" },
  amountDisplay: { textAlign: "center", margin: "6px 0" },
  amountLabel: { fontSize: 12, color: "#9ca3af", marginBottom: 4 },
  amountValue: { fontSize: 24, fontWeight: 800, color: "#3b82f6", textShadow: "0 0 10px rgba(59, 130, 246, 0.3)" },
  receiptRow: { display: "flex", justifyContent: "space-between", fontSize: 13, color: "#cbd5e1" },
  receiptDash: { borderTop: "1px dashed rgba(255,255,255,0.2)", margin: "8px 0" },
  stepCircle: { width: 24, height: 24, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: "#fff", fontWeight: "bold" },
  stepText: { fontSize: 10, whiteSpace: "nowrap" },
  actionArea: { display: "flex", flexDirection: "column", gap: 10, marginTop: 10 },
  actionBtnHighlight: { background: "linear-gradient(135deg, #3b82f6, #2563eb)", border: "none", padding: "12px", borderRadius: 12, color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer", boxShadow: "0 4px 15px rgba(59, 130, 246, 0.4)" },
  actionBtnSuccess: { background: "linear-gradient(135deg, #22c55e, #16a34a)", border: "none", padding: "12px", borderRadius: 12, color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer", boxShadow: "0 4px 15px rgba(34, 197, 94, 0.4)" },
  cancelTxtBtn: { background: "transparent", border: "none", color: "#ef4444", fontSize: 12, textDecoration: "underline", cursor: "pointer", marginTop: 4 },
  waitingText: { fontSize: 12, color: "#9ca3af", textAlign: "center", padding: "10px" },
  successText: { fontSize: 13, color: "#22c55e", textAlign: "center", fontWeight: "bold", padding: "10px" },
  errorText: { fontSize: 13, color: "#ef4444", textAlign: "center", fontWeight: "bold", padding: "10px" },
  
  miniBar: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", background: "linear-gradient(145deg, #1a2332, #111827)", borderTop: "1px solid rgba(255,255,255,0.06)", cursor: "pointer" },
  miniBarLeft: { display: "flex", alignItems: "center", gap: 12 },
  safeIcon: { fontSize: 24, filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.5))" },
  miniBarTitle: { fontSize: 13, fontWeight: 700, color: "#f1f5f9" },
  miniBarSub: { fontSize: 11, color: "#94a3b8", marginTop: 2 },
  viewModalBtn: { background: "rgba(255,255,255,0.1)", border: "none", color: "#fff", padding: "6px 12px", borderRadius: 8, fontSize: 12, cursor: "pointer" },
  primaryActionBtn: { background: "#3b82f6", border: "none", color: "#fff", padding: "6px 12px", borderRadius: 8, fontSize: 12, cursor: "pointer" }
};