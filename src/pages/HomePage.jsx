import { TeamBadge } from '../components/TeamComponents'
import KboStandings from '../components/KboStandings'

export default function HomePage() {
  return (
    <div className="home-page">
      <div className="page-header">
        <h2 className="page-title">⚾ FULL COUNT</h2>
        <p className="page-subtitle">대한민국 야구 직관의 모든 것, 풀카운트와 함께하세요!</p>
      </div>

      {/* 2컬럼 레이아웃: 왼쪽 메인 + 오른쪽 순위 */}
      <div className="home-layout">

        {/* ── 왼쪽: 기존 콘텐츠 ── */}
        <div className="home-main">

          {/* 배너 */}
          <div className="home-banner">
            <div className="home-banner-label">오늘의 경기</div>
            <div className="home-banner-match">LG vs 두산</div>
            <div className="home-banner-sub">오후 6:30 · 잠실야구장</div>
          </div>

          {/* 빠른 메뉴 */}
          <div className="quick-menu">
            {[
              { icon: '👥', label: '직관 메이트' },
              { icon: '👥', label: '직관 크루' },
              { icon: '📅', label: '경기 일정' },
              { icon: '🎟️', label: '티켓 양도' },
            ].map(m => (
              <div key={m.label} className="quick-menu-item">
                <span className="quick-menu-icon">{m.icon}</span>
                <span className="quick-menu-label">{m.label}</span>
              </div>
            ))}
          </div>

          {/* 최신 모집글 */}
          <div className="home-section">
            <div className="home-section-title">🔥 최신 모집글</div>
            {[
              { team1: 'LG', team2: 'DU', title: '3/28 잠실 LG vs 두산 같이 보실분~', count: '2/4' },
              { team1: 'SSG', team2: 'KIA', title: '인천 SSG 경기 보실 직관리 구해요', count: '1/3' },
            ].map((p, i) => (
              <div key={i} className="card" style={{ borderRadius: 12, marginBottom: 8, border: '1px solid #eee' }}>
                <div className="card-vs">
                  <TeamBadge teamId={p.team1} />
                  <span style={{ fontSize: 12, color: '#bbb', margin: '0 4px' }}>VS</span>
                  <TeamBadge teamId={p.team2} />
                </div>
                <div style={{ fontSize: 14, fontWeight: 600, margin: '6px 0 4px' }}>{p.title}</div>
                <div style={{ fontSize: 12, color: '#e94560', fontWeight: 700 }}>👤 {p.count}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── 오른쪽: KBO 순위 위젯 ── */}
        <KboStandings />
      </div>
    </div>
  )
}
