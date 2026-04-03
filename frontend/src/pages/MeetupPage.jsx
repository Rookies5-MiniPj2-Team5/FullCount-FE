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

const TEAM_CODE_MAP = {
  LG: 1, DU: 2, SSG: 3, KIA: 4, SA: 5,
  LO: 6, HH: 7, KT: 8, NC: 9, WO: 10,
};

const ID_TO_TEAM_NAME = {
  1: "LG", 2: "두산", 3: "SSG", 4: "KIA", 5: "삼성",
  6: "롯데", 7: "한화", 8: "KT", 9: "NC", 10: "키움"
};

const STADIUMS = {
  1: '잠실야구장', 2: '잠실야구장', 3: '인천 SSG 랜더스필드', 4: '광주-기아 챔피언스 필드',
  5: '대구 삼성 라이온즈 파크', 6: '사직야구장', 7: '한화생명 이글스 파크', 8: '수원 KT 위즈 파크',
  9: '창원 NC 파크', 10: '고척 스카이돔',
  LG: '잠실야구장', DU: '잠실야구장', SSG: '인천 SSG 랜더스필드', KIA: '광주-기아 챔피언스 필드',
  SA: '대구 삼성 라이온즈 파크', LO: '사직야구장', HH: '한화생명 이글스 파크', KT: '수원 KT 위즈 파크',
  NC: '창원 NC 파크', WO: '고척 스카이돔'
};

const STADIUM_OPTIONS = [
  "잠실야구장", "고척 스카이돔", "인천 SSG 랜더스필드", "수원 KT 위즈 파크", 
  "광주-기아 챔피언스 필드", "창원 NC 파크", "대구 삼성 라이온즈 파크", 
  "사직야구장", "한화생명 이글스 파크"
];

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
          
          {/* 🚨 복구된 카드 내 수정 및 삭제 버튼 */}
          {user?.nickname === post.authorNickname && (
            <div style={{ display: 'flex', gap: '4px' }}>
              <button 
                onClick={(e) => { 
                  e.stopPropagation(); 
                  sessionStorage.setItem('autoOpenEdit', 'true');
                  onClick(post.id); 
                }} 
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f5f5f5'; e.currentTarget.style.borderColor = '#ddd'; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.borderColor = 'transparent'; }}
                style={{ background: 'transparent', border: '1px solid transparent', color: '#666', fontSize: '12px', cursor: 'pointer', fontWeight: 'bold', padding: '4px 10px', borderRadius: '6px', transition: 'all 0.2s' }}
              >
                수정
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); onDelete(post.id); }} 
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#fff0f0'; e.currentTarget.style.borderColor = '#ff4d4f'; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.borderColor = 'transparent'; }}
                style={{ background: 'transparent', border: '1px solid transparent', color: '#ff4d4f', fontSize: '12px', cursor: 'pointer', fontWeight: 'bold', padding: '4px 10px', borderRadius: '6px', transition: 'all 0.2s' }}
              >
                삭제
              </button>
            </div>
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
  
  const [formData, setFormData] = useState({ title: '', content: '', matchDate: '', homeTeamId: '', awayTeamId: '', maxParticipants: 2, stadium: '' });

  const fetchMates = async () => {
    setLoading(true);
    try {
      const selectedTeamId = filterTeam === 'ALL' ? null : TEAM_CODE_MAP[filterTeam];
      const status = filterStatus === 'OPEN' ? 'OPEN' : null;

      const response = await api.get('/posts', {
        params: { boardType: 'MATE', teamId: selectedTeamId, homeTeamId: selectedTeamId, awayTeamId: selectedTeamId, status, page: 0, size: 9 }
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

  useEffect(() => { fetchMates(); }, [filterTeam, filterStatus]);

  const handleTeamChange = (type, value) => {
      if (type === 'home' && value === formData.awayTeamId && value !== '') {
          alert('홈 팀과 어웨이 팀은 같을 수 없습니다.'); return;
      }
      if (type === 'away' && value === formData.homeTeamId && value !== '') {
          alert('홈 팀과 어웨이 팀은 같을 수 없습니다.'); return;
      }
      
      if (type === 'home') {
          setFormData({ ...formData, homeTeamId: value, stadium: STADIUMS[value] || '' });
      } else {
          setFormData({ ...formData, awayTeamId: value });
      }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (formData.homeTeamId && formData.homeTeamId === formData.awayTeamId) {
      alert('홈 팀과 어웨이 팀은 같을 수 없습니다!');
      return;
    }
    if (!formData.stadium) {
      alert('경기장을 선택해주세요!');
      return;
    }
    if (formData.maxParticipants < 2 || formData.maxParticipants > 50) {
      alert('인원수는 2명 이상, 50명 이하로 설정해주세요.');
      return;
    }
    try {
      const payload = {
        boardType: 'MATE',
        ...formData,
        stadium: formData.stadium,
        homeTeamId: String(TEAM_CODE_MAP[formData.homeTeamId] || formData.homeTeamId),
        awayTeamId: String(TEAM_CODE_MAP[formData.awayTeamId] || formData.awayTeamId),
        maxParticipants: parseInt(formData.maxParticipants, 10),
      };

      await api.post('/posts', payload);
      setIsModalOpen(false);
      setFormData({ title: '', content: '', matchDate: '', homeTeamId: '', awayTeamId: '', maxParticipants: 2, stadium: '' });
      fetchMates();
      alert('모집글이 성공적으로 등록되었습니다!');
    } catch (err) {
      alert('등록에 실패했습니다. (서버 연결을 확인해주세요)');
    }
  };

  const handleDelete = async (postId) => {
    if (!window.confirm('정말 삭제하시겠습니까?')) return;
    try { await api.delete(`/posts/${postId}`); fetchMates(); } catch { alert("삭제 실패"); }
  };

  return (
    <div className="meetup-page">
      <div className="page-header">
        <h2 className="page-title">직관 메이트 모집</h2>
      </div>

      <div style={{ background: '#fff', padding: '20px 24px', borderRadius: '12px', marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
        <TeamFilter selected={filterTeam} onChange={setFilterTeam} />
      </div>

      <div className="page-content">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>로딩 중...</div>
        ) : (
          <div className="card-grid">
            <div onClick={() => { if (!user) return alert('로그인 후 이용 가능합니다.'); setIsModalOpen(true); }} style={{ cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "220px", borderRadius: '16px', border: '2px dashed #ddd', backgroundColor: '#f9f9f9', transition: 'all 0.2s ease' }}>
              <div style={{ fontSize: '40px', color: '#ef4b5f', marginBottom: '8px' }}>+</div>
              <div style={{ fontSize: '14px', fontWeight: '700', color: '#888' }}>새 모집글 작성</div>
            </div>

            {posts.map(post => (
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
              <input placeholder="제목" style={{ width: '100%', marginBottom: 12, padding: 10, borderRadius: 10, border: '1px solid #ddd', boxSizing: 'border-box' }} value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} required />
              <textarea placeholder="내용" style={{ width: '100%', height: 100, marginBottom: 12, padding: 10, borderRadius: 10, border: '1px solid #ddd', boxSizing: 'border-box', resize: 'none' }} value={formData.content} onChange={e => setFormData({ ...formData, content: e.target.value })} required />
              
              <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                <select style={{ flex: 1, padding: 8, borderRadius: 10, border: '1px solid #ddd' }} value={formData.homeTeamId} onChange={e => handleTeamChange('home', e.target.value)} required>
                  <option value="">홈 팀</option>
                  {TEAMS.filter(t => t.id !== 'ALL').map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
                <select style={{ flex: 1, padding: 8, borderRadius: 10, border: '1px solid #ddd' }} value={formData.awayTeamId} onChange={e => handleTeamChange('away', e.target.value)} required>
                  <option value="">어웨이 팀</option>
                  {TEAMS.filter(t => t.id !== 'ALL').map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>

              <select 
                style={{ width: '100%', marginBottom: 12, padding: 10, borderRadius: 10, border: '1px solid #ddd', boxSizing: 'border-box', appearance: 'auto' }} 
                value={formData.stadium} 
                onChange={e => setFormData({ ...formData, stadium: e.target.value })} 
                required 
              >
                <option value="">경기장 선택</option>
                {STADIUM_OPTIONS.map(stadium => (
                  <option key={stadium} value={stadium}>{stadium}</option>
                ))}
              </select>

              <div style={{ display: 'flex', gap: '10px', width: '100%', marginBottom: 20 }}>
                <input 
                  type="date" 
                  style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #ddd', boxSizing: 'border-box', color: '#333' }} 
                  value={formData.matchDate} 
                  onChange={e => setFormData({ ...formData, matchDate: e.target.value })} 
                  required 
                />
                
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', padding: '0 12px', borderRadius: '8px', border: '1px solid #ddd', background: '#fff', boxSizing: 'border-box' }}>
                  <span style={{ fontSize: '13px', color: '#666', fontWeight: '600', whiteSpace: 'nowrap' }}>모집 인원</span>
                  <input 
                    type="number" 
                    min="2" 
                    max="50" 
                    style={{ flex: 1, width: '100%', border: 'none', outline: 'none', textAlign: 'right', fontSize: '14px', color: '#333', background: 'transparent' }} 
                    value={formData.maxParticipants} 
                    onChange={e => setFormData({ ...formData, maxParticipants: e.target.value })} 
                    required 
                  />
                  <span style={{ fontSize: '13px', color: '#333', marginLeft: '4px', fontWeight: '600' }}>명</span>
                </div>
              </div>

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