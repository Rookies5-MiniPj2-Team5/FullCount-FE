// components/ChatFab.jsx
// 오른쪽 하단 고정 채팅 버튼 (FAB)
//
// ■ 기능
//   - 오른쪽 하단에 항상 떠있는 채팅 버튼
//   - 읽지 않은 메시지가 있으면 빨간 뱃지 표시
//   - 클릭 시 내가 참여 중인 채팅방 목록 팝업
//   - 채팅방 클릭 시 onOpenChat(room) 콜백 호출
//
// ■ props
//   currentUser  - { id, nickname }
//   onOpenChat   - (room) => void  채팅방 열기 콜백 (App.jsx에서 관리)
//
// ■ App.jsx 적용 방법
//   1. import ChatFab from "./components/ChatFab";
//   2. return 최하단(탭바 위)에 추가:
//      <ChatFab currentUser={currentUser} onOpenChat={handleOpenChat} />
//
// ■ BE 연동 포인트
//   - 채팅방 목록: GET /api/chat/rooms/my
//   - 읽지 않은 수: 위 응답의 unreadCount 필드 합산
//   - 실시간 뱃지 업데이트: WebSocket 구독으로 새 메시지 수신 시 카운트 증가

import { useState, useEffect, useRef } from "react";

// ─── 더미 채팅방 목록 ─────────────────────────────────
// TODO: BE 연동 - GET /api/chat/rooms/my
// 응답: ChatRoomSummaryDTO[]
// ChatRoomSummaryDTO: {
//   id, roomType: "GROUP"|"ONE_ON_ONE",
//   title,           // 그룹: 크루 이름 / 1:1: 상대방 닉네임
//   lastMessage,     // 마지막 메시지 내용
//   lastMessageAt,   // 마지막 메시지 시각 (ISO8601)
//   unreadCount,     // 읽지 않은 메시지 수
//   crewTeam,        // 연관 팀 (팀 컬러용)
// }
const DUMMY_ROOMS = [
  {
    id: 101,
    roomType: "GROUP",
    title: "두산 홈 개막전 같이 가실 분!",
    lastMessage: "집합 시간은 17:30으로 할게요!",
    lastMessageAt: "2026-04-04T14:25:00",
    unreadCount: 3,
    crewTeam: "두산 베어스",
  },
  {
    id: 102,
    roomType: "ONE_ON_ONE",
    title: "야구왕김철수",
    lastMessage: "안녕하세요! 크루에 관심 가져주셔서 감사해요 ⚾",
    lastMessageAt: "2026-04-03T10:00:00",
    unreadCount: 1,
    crewTeam: "두산 베어스",
  },
  {
    id: 103,
    roomType: "ONE_ON_ONE",
    title: "쌍둥이팬클럽",
    lastMessage: "티켓 양도 관련해서 연락드렸어요",
    lastMessageAt: "2026-04-02T09:30:00",
    unreadCount: 0,
    crewTeam: "LG 트윈스",
  },
];

// ─── 팀 컬러 ──────────────────────────────────────────
const TEAM_COLORS = {
  "두산 베어스":   "#C8102E",
  "LG 트윈스":    "#C8102E",
  "SSG 랜더스":   "#CE0E2D",
  "키움 히어로즈": "#820024",
  "KT 위즈":      "#EB0028",
  "삼성 라이온즈": "#074CA1",
  "한화 이글스":   "#F37321",
  "NC 다이노스":   "#1D467A",
  "롯데 자이언츠": "#002561",
  "KIA 타이거즈":  "#EA0029",
};

// ─── 시간 포맷 ────────────────────────────────────────
function fmtRelative(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const min  = Math.floor(diff / 60000);
  const hr   = Math.floor(diff / 3600000);
  const day  = Math.floor(diff / 86400000);
  if (min  <  1) return "방금";
  if (min  < 60) return `${min}분 전`;
  if (hr   < 24) return `${hr}시간 전`;
  if (day  <  7) return `${day}일 전`;
  return new Date(iso).toLocaleDateString("ko-KR", { month: "short", day: "numeric" });
}

// ─── 채팅방 아이템 ────────────────────────────────────
function RoomItem({ room, onClick }) {
  const color   = TEAM_COLORS[room.crewTeam] || "#2563eb";
  const isGroup = room.roomType === "GROUP";

  return (
    <button style={s.roomItem} onClick={() => onClick(room)}>
      {/* 아이콘 */}
      <div style={{ ...s.roomIcon, background: isGroup ? color : "#7c3aed" }}>
        {isGroup ? "👥" : "💬"}
      </div>

      {/* 내용 */}
      <div style={s.roomContent}>
        <div style={s.roomTop}>
          <span style={s.roomTitle}>{room.title}</span>
          <span style={s.roomTime}>{fmtRelative(room.lastMessageAt)}</span>
        </div>
        <div style={s.roomBottom}>
          <span style={s.roomLastMsg}>{room.lastMessage}</span>
          {room.unreadCount > 0 && (
            <span style={s.unreadBadge}>
              {room.unreadCount > 99 ? "99+" : room.unreadCount}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

// ─── 메인 FAB 컴포넌트 ────────────────────────────────
export default function ChatFab({ currentUser, onOpenChat }) {
  const [open,  setOpen]  = useState(false);
  const [rooms, setRooms] = useState(DUMMY_ROOMS);
  const popupRef = useRef(null);

  // 총 읽지 않은 메시지 수
  const totalUnread = rooms.reduce((sum, r) => sum + (r.unreadCount || 0), 0);

  // TODO: BE 연동 - 채팅방 목록 + 읽지 않은 수 주기적 갱신
  // useEffect(() => {
  //   const load = async () => {
  //     const token = localStorage.getItem("accessToken");
  //     const res = await fetch("/api/chat/rooms/my", {
  //       headers: { Authorization: `Bearer ${token}` },
  //     });
  //     const data = await res.json();
  //     setRooms(data);
  //   };
  //   load();
  //   const interval = setInterval(load, 30000); // 30초마다 갱신
  //   return () => clearInterval(interval);
  // }, []);

  // TODO: BE 연동 - WebSocket으로 새 메시지 수신 시 unreadCount 실시간 증가
  // subscribeToMyNotifications(currentUser.id, (notification) => {
  //   setRooms((prev) =>
  //     prev.map((r) =>
  //       r.id === notification.roomId
  //         ? { ...r, unreadCount: r.unreadCount + 1, lastMessage: notification.content, lastMessageAt: notification.sentAt }
  //         : r
  //     )
  //   );
  // });

  // 팝업 외부 클릭 시 닫기
  useEffect(() => {
    if (!open) return;
    const handleClick = (e) => {
      if (popupRef.current && !popupRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  // 채팅방 클릭 → 읽음 처리 + 채팅 열기
  const handleRoomClick = (room) => {
    // TODO: BE 연동 - PATCH /api/chat/rooms/{roomId}/read
    setRooms((prev) =>
      prev.map((r) => (r.id === room.id ? { ...r, unreadCount: 0 } : r))
    );
    setOpen(false);
    onOpenChat?.(room);
  };

  return (
    <div style={s.fabWrap} ref={popupRef}>

      {/* ── 팝업 ── */}
      {open && (
        <div style={s.popup}>
          {/* 팝업 헤더 */}
          <div style={s.popupHeader}>
            <span style={s.popupTitle}>💬 내 채팅</span>
            <button style={s.popupClose} onClick={() => setOpen(false)}>✕</button>
          </div>

          {/* 채팅방 목록 */}
          <div style={s.roomList}>
            {rooms.length === 0 ? (
              <div style={s.emptyChat}>
                <div style={{ fontSize: "32px", marginBottom: "8px" }}>💬</div>
                <div style={{ color: "#6b7280", fontSize: "13px" }}>
                  참여 중인 채팅방이 없어요
                </div>
              </div>
            ) : (
              rooms
                .sort((a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt))
                .map((room) => (
                  <RoomItem key={room.id} room={room} onClick={handleRoomClick} />
                ))
            )}
          </div>
        </div>
      )}

      {/* ── FAB 버튼 ── */}
      <button
        style={{
          ...s.fab,
          transform: open ? "scale(0.92)" : "scale(1)",
        }}
        onClick={() => setOpen((v) => !v)}
        aria-label="채팅 열기"
      >
        {/* 채팅 아이콘 */}
        <span style={{ fontSize: "22px", lineHeight: 1 }}>
          {open ? "✕" : "💬"}
        </span>

        {/* 읽지 않은 뱃지 */}
        {!open && totalUnread > 0 && (
          <span style={s.fabBadge}>
            {totalUnread > 99 ? "99+" : totalUnread}
          </span>
        )}
      </button>
    </div>
  );
}

// ─── 스타일 ────────────────────────────────────────────
const s = {
  // FAB 래퍼 (position 기준점)
  fabWrap: {
    position: "fixed",
    bottom: "88px",   // 하단 탭바 위
    right: "20px",
    zIndex: 1000,
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-end",
    gap: "10px",
  },

  // FAB 버튼
  fab: {
    width: "52px",
    height: "52px",
    borderRadius: "50%",
    background: "linear-gradient(135deg, #1d4ed8, #7c3aed)",
    border: "none",
    color: "#fff",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 4px 20px rgba(29,78,216,0.45)",
    transition: "transform 0.15s, box-shadow 0.15s",
    position: "relative",
    flexShrink: 0,
  },

  // 읽지 않은 메시지 뱃지 (FAB 위)
  fabBadge: {
    position: "absolute",
    top: "-4px",
    right: "-4px",
    minWidth: "18px",
    height: "18px",
    background: "#ef4444",
    color: "#fff",
    fontSize: "11px",
    fontWeight: "700",
    borderRadius: "999px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "0 4px",
    border: "2px solid #0f0f1a",
    fontFamily: "inherit",
  },

  // 팝업 전체
  popup: {
    width: "320px",
    maxHeight: "420px",
    background: "#161b22",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "20px",
    boxShadow: "0 8px 40px rgba(0,0,0,0.5)",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
    animation: "fadeSlideUp 0.18s ease",
  },

  // 팝업 헤더
  popupHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "16px 18px 12px",
    borderBottom: "1px solid rgba(255,255,255,0.06)",
    flexShrink: 0,
  },
  popupTitle: {
    fontSize: "15px",
    fontWeight: "700",
    color: "#f0f0f0",
  },
  popupClose: {
    background: "none",
    border: "none",
    color: "#6b7280",
    fontSize: "14px",
    cursor: "pointer",
    padding: "4px 6px",
    borderRadius: "6px",
    fontFamily: "inherit",
  },

  // 채팅방 목록 스크롤 영역
  roomList: {
    overflowY: "auto",
    flex: 1,
  },

  // 채팅방 없을 때
  emptyChat: {
    textAlign: "center",
    padding: "40px 20px",
  },

  // 채팅방 아이템 (버튼)
  roomItem: {
    width: "100%",
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "12px 16px",
    background: "none",
    border: "none",
    borderBottom: "1px solid rgba(255,255,255,0.04)",
    cursor: "pointer",
    textAlign: "left",
    transition: "background 0.1s",
    fontFamily: "inherit",
    color: "inherit",
  },

  // 채팅방 아이콘
  roomIcon: {
    width: "40px",
    height: "40px",
    borderRadius: "12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "18px",
    flexShrink: 0,
  },

  // 채팅방 텍스트 영역
  roomContent: {
    flex: 1,
    overflow: "hidden",
  },
  roomTop: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "8px",
    marginBottom: "3px",
  },
  roomTitle: {
    fontSize: "14px",
    fontWeight: "600",
    color: "#f0f0f0",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    flex: 1,
  },
  roomTime: {
    fontSize: "11px",
    color: "#4b5563",
    flexShrink: 0,
  },
  roomBottom: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "8px",
  },
  roomLastMsg: {
    fontSize: "12px",
    color: "#6b7280",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    flex: 1,
  },

  // 읽지 않은 메시지 뱃지 (채팅방 아이템)
  unreadBadge: {
    minWidth: "18px",
    height: "18px",
    background: "#ef4444",
    color: "#fff",
    fontSize: "11px",
    fontWeight: "700",
    borderRadius: "999px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "0 4px",
    flexShrink: 0,
  },
};
