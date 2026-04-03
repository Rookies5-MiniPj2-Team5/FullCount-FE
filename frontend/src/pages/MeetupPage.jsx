import { useEffect, useState, useCallback } from 'react';
import api from '../api/api';
import { TeamFilter, TEAMS } from '../components/TeamComponents';
import { StatusBadge } from '../components/StatusBadge';
import { useAuth } from '../context/AuthContext';

const TEAM_COLORS = {
  두산: '#1a1748',
  LG: '#C8102E',
  SSG: '#CE0E2D',
  키움: '#820024',
  KT: '#1b1a1a',
  삼성: '#074CA1',
  한화: '#F37321',
  NC: '#1D467A',
  롯데: '#002561',
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

const STADIUM_OPTIONS = [
  '잠실야구장',
  '인천SSG랜더스필드',
  '광주-기아 챔피언스 필드',
  '대구삼성라이온즈파크',
  '사직야구장',
  '한화생명이글스파크',
  '수원KT위즈파크',
  '창원NC파크',
  '고척스카이돔',
];

const MEETUP_DUMMY = [
  { id: 1, authorNickname: '야구팬1', title: '잠실 LG vs 두산 같이 보실 분!', content: '응원해요!', status: 'OPEN', supportTeamName: 'LG 트윈스', homeTeamName: 'LG', awayTeamName: 'DU', maxParticipants: 4, currentParticipants: 2, stadium: '잠실야구장', matchDate: '2026-04-05' },
  { id: 2, authorNickname: '트윈스킹', title: 'LG 홈경기 직관 (마감)', content: '마감!', status: 'OPEN', supportTeamName: 'LG 트윈스', homeTeamName: 'LG', awayTeamName: 'KT', maxParticipants: 2, currentParticipants: 2, stadium: '잠실야구장', matchDate: '2026-04-07' },
  { id: 3, authorNickname: '곰팬이에요', title: '두산 개막전 직관!', content: '곰팬 모여라', status: 'OPEN', supportTeamName: '두산 베어스', homeTeamName: 'DU', awayTeamName: 'SSG', maxParticipants: 5, currentParticipants: 1, stadium: '잠실야구장', matchDate: '2026-04-05' },
];

const PAGE_SIZE = 9;

// currentParticipants 응답 필드명 정규화
const normalizePost = (post) => ({
  ...post,
  currentParticipants:
    post.currentParticipants ??
    post.currentParticipantCount ??
    post.participantCount ??
    post.participants ??
    0,
});

const getParticipantCount = (post) => {
  const parsed = Number(post?.currentParticipants);
  return Number.isFinite(parsed) ? parsed : 0;
};

const getMaxParticipantCount = (post) => {
  const parsed = Number(post?.maxParticipants);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
};

function MeetupCard({ post, user, onClick, onDelete }) {
  const getTeamDisplayName = (team) => {
    const nameMap = {
      DU: '두산', WO: '키움', SA: '삼성', LO: '롯데',
      HH: '한화', KIA: 'KIA', KT: 'KT', LG: 'LG', NC: 'NC', SSG: 'SSG',
    };
    return nameMap[team] || team;
  };

  const homeTeam = getTeamDisplayName(post.homeTeamName || '미정');
  const awayTeam = getTeamDisplayName(post.awayTeamName || '미정');
  const homeColor = TEAM_COLORS[homeTeam] || '#ef4b5f';
  const awayColor = TEAM_COLORS[awayTeam] || '#666';
  const currentParticipants = getParticipantCount(post);
  const maxParticipants = getMaxParticipantCount(post);
  const isFull = currentParticipants >= maxParticipants;
  const ratio = Math.min(currentParticipants / maxParticipants, 1);

  return (
    <div
      className="card"
      onClick={() => onClick(post.id)}
      style={{ cursor: 'pointer', overflow: 'hidden', padding: 0, backgroundColor: '#fff', borderRadius: '16px', border: '1px solid #eee', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
    >
      <div style={{ height: 4, background: homeColor }} />
      <div style={{ padding: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '10px', fontWeight: '800', color: homeColor, background: `${homeColor}15`, border: `1px solid ${homeColor}30`, padding: '3px 8px', borderRadius: '8px' }}>
              {homeTeam}
            </span>
            <span style={{ fontSize: '10px', fontWeight: '700', color: '#ccc' }}>VS</span>
            <span style={{ fontSize: '10px', fontWeight: '800', color: awayColor, background: `${awayColor}15`, border: `1px solid ${awayColor}30`, padding: '3px 8px', borderRadius: '8px' }}>
              {awayTeam}
            </span>
          </div>
          <StatusBadge status={post.status} />
        </div>

        <div style={{ marginBottom: 10, fontSize: '16px', fontWeight: '800', color: '#222' }}>{post.title}</div>

        <div style={{ marginBottom: 16, display: 'flex', gap: 10, fontSize: '12px', color: '#999' }}>
          <span>📍 {post.stadium || '경기장 미정'}</span>
          <span>📅 {post.matchDate}</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <div style={{ flex: 1, height: 4, background: '#f5f5f5', borderRadius: 999, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${ratio * 100}%`, background: isFull ? '#ccc' : homeColor, borderRadius: 999, transition: 'width 0.3s ease' }} />
          </div>
          <span style={{ fontSize: 12, color: '#666', fontWeight: 700 }}>👤 {currentParticipants}/{maxParticipants}명</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', backgroundColor: homeColor, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 'bold' }}>
              {post.authorNickname?.slice(0, 1)}
            </div>
            <div style={{ fontSize: '13px', fontWeight: '700', color: '#333' }}>{post.authorNickname}</div>
          </div>
          {user?.nickname === post.authorNickname && (
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(post.id); }}
              style={{ background: 'none', border: 'none', color: '#ff4d4f', fontSize: '11px', cursor: 'pointer', fontWeight: 'bold' }}
            >
              삭제
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// 페이지네이션 컴포넌트
function Pagination({ currentPage, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: totalPages }, (_, i) => i);

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 6, marginTop: 24 }}>
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 0}
        style={{
          padding: '6px 12px', borderRadius: 8, border: '1px solid #ddd',
          background: '#fff', cursor: currentPage === 0 ? 'not-allowed' : 'pointer',
          color: currentPage === 0 ? '#ccc' : '#333',
        }}
      >
        이전
      </button>

      {pages.map((page) => (
        <button
          key={page}
          onClick={() => onPageChange(page)}
          style={{
            padding: '6px 12px', borderRadius: 8, border: '1px solid #ddd',
            background: currentPage === page ? '#ef4b5f' : '#fff',
            color: currentPage === page ? '#fff' : '#333',
            fontWeight: currentPage === page ? 700 : 400,
            cursor: 'pointer',
          }}
        >
          {page + 1}
        </button>
      ))}

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages - 1}
        style={{
          padding: '6px 12px', borderRadius: 8, border: '1px solid #ddd',
          background: '#fff', cursor: currentPage === totalPages - 1 ? 'not-allowed' : 'pointer',
          color: currentPage === totalPages - 1 ? '#ccc' : '#333',
        }}
      >
        다음
      </button>
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

  // 페이지네이션 상태
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
    stadium: '',
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
      let postsArray = [];
      let pageInfo = { totalPages: 0, totalElements: 0 };

      if (responseData?.success && responseData?.data?.content) {
        postsArray = responseData.data.content;
        pageInfo = {
          totalPages: responseData.data.totalPages ?? 0,
          totalElements: responseData.data.totalElements ?? 0,
        };
      } else if (responseData?.data?.content) {
        postsArray = responseData.data.content;
        pageInfo = {
          totalPages: responseData.data.totalPages ?? 0,
          totalElements: responseData.data.totalElements ?? 0,
        };
      } else if (responseData?.content) {
        postsArray = responseData.content;
        pageInfo = {
          totalPages: responseData.totalPages ?? 0,
          totalElements: responseData.totalElements ?? 0,
        };
      } else if (Array.isArray(responseData?.data)) {
        postsArray = responseData.data;
      }

      // currentParticipants 필드명 정규화
      setPosts(postsArray.map(normalizePost));
      setTotalPages(pageInfo.totalPages);
      setTotalElements(pageInfo.totalElements);
      setCurrentPage(page);
    } catch (err) {
      console.error('데이터 로드 실패:', err);
      setPosts(MEETUP_DUMMY.map(normalizePost));
      setTotalPages(1);
      setTotalElements(MEETUP_DUMMY.length);
    } finally {
      setLoading(false);
    }
  }, [filterTeam, filterStatus]);

  // 필터 변경 시 1페이지로 초기화
  useEffect(() => {
    setCurrentPage(0);
    fetchMates(0);
  }, [filterTeam, filterStatus]);

  const handlePageChange = (page) => {
    if (page < 0 || page >= totalPages) return;
    fetchMates(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const filteredPosts = posts.filter((post) => {
    if (filterTeam !== 'ALL') {
      const targetId = TEAM_CODE_MAP[filterTeam];
      const isIdMatch = post.homeTeamId === targetId || post.awayTeamId === targetId;
      const filterName = TEAMS.find((t) => t.id === filterTeam)?.name || '';
      const isNameMatch =
        (post.homeTeamName || '').includes(filterName) ||
        (post.awayTeamName || '').includes(filterName) ||
        (post.supportTeamName || '').includes(filterName);

      if (!isIdMatch && !isNameMatch) return false;
    }

    if (filterStatus === 'FULL' && getParticipantCount(post) < getMaxParticipantCount(post)) {
      return false;
    }

    return true;
  });

  const handleDelete = async (postId) => {
    if (!window.confirm('정말 삭제하시겠습니까?')) return;
    try {
      await api.delete(`/posts/${postId}`);
      fetchMates(currentPage);
    } catch {
      alert('삭제 실패');
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
      stadium: '',
      matchTime: '',
    });
  };

  const handleCreate = async (e) => {
    e.preventDefault();

    try {
      const payload = {
        boardType: 'MATE',
        title: formData.title,
        content: formData.content,
        matchDate: formData.matchDate,
        homeTeamId: String(TEAM_CODE_MAP[formData.homeTeamId] || formData.homeTeamId),
        awayTeamId: String(TEAM_CODE_MAP[formData.awayTeamId] || formData.awayTeamId),
        supportTeamId: String(TEAM_CODE_MAP[formData.supportTeamId] || formData.supportTeamId),
        maxParticipants: Number(formData.maxParticipants),
        stadium: formData.stadium,
        matchTime: formData.matchTime,
      };

      await api.post('/posts', payload);
      setIsModalOpen(false);
      resetForm();
      fetchMates(0); // 등록 후 1페이지로 이동
      alert('모집글이 등록되었습니다.');
    } catch (err) {
      console.error('등록 실패:', err);
      alert('등록 실패');
    }
  };

  return (
    <div className="meetup-page">
      <div className="page-header">
        <h2 className="page-title">직관 메이트 모집</h2>
        <p className="page-subtitle">응원할 경기에서 함께할 메이트를 찾아보세요.</p>
      </div>

      <div style={{ background: '#fff', padding: '20px 24px', borderRadius: '12px', marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
        <TeamFilter selected={filterTeam} onChange={setFilterTeam} />
        <div style={{ display: 'flex', gap: '8px' }}>
          {[{ id: 'ALL', label: '전체 상태' }, { id: 'OPEN', label: '모집 중' }, { id: 'FULL', label: '마감' }].map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setFilterStatus(id)}
              style={{
                padding: '6px 14px', fontSize: '13px', fontWeight: '500', borderRadius: '18px',
                cursor: 'pointer', border: filterStatus === id ? 'none' : '1px solid #eee',
                backgroundColor: filterStatus === id ? '#ef4b5f' : '#fff',
                color: filterStatus === id ? '#fff' : '#666',
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* 총 게시글 수 */}
      {totalElements > 0 && (
        <div style={{ fontSize: 13, color: '#888', marginBottom: 12 }}>
          총 <strong>{totalElements}</strong>개의 모집글
        </div>
      )}

      <div className="page-content">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>로딩 중...</div>
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
                style={{
                  cursor: 'pointer', display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center', minHeight: '220px',
                  borderRadius: '16px', border: '2px dashed #ddd', backgroundColor: '#f9f9f9', transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#ef4b5f'; e.currentTarget.style.backgroundColor = '#fff5f6'; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#ddd'; e.currentTarget.style.backgroundColor = '#f9f9f9'; }}
              >
                <div style={{ fontSize: '40px', color: '#ef4b5f', marginBottom: '8px' }}>+</div>
                <div style={{ fontSize: '14px', fontWeight: '700', color: '#888' }}>새 모집글 작성</div>
              </div>

              {filteredPosts.map((post) => (
                <MeetupCard key={post.id} post={post} user={user} onClick={onSelectPost} onDelete={handleDelete} />
              ))}
            </div>

            {/* 페이지네이션 */}
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          </>
        )}
      </div>

      {isModalOpen && (
        <div
          style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
          onClick={() => setIsModalOpen(false)}
        >
          <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 460, padding: 24 }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ marginBottom: 20 }}>직관 메이트 모집</h3>
            <form onSubmit={handleCreate}>
              <input placeholder="제목" style={{ width: '100%', marginBottom: 12, borderRadius: 10, padding: 10, border: '1px solid #ddd', boxSizing: 'border-box' }} value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} required />
              <textarea placeholder="내용" style={{ width: '100%', height: 100, marginBottom: 12, borderRadius: 10, padding: 10, border: '1px solid #ddd', boxSizing: 'border-box', resize: 'none' }} value={formData.content} onChange={(e) => setFormData({ ...formData, content: e.target.value })} required />

              <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                <select style={{ flex: 1, padding: 8, borderRadius: 10, border: '1px solid #ddd' }} value={formData.homeTeamId} onChange={(e) => setFormData({ ...formData, homeTeamId: e.target.value })} required>
                  <option value="">홈팀</option>
                  {TEAMS.filter((t) => t.id !== 'ALL').map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
                <select style={{ flex: 1, padding: 8, borderRadius: 10, border: '1px solid #ddd' }} value={formData.awayTeamId} onChange={(e) => setFormData({ ...formData, awayTeamId: e.target.value })} required>
                  <option value="">원정팀</option>
                  {TEAMS.filter((t) => t.id !== 'ALL').map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>

              <select style={{ width: '100%', marginBottom: 12, padding: 8, borderRadius: 10, border: '1px solid #ddd', boxSizing: 'border-box' }} value={formData.supportTeamId} onChange={(e) => setFormData({ ...formData, supportTeamId: e.target.value })} required>
                <option value="">응원 팀</option>
                {TEAMS.filter((t) => t.id !== 'ALL').map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>

              <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                <input type="date" style={{ flex: 1, padding: 8, borderRadius: 10, border: '1px solid #ddd', boxSizing: 'border-box' }} value={formData.matchDate} onChange={(e) => setFormData({ ...formData, matchDate: e.target.value })} required />
                <input type="time" style={{ flex: 1, padding: 8, borderRadius: 10, border: '1px solid #ddd', boxSizing: 'border-box' }} value={formData.matchTime} onChange={(e) => setFormData({ ...formData, matchTime: e.target.value })} required />
              </div>

              <select style={{ width: '100%', marginBottom: 12, padding: 10, borderRadius: 10, border: '1px solid #ddd', boxSizing: 'border-box' }} value={formData.stadium} onChange={(e) => setFormData({ ...formData, stadium: e.target.value })} required>
                <option value="">경기장 선택</option>
                {STADIUM_OPTIONS.map((stadium) => (
                  <option key={stadium} value={stadium}>{stadium}</option>
                ))}
              </select>

              <input type="number" min="2" max="99" placeholder="최대 인원" style={{ width: '100%', marginBottom: 20, borderRadius: 10, padding: 10, border: '1px solid #ddd', boxSizing: 'border-box' }} value={formData.maxParticipants} onChange={(e) => setFormData({ ...formData, maxParticipants: e.target.value })} required />

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