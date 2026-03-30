import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { TeamBadge, TeamFilter, TEAMS } from '../components/TeamComponents'
import api from '../api/api'

export default function MeetupPage() {
  const { user } = useAuth();
  const [posts, setPosts] = useState([])
  const [filter, setFilter] = useState('ALL')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [loading, setLoading] = useState(true)

  // 작성 폼 상태
  const [formData, setFormData] = useState({
    title: '', content: '', matchDate: '', 
    homeTeamId: '', awayTeamId: '', maxParticipants: 2
  })

  const fetchPosts = async () => {
    try {
      setLoading(true)
      const response = await api.get('/posts', { params: { boardType: 'MEETUP' } })
      setPosts(response.data.content)
    } catch (error) {
      console.error('게시글 로딩 실패:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPosts()
  }, [])

  const handleCreate = async (e) => {
    e.preventDefault()
    try {
      await api.post('/posts', { ...formData, boardType: 'MEETUP' })
      alert('모집글이 등록되었습니다!')
      setIsModalOpen(false)
      fetchPosts()
    } catch (error) {
      alert('등록에 실패했습니다.')
    }
  }

  const handleDelete = async (postId) => {
    if (!window.confirm('정말 삭제하시겠습니까?')) return
    try {
      await api.delete(`/posts/${postId}`)
      fetchPosts()
    } catch (error) {
      alert('삭제 실패: 권한이 없거나 이미 예약된 글입니다.')
    }
  }

  const filtered = filter === 'ALL'
    ? posts
    : posts.filter(p => p.homeTeamName === filter || p.awayTeamName === filter || p.teamName === filter)

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
          <div key={post.id} className="card">
            <div className="card-meta">
              📅 {post.matchDate} · 👤 {post.authorNickname}
              {user?.nickname === post.authorNickname && (
                <span 
                  onClick={() => handleDelete(post.id)} 
                  style={{ marginLeft: 'auto', color: '#e94560', cursor: 'pointer', fontSize: 10 }}
                >삭제</span>
              )}
            </div>
            <div className="card-vs">
              {post.homeTeamName ? <TeamBadge teamId={post.homeTeamName} /> : <TeamBadge teamId="LG" />}
              <span style={{ fontSize: 13, color: '#999' }}>VS</span>
              {post.awayTeamName ? <TeamBadge teamId={post.awayTeamName} /> : <TeamBadge teamId="DU" />}
            </div>
            <div className="card-title">{post.title}</div>
            <div className="card-desc">{post.content}</div>
            <div className="card-footer">
              <div className="author-info">
                <div className="avatar-sm">{post.authorNickname.substring(0, 1)}</div>
                <div>
                  <div className="author-name">{post.authorNickname}</div>
                  <TeamBadge teamId={post.teamName || 'LG'} />
                </div>
              </div>
              <div className="participant-count">
                👤 {post.maxParticipants}명 모집
              </div>
            </div>
          </div>
            ))}
          </div>
        )}
      </div>

      <button className="fab" onClick={() => setIsModalOpen(true)}>➕</button>

      {/* 작성 모달 (단순 구현) */}
      {isModalOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
          background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', 
          alignItems: 'center', justifyContent: 'center', padding: 20
        }}>
          <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 400, padding: 24 }}>
            <h3 style={{ marginBottom: 20 }}>직관 메이트 모집</h3>
            <form onSubmit={handleCreate}>
              <input 
                placeholder="제목" className="chip" style={{ width: '100%', marginBottom: 12, borderRadius: 8, padding: 10, border: '1px solid #ddd' }}
                value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} required
              />
              <textarea 
                placeholder="내용" className="chip" style={{ width: '100%', height: 100, marginBottom: 12, borderRadius: 8, padding: 10, border: '1px solid #ddd' }}
                value={formData.content} onChange={e => setFormData({...formData, content: e.target.value})} required
              />
              <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                <select 
                  style={{ flex: 1, padding: 8, borderRadius: 8, border: '1px solid #ddd' }}
                  onChange={e => setFormData({...formData, homeTeamId: e.target.value})} required
                >
                  <option value="">홈 팀 선택</option>
                  {TEAMS.filter(t => t.id !== 'ALL').map((t, i) => <option key={t.id} value={i+1}>{t.name}</option>)}
                </select>
                <select 
                   style={{ flex: 1, padding: 8, borderRadius: 8, border: '1px solid #ddd' }}
                   onChange={e => setFormData({...formData, awayTeamId: e.target.value})} required
                >
                  <option value="">어웨이 선택</option>
                  {TEAMS.filter(t => t.id !== 'ALL').map((t, i) => <option key={t.id} value={i+1}>{t.name}</option>)}
                </select>
              </div>
              <input 
                type="date" style={{ width: '100%', marginBottom: 20, padding: 8, borderRadius: 8, border: '1px solid #ddd' }}
                value={formData.matchDate} onChange={e => setFormData({...formData, matchDate: e.target.value})} required
              />
              <div style={{ display: 'flex', gap: 10 }}>
                <button type="submit" style={{ flex: 1, padding: 12, background: '#e94560', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700 }}>등록</button>
                <button type="button" onClick={() => setIsModalOpen(false)} style={{ flex: 1, padding: 12, background: '#eee', border: 'none', borderRadius: 8 }}>취소</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
