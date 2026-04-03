import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { TeamFilter, TEAMS } from '../components/TeamComponents'
import { StatusBadge } from "../components/StatusBadge"
import api from '../api/api'

const TEAM_COLORS = {
  "두산": "#1a1748", "LG": "#C8102E", "SSG": "#CE0E2D",
  "키움": "#820024", "KT": "#1b1a1a", "삼성": "#074CA1",
  "한화": "#F37321", "NC": "#1D467A", "롯데": "#002561",
  "KIA": "#EA0029",
};

// 팀 코드 → BE teamId 매핑 (설계서 기준 숫자 ID)
const TEAM_CODE_MAP = {
  LG: 1, DU: 2, SSG: 3, KIA: 4, SA: 5,
  LO: 6, HH: 7, KT: 8, NC: 9, WO: 10,
};

const ID_TO_TEAM_NAME = {
  1: "LG", 2: "두산", 3: "SSG", 4: "KIA", 5: "삼성",
  6: "롯데", 7: "한화", 8: "KT", 9: "NC", 10: "키움"
};

// 🚨 구단별 홈 구장 매핑 데이터 (숫자 ID와 영어 ID 모두 지원)
const STADIUMS = {
  1: '잠실야구장', 2: '잠실야구장', 3: '인천 SSG 랜더스필드', 4: '광주-기아 챔피언스 필드',
  5: '대구 삼성 라이온즈 파크', 6: '사직야구장', 7: '한화생명 이글스 파크', 8: '수원 KT 위즈 파크',
  9: '창원 NC 파크', 10: '고척 스카이돔',
  LG: '잠실야구장', DU: '잠실야구장', SSG: '인천 SSG 랜더스필드', KIA: '광주-기아 챔피언스 필드',
  SA: '대구 삼성 라이온즈 파크', LO: '사직야구장', HH: '한화생명 이글스 파크', KT: '수원 KT 위즈 파크',
  NC: '창원 NC 파크', WO: '고척 스카이돔'
};

const getNormalizedTeamName = (id, name) => {
    if (id && ID_TO_TEAM_NAME[id]) return ID_TO_TEAM_NAME[id];
    if (typeof name === 'string') {
        if (name.includes('LG')) return 'LG';
        if (name.includes('두산') || name === 'DU') return '두산';
        if (name.includes('SSG')) return 'SSG';
        if (name.includes('KIA') || name.includes('기아')) return 'KIA';
        if (name.includes('삼성') || name === 'SA') return '삼성';
        if (name.includes('롯데') || name === 'LO') return '롯데';
        if (name.includes('한화') || name === 'HH') return '한화';
        if (name.includes('KT')) return 'KT';
        if (name.includes('NC')) return 'NC';
        if (name.includes('키움') || name === 'WO') return '키움';
    }
    return "미정";
};

function MeetupCard({ post, user, onClick, onDelete }) {
  const homeTeam = getNormalizedTeamName(post.homeTeamId, post.homeTeamName);
  const awayTeam = getNormalizedTeamName(post.awayTeamId, post.awayTeamName);
  
  const homeColor = TEAM_COLORS[homeTeam] || "#ef4b5f";
  const awayColor = TEAM_COLORS[awayTeam] || "#666";
  
  const isFull = (post.currentParticipants || 0) >= (post.maxParticipants || 1);
  const ratio = (post.currentParticipants || 0) / (post.maxParticipants || 1);

  return (
    <div className="card" onClick={() => onClick(post.id)} style={{ cursor: "pointer", overflow: "hidden", padding: 0, backgroundColor: '#fff', borderRadius: '16px', border: '1px solid #eee', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
      <div style={{ height: 4, background: homeColor }} />
      <div style={{ padding: "20px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '10px', fontWeight: '800', color: homeColor, background: homeColor + "15", border: `1px solid ${homeColor}30`, padding: "3px 8px", borderRadius: '8px' }}>
              {homeTeam}
            </span>
            <span style={{ fontSize: '10px', fontWeight: '700', color: '#ccc' }}>VS</span>
            <span style={{ fontSize: '10px', fontWeight: '800', color: awayColor, background: awayColor + "15", border: `1px solid ${awayColor}30`, padding: "3px 8px", borderRadius: '8px' }}>
              {awayTeam}
            </span>
          </div>
          <StatusBadge status={post.status} />
        </div>
        <div style={{ marginBottom: 10, fontSize: '16px', fontWeight: '800', color: '#222' }}>{post.title}</div>
        <div style={{ marginBottom: 16, display: 'flex', gap: 10, fontSize: '12px', color: '#999' }}>
          <span>🏟️ {post.stadium || "경기장 미정"}</span>
          <span>📅 {post.matchDate}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
          <div style={{ flex: 1, height: 4, background: "#f5f5f5", borderRadius: 999, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${ratio * 100}%`, background: isFull ? "#ccc" : homeColor, borderRadius: 999, transition: "width 0.3s ease" }} />
          </div>
          <span style={{ fontSize: 12, color: "#666", fontWeight: 700 }}>👤 {post.currentParticipants || 0}/{post.maxParticipants || 1}명</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', backgroundColor: homeColor, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 'bold' }}>
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

export default function MeetupPage({ onSelectPost, initialOpen }) {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [filterTeam, setFilterTeam] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [isModalOpen, setIsModalOpen] = useState(initialOpen || false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ title: '', content: '', matchDate: '', homeTeamId: '', awayTeamId: '', maxParticipants: 2 });

  const fetchMates = async () => {
    setLoading(true);
    try {
      const selectedTeamId = filterTeam === 'ALL' ? null : TEAM_CODE_MAP[filterTeam];
      const status = filterStatus === 'OPEN' ? 'OPEN' : null;

      const response = await api.get('/posts', {
        params: { 
          boardType: 'MATE', teamId: selectedTeamId, homeTeamId: selectedTeamId, awayTeamId: selectedTeamId, status, page: 0, size: 9 
        }
      });

      const responseData = response.data;
      let postsArray = [];

      if (responseData?.success && responseData?.data?.content) postsArray = responseData.data.content;
      else if (responseData?.data?.content) postsArray = responseData.data.content;
      else if (responseData?.content) postsArray = responseData.content;
      else if (Array.isArray(responseData?.data)) postsArray = responseData.data;

      setPosts(postsArray);
    } catch (err) {
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMates();
  }, [filterTeam, filterStatus]);

  const filteredPosts = posts.filter(post => {
    if (filterTeam !== 'ALL') {
      const targetId = TEAM_CODE_MAP[filterTeam];
      const isIdMatch = post.homeTeamId === targetId || post.awayTeamId === targetId;
      const filterName = TEAMS.find(t => t.id === filterTeam)?.name || '';
      const isNameMatch = (post.homeTeamName || '').includes(filterName) || (post.awayTeamName || '').includes(filterName) || (post.supportTeamName || '').includes(filterName);
      if (!isIdMatch && !isNameMatch) return false;
    }
    if (filterStatus === 'FULL') {
      if ((post.currentParticipants || 0) < (post.maxParticipants || 1)) return false;
    }
    return true;
  });

  // 동일 팀 선택 방지 로직
  const handleTeamChange = (type, value) => {
      if (type === 'home' && value === formData.awayTeamId && value !== '') {
          alert('홈 팀과 어웨이 팀은 같을 수 없습니다.');
          return;
      }
      if (type === 'away' && value === formData.homeTeamId && value !== '') {
          alert('홈 팀과 어웨이 팀은 같을 수 없습니다.');
          return;
      }
      setFormData({ ...formData, [type === 'home' ? 'homeTeamId' : 'awayTeamId']: value });
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (formData.homeTeamId && formData.homeTeamId === formData.awayTeamId) {
      alert('홈 팀과 어웨이 팀은 같을 수 없습니다!');
      return;
    }
    try {
      // 🚨 홈 경기장 자동 설정
      const autoStadium = STADIUMS[formData.homeTeamId] || "경기장 미정";
      const payload = {
        boardType: 'MATE',
        ...formData,
        stadium: autoStadium, 
        homeTeamId: TEAM_CODE_MAP[formData.homeTeamId] || formData.homeTeamId,
        awayTeamId: TEAM_CODE_MAP[formData.awayTeamId] || formData.awayTeamId,
      };

      await api.post('/posts', payload);
      setIsModalOpen(false);
      setFormData({ title: '', content: '', matchDate: '', homeTeamId: '', awayTeamId: '', maxParticipants: 2 });
      fetchMates();
      alert('모집글이 성공적으로 등록되었습니다!');
    } catch (err) {
      alert('등록 실패');
    }
  };

  const handleDelete = async (postId) => {
    if (!window.confirm('정말 삭제하시겠습니까?')) return;
    try {
      await api.delete(`/posts/${postId}`);
      fetchMates();
    } catch (err) {
      alert("삭제 실패");
    }
  };

  return (
    <div className="meetup-page">
      <div className="page-header">
        <h2 className="page-title">직관 메이트 모집</h2>
        <p className="page-subtitle">함께 야구장에 갈 직관 메이트를 찾아보세요!</p>
      </div>

      <div style={{ background: '#fff', padding: '20px 24px', borderRadius: '12px', marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
        <TeamFilter selected={filterTeam} onChange={setFilterTeam} />
        <div style={{ display: 'flex', gap: '8px' }}>
          {[{ id: "ALL", label: "전체 상태" }, { id: "OPEN", label: "모집 중" }, { id: "FULL", label: "마감" }].map(({ id, label }) => (
            <button key={id} onClick={() => setFilterStatus(id)} style={{ padding: "6px 14px", fontSize: "13px", fontWeight: "500", borderRadius: "18px", cursor: "pointer", border: filterStatus === id ? "none" : "1px solid #eee", backgroundColor: filterStatus === id ? "#ef4b5f" : "#fff", color: filterStatus === id ? "#fff" : "#666" }}>
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
            <div onClick={() => {
                if (!user) { alert('로그인 후 이용 가능합니다.'); return; }
                setIsModalOpen(true);
              }} 
              style={{ cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "220px", borderRadius: '16px', border: '2px dashed #ddd', backgroundColor: '#f9f9f9', transition: 'all 0.2s ease' }} 
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#ef4b5f'; e.currentTarget.style.backgroundColor = '#fff5f6'; }} 
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#ddd'; e.currentTarget.style.backgroundColor = '#f9f9f9'; }}
            >
              <div style={{ fontSize: '40px', color: '#ef4b5f', marginBottom: '8px' }}>+</div>
              <div style={{ fontSize: '14px', fontWeight: '700', color: '#888' }}>새 모집글 작성</div>
            </div>

            {filteredPosts.map(post => (
              <MeetupCard key={post.id} post={post} user={user} onClick={onSelectPost} onDelete={handleDelete} />
            ))}
          </div>
        )}
      </div>

      {isModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={() => setIsModalOpen(false)}>
          <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 400, padding: 24 }} onClick={e => e.stopPropagation()}>
            <h3 style={{ marginBottom: 20 }}>직관 메이트 모집</h3>
            <form onSubmit={handleCreate}>
              <input placeholder="제목" style={{ width: '100%', marginBottom: 12, borderRadius: 10, padding: 10, border: '1px solid #ddd', boxSizing: 'border-box' }} value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} required />
              <textarea placeholder="내용" style={{ width: '100%', height: 100, marginBottom: 12, borderRadius: 10, padding: 10, border: '1px solid #ddd', boxSizing: 'border-box', resize: 'none' }} value={formData.content} onChange={e => setFormData({ ...formData, content: e.target.value })} required />
              
              <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                {/* 동일 팀 선택 방지 로직(handleTeamChange) 연결 */}
                <select style={{ flex: 1, padding: 8, borderRadius: 10, border: '1px solid #ddd' }} value={formData.homeTeamId} onChange={e => handleTeamChange('home', e.target.value)} required>
                  <option value="">홈 팀</option>
                  {TEAMS.filter(t => t.id !== 'ALL').map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
                <select style={{ flex: 1, padding: 8, borderRadius: 10, border: '1px solid #ddd' }} value={formData.awayTeamId} onChange={e => handleTeamChange('away', e.target.value)} required>
                  <option value="">어웨이 팀</option>
                  {TEAMS.filter(t => t.id !== 'ALL').map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>

              {/* 홈팀 선택 시 예상 경기장 UI 표시 */}
              {formData.homeTeamId && (
                  <div style={{ marginBottom: 12, padding: '10px', background: '#f5f5f5', borderRadius: 10, fontSize: 13, color: '#555', textAlign: 'center', border: '1px solid #eee' }}>
                      예상 경기장: <b>{STADIUMS[formData.homeTeamId] || '미정'}</b>
                  </div>
              )}

              <input type="date" style={{ width: '100%', marginBottom: 20, padding: 8, borderRadius: 10, border: '1px solid #ddd', boxSizing: 'border-box' }} value={formData.matchDate} onChange={e => setFormData({ ...formData, matchDate: e.target.value })} required />
              <div style={{ display: 'flex', gap: 10 }}>
                <button type="submit" style={{ flex: 1, padding: 12, background: '#ef4b5f', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 700, cursor: 'pointer' }}>등록</button>
                <button type="button" onClick={() => setIsModalOpen(false)} style={{ flex: 1, padding: 12, background: '#eee', border: 'none', borderRadius: 10, cursor: 'pointer' }}>취소</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}