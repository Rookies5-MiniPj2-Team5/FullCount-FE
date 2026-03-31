import { useState } from 'react'
import { TeamBadge } from '../components/TeamComponents'
import KboStandings from '../components/KboStandings'
import TodaysGame from '../components/TodaysGame'
import stadiumBg from '../assets/stadium_hero.png'

// status: 'recruiting' | 'closed' | 'urgent'
const RECRUITMENT_POSTS = [
  {
    team1: 'LG', team2: 'DU',
    title: '3/28 잠실 LG vs 두산 같이 보실분~',
    count: '2/4',
    status: 'recruiting',
    dDay: null,
  },
  {
    team1: 'SSG', team2: 'KIA',
    title: '인천 SSG 경기 보실 직관리 구해요',
    count: '3/3',
    status: 'closed',
    dDay: null,
  },
  {
    team1: 'HH', team2: 'SA',
    title: '4/2 한화 vs 삼성 대전원정 직관 모집!',
    count: '1/4',
    status: 'urgent',
    dDay: 2,
  },
]

function StatusBadge({ status, dDay }) {
  if (status === 'recruiting') {
    return <span className="recruit-badge recruit-badge--open">✅ 모집중</span>
  }
  if (status === 'closed') {
    return <span className="recruit-badge recruit-badge--closed">🔒 마감</span>
  }
  if (status === 'urgent') {
    return <span className="recruit-badge recruit-badge--urgent">🔥 D-{dDay}</span>
  }
  return null
}

export default function HomePage({ onNavigate }) {
  // ── My Team 상태 (localStorage 영속) ──
  const [myTeam, setMyTeam] = useState(() => {
    try { return localStorage.getItem('myTeam') || null } catch { return null }
  })

  function handleMyTeamChange(teamId) {
    setMyTeam(teamId)
    try {
      if (teamId) localStorage.setItem('myTeam', teamId)
      else localStorage.removeItem('myTeam')
    } catch { /* ignore */ }
  }

  return (
    <div className="home-page">

      {/* ── Hero Section ── */}
      <div className="home-hero">
        <img className="home-hero__bg" src={stadiumBg} alt="야구 경기장" />
        <div className="home-hero__overlay" />
        <div className="home-hero__content">
          <div className="home-hero__eyebrow">⚾ FULL COUNT</div>
          <h1 className="home-hero__title">대한민국 야구 직관의<br />모든 것</h1>
          <p className="home-hero__sub">지금 바로 직관 메이트를 찾고, 함께 야구장을 만끽하세요!</p>
          <button
            className="home-hero__cta"
            onClick={() => onNavigate && onNavigate('meetup-create')}
          >
            🤝 메이트 구하기
          </button>
        </div>
      </div>

      {/* 2컬럼 레이아웃 */}
      <div className="home-layout">

        {/* ── 왼쪽 ── */}
        <div className="home-main">

          {/* 빠른 메뉴 */}
          <div className="quick-menu">
            {[
              { icon: '🤝', label: '직관 메이트 구하기', action: 'meetup-create' },
              { icon: '🙌', label: '크루 가입하기', action: 'crew' },
              { icon: '🗓️', label: '경기일정 확인', action: 'schedule' },
              { icon: '🎫', label: '티켓 양도하기', action: 'meetup' },
            ].map(m => (
              <div
                key={m.label}
                className="quick-menu-item"
                onClick={() => onNavigate && onNavigate(m.action)}
              >
                <span className="quick-menu-icon" style={{ fontSize: '28px' }}>{m.icon}</span>
                <span className="quick-menu-label" style={{ fontSize: '13px', marginTop: '4px' }}>{m.label}</span>
              </div>
            ))}
          </div>

          {/* ── 오늘의 경기 (실시간 스코어 + 날씨) ── */}
          <TodaysGame myTeam={myTeam} />

          {/* 최신 모집글 */}
          <div className="home-section">
            <div className="home-section-title">🔥 최신 모집글</div>
            {RECRUITMENT_POSTS.map((p, i) => (
              <div
                key={i}
                className={`recruit-card${p.status === 'closed' ? ' recruit-card--closed' : ''}`}
                onClick={() => p.status !== 'closed' && onNavigate && onNavigate('meetup')}
              >
                {/* 상단: 팀 배지 + 상태 뱃지 */}
                <div className="recruit-card__head">
                  <div className="card-vs">
                    <TeamBadge teamId={p.team1} />
                    <span style={{ fontSize: 12, color: '#bbb', margin: '0 4px' }}>VS</span>
                    <TeamBadge teamId={p.team2} />
                  </div>
                  <StatusBadge status={p.status} dDay={p.dDay} />
                </div>

                {/* 제목 */}
                <div className="recruit-card__title">{p.title}</div>

                {/* 하단: 참여 인원 */}
                <div className="recruit-card__footer">
                  <span className="recruit-card__count">👤 {p.count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── 오른쪽: KBO 순위 (My Team 연동) ── */}
        <KboStandings myTeam={myTeam} onMyTeamChange={handleMyTeamChange} />
      </div>
    </div>
  )
}
