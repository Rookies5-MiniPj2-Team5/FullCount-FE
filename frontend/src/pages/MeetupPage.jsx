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

const ID_TO_TEAM_NAME = {
  1: 'LG', 2: '두산', 3: 'SSG', 4: 'KIA', 5: '삼성',
  6: '롯데', 7: '한화', 8: 'KT', 9: 'NC', 10: '키움',
};

const STADIUMS = {
  1: '잠실야구장', 2: '잠실야구장', 3: '인천 SSG 랜더스필드', 4: '광주-기아 챔피언스 필드',
  5: '대구 삼성 라이온즈 파크', 6: '사직야구장', 7: '한화생명 이글스 파크', 8: '수원 KT 위즈 파크',
  9: '창원 NC 파크', 10: '고척 스카이돔',
  LG: '잠실야구장', DU: '잠실야구장', SSG: '인천 SSG 랜더스필드', KIA: '광주-기아 챔피언스 필드',
  SA: '대구 삼성 라이온즈 파크', LO: '사직야구장', HH: '한화생명 이글스 파크', KT: '수원 KT 위즈 파크',
  NC: '창원 NC 파크', WO: '고척 스카이돔',
};

const STADIUM_OPTIONS = [

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
  return '미정';
};

// currentParticipants, maxParticipants 응답 필드명 정규화
const normalizePost = (post) => {
  if (!post) return post;
  return {
    ...post,
    currentParticipants:
      post.currentParticipants ??
      post.currentParticipantCount ??
      post.participantCount ??
      post.participants ??
      0,
    maxParticipants:
      post.maxParticipants ??
      post.maxParticipantCount ??
      post.maximumParticipants ??
      post.capacity ??
      0,
  };
};

const getParticipantCount = (post) => {
  const parsed = Number(post?.currentParticipants);
  return Number.isFinite(parsed) ? parsed : 0;
};

const getMaxParticipantCount = (post) => {
  const parsed = Number(post?.maxParticipants);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
};

function MeetupCard({ post, user, onClick, onDelete }) {
  const homeTeam = getNormalizedTeamName(post.homeTeamId, post.homeTeamName);
  const awayTeam = getNormalizedTeamName(post.awayTeamId, post.awayTeamName);
  const homeColor = TEAM_COLORS[homeTeam] || '#ef4b5f';
  const awayColor = TEAM_COLORS[awayTeam] || '#666';

  const currentParticipants = getParticipantCount(post);
  const maxParticipants = getMaxParticipantCount(post);
  const isFull = maxParticipants > 0 && currentParticipants >= maxParticipants;
  // maxParticipants가 0이면 프로그레스바 0%로 안전하게 처리
  const ratio = maxParticipants > 0 ? Math.min(currentParticipants / maxParticipants, 1) : 0;

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
            <div style={{
              height: '100%',
              width: `${ratio * 100}%`,
              background: isFull ? '#ccc' : homeColor,
              borderRadius: 999,
              transition: 'width 0.3s ease',
            }} />
          </div>
          <span style={{ fontSize: 12, color: '#666', fontWeight: 700 }}>
            👤 {currentParticipants}/{maxParticipants > 0 ? maxParticipants : '?'}명
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', backgroundColor: homeColor, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 'bold' }}>
              {post.authorNickname?.slice(0, 1)}
            </div>
            <div style={{ fontSize: '13px', fontWeight: '700', color: '#333' }}>{post.authorNickname}</div>
          </div>
          
          {/* 🚨 복구된 카드 내 수정 및 삭제 버튼 */}
          {user?.nickname === post.authorNickname && (

          )}
        </div>
      </div>
    </div>
  );
}

function Pagination({ currentPage, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;
  const pages = Array.from({ length: totalPages }, (_, i) => i);
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 6, marginTop: 24 }}>
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 0}
        style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid #ddd', background: '#fff', cursor: currentPage === 0 ? 'not-allowed' : 'pointer', color: currentPage === 0 ? '#ccc' : '#333' }}
      >
        이전
      </button>
      {pages.map((page) => (
        <button
          key={page}
          onClick={() => onPageChange(page)}
          style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid #ddd', background: currentPage === page ? '#ef4b5f' : '#fff', color: currentPage === page ? '#fff' : '#333', fontWeight: currentPage === page ? 700 : 400, cursor: 'pointer' }}
        >
          {page + 1}
        </button>
      ))}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages - 1}
        style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid #ddd', background: '#fff', cursor: currentPage === totalPages - 1 ? 'not-allowed' : 'pointer', color: currentPage === totalPages - 1 ? '#ccc' : '#333' }}
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


  const fetchMates = useCallback(async (page = 0) => {
    setLoading(true);
    try {
      const selectedTeamId = filterTeam === 'ALL' ? null : TEAM_CODE_MAP[filterTeam];
      const status = filterStatus === 'OPEN' ? 'OPEN' : null;

      const response = await api.get('/posts', {

      });

      const responseData = response.data;
      let postsArray = [];


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


  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (formData.homeTeamId && formData.homeTeamId === formData.awayTeamId) {
      alert('홈 팀과 어웨이 팀은 같을 수 없습니다.');
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

      };
      await api.post('/posts', payload);
      setIsModalOpen(false);

  return (
    <div className="meetup-page">
      <div className="page-header">
        <h2 className="page-title">직관 메이트 모집</h2>

      </div>

      <div style={{ background: '#fff', padding: '20px 24px', borderRadius: '12px', marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
        <TeamFilter selected={filterTeam} onChange={setFilterTeam} />

      </div>

      {totalElements > 0 && (
        <div style={{ fontSize: 13, color: '#888', marginBottom: 12 }}>
          총 <strong>{totalElements}</strong>개의 모집글
        </div>
      )}

      <div className="page-content">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>로딩 중...</div>
        ) : (

        )}
      </div>

      {isModalOpen && (
        <div
          style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
          onClick={() => setIsModalOpen(false)}
        >
          <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 460, padding: 24, maxHeight: '90vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ marginBottom: 20 }}>직관 메이트 모집</h3>
            <form onSubmit={handleCreate}>

                  <option value="">홈 팀</option>
                  {TEAMS.filter((t) => t.id !== 'ALL').map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
                <select style={{ flex: 1, padding: 8, borderRadius: 10, border: '1px solid #ddd' }} value={formData.awayTeamId} onChange={(e) => handleTeamChange('away', e.target.value)} required>
                  <option value="">어웨이 팀</option>
                  {TEAMS.filter((t) => t.id !== 'ALL').map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>


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