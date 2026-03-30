import { TeamBadge } from '../components/TeamComponents'

export default function HomePage() {
  return (
    <div className="home-page">
      <div className="page-header">
        <h2 className="page-title">⚾ FULL COUNT</h2>
        <p className="page-subtitle">대한민국 야구 직관의 모든 것, 풀카운트와 함께하세요!</p>
      </div>
      <div className="page-content">

        {/* 배너 */}
        <div style={{
          background: 'linear-gradient(135deg, #1a2a4a 0%, #e94560 100%)',
          borderRadius: 16,
          marginBottom: 20,
        }}>
          <div style={{ fontSize: 13, opacity: 0.8, marginBottom: 4 }}>오늘의 경기</div>
          <div style={{ fontSize: 20, fontWeight: 800 }}>LG vs 두산</div>
          <div style={{ fontSize: 13, opacity: 0.7, marginTop: 4 }}>오후 6:30 · 잠실야구장</div>
        </div>

        {/* 빠른 메뉴 */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
          {[
            { icon: '👥', label: '직관 메이트' },
            { icon: '👥', label: '직관 크루' },
            { icon: '📅', label: '경기 일정' },
            { icon: '🎟️', label: '티켓 양도' },
          ].map(m => (
            <div key={m.label} style={{
              flex: 1, background: '#fff', borderRadius: 12, padding: '14px 0',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
              boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
            }}>
              <span style={{ fontSize: 22 }}>{m.icon}</span>
              <span style={{ fontSize: 11, color: '#555', fontWeight: 600 }}>{m.label}</span>
            </div>
          ))}
        </div>

        {/* 최신 모집글 */}
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>🔥 최신 모집글</div>
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
    </div>
  )
}
