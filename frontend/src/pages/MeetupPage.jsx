import { useState } from 'react'
import { TeamBadge, TeamFilter } from '../components/TeamComponents'

// 목 데이터
const MEETUP_POSTS = [
  {
    id: 1,
    date: '2026-03-28', time: '18:30', stadium: '잠실야구장',
    homeTeam: 'LG', awayTeam: 'DU',
    title: '3/28 잠실 LG vs 두산 같이 보실분~',
    desc: '기아전 같이 보구가요! 3루 홈원정 자리 있습니다. 맥주 한잔 하면서 즐겁게 관람해요!',
    author: '야구매니아', authorTeam: 'LG', authorInitial: '야',
    current: 2, max: 4,
  },
  {
    id: 2,
    date: '2026-03-28', time: '18:30', stadium: '인천SSG랜더스필드',
    homeTeam: 'SSG', awayTeam: 'KIA',
    title: '인천 SSG 경기 보실 직관리 구해요',
    desc: '퇴근하고 바로 가실 분! 외야석 예매했어요. 편하게 원하실 분 환영합니다.',
    author: '랜더스사랑', authorTeam: 'SSG', authorInitial: '랜',
    current: 1, max: 3,
  },
  {
    id: 3,
    date: '2026-03-28', time: '18:30', stadium: '대구삼성라이온즈파크',
    homeTeam: 'SA', awayTeam: 'LO',
    title: '대구 삼성 홈경기 같이 가요!',
    desc: '삼성 라이온즈 20년차 팬입니다. 즐겁게 관람하실 분 구합니다.',
    author: '라이온즈킹', authorTeam: 'SA', authorInitial: '라',
    current: 1, max: 3,
  },
  {
    id: 4,
    date: '2026-03-29', time: '14:00', stadium: '수원KT위즈파크',
    homeTeam: 'KT', awayTeam: 'NC',
    title: 'KT vs NC 주말 직관 같이 해요 ⚾',
    desc: '수원 경기 처음 가보시는 분도 환영! 경기장 맛집 알려드릴게요.',
    author: '위즈팬', authorTeam: 'KT', authorInitial: '위',
    current: 3, max: 5,
  },
]

export default function MeetupPage() {
  const [filter, setFilter] = useState('ALL')

  const filtered = filter === 'ALL'
    ? MEETUP_POSTS
    : MEETUP_POSTS.filter(p => p.homeTeam === filter || p.awayTeam === filter)

  return (
    <div>
      {/* 상단 */}
      <div className="top-bar">
        <h1><span className="icon">👥</span> 직관 메이트 모집</h1>
      </div>

      {/* 팀 필터 */}
      <TeamFilter selected={filter} onChange={setFilter} />

      {/* 게시글 목록 */}
      <div className="page-content">
        {filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">⚾</div>
            <p>해당 팀의 모집글이 없습니다.</p>
          </div>
        ) : filtered.map(post => (
          <div key={post.id} className="card">
            <div className="card-meta">
              📅 {post.date} · {post.time} · {post.stadium}
            </div>
            <div className="card-vs">
              <TeamBadge teamId={post.homeTeam} />
              <span style={{ fontSize: 13, color: '#999' }}>VS</span>
              <TeamBadge teamId={post.awayTeam} />
            </div>
            <div className="card-title">{post.title}</div>
            <div className="card-desc">{post.desc}</div>
            <div className="card-footer">
              <div className="author-info">
                <div className="avatar-sm">{post.authorInitial}</div>
                <div>
                  <div className="author-name">{post.author}</div>
                  <TeamBadge teamId={post.authorTeam} />
                </div>
              </div>
              <div className="participant-count">
                👤 {post.current}/{post.max}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* FAB 작성 버튼 */}
      <button className="fab">👤</button>
    </div>
  )
}
