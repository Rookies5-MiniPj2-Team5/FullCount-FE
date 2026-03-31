// pages/CrewPage.jsx
// MeetupPage와 동일한 디자인 시스템 사용 (라이트 테마, className 기반)
//
// ■ 화면 전환 (탭 변경 없이 내부 view 상태로 관리)
//   "list"      → 크루 카드 목록
//   "detail"    → CrewDetailPage
//   "groupChat" → ChatPage (GROUP)
//   "dmChat"    → ChatPage (ONE_ON_ONE)
//
// ■ props
//   currentUser - { id, nickname }

import { useState } from "react";
import CrewDetailPage from "./CrewDetailPage";
import ChatPage from "./ChatPage";
import { StatusBadge } from "../components/StatusBadge";
import { TeamFilter } from "../components/TeamComponents";
import CreateCrewModal from "../components/CreateCrewModal";

// ─── 더미 데이터 ──────────────────────────────────────
// TODO: BE 연동 - GET /api/crews?team={team}&status={status}&page={page}&size=10
const DUMMY_CREWS = [
  {
    id: 1,
    title: "두산 홈 개막전 같이 가실 분!",
    team: "두산 베어스",
    stadium: "잠실야구장",
    matchDate: "2026-04-05",
    matchTime: "14:00",
    currentMembers: 3,
    maxMembers: 5,
    status: "OPEN",
    leaderId: 1,
    leaderNickname: "야구왕김철수",
    leaderBadge: "ALL_STAR",
    leaderMannerTemp: 38.2,
    seatArea: "3루 응원석",
    description: "두산 개막전 같이 직관할 분 모집합니다!\n3루 응원석에서 열심히 응원해요 ⚾\n치킨 + 맥주 같이 먹어요 🍺\n초보 환영, 직관 경험 없어도 돼요!",
    chatRoomId: 101,
    tags: ["초보환영", "맥주", "응원석"],
  },
  {
    id: 2,
    title: "LG 원정 직관 (고척) 함께해요",
    team: "LG 트윈스",
    stadium: "고척스카이돔",
    matchDate: "2026-04-12",
    matchTime: "17:00",
    currentMembers: 4,
    maxMembers: 4,
    status: "FULL",
    leaderId: 5,
    leaderNickname: "쌍둥이팬클럽",
    leaderBadge: "LEGEND",
    leaderMannerTemp: 41.0,
    seatArea: "1루 내야",
    description: "LG vs 키움 원정 직관! 내야석 4연석 확보했어요.",
    chatRoomId: 102,
    tags: ["내야석", "원정"],
  },
  {
    id: 3,
    title: "삼성 대구 직관 (KTX 같이 탈 분)",
    team: "삼성 라이온즈",
    stadium: "대구삼성라이온즈파크",
    matchDate: "2026-04-19",
    matchTime: "18:30",
    currentMembers: 1,
    maxMembers: 4,
    status: "OPEN",
    leaderId: 7,
    leaderNickname: "대구사자",
    leaderBadge: "PRO",
    leaderMannerTemp: 36.5,
    seatArea: "외야",
    description: "서울역 출발 KTX 같이 타고 대구 직관 가실 분!\n왕복 교통비 나눠요 🚅",
    chatRoomId: 103,
    tags: ["KTX", "외야", "대구"],
  },
];



const TEAM_COLORS = {
  "두산 베어스": "#1a1748",
  "LG 트윈스": "#C8102E",
  "SSG 랜더스": "#CE0E2D",
  "키움 히어로즈": "#820024",
  "KT 위즈": "#1b1a1a",
  "삼성 라이온즈": "#074CA1",
  "한화 이글스": "#F37321",
  "NC 다이노스": "#1D467A",
  "롯데 자이언츠": "#002561",
  "KIA 타이거즈": "#EA0029",
};

// ─── 크루 카드 ────────────────────────────────────────
function CrewCard({ crew, onClick }) {
  const color = TEAM_COLORS[crew.team] || "#e94560";
  const isFull = crew.currentMembers >= crew.maxMembers;
  const ratio = crew.currentMembers / crew.maxMembers;

  return (
    <div
      className="card"
      onClick={() => onClick(crew)} // 1. 여기서 부모의 goTo 함수를 호출합니다.
      style={{ cursor: "pointer", overflow: "hidden", padding: 0 }}
    >
      <div style={{ height: 4, background: color }} />
      <div style={{ padding: "16px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color, background: color + "15", border: `1px solid ${color}30`, padding: "3px 10px", borderRadius: 20 }}>
            {crew.team}
          </span>
          <StatusBadge status={crew.status} />
        </div>
        <div className="card-title" style={{ marginBottom: 8 }}>{crew.title}</div>
        <div className="card-meta" style={{ marginBottom: 12 }}>
          🏟️ {crew.stadium} · 📅 {crew.matchDate}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
          <div style={{ flex: 1, height: 6, background: "#f0f0f0", borderRadius: 999, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${ratio * 100}%`, background: isFull ? "#ef4444" : color, borderRadius: 999 }} />
          </div>
          <span style={{ fontSize: 12, color: "#888", fontWeight: 600 }}>👤 {crew.currentMembers}/{crew.maxMembers}명</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", gap: 6 }}>
            {crew.tags?.slice(0, 2).map((t) => (
              <span key={t} style={{ fontSize: 11, color: "#888", background: "#f5f5f5", padding: "2px 8px", borderRadius: 20 }}>#{t}</span>
            ))}
          </div>
          <div className="author-info" style={{ gap: 6 }}>
            <div className="avatar-sm">{crew.leaderNickname?.slice(0, 1)}</div>
            <div style={{ fontSize: 12, fontWeight: 700 }}>{crew.leaderNickname}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CrewPage({ currentUser }) {
  const [view, setView] = useState("list");
  const [selectedCrew, setSelectedCrew] = useState(null);
  const [filterTeam, setFilterTeam] = useState("ALL");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const crews = DUMMY_CREWS.filter((c) => {
    if (filterTeam !== "ALL" && c.team !== filterTeam) return false;
    if (filterStatus !== "ALL" && c.status !== filterStatus) return false;
    return true;
  });

  const goTo = (v, crew = null) => {
    if (crew) setSelectedCrew(crew);
    setView(v);
    window.scrollTo(0, 0); // 페이지 전환 시 상단으로 스크롤
  };

  // 2. 메인 리턴문 하나에서 삼항 연산자로 뷰를 제어하는 것이 가장 안전합니다.
  return (
    <div className="meetup-page">
      {view === "list" && (
        <>
          <div className="page-header">
            <h2 className="page-title">직관 크루 모집</h2>
            <p className="page-subtitle">함께 야구장에 갈 크루를 찾아보세요!</p>
          </div>

          <div style={{ background: '#fff', padding: '20px 24px', borderRadius: '12px', marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
            <TeamFilter selected={filterTeam} onChange={setFilterTeam} />
            <div style={{ display: 'flex', gap: '8px' }}>
              {["ALL", "OPEN", "FULL"].map((id) => (
                <button
                  key={id}
                  onClick={() => setFilterStatus(id)}
                  style={{
                    padding: "6px 14px", fontSize: "13px", fontWeight: "500", borderRadius: "18px",
                    cursor: "pointer", border: filterStatus === id ? "none" : "1px solid #eee",
                    backgroundColor: filterStatus === id ? "#ef4b5f" : "#fff",
                    color: filterStatus === id ? "#fff" : "#666",
                  }}
                >
                  {id === "ALL" ? "전체 상태" : id === "OPEN" ? "모집 중" : "마감"}
                </button>
              ))}
            </div>
          </div>

          <div className="page-content">
            <div className="card-grid">
              {crews.map((crew) => (
                <CrewCard key={crew.id} crew={crew} onClick={(c) => goTo("detail", c)} />
              ))}
              
              <div 
                onClick={() => setIsCreateModalOpen(true)}
                style={{
                  cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                  minHeight: "220px", borderRadius: '16px', border: '2px dashed #ddd', backgroundColor: '#f9f9f9', transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#ef4b5f'; e.currentTarget.style.backgroundColor = '#fff5f6'; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#ddd'; e.currentTarget.style.backgroundColor = '#f9f9f9'; }}
              >
                <div style={{ fontSize: '40px', color: '#ef4b5f', marginBottom: '8px' }}>+</div>
                <div style={{ fontSize: '14px', fontWeight: '700', color: '#888' }}>새 크루 만들기</div>
              </div>
            </div>
          </div>
        </>
      )}

      {view === "detail" && selectedCrew && (
        <CrewDetailPage
          crew={selectedCrew}
          currentUserId={currentUser?.id}
          onBack={() => setView("list")}
          onOpenDmChat={(crew) => goTo("dmChat", crew)}
        />
      )}

      {view === "dmChat" && selectedCrew && (
        <ChatPage
          crew={selectedCrew}
          roomType="ONE_ON_ONE"
          currentUser={currentUser}
          isDm={true}
          dmTargetNickname={selectedCrew.leaderNickname}
          onBack={() => setView("detail")}
        />
      )}

      {isCreateModalOpen && (
        <CreateCrewModal
          onClose={() => setIsCreateModalOpen(false)}
          onSubmit={async (formData) => {
            console.log("크루 생성:", formData);
            setIsCreateModalOpen(false);
          }}
        />
      )}
    </div>
  );
}