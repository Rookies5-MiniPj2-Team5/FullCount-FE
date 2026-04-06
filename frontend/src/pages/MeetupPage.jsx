import { useCallback, useEffect, useState } from 'react';
import api from '../api/api';
import { TeamFilter, TEAMS } from '../components/TeamComponents';
import { StatusBadge } from '../components/StatusBadge';
import { useAuth } from '../context/AuthContext';
import MeetupDetailPage from './Meetupdetailpage';

const TEAM_COLORS = {
  DU: '#1a1748', LG: '#C8102E', SSG: '#CE0E2D', WO: '#820024',
  KT: '#1b1a1a', SA: '#074CA1', HH: '#F37321', NC: '#1D467A',
  LO: '#002561', KIA: '#EA0029',
};

const TEAM_CODE_MAP = {
  LG: 1, DU: 2, SSG: 3, KIA: 4, SA: 5, LO: 6, HH: 7, KT: 8, NC: 9, WO: 10,
};

const ID_TO_TEAM_CODE = {
  1: 'LG', 2: 'DU', 3: 'SSG', 4: 'KIA', 5: 'SA',
  6: 'LO', 7: 'HH', 8: 'KT', 9: 'NC', 10: 'WO',
};

const STADIUMS = {
  LG: '잠실야구장', DU: '잠실야구장', SSG: '인천SSG랜더스필드', KIA: '광주-기아 챔피언스 필드',
  SA: '대구삼성라이온즈파크', LO: '사직야구장', HH: '한화생명이글스파크', KT: '수원KT위즈파크',
  NC: '창원NC파크', WO: '고척스카이돔',
};

const STADIUM_LIST = [
  "잠실야구장", "인천SSG랜더스필드", "광주-기아 챔피언스 필드",
  "대구삼성라이온즈파크", "사직야구장", "한화생명이글스파크",
  "수원KT위즈파크", "창원NC파크", "고척스카이돔"
];

const PAGE_SIZE = 9;

const normalizePost = (post) => ({
  ...post,
  currentParticipants: Number(post?.currentParticipants) || 0,
  maxParticipants: Number(post?.maxParticipants) || 0,
});

const getErrorMessage = (error, fallbackMessage) =>
  error?.response?.data?.message ||
  error?.response?.data?.error ||
  error?.message ||
  fallbackMessage;

const getTeamCode = (teamId, teamName) => {
  if (teamId && ID_TO_TEAM_CODE[teamId]) return ID_TO_TEAM_CODE[teamId];
  const name = teamName || '';
  if (name.includes('LG')) return 'LG';
  if (name.includes('두산')) return 'DU';
  if (name.includes('SSG')) return 'SSG';
  if (name.includes('KIA') || name.includes('기아')) return 'KIA';
  if (name.includes('삼성')) return 'SA';
  if (name.includes('롯데')) return 'LO';
  if (name.includes('한화')) return 'HH';
  if (name.includes('KT')) return 'KT';
  if (name.includes('NC')) return 'NC';
  if (name.includes('키움')) return 'WO';
  return 'LG';
};

function MeetupCard({ post, currentUser, onClick, onEdit, onDelete }) {
  const homeTeam = getTeamCode(post.homeTeamId, post.homeTeamName);
  const awayTeam = getTeamCode(post.awayTeamId, post.awayTeamName);
  const homeColor = TEAM_COLORS[homeTeam] || '#ef4b5f';
  const awayColor = TEAM_COLORS[awayTeam] || '#666';
  const isFull = post.maxParticipants > 0 && post.currentParticipants >= post.maxParticipants;
  const ratio = post.maxParticipants > 0 ? Math.min(post.currentParticipants / post.maxParticipants, 1) : 0;
  const isAuthor = currentUser?.nickname === post.authorNickname;

  return (
    <div
      className="card"
      onClick={() => onClick(post.id)}
      style={{ cursor: 'pointer', overflow: 'hidden', padding: 0, backgroundColor: '#fff', borderRadius: 16, border: '1px solid #eee', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
    >
      <div style={{ height: 4, background: homeColor }} />
      <div style={{ padding: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 10, fontWeight: 800, color: homeColor, background: `${homeColor}15`, border: `1px solid ${homeColor}30`, padding: '3px 8px', borderRadius: 8 }}>{homeTeam}</span>
            <span style={{ fontSize: 10, fontWeight: 700, color: '#ccc' }}>VS</span>
            <span style={{ fontSize: 10, fontWeight: 800, color: awayColor, background: `${awayColor}15`, border: `1px solid ${awayColor}30`, padding: '3px 8px', borderRadius: 8 }}>{awayTeam}</span>
          </div>
          
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            {isAuthor && (
              <div style={{ display: "flex", gap: "4px" }}>
                <button 
                  onClick={(e) => { e.stopPropagation(); onEdit(post); }} 
                  style={{ padding: "4px 8px", fontSize: "11px", borderRadius: "4px", border: "1px solid #ddd", background: "#f9f9f9", color: "#555", cursor: "pointer" }}
                >
                  수정
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); onDelete(post); }} 
                  style={{ padding: "4px 8px", fontSize: "11px", borderRadius: "4px", border: "1px solid #ffcccc", background: "#fff5f5", color: "#d32f2f", cursor: "pointer" }}
                >
                  삭제
                </button>
              </div>
            )}
            <StatusBadge status={post.status} />
          </div>
        </div>

        <div style={{ marginBottom: 10, fontSize: 16, fontWeight: 800, color: '#222' }}>{post.title}</div>
        <div style={{ marginBottom: 16, display: 'flex', gap: 10, fontSize: 12, color: '#999' }}>
          <span>📍 {post.stadium || '경기장 미정'}</span>
          <span>📅 {post.matchDate}</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <div style={{ flex: 1, height: 4, background: '#f5f5f5', borderRadius: 999, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${ratio * 100}%`, background: isFull ? '#ccc' : homeColor, borderRadius: 999 }} />
          </div>
          <span style={{ fontSize: 12, color: '#666', fontWeight: 700 }}>👥 {post.currentParticipants}/{post.maxParticipants}명</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 28, height: 28, borderRadius: '50%', backgroundColor: homeColor, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 'bold' }}>
            {post.authorNickname?.slice(0, 1)}
          </div>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#333' }}>{post.authorNickname}</div>
        </div>
      </div>
    </div>
  );
}

export default function MeetupPage({ onSelectPost, onOpenChat }) {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [selectedPostId, setSelectedPostId] = useState(null);
  const [filterTeam, setFilterTeam] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [editingPostId, setEditingPostId] = useState(null);
  const [initialFormState, setInitialFormState] = useState(null);
  const [formData, setFormData] = useState({
    title: '', content: '', matchDate: '', homeTeamId: '', awayTeamId: '',
    supportTeamId: '', maxParticipants: 4, matchTime: '', stadium: '',
  });

  const fetchMates = useCallback(async () => {
    setLoading(true);
    try {
      const selectedTeamId = filterTeam === 'ALL' ? null : TEAM_CODE_MAP[filterTeam];
      const status = filterStatus === 'OPEN' ? 'OPEN' : null;
      const response = await api.get('/posts', {
        params: { boardType: 'MATE', teamId: selectedTeamId, status, page: 0, size: 100 },
      });
      setPosts((response.data?.data?.content || []).map(normalizePost));
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [filterStatus, filterTeam]);

  useEffect(() => { fetchMates(); }, [fetchMates]);

  const handleDelete = async (post) => {
    if (!window.confirm('정말 삭제하시겠습니까?')) return;
    try {
      await api.delete(`/posts/${post.id}`);
      alert('삭제되었습니다.');
      setSelectedPostId(null);
      fetchMates();
    } catch (error) {
      alert(getErrorMessage(error, '삭제 실패'));
    }
  };

  const handleEditClick = (post) => {
    const data = {
      title: post.title || '', content: post.content || '', matchDate: post.matchDate || '',
      homeTeamId: getTeamCode(post.homeTeamId, post.homeTeamName),
      awayTeamId: getTeamCode(post.awayTeamId, post.awayTeamName),
      supportTeamId: getTeamCode(null, post.authorTeam),
      maxParticipants: post.maxParticipants || 4, matchTime: post.matchTime || '', stadium: post.stadium || '',
    };
    setFormData(data);
    setInitialFormState(data);
    setEditingPostId(post.id);
    setIsModalOpen(true);
  };

  const resetForm = () => {
    setFormData({ title: '', content: '', matchDate: '', homeTeamId: '', awayTeamId: '', supportTeamId: '', maxParticipants: 4, matchTime: '', stadium: '' });
    setEditingPostId(null);
    setInitialFormState(null);
  };

  const handleHomeTeamChange = (e) => {
    const homeId = e.target.value;
    if (homeId && String(homeId) === String(formData.awayTeamId)) {
      alert("홈팀과 원정팀을 동일하게 선택할 수 없습니다.");
      return;
    }
    const autoStadium = STADIUMS[homeId] || formData.stadium;
    setFormData((prev) => ({ ...prev, homeTeamId: homeId, stadium: autoStadium }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (String(formData.homeTeamId) === String(formData.awayTeamId)) {
      alert('홈팀과 원정팀은 같을 수 없습니다.');
      return;
    }
    if (editingPostId && initialFormState) {
      const isSame = Object.keys(formData).every(key => formData[key] === initialFormState[key]);
      if (isSame) return alert("변경사항이 없습니다.");
    }
    
    const payload = {
      ...formData, boardType: 'MATE',
      homeTeamId: String(TEAM_CODE_MAP[formData.homeTeamId] || formData.homeTeamId),
      awayTeamId: String(TEAM_CODE_MAP[formData.awayTeamId] || formData.awayTeamId),
      supportTeamId: String(TEAM_CODE_MAP[formData.supportTeamId] || formData.supportTeamId),
    };

    try {
      if (editingPostId) {
        await api.put(`/posts/${editingPostId}`, payload);
        alert('성공적으로 수정되었습니다.'); 
      } else {
        await api.post('/posts', payload);
        alert('모집글이 등록되었습니다.'); 
      }
      setIsModalOpen(false);
      resetForm();
      fetchMates();
    } catch (error) {
      alert(getErrorMessage(error, '처리 실패'));
    }
  };

  return (
    <div className="meetup-page">
      {selectedPostId ? (
        <MeetupDetailPage 
          postId={selectedPostId} 
          onBack={() => setSelectedPostId(null)} 
          onOpenChat={onOpenChat}
          onEdit={handleEditClick}   
          onDelete={handleDelete}    
        />
      ) : (
        <>
          <div className="page-header">
            <h2 className="page-title">직관 메이트 모집</h2>
            <p className="page-subtitle">같이 야구 볼 메이트를 찾아보세요.</p>
          </div>

          <div style={{ background: '#fff', padding: '20px 24px', borderRadius: 12, marginBottom: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
            <TeamFilter selected={filterTeam} onChange={setFilterTeam} />
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              {[{ id: 'ALL', label: '전체 상태' }, { id: 'OPEN', label: '모집 중' }, { id: 'FULL', label: '마감' }].map(({ id, label }) => (
                <button key={id} onClick={() => setFilterStatus(id)} style={{ padding: '6px 14px', fontSize: 13, borderRadius: 18, border: filterStatus === id ? 'none' : '1px solid #eee', backgroundColor: filterStatus === id ? '#ef4b5f' : '#fff', color: filterStatus === id ? '#fff' : '#666', cursor: 'pointer' }}>{label}</button>
              ))}
            </div>
          </div>

          <div className="card-grid">
            <div onClick={() => { if(!user) return alert('로그인 필요'); setIsModalOpen(true); }} style={{ cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 220, borderRadius: 16, border: '2px dashed #ddd', backgroundColor: '#f9f9f9' }}>
              <div style={{ fontSize: 40, color: '#ef4b5f', marginBottom: 8 }}>+</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#888' }}>모집글 작성</div>
            </div>
            {posts.map((post) => (
              <MeetupCard key={post.id} post={post} currentUser={user} onClick={setSelectedPostId} onEdit={handleEditClick} onDelete={handleDelete} />
            ))}
          </div>
        </>
      )}

      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => { setIsModalOpen(false); resetForm(); }}>
          <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 460, padding: 24, maxHeight: '90vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ marginBottom: 20 }}>{editingPostId ? '모집글 수정' : '메이트 모집'}</h3>
            <form onSubmit={handleSubmit}>
              <input placeholder="제목" style={fieldStyle} value={formData.title} onChange={(e) => setFormData(p => ({...p, title: e.target.value}))} required />
              <textarea placeholder="내용" style={{...fieldStyle, height: 100}} value={formData.content} onChange={(e) => setFormData(p => ({...p, content: e.target.value}))} required />
              <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                <select style={{...fieldStyle, marginBottom: 0, flex: 1}} value={formData.homeTeamId} onChange={handleHomeTeamChange} required>
                  <option value="">홈팀</option>
                  {TEAMS.filter(t => t.id !== 'ALL').map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
                <select style={{...fieldStyle, marginBottom: 0, flex: 1}} value={formData.awayTeamId} onChange={(e) => {
                  const val = e.target.value;
                  if(val && val === formData.homeTeamId) return alert('홈 팀과 어웨이 팀을 동일하게 선택할 수 없습니다.');
                  setFormData(p => ({...p, awayTeamId: val}));
                }} required>
                  <option value="">원정팀</option>
                  {TEAMS.filter(t => t.id !== 'ALL').map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
              <select style={fieldStyle} value={formData.stadium} onChange={(e) => setFormData(p => ({...p, stadium: e.target.value}))} required>
                <option value="">경기장 선택</option>
                {STADIUM_LIST.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                <input type="date" style={{...fieldStyle, marginBottom: 0, flex: 1}} value={formData.matchDate} onChange={(e) => setFormData(p => ({...p, matchDate: e.target.value}))} required />
                <input type="time" style={{...fieldStyle, marginBottom: 0, flex: 1}} value={formData.matchTime} onChange={(e) => setFormData(p => ({...p, matchTime: e.target.value}))} />
              </div>
              <input type="number" placeholder="인원" style={fieldStyle} value={formData.maxParticipants} onChange={(e) => setFormData(p => ({...p, maxParticipants: e.target.value}))} required />
              <div style={{ display: 'flex', gap: 10 }}>
                <button type="submit" style={{ flex: 1, padding: 12, background: '#ef4b5f', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 700 }}>{editingPostId ? '수정 완료' : '등록 완료'}</button>
                <button type="button" onClick={() => { setIsModalOpen(false); resetForm(); }} style={{ flex: 1, padding: 12, background: '#eee', border: 'none', borderRadius: 10 }}>취소</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const fieldStyle = { width: '100%', marginBottom: 12, borderRadius: 10, padding: 10, border: '1px solid #ddd', boxSizing: 'border-box' };
