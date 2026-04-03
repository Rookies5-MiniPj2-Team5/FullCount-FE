import { useState, useEffect } from "react";
import CrewDetailPage from "./CrewDetailPage";
import { createOrGetCrewDmRoom, createOrGetDmByNickname } from "../api/chat";
import ChatPage from "./ChatPage";
import { StatusBadge } from "../components/StatusBadge";
import { TeamFilter, TEAMS } from "../components/TeamComponents";
import CreateCrewModal from "../components/CreateCrewModal";
import api from '../api/api';

const TEAM_COLORS = {
  "두산": "#1a1748", "LG": "#C8102E", "SSG": "#CE0E2D",
  "키움": "#820024", "KT": "#1b1a1a", "삼성": "#074CA1",
  "한화": "#F37321", "NC": "#1D467A", "롯데": "#002561",
  "KIA": "#EA0029",
};

// ✅ 팀 코드 → BE teamId 매핑 (GET /api/teams 응답 기준)
const TEAM_CODE_MAP = {
  LG: 1, DU: 2, SSG: 3, KIA: 4, SA: 5,
  LO: 6, HH: 7, KT: 8, NC: 9, WO: 10,
};

// ✅ 팀 코드 → 팀 표시명 매핑 (클라이언트 필터용)
const TEAM_CODE_TO_NAME = {
  LG: 'LG', DU: '두산', SSG: 'SSG', KIA: 'KIA',
  SA: '삼성', LO: '롯데', HH: '한화', KT: 'KT', NC: 'NC', WO: '키움',
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ✂️  더미 데이터 시작 — BE 연동 완료 후 아래 블록 전체 삭제
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const DUMMY_RESPONSE = [
  // 팀 필터 테스트: LG (OPEN)
  { id: 1, authorId: 101, authorNickname: "야구팬1",   title: "잠실 LG 직관 크루 구합니다!",      content: "같이 응원해요! 초보 환영 ⚾",      boardType: "CREW", status: "OPEN",   supportTeamName: "LG 트윈스",    maxParticipants: 4, currentParticipants: 1, stadium: "잠실야구장",             matchDate: "2026-04-05", matchTime: "18:30" },
  // 팀 필터 테스트: LG (FULL - 마감 필터 테스트)
  { id: 2, authorId: 102, authorNickname: "트윈스킹",  title: "LG 홈경기 응원단 모집 (마감)",      content: "인원이 다 찼어요!",               boardType: "CREW", status: "OPEN",   supportTeamName: "LG 트윈스",    maxParticipants: 3, currentParticipants: 3, stadium: "잠실야구장",             matchDate: "2026-04-07", matchTime: "14:00" },
  // 팀 필터 테스트: SSG
  { id: 3, authorId: 103, authorNickname: "홈런왕",    title: "문학 SSG 원정 크루 모집",          content: "원정 응원 가실 분?",              boardType: "CREW", status: "OPEN",   supportTeamName: "SSG 랜더스",   maxParticipants: 3, currentParticipants: 2, stadium: "인천 SSG 랜더스필드",   matchDate: "2026-04-10", matchTime: "18:30" },
  // 팀 필터 테스트: 삼성
  { id: 4, authorId: 104, authorNickname: "사자팬",    title: "대구 라팍 삼성 직관 크루!",        content: "치맥 같이 먹으면서 봐요.",        boardType: "CREW", status: "OPEN",   supportTeamName: "삼성 라이온즈", maxParticipants: 6, currentParticipants: 2, stadium: "대구 삼성 라이온즈 파크", matchDate: "2026-04-12", matchTime: "14:00" },
  // 팀 필터 테스트: 두산
  { id: 5, authorId: 105, authorNickname: "곰팬이에요", title: "두산 개막전 같이 가요!",           content: "3루 응원석 자리 있어요 🐻",       boardType: "CREW", status: "OPEN",   supportTeamName: "두산 베어스",   maxParticipants: 5, currentParticipants: 3, stadium: "잠실야구장",             matchDate: "2026-04-05", matchTime: "18:30" },
  // 팀 필터 테스트: KIA
  { id: 6, authorId: 106, authorNickname: "호랑이",    title: "광주 KIA 직관 크루 모집 중",       content: "챔피언스필드 같이 가요!",         boardType: "CREW", status: "OPEN",   supportTeamName: "KIA 타이거즈",  maxParticipants: 4, currentParticipants: 1, stadium: "광주-기아 챔피언스 필드",  matchDate: "2026-04-15", matchTime: "18:00" },
  // 상태 필터 테스트: 마감된 크루 (두산)
  { id: 7, authorId: 107, authorNickname: "직관고수",  title: "두산 원정 크루 (마감됨)",          content: "인원이 모두 찼습니다!",           boardType: "CREW", status: "CLOSED", supportTeamName: "두산 베어스",   maxParticipants: 4, currentParticipants: 4, stadium: "잠실야구장",             matchDate: "2026-04-08", matchTime: "18:30" },
  // 팀 필터 테스트: 한화
  { id: 8, authorId: 108, authorNickname: "독수리팬",  title: "한화 이글스파크 직관 모집",        content: "대전까지 같이 가요! 🦅",         boardType: "CREW", status: "OPEN",   supportTeamName: "한화 이글스",   maxParticipants: 5, currentParticipants: 2, stadium: "한화생명이글스파크",        matchDate: "2026-04-20", matchTime: "14:00" },
  // 팀 필터 테스트: 롯데
  { id: 9, authorId: 109, authorNickname: "갈매기",    title: "사직 롯데 직관 크루 모집",         content: "부산 직관 같이 가실 분!",         boardType: "CREW", status: "OPEN",   supportTeamName: "롯데 자이언츠",  maxParticipants: 6, currentParticipants: 4, stadium: "사직야구장",             matchDate: "2026-04-18", matchTime: "18:30" },
];
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ✂️  더미 데이터 끝
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// ─── 크루 카드 ───
function CrewCard({ crew, onClick }) {
  const teamKey = crew.supportTeamName?.split(' ')[0] || "기타";
  const color = TEAM_COLORS[teamKey] || "#ef4b5f";
  const isFull = crew.currentParticipants >= crew.maxParticipants;
  const ratio = crew.currentParticipants / crew.maxParticipants;

  return (
    <div
      className="card"
      onClick={() => onClick(crew)}
      style={{ cursor: "pointer", overflow: "hidden", padding: 0, backgroundColor: '#fff', borderRadius: '16px', border: '1px solid #eee', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
    >
      <div style={{ height: 4, background: color }} />
      <div style={{ padding: "20px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <span style={{ fontSize: '11px', fontWeight: '800', color, background: color + "15", border: `1px solid ${color}30`, padding: "4px 10px", borderRadius: '12px' }}>
            {crew.supportTeamName}
          </span>
          <StatusBadge status={crew.status} />
        </div>
        <div style={{ marginBottom: 10, fontSize: '16px', fontWeight: '800', color: '#222' }}>{crew.title}</div>
        <div style={{ marginBottom: 16, display: 'flex', gap: 10, fontSize: '12px', color: '#999' }}>
          <span>🏟️ {crew.stadium}</span>
          <span>📅 {crew.matchDate}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
          <div style={{ flex: 1, height: 4, background: "#f5f5f5", borderRadius: 999, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${ratio * 100}%`, background: isFull ? "#ccc" : color, borderRadius: 999, transition: "width 0.3s ease" }} />
          </div>
          <span style={{ fontSize: 12, color: "#666", fontWeight: 700 }}>👤 {crew.currentParticipants}/{crew.maxParticipants}명</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 28, height: 28, borderRadius: '50%', backgroundColor: color, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 'bold' }}>
            {crew.authorNickname?.slice(0, 1)}
          </div>
          <div style={{ fontSize: "13px", fontWeight: "700", color: "#333" }}>{crew.authorNickname}</div>
        </div>
      </div>
    </div>
  );
}

// ─── 크루 페이지 메인 ───
export default function CrewPage({ currentUser, onOpenChat }) {
  const [view, setView] = useState("list");
  const [crews, setCrews] = useState(DUMMY_RESPONSE);
  const [selectedCrew, setSelectedCrew] = useState(null);
  const [filterTeam, setFilterTeam] = useState("ALL");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchCrews = async () => {
    setLoading(true);
    try {
      // ✅ 팀 코드 → 숫자 teamId 변환
      const teamId = filterTeam === 'ALL' ? null : TEAM_CODE_MAP[filterTeam];
      // ✅ BE PostStatus enum: OPEN | RESERVED | CLOSED
      // FULL은 BE에 없으므로 API에는 보내지 않고 클라이언트에서 필터링
      const status = filterStatus === 'OPEN' ? 'OPEN' : null;

      const response = await api.get('/posts', {
        params: {
          boardType: 'CREW',
          teamId,
          status,
          page: 0,
          size: 10
        }
      });
      const content = response.data?.data?.content ?? response.data?.content ?? [];
      setCrews(content);
    } catch (error) {
      console.warn("API 연동 실패: 더미 데이터 유지");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCrews();
  }, [filterTeam, filterStatus]);

  // ✅ 클라이언트 사이드 필터링 (BE 필터 보조)
  const filteredCrews = crews.filter(crew => {
    if (filterTeam !== 'ALL') {
      const teamName = crew.supportTeamName || '';
      const filterName = TEAM_CODE_TO_NAME[filterTeam] || '';
      if (!teamName.includes(filterName)) return false;
    }
    if (filterStatus === 'OPEN' && crew.status !== 'OPEN') return false;
    if (filterStatus === 'FULL' && crew.currentParticipants < crew.maxParticipants) return false;
    return true;
  });

  const handleOpenDm = async (targetNickname) => {
    if (!currentUser) {
      alert('로그인이 필요합니다.');
      return;
    }
    if (!onOpenChat) return;

    try {
      let room;

      // 크루장에게 문의 → crewId 기반 엔드포인트 우선 (authorId로 폴백)
      if (targetNickname === selectedCrew?.authorNickname && selectedCrew?.id) {
        try {
          room = await createOrGetCrewDmRoom(selectedCrew.id, selectedCrew.authorId);
        } catch {
          // crewId 기반 실패 시 닉네임으로 폴백
          console.warn('[Crew] crewId 기반 DM 실패 - 닉네임으로 폴백:', targetNickname);
          room = await createOrGetDmByNickname(targetNickname);
        }
      } else {
        // 일반 멤버 → 닉네임으로 직접 조회
        room = await createOrGetDmByNickname(targetNickname);
      }

      const roomId = room?.chatRoomId || room?.id;
      if (!roomId) throw new Error('채팅방 ID를 받지 못했습니다.');

      onOpenChat({
        id: roomId,
        roomType: 'ONE_ON_ONE_DIRECT',
        title: targetNickname,
        isDm: true,
        dmTargetNickname: targetNickname,
      });
    } catch (err) {
      console.error('채팅방 생성 실패:', err);
      alert('채팅방을 열 수 없습니다.');
    }
  };

  const goTo = (v, crew = null) => {
    if (crew) setSelectedCrew(crew);
    setView(v);
    window.scrollTo(0, 0);
  };

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
              {[
                { id: "ALL",  label: "전체 상태" },
                { id: "OPEN", label: "모집 중" },
                { id: "FULL", label: "마감" },
              ].map(({ id, label }) => (
                <button
                  key={id}
                  onClick={() => setFilterStatus(id)}
                  style={{
                    padding: "6px 14px", fontSize: "13px", fontWeight: "500",
                    borderRadius: "18px", cursor: "pointer",
                    border: filterStatus === id ? "none" : "1px solid #eee",
                    backgroundColor: filterStatus === id ? "#ef4b5f" : "#fff",
                    color: filterStatus === id ? "#fff" : "#666",
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="page-content">
            {loading ? (
              <div style={{ textAlign: 'center', padding: '40px' }}>로딩 중...</div>
            ) : (
              <div className="card-grid">
                {/* 새 크루 만들기 카드 */}
                <div
                  onClick={() => {
                    if (!currentUser) {
                      alert('로그인 후 이용 가능합니다.');
                      return;
                    }
                    setIsCreateModalOpen(true);
                  }}
                  style={{ cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "220px", borderRadius: '16px', border: '2px dashed #ddd', backgroundColor: '#f9f9f9', transition: 'all 0.2s ease' }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#ef4b5f'; e.currentTarget.style.backgroundColor = '#fff5f6'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#ddd'; e.currentTarget.style.backgroundColor = '#f9f9f9'; }}
                >
                  <div style={{ fontSize: '40px', color: '#ef4b5f', marginBottom: '8px' }}>+</div>
                  <div style={{ fontSize: '14px', fontWeight: '700', color: '#888' }}>새 크루 만들기</div>
                </div>

                {/* ✅ 클라이언트 필터 적용된 목록 */}
                {filteredCrews.map(crew => (
                  <CrewCard key={crew.id} crew={crew} onClick={(c) => goTo("detail", c)} />
                ))}

                {filteredCrews.length === 0 && !loading && (
                  <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px', color: '#999' }}>
                    <div style={{ fontSize: 40, marginBottom: 12 }}>⚾</div>
                    <p>해당 조건의 크루가 없습니다.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      )}

      {view === "detail" && selectedCrew && (
        <CrewDetailPage
          crew={selectedCrew}
          currentUser={currentUser}
          onBack={() => setView("list")}
          onOpenDmChat={(nickname) => handleOpenDm(nickname)}
        />


      )}

      {isCreateModalOpen && (
        <CreateCrewModal
          onClose={() => setIsCreateModalOpen(false)}
          onSubmit={async (formData) => {
            try {
              const payload = {
                boardType: 'CREW',
                title: formData.title,
                content: formData.content,
                matchDate: formData.matchDate,
                stadium: formData.stadium,
                supportTeamId: formData.teamId, // 백엔드 필수 필드 반영
                homeTeamId: formData.teamId,
                awayTeamId: formData.teamId,
                maxParticipants: formData.maxParticipants,
                maxMember: formData.maxParticipants, // 백엔드 필드명 확인용 중복 전송
                isPublic: formData.isPublic,
              };
              const res = await api.post('/posts', payload);
              const newId = res.data?.data?.id || res.data?.id;

              setIsCreateModalOpen(false);
              fetchCrews();

              if (newId) {
                alert('모집글이 등록되었습니다!');
                // 상세 페이지로 자동 이동 (필요한 최소 정보를 담아 이동)
                goTo("detail", { 
                  id: newId, 
                  ...payload, 
                  authorNickname: currentUser?.nickname,
                  currentParticipants: 1 
                });
              } else {
                alert('모집글이 등록되었습니다!');
              }
            } catch (err) {
              console.error("Crew creation error:", err);
              const errMsg = err.response?.data?.message || "입력 정보를 다시 확인해주세요.";
              alert(`생성 실패: ${errMsg}`);
            }
          }}
        />
      )}
    </div>
  );
}