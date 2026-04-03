import { useCallback, useEffect, useState } from 'react';
import api from '../api/api';
import { TeamFilter, TEAMS } from '../components/TeamComponents';
import { StatusBadge } from '../components/StatusBadge';
import { useAuth } from '../context/AuthContext';

const TEAM_COLORS = {
  DU: '#1a1748',
  LG: '#C8102E',
  SSG: '#CE0E2D',
  WO: '#820024',
  KT: '#1b1a1a',
  SA: '#074CA1',
  HH: '#F37321',
  NC: '#1D467A',
  LO: '#002561',
  KIA: '#EA0029',
};

const TEAM_CODE_MAP = {
  LG: 1,
  DU: 2,
  SSG: 3,
  KIA: 4,
  SA: 5,
  LO: 6,
  HH: 7,
  KT: 8,
  NC: 9,
  WO: 10,
};

const ID_TO_TEAM_CODE = {
  1: 'LG',
  2: 'DU',
  3: 'SSG',
  4: 'KIA',
  5: 'SA',
  6: 'LO',
  7: 'HH',
  8: 'KT',
  9: 'NC',
  10: 'WO',
};

const STADIUMS = {
  LG: '잠실야구장',
  DU: '잠실야구장',
  SSG: '인천SSG랜더스필드',
  KIA: '광주-기아 챔피언스 필드',
  SA: '대구삼성라이온즈파크',
  LO: '사직야구장',
  HH: '한화생명이글스파크',
  KT: '수원KT위즈파크',
  NC: '창원NC파크',
  WO: '고척스카이돔',
};

const PAGE_SIZE = 9;

const normalizePost = (post) => ({
  ...post,
  currentParticipants: Number(post?.currentParticipants) || 0,
  maxParticipants: Number(post?.maxParticipants) || 0,
});

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

function MeetupCard({ post, user, onClick, onDelete }) {
  const homeTeam = getTeamCode(post.homeTeamId, post.homeTeamName);
  const awayTeam = getTeamCode(post.awayTeamId, post.awayTeamName);
  const homeColor = TEAM_COLORS[homeTeam] || '#ef4b5f';
  const awayColor = TEAM_COLORS[awayTeam] || '#666';
  const isFull = post.maxParticipants > 0 && post.currentParticipants >= post.maxParticipants;
  const ratio = post.maxParticipants > 0 ? Math.min(post.currentParticipants / post.maxParticipants, 1) : 0;

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
          <StatusBadge status={post.status} />
        </div>

        <div style={{ marginBottom: 10, fontSize: 16, fontWeight: 800, color: '#222' }}>{post.title}</div>

        <div style={{ marginBottom: 16, display: 'flex', gap: 10, fontSize: 12, color: '#999' }}>
          <span>📍 {post.stadium || '경기장 미정'}</span>
          <span>📅 {post.matchDate}</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <div style={{ flex: 1, height: 4, background: '#f5f5f5', borderRadius: 999, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${ratio * 100}%`, background: isFull ? '#ccc' : homeColor, borderRadius: 999, transition: 'width 0.3s ease' }} />
          </div>
          <span style={{ fontSize: 12, color: '#666', fontWeight: 700 }}>👥 {post.currentParticipants}/{post.maxParticipants > 0 ? post.maxParticipants : '?'}명</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', backgroundColor: homeColor, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 'bold' }}>
              {post.authorNickname?.slice(0, 1)}
            </div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#333' }}>{post.authorNickname}</div>
          </div>
          {user?.nickname === post.authorNickname && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(post.id);
              }}
              style={{ background: 'none', border: 'none', color: '#ff4d4f', fontSize: 11, cursor: 'pointer', fontWeight: 'bold' }}
            >
              삭제
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function Pagination({ currentPage, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;
  const pages = Array.from({ length: totalPages }, (_, index) => index);

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 6, marginTop: 24 }}>
      <button onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 0} style={pageButtonStyle(currentPage === 0)}>이전</button>
      {pages.map((page) => (
        <button key={page} onClick={() => onPageChange(page)} style={{ ...pageButtonStyle(false), background: currentPage === page ? '#ef4b5f' : '#fff', color: currentPage === page ? '#fff' : '#333', fontWeight: currentPage === page ? 700 : 400 }}>
          {page + 1}
        </button>
      ))}
      <button onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages - 1} style={pageButtonStyle(currentPage === totalPages - 1)}>다음</button>
    </div>
  );
}

export default function MeetupPage({ onSelectPost, initialOpen }) {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [filterTeam, setFilterTeam] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [isModalOpen, setIsModalOpen] = useState(Boolean(initialOpen));
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    matchDate: '',
    homeTeamId: '',
    awayTeamId: '',
    supportTeamId: '',
    maxParticipants: 4,
    matchTime: '',
  });

  const fetchMates = useCallback(async (page = 0) => {
    setLoading(true);
    try {
      const selectedTeamId = filterTeam === 'ALL' ? null : TEAM_CODE_MAP[filterTeam];
      const status = filterStatus === 'OPEN' ? 'OPEN' : null;
      const response = await api.get('/posts', {
        params: {
          boardType: 'MATE',
          teamId: selectedTeamId,
          homeTeamId: selectedTeamId,
          awayTeamId: selectedTeamId,
          status,
          page,
          size: PAGE_SIZE,
        },
      });

      const responseData = response.data;
      const pageData = responseData?.data?.content ? responseData.data : responseData?.content ? responseData : null;
      const postsArray = pageData?.content || [];
      setPosts(postsArray.map(normalizePost));
      setTotalPages(pageData?.totalPages ?? 0);
      setTotalElements(pageData?.totalElements ?? postsArray.length);
      setCurrentPage(page);
    } catch (error) {
      console.error('메이트 목록 조회 실패:', error);
      setPosts([]);
      setTotalPages(0);
      setTotalElements(0);
    } finally {
      setLoading(false);
    }
  }, [filterStatus, filterTeam]);

  useEffect(() => {
    fetchMates(0);
  }, [fetchMates]);

  const filteredPosts = posts.filter((post) => {
    if (filterStatus === 'FULL') {
      return post.maxParticipants > 0 && post.currentParticipants >= post.maxParticipants;
    }
    return true;
  });

  const handleDelete = async (postId) => {
    if (!window.confirm('정말 삭제하시겠습니까?')) return;
    try {
      await api.delete(`/posts/${postId}`);
      fetchMates(currentPage);
    } catch (error) {
      console.error('게시글 삭제 실패:', error);
      alert('삭제에 실패했습니다.');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      matchDate: '',
      homeTeamId: '',
      awayTeamId: '',
      supportTeamId: '',
      maxParticipants: 4,
      matchTime: '',
    });
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (formData.homeTeamId === formData.awayTeamId) {
      alert('홈팀과 원정팀은 같을 수 없습니다.');
      return;
    }
    try {
      await api.post('/posts', {
        boardType: 'MATE',
        title: formData.title,
        content: formData.content,
        matchDate: formData.matchDate,
        homeTeamId: String(TEAM_CODE_MAP[formData.homeTeamId] || formData.homeTeamId),
        awayTeamId: String(TEAM_CODE_MAP[formData.awayTeamId] || formData.awayTeamId),
        supportTeamId: String(TEAM_CODE_MAP[formData.supportTeamId] || formData.supportTeamId),
        maxParticipants: Number(formData.maxParticipants),
        stadium: STADIUMS[formData.homeTeamId] || '',
        matchTime: formData.matchTime,
      });
      setIsModalOpen(false);
      resetForm();
      fetchMates(0);
    } catch (error) {
      console.error('메이트 게시글 등록 실패:', error);
      alert('등록에 실패했습니다.');
    }
  };

  return (
    <div className="meetup-page">
      <div className="page-header">
        <h2 className="page-title">직관 메이트 모집</h2>
        <p className="page-subtitle">같이 야구 볼 메이트를 찾아보세요.</p>
      </div>

      <div style={{ background: '#fff', padding: '20px 24px', borderRadius: 12, marginBottom: 20, display: 'flex', flexDirection: 'column', gap: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
        <TeamFilter selected={filterTeam} onChange={setFilterTeam} />
        <div style={{ display: 'flex', gap: 8 }}>
          {[{ id: 'ALL', label: '전체 상태' }, { id: 'OPEN', label: '모집 중' }, { id: 'FULL', label: '마감' }].map(({ id, label }) => (
            <button key={id} onClick={() => setFilterStatus(id)} style={{ padding: '6px 14px', fontSize: 13, fontWeight: 500, borderRadius: 18, cursor: 'pointer', border: filterStatus === id ? 'none' : '1px solid #eee', backgroundColor: filterStatus === id ? '#ef4b5f' : '#fff', color: filterStatus === id ? '#fff' : '#666' }}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {totalElements > 0 && <div style={{ fontSize: 13, color: '#888', marginBottom: 12 }}>총 <strong>{totalElements}</strong>개의 모집글</div>}

      <div className="page-content">
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40 }}>로딩 중...</div>
        ) : (
          <>
            <div className="card-grid">
              <div
                onClick={() => {
                  if (!user) {
                    alert('로그인 후 이용 가능합니다.');
                    return;
                  }
                  setIsModalOpen(true);
                }}
                style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 220, borderRadius: 16, border: '2px dashed #ddd', backgroundColor: '#f9f9f9' }}
              >
                <div style={{ fontSize: 40, color: '#ef4b5f', marginBottom: 8 }}>+</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#888' }}>모집글 작성</div>
              </div>
              {filteredPosts.map((post) => (
                <MeetupCard key={post.id} post={post} user={user} onClick={onSelectPost} onDelete={handleDelete} />
              ))}
            </div>
            <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={(page) => fetchMates(page)} />
          </>
        )}
      </div>

      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={() => setIsModalOpen(false)}>
          <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 460, padding: 24 }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ marginBottom: 20 }}>직관 메이트 모집</h3>
            <form onSubmit={handleCreate}>
              <input placeholder="제목" style={fieldStyle} value={formData.title} onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))} required />
              <textarea placeholder="내용" style={{ ...fieldStyle, height: 100, resize: 'none' }} value={formData.content} onChange={(e) => setFormData((prev) => ({ ...prev, content: e.target.value }))} required />
              <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                <select style={{ ...fieldStyle, marginBottom: 0, flex: 1 }} value={formData.homeTeamId} onChange={(e) => setFormData((prev) => ({ ...prev, homeTeamId: e.target.value }))} required>
                  <option value="">홈팀</option>
                  {TEAMS.filter((team) => team.id !== 'ALL').map((team) => <option key={team.id} value={team.id}>{team.name}</option>)}
                </select>
                <select style={{ ...fieldStyle, marginBottom: 0, flex: 1 }} value={formData.awayTeamId} onChange={(e) => setFormData((prev) => ({ ...prev, awayTeamId: e.target.value }))} required>
                  <option value="">원정팀</option>
                  {TEAMS.filter((team) => team.id !== 'ALL').map((team) => <option key={team.id} value={team.id}>{team.name}</option>)}
                </select>
              </div>
              <select style={fieldStyle} value={formData.supportTeamId} onChange={(e) => setFormData((prev) => ({ ...prev, supportTeamId: e.target.value }))} required>
                <option value="">응원팀</option>
                {TEAMS.filter((team) => team.id !== 'ALL').map((team) => <option key={team.id} value={team.id}>{team.name}</option>)}
              </select>
              <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                <input type="date" style={{ ...fieldStyle, marginBottom: 0, flex: 1 }} value={formData.matchDate} onChange={(e) => setFormData((prev) => ({ ...prev, matchDate: e.target.value }))} required />
                <input type="time" style={{ ...fieldStyle, marginBottom: 0, flex: 1 }} value={formData.matchTime} onChange={(e) => setFormData((prev) => ({ ...prev, matchTime: e.target.value }))} />
              </div>
              <input type="number" min="2" max="99" placeholder="최대 인원" style={fieldStyle} value={formData.maxParticipants} onChange={(e) => setFormData((prev) => ({ ...prev, maxParticipants: e.target.value }))} required />
              <div style={{ display: 'flex', gap: 10 }}>
                <button type="submit" style={{ flex: 1, padding: 12, background: '#ef4b5f', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 700, cursor: 'pointer' }}>등록</button>
                <button type="button" onClick={() => { setIsModalOpen(false); resetForm(); }} style={{ flex: 1, padding: 12, background: '#eee', border: 'none', borderRadius: 10, cursor: 'pointer' }}>취소</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const pageButtonStyle = (disabled) => ({
  padding: '6px 12px',
  borderRadius: 8,
  border: '1px solid #ddd',
  background: '#fff',
  cursor: disabled ? 'not-allowed' : 'pointer',
  color: disabled ? '#ccc' : '#333',
});

const fieldStyle = {
  width: '100%',
  marginBottom: 12,
  borderRadius: 10,
  padding: 10,
  border: '1px solid #ddd',
  boxSizing: 'border-box',
};
