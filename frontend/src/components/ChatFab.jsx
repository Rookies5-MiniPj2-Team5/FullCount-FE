// components/ChatFab.jsx
import { useState, useEffect, useRef } from "react";
import api from "../api/api";

// ─── 팀 컬러 ──────────────────────────────────────────
const TEAM_COLORS = {
  "두산 베어스": "#C8102E",
  "LG 트윈스": "#C8102E",
  "SSG 랜더스": "#CE0E2D",
  "키움 히어로즈": "#820024",
  "KT 위즈": "#EB0028",
  "삼성 라이온즈": "#074CA1",
  "한화 이글스": "#F37321",
  "NC 다이노스": "#1D467A",
  "롯데 자이언츠": "#002561",
  "KIA 타이거즈": "#EA0029",
};

// ─── 시간 포맷 ────────────────────────────────────────
function fmtRelative(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  const hr = Math.floor(diff / 3600000);
  const day = Math.floor(diff / 86400000);
  if (min < 1) return "방금";
  if (min < 60) return `${min}분 전`;
  if (hr < 24) return `${hr}시간 전`;
  if (day < 7) return `${day}일 전`;
  return new Date(iso).toLocaleDateString("ko-KR", { month: "short", day: "numeric" });
}

// ─── 채팅방 아이템 ────────────────────────────────────
function RoomItem({ room, onClick }) {
  const color = TEAM_COLORS[room.crewTeam] || "#2563eb";
  const isGroup = room.roomType === "GROUP_JOIN" || room.roomType === "GROUP_CREW";

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
          <span style={s.roomLastMsg}>{room.lastMessage || "메시지가 없습니다."}</span>
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
  const [open, setOpen] = useState(false);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(false);
  const popupRef = useRef(null);

  // 총 읽지 않은 메시지 수
  const totalUnread = rooms.reduce((sum, r) => sum + (r.unreadCount || 0), 0);

  // 채팅방 목록 로드
  const loadRooms = async () => {
    try {
      setLoading(true);
      const res = await api.get("/chat/rooms");
      // BE 응답: { content: [...], ... } (PagedResponse)
      setRooms(res.data.data?.content || []);
    } catch (err) {
      console.error("[ChatFab] 채팅방 목록 조회 실패:", err);
    } finally {
      setLoading(false);
    }
  };

  // 컴포넌트 마운트 시 + 30초마다 갱신
  useEffect(() => {
    loadRooms();
    const interval = setInterval(loadRooms, 5000);
    return () => clearInterval(interval);
  }, []);

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
    setOpen(false);
    onOpenChat?.({
      id: room.chatRoomId,
      title: room.title,
      roomType: room.Type,
    });
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
            {loading ? (
              <div style={s.emptyChat}>
                <div style={{ color: "#6b7280", fontSize: "13px" }}>불러오는 중...</div>
              </div>
            ) : rooms.length === 0 ? (
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
        style={{ ...s.fab, transform: open ? "scale(0.92)" : "scale(1)" }}
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
  fabWrap: {
    position: "fixed",
    bottom: "88px",
    right: "20px",
    zIndex: 1000,
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-end",
    gap: "10px",
  },
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
  popupHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "16px 18px 12px",
    borderBottom: "1px solid rgba(255,255,255,0.06)",
    flexShrink: 0,
  },
  popupTitle: { fontSize: "15px", fontWeight: "700", color: "#f0f0f0" },
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
  roomList: { overflowY: "auto", flex: 1 },
  emptyChat: { textAlign: "center", padding: "40px 20px" },
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
  roomContent: { flex: 1, overflow: "hidden" },
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
  roomTime: { fontSize: "11px", color: "#4b5563", flexShrink: 0 },
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