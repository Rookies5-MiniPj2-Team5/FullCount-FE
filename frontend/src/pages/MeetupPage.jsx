import { useState, useEffect, useMemo } from 'react'
import { useAuth } from '../context/AuthContext'
import { TeamBadge, TeamFilter, TEAMS } from '../components/TeamComponents'
import api from '../api/api'

export default function MeetupPage({ onSelectPost, initialOpen }) {
  const { user } = useAuth();
  const [posts, setPosts] = useState([])
  const [filter, setFilter] = useState('ALL')
  const [isModalOpen, setIsModalOpen] = useState(initialOpen || false)
  const [loading, setLoading] = useState(true)

  const [formData, setFormData] = useState({
    title: '', content: '', matchDate: '',
    homeTeamId: '', awayTeamId: '', maxParticipants: 2
  });

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const response = await api.get('/posts', { params: { boardType: 'MEETUP' } });
      // 공통 응답 포맷(data.data.content) 대응
      const content = response.data.data?.content || response.data.content || [];
      setPosts(Array.isArray(content) ? content : []);
    } catch (error) {
      console.error('게시글 로딩 실패:', error);
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  // posts가 undefined일 경우를 대비해 (posts || []) 사용
  const filtered = useMemo(() => {
    const safePosts = Array.isArray(posts) ? posts : [];
    if (filter === 'ALL') return safePosts;
    return safePosts.filter(p => 
      p.homeTeamName === filter || p.awayTeamName === filter || p.teamName === filter
    );
  }, [posts, filter]);

  const handleDelete = async (postId) => {
    if (!window.confirm('정말 삭제하시겠습니까?')) return;
    try {
      await api.delete(`/posts/${postId}`);
      fetchPosts();
    } catch (error) {
      alert('삭제 실패: 권한이 없거나 이미 예약된 글입니다.');
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post('/posts', { ...formData, boardType: 'MEETUP' });
      alert('모집글이 등록되었습니다!');
      setIsModalOpen(false);
      setFormData({ title: '', content: '', matchDate: '', homeTeamId: '', awayTeamId: '', maxParticipants: 2 });
      fetchPosts();
    } catch (error) {
      alert('등록에 실패했습니다.');
    }
  };

  return (
    <div className="meetup-page">
      <div className="page-header">
        <h2 className="page-title">직관 메이트 모집</h2>
        <p className="page-subtitle">함께 야구장에 갈 직관 메이트를 찾아보세요!</p>
      </div>

      <TeamFilter selected={filter} onChange={setFilter} />

      <div className="page-content">
        {loading ? (
          <div className="empty-state"><p>로딩 중...</p></div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">⚾</div>
            <p>모집글이 없습니다. 첫 글을 작성해보세요!</p>
          </div>
        ) : (
          <div className="card-grid">
            {filtered.map(post => (
              <div 
                key={post.id} 
                className="card"
                onClick={() => onSelectPost?.(post.id)}
                style={{ cursor: onSelectPost ? 'pointer' : 'default' }}
              >
                <div className="card-meta">
                  📅 {post.matchDate} · 👤 {post.authorNickname || '익명'}
                  {user?.nickname === post.authorNickname && (
                    <span
                      onClick={(e) => { e.stopPropagation(); handleDelete(post.id) }}
                      style={{ marginLeft: 'auto', color: '#e94560', cursor: 'pointer', fontSize: 12 }}
                    >삭제</span>
                  )}
                </div>
                <div className="card-vs">
                  <TeamBadge teamId={post.homeTeamName || 'LG'} />
                  <span style={{ fontSize: 13, color: '#999' }}>VS</span>
                  <TeamBadge teamId={post.awayTeamName || 'DU'} />
                </div>
                <div className="card-title">{post.title}</div>
                <div className="card-desc">{post.content}</div>
                <div className="card-footer">
                  <div className="author-info">
                    <div className="avatar-sm">{(post.authorNickname || 'U')[0]}</div>
                    <div>
                      <div className="author-name">{post.authorNickname || '익명'}</div>
                      <TeamBadge teamId={post.teamName || 'LG'} />
                    </div>
                  </div>
                  <div className="participant-count">👤 {post.maxParticipants}명 모집</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <button className="fab" onClick={() => setIsModalOpen(true)}>➕</button>

      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)} style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
          background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex',
          alignItems: 'center', justifyContent: 'center', padding: 20
        }}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 400, padding: 24 }}>
            <h3 style={{ marginBottom: 20 }}>직관 메이트 모집</h3>
            <form onSubmit={handleCreate}>
              <input
                placeholder="제목" style={{ width: '100%', marginBottom: 12, borderRadius: 8, padding: 10, border: '1px solid #ddd' }}
                value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} required
              />
              <textarea
                placeholder="내용" style={{ width: '100%', height: 100, marginBottom: 12, borderRadius: 8, padding: 10, border: '1px solid #ddd' }}
                value={formData.content} onChange={e => setFormData({ ...formData, content: e.target.value })} required
              />
              <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                <select
                  style={{ flex: 1, padding: 8, borderRadius: 8, border: '1px solid #ddd' }}
                  value={formData.homeTeamId}
                  onChange={e => setFormData({ ...formData, homeTeamId: e.target.value })} required
                >
                  <option value="">홈 팀</option>
                  {TEAMS.filter(t => t.id !== 'ALL').map((t, i) => <option key={t.id} value={i + 1}>{t.name}</option>)}
                </select>
                <select
                  style={{ flex: 1, padding: 8, borderRadius: 8, border: '1px solid #ddd' }}
                  value={formData.awayTeamId}
                  onChange={e => setFormData({ ...formData, awayTeamId: e.target.value })} required
                >
                  <option value="">어웨이</option>
                  {TEAMS.filter(t => t.id !== 'ALL').map((t, i) => <option key={t.id} value={i + 1}>{t.name}</option>)}
                </select>
              </div>
              <input
                type="date" style={{ width: '100%', marginBottom: 20, padding: 8, borderRadius: 8, border: '1px solid #ddd' }}
                value={formData.matchDate} onChange={e => setFormData({ ...formData, matchDate: e.target.value })} required
              />
              <div style={{ display: 'flex', gap: 10 }}>
                <button type="submit" style={{ flex: 1, padding: 12, background: '#e94560', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}>등록</button>
                <button type="button" onClick={() => setIsModalOpen(false)} style={{ flex: 1, padding: 12, background: '#eee', border: 'none', borderRadius: 8, cursor: 'pointer' }}>취소</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}