import { useState, useEffect, useMemo } from 'react'
import { useAuth } from '../context/AuthContext'
import { TeamFilter, TEAMS } from '../components/TeamComponents'
import { StatusBadge } from "../components/StatusBadge"
import api from '../api/api'

// 팀별 컬러 정의 (디자인 포인트)
const TEAM_COLORS = {
  "두산": "#1a1748", "LG": "#C8102E", "SSG": "#CE0E2D",
  "키움": "#820024", "KT": "#1b1a1a", "삼성": "#074CA1",
  "한화": "#F37321", "NC": "#1D467A", "롯데": "#002561",
  "KIA": "#EA0029",
};

// ─── 컴포넌트: 모집 카드 ───────────────────────────────────────────
function MeetupCard({ post, user, onClick, onDelete }) {
  const color = TEAM_COLORS[post.teamName] || "#ef4b5f";
  const isFull = (post.currentCount || 0) >= (post.maxParticipants || 1);
  const ratio = (post.currentCount || 0) / (post.maxParticipants || 1);

  return (
    <div
      className="card"
      onClick={() => onClick(post.id)}
      style={{
        cursor: "pointer", overflow: "hidden", padding: 0, backgroundColor: '#fff',
        borderRadius: '16px', border: '1px solid #eee', boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
      }}
    >
      <div style={{ height: 4, background: color }} />
      <div style={{ padding: "20px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <span style={{ fontSize: '11px', fontWeight: '800', color: color, background: color + "15", border: `1px solid ${color}30`, padding: "4px 10px", borderRadius: '12px' }}>
            {post.teamName}
          </span>
          <StatusBadge status={post.status} />
        </div>
        <div style={{ marginBottom: 10, fontSize: '16px', fontWeight: '800', color: '#222' }}>{post.title}</div>
        <div style={{ marginBottom: 16, display: 'flex', gap: 10, fontSize: '12px', color: '#999' }}>
          <span>🏟️ {post.stadium}</span>
          <span>📅 {post.matchDate}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
          <div style={{ flex: 1, height: 4, background: "#f5f5f5", borderRadius: 999, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${ratio * 100}%`, background: isFull ? "#ccc" : color, borderRadius: 999, transition: "width 0.3s ease" }} />
          </div>
          <span style={{ fontSize: 12, color: "#666", fontWeight: 700 }}>👤 {post.currentCount}/{post.maxParticipants}명</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', backgroundColor: color, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 'bold' }}>
              {post.authorNickname?.slice(0, 1)}
            </div>
            <div style={{ fontSize: "13px", fontWeight: "700", color: "#333" }}>{post.authorNickname}</div>
          </div>
          {user?.nickname === post.authorNickname && (
            <button onClick={(e) => { e.stopPropagation(); onDelete(post.id); }} style={{ background: 'none', border: 'none', color: '#ff4d4f', fontSize: '11px', cursor: 'pointer', fontWeight: 'bold' }}>삭제</button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── 메인 페이지 컴포넌트 ────────────────────────────────────────────
export default function MeetupPage({ onSelectPost, initialOpen }) {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [filterTeam, setFilterTeam] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [isModalOpen, setIsModalOpen] = useState(initialOpen || false);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({ title: '', content: '', matchDate: '', homeTeamId: '', awayTeamId: '', maxParticipants: 2 });

  // API 서버 데이터 로드
  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true);
      try {
        const response = await api.get('/api/posts'); // BE 엔드포인트에 맞춰 수정
        setPosts(response.data);
      } catch (error) {
        console.error("데이터 로드 실패:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchPosts();
  }, []);

  const filtered = useMemo(() => {
    const safePosts = Array.isArray(posts) ? posts : [];
    return safePosts.filter(p => {
      const teamMatch = filterTeam === 'ALL' || p.homeTeamName === filterTeam || p.awayTeamName === filterTeam || p.teamName === filterTeam;
      const statusMatch = filterStatus === 'ALL' || p.status === filterStatus;
      return teamMatch && statusMatch;
    });
  }, [posts, filterTeam, filterStatus]);

  const handleDelete = async (postId) => {
    if (!window.confirm('정말 삭제하시겠습니까?')) return;
    try {
      await api.delete(`/api/posts/${postId}`);
      setPosts(posts.filter(p => p.id !== postId));
    } catch (error) { alert('삭제에 실패했습니다.'); }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post('/api/posts', formData);
      setPosts([response.data, ...posts]);
      setIsModalOpen(false);
      alert('모집글이 등록되었습니다!');
    } catch (error) { alert('등록 실패!'); }
  };

  return (
    <div className="meetup-page">
      <div className="page-header">
        <h2 className="page-title">직관 메이트 모집</h2>
        <p className="page-subtitle">함께 야구장에 갈 직관 메이트를 찾아보세요!</p>
      </div>

      {/* 필터 섹션 */}
      <div style={{ background: '#fff', padding: '20px 24px', borderRadius: '12px', marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
        <TeamFilter selected={filterTeam} onChange={setFilterTeam} />
        <div style={{ display: 'flex', gap: '8px' }}>
          {["ALL", "OPEN", "FULL"].map((id) => (
            <button key={id} onClick={() => setFilterStatus(id)} style={{ padding: "6px 14px", fontSize: "13px", fontWeight: "500", borderRadius: "18px", cursor: "pointer", border: filterStatus === id ? "none" : "1px solid #eee", backgroundColor: filterStatus === id ? "#ef4b5f" : "#fff", color: filterStatus === id ? "#fff" : "#666" }}>
              {id === "ALL" ? "전체 상태" : id === "OPEN" ? "모집 중" : "마감"}
            </button>
          ))}
        </div>
      </div>

      {/* 카드 그리드 */}
      <div className="page-content">
        <div className="card-grid">
          {filtered.map(post => (
            <MeetupCard key={post.id} post={post} user={user} onClick={onSelectPost} onDelete={handleDelete} />
          ))}

          {/* ✅ 카드 형태의 새 글 작성 버튼 (CrewPage와 통일) */}
          <div 
            onClick={() => setIsModalOpen(true)}
            style={{
              cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
              minHeight: "220px", borderRadius: '16px', border: '2px dashed #ddd', backgroundColor: '#f9f9f9', transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#ef4b5f'; e.currentTarget.style.backgroundColor = '#fff5f6'; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#ddd'; e.currentTarget.style.backgroundColor = '#f9f9f9'; }}
          >
            <div style={{ fontSize: '40px', color: '#ef4b5f', marginBottom: '8px' }}>+</div>
            <div style={{ fontSize: '14px', fontWeight: '700', color: '#888' }}>새 모집글 작성</div>
          </div>
        </div>
      </div>

      {/* 모달 영역 */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)} style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 400, padding: 24 }}>
            <h3 style={{ marginBottom: 20 }}>직관 메이트 모집</h3>
            <form onSubmit={handleCreate}>
              <input placeholder="제목" style={{ width: '100%', marginBottom: 12, borderRadius: 8, padding: 10, border: '1px solid #ddd' }} value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} required />
              <textarea placeholder="내용" style={{ width: '100%', height: 100, marginBottom: 12, borderRadius: 8, padding: 10, border: '1px solid #ddd' }} value={formData.content} onChange={e => setFormData({ ...formData, content: e.target.value })} required />
              <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                <select style={{ flex: 1, padding: 8, borderRadius: 8, border: '1px solid #ddd' }} value={formData.homeTeamId} onChange={e => setFormData({ ...formData, homeTeamId: e.target.value })} required>
                  <option value="">홈 팀</option>
                  {TEAMS.filter(t => t.id !== 'ALL').map((t, i) => <option key={t.id} value={i + 1}>{t.name}</option>)}
                </select>
                <select style={{ flex: 1, padding: 8, borderRadius: 8, border: '1px solid #ddd' }} value={formData.awayTeamId} onChange={e => setFormData({ ...formData, awayTeamId: e.target.value })} required>
                  <option value="">어웨이</option>
                  {TEAMS.filter(t => t.id !== 'ALL').map((t, i) => <option key={t.id} value={i + 1}>{t.name}</option>)}
                </select>
              </div>
              <input type="date" style={{ width: '100%', marginBottom: 20, padding: 8, borderRadius: 8, border: '1px solid #ddd' }} value={formData.matchDate} onChange={e => setFormData({ ...formData, matchDate: e.target.value })} required />
              <div style={{ display: 'flex', gap: 10 }}>
                <button type="submit" style={{ flex: 1, padding: 12, background: '#ef4b5f', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}>등록</button>
                <button type="button" onClick={() => setIsModalOpen(false)} style={{ flex: 1, padding: 12, background: '#eee', border: 'none', borderRadius: 8, cursor: 'pointer' }}>취소</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}