import { useState, useEffect } from "react";
import CrewDetailPage from "./CrewDetailPage";
import { createOrGetCrewDmRoom, createOrGetDmByNickname } from "../api/chat";
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

const TEAM_CODE_MAP = {
  LG: 1, DU: 2, SSG: 3, KIA: 4, SA: 5,
  LO: 6, HH: 7, KT: 8, NC: 9, WO: 10,
};

const TEAM_CODE_TO_NAME = {
  LG: 'LG', DU: '두산', SSG: 'SSG', KIA: 'KIA',
  SA: '삼성', LO: '롯데', HH: '한화', KT: 'KT', NC: 'NC', WO: '키움',
};

// ─── 크루 카드 ───
function CrewCard({ crew, currentUser, onClick, onEdit, onDelete }) {
  const teamKey = crew.supportTeamName?.split(' ')[0] || "기타";
  const color = TEAM_COLORS[teamKey] || "#ef4b5f";
  const isFull = crew.currentParticipants >= crew.maxParticipants;
  const ratio = crew.currentParticipants / crew.maxParticipants;
  
  const isAuthor = currentUser?.nickname === crew.authorNickname;

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
          
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            {isAuthor && (
              <div style={{ display: "flex", gap: "4px" }}>
                <button 
                  onClick={(e) => { e.stopPropagation(); onEdit(crew); }} 
                  style={{ padding: "4px 8px", fontSize: "11px", borderRadius: "4px", border: "1px solid #ddd", background: "#f9f9f9", color: "#555", cursor: "pointer" }}
                >
                  수정
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); onDelete(crew); }} 
                  style={{ padding: "4px 8px", fontSize: "11px", borderRadius: "4px", border: "1px solid #ffcccc", background: "#fff5f5", color: "#d32f2f", cursor: "pointer" }}
                >
                  삭제
                </button>
              </div>
            )}
            <StatusBadge status={crew.status} />
          </div>
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
  const [crews, setCrews] = useState([]);
  const [selectedCrew, setSelectedCrew] = useState(null);
  const [filterTeam, setFilterTeam] = useState("ALL");
  const [filterStatus, setFilterStatus] = useState("ALL");
  
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingCrew, setEditingCrew] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchCrews = async () => {
    setLoading(true);
    try {
      const teamId = filterTeam === 'ALL' ? null : TEAM_CODE_MAP[filterTeam];
      const status = filterStatus === 'OPEN' ? 'OPEN' : null;

      const response = await api.get('/posts', {
        params: { boardType: 'CREW', teamId, status, page: 0, size: 10 }
      });
      const content = response.data?.data?.content ?? response.data?.content ?? [];
      setCrews(content);
    } catch (error) {
      console.warn("API 연동 실패");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCrews(); }, [filterTeam, filterStatus]);

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
    if (!currentUser) return alert('로그인이 필요합니다.');
    if (!onOpenChat) return;

    try {
      let room;
      if (targetNickname === selectedCrew?.authorNickname && selectedCrew?.id) {
        try {
          room = await createOrGetCrewDmRoom(selectedCrew.id, selectedCrew.authorId);
        } catch {
          room = await createOrGetDmByNickname(targetNickname);
        }
      } else {
        room = await createOrGetDmByNickname(targetNickname);
      }

      const roomId = room?.chatRoomId || room?.id;
      if (!roomId) throw new Error('채팅방 ID를 받지 못했습니다.');

      onOpenChat({ id: roomId, roomType: 'ONE_ON_ONE_DIRECT', title: targetNickname, isDm: true, dmTargetNickname: targetNickname });
    } catch (err) {
      alert('채팅방을 열 수 없습니다.');
    }
  };

  const handleEdit = (crew) => {
    setEditingCrew(crew);
  };

  // 💡 상세 페이지나 카드에서 모두 쓰이는 삭제 로직
  const handleDelete = async (crew) => {
    if (window.confirm("정말 이 모집글을 삭제하시겠습니까?")) {
      try {
        await api.delete(`/posts/${crew.id}`);
        alert("삭제가 완료되었습니다.");
        setView("list"); // 상세 페이지에서 삭제했을 경우를 대비해 목록으로 강제 전환
        fetchCrews();    // 목록 새로고침
      } catch (err) {
        alert("삭제에 실패했습니다. 다시 시도해주세요.");
      }
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
              {[{ id: "ALL", label: "전체 상태" }, { id: "OPEN", label: "모집 중" }, { id: "FULL", label: "마감" }].map(({ id, label }) => (
                <button
                  key={id} onClick={() => setFilterStatus(id)}
                  style={{
                    padding: "6px 14px", fontSize: "13px", fontWeight: "500", borderRadius: "18px", cursor: "pointer",
                    border: filterStatus === id ? "none" : "1px solid #eee", backgroundColor: filterStatus === id ? "#ef4b5f" : "#fff", color: filterStatus === id ? "#fff" : "#666",
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
                <div
                  onClick={() => {
                    if (!currentUser) return alert('로그인 후 이용 가능합니다.');
                    setIsCreateModalOpen(true);
                  }}
                  style={{ cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "220px", borderRadius: '16px', border: '2px dashed #ddd', backgroundColor: '#f9f9f9', transition: 'all 0.2s ease' }}
                >
                  <div style={{ fontSize: '40px', color: '#ef4b5f', marginBottom: '8px' }}>+</div>
                  <div style={{ fontSize: '14px', fontWeight: '700', color: '#888' }}>새 크루 만들기</div>
                </div>

                {filteredCrews.map(crew => (
                  <CrewCard 
                    key={crew.id} 
                    crew={crew} 
                    currentUser={currentUser} 
                    onClick={(c) => goTo("detail", c)} 
                    onEdit={handleEdit}      
                    onDelete={handleDelete}  
                  />
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

      {/* 상세 페이지 컴포넌트로 핸들러 넘겨주기 */}
      {view === "detail" && selectedCrew && (
        <CrewDetailPage
          crew={selectedCrew}
          currentUser={currentUser}
          onBack={() => setView("list")}
          onOpenDmChat={(nickname) => handleOpenDm(nickname)}
          onEdit={handleEdit}      // 상세페이지 안에 띄워질 수정 버튼용
          onDelete={handleDelete}  // 상세페이지 안에 띄워질 삭제 버튼용
        />
      )}

      {(isCreateModalOpen || editingCrew) && (
        <CreateCrewModal
          initialData={editingCrew}
          onClose={() => {
            setIsCreateModalOpen(false);
            setEditingCrew(null);
          }}
          onSubmit={async (formData) => {
            try {
              const payload = {
                boardType: 'CREW',
                title: formData.title,
                content: formData.content,
                matchDate: formData.matchDate,
                stadium: formData.stadium,
                supportTeamId: formData.teamId, 
                homeTeamId: formData.homeTeamId,
                awayTeamId: formData.awayTeamId,
                maxParticipants: formData.maxParticipants,
                maxMember: formData.maxParticipants, 
                isPublic: formData.isPublic,
              };

              if (editingCrew) {
                // 수정
                await api.put(`/posts/${editingCrew.id}`, payload);
                alert("성공적으로 수정되었습니다.");
                
                //수정 후 상세 페이지를 보고 있는 상태라면 데이터 바로 동기화 (새로고침 없이 내용 반영)
                if (selectedCrew?.id === editingCrew.id) {
                  setSelectedCrew(prev => ({ ...prev, ...payload }));
                }
              } else {
                // 작성
                await api.post('/posts', payload);
                alert('모집글이 등록되었습니다!');
              }

              setIsCreateModalOpen(false);
              setEditingCrew(null);
              fetchCrews(); // 리스트 갱신
            } catch (err) {
              alert(`처리 실패: ${err.response?.data?.message || err.message}`);
            }
          }}
        />
      )}
    </div>
  );
}