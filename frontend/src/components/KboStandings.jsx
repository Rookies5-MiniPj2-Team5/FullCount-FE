import { useState, useEffect } from 'react'
import { TEAM_LOGO, TEAM_NAME } from './TeamComponents'
import api from '../api/api'

// 팀 색상
const TEAM_COLORS = {
  LG: '#C30452', DU: '#131230', SSG: '#CE0E2D', KIA: '#EA0029',
  SA: '#074CA1', LO: '#A50021', HH: '#FF6600', KT: '#222',
  NC: '#315288', WO: '#570514',
}

// 백엔드 자체 API 호출 (프론트엔드 크롤링 제거)
async function fetchKboStandings() {
  const res = await api.get('/baseball/standings')
  let data = res.data

  // GlobalResponseAdvice 래핑 처리
  if (data?.success && data?.data) {
    data = data.data
  }

  // 숫자로 계산되는 rank 필드만 안전하게 Number 캐스팅
  data = data.map(team => ({
    ...team,
    rank: parseInt(team.rank, 10)
  }))

  return data
}

// 파싱 실패 시 사용할 목업 데이터
const MOCK_STANDINGS = [
  { rank: 1, teamId: 'KIA', teamName: 'KIA', games: '-', wins: '-', draws: '-', losses: '-', pct: '-', gb: '-' },
  { rank: 2, teamId: 'LG', teamName: 'LG', games: '-', wins: '-', draws: '-', losses: '-', pct: '-', gb: '-' },
  { rank: 3, teamId: 'SA', teamName: '삼성', games: '-', wins: '-', draws: '-', losses: '-', pct: '-', gb: '-' },
  { rank: 4, teamId: 'SSG', teamName: 'SSG', games: '-', wins: '-', draws: '-', losses: '-', pct: '-', gb: '-' },
  { rank: 5, teamId: 'LO', teamName: '롯데', games: '-', wins: '-', draws: '-', losses: '-', pct: '-', gb: '-' },
  { rank: 6, teamId: 'KT', teamName: 'KT', games: '-', wins: '-', draws: '-', losses: '-', pct: '-', gb: '-' },
  { rank: 7, teamId: 'NC', teamName: 'NC', games: '-', wins: '-', draws: '-', losses: '-', pct: '-', gb: '-' },
  { rank: 8, teamId: 'DU', teamName: '두산', games: '-', wins: '-', draws: '-', losses: '-', pct: '-', gb: '-' },
  { rank: 9, teamId: 'HH', teamName: '한화', games: '-', wins: '-', draws: '-', losses: '-', pct: '-', gb: '-' },
  { rank: 10, teamId: 'WO', teamName: '키움', games: '-', wins: '-', draws: '-', losses: '-', pct: '-', gb: '-' },
]

// prop: myTeam (선택된 팀 ID), onMyTeamChange (팀 ID => void)
export default function KboStandings({ myTeam, onMyTeamChange }) {
  const [standings, setStandings] = useState([])
  const [loading, setLoading] = useState(true)
  const [isMock, setIsMock] = useState(false)
  const [lastUpdated, setLastUpdated] = useState('')
  const [tooltip, setTooltip] = useState(null) // 선택 안내 툴팁

  useEffect(() => {
    let cancelled = false
    setLoading(true)

    fetchKboStandings()
      .then((data) => {
        if (cancelled) return
        if (data && data.length >= 5) {
          setStandings(data)
          setIsMock(false)
        } else {
          setStandings(MOCK_STANDINGS)
          setIsMock(true)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setStandings(MOCK_STANDINGS)
          setIsMock(true)
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false)
          const now = new Date()
          setLastUpdated(
            `${now.getMonth() + 1}/${now.getDate()} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
          )
        }
      })

    return () => { cancelled = true }
  }, [])

  function handleRowClick(teamId) {
    if (!onMyTeamChange) return
    const newTeam = teamId === myTeam ? null : teamId // 같은 팀 클릭 시 해제
    onMyTeamChange(newTeam)
    setTooltip(newTeam ? `⭐ ${TEAM_NAME[teamId] || teamId} 팀이 내 팀으로 설정되었습니다!` : '내 팀 설정이 해제되었습니다.')
    setTimeout(() => setTooltip(null), 2200)
  }

  return (
    <aside className="kbo-standings-widget">
      {/* 헤더 */}
      <div className="standings-header">
        <div className="standings-title">
          <span className="standings-icon">🏆</span>
          <span>KBO 팀 순위</span>
          {isMock && (
            <span className="standings-mock-badge">업데이트 불가</span>
          )}
        </div>
        {lastUpdated && (
          <span className="standings-updated">기준 {lastUpdated}</span>
        )}
      </div>

      {/* My Team 안내 배너 */}
      <div className="standings-my-team-hint">
        {myTeam ? (
          <span>
            <span style={{ color: TEAM_COLORS[myTeam] }}>⭐</span>{' '}
            <strong>{TEAM_NAME[myTeam] || myTeam}</strong> 팀 응원 중 · 행을 클릭해 변경
          </span>
        ) : (
          <span>👆 팀 행을 클릭해 내 팀을 설정하세요</span>
        )}
      </div>

      {/* 툴팁 토스트 */}
      {tooltip && (
        <div className="standings-toast">{tooltip}</div>
      )}

      {/* 컬럼 헤더 */}
      <div className="standings-col-header">
        <span className="col-rank">순위</span>
        <span className="col-team">팀</span>
        <span className="col-num">경기</span>
        <span className="col-num">승</span>
        <span className="col-num">패</span>
        <span className="col-pct">승률</span>
        <span className="col-gb">게임차</span>
      </div>

      {/* 순위 목록 */}
      <div className="standings-list">
        {loading ? (
          <div className="standings-loading">
            <div className="standings-spinner" />
            <span>순위 불러오는 중...</span>
          </div>
        ) : (
          standings.map((team) => {
            const logo = TEAM_LOGO[team.teamId]
            const color = TEAM_COLORS[team.teamId] || '#e94560'
            const isTop5 = team.rank <= 5
            const isMyTeam = team.teamId === myTeam
            return (
              <div
                key={team.teamId}
                className={[
                  'standings-row',
                  isTop5 ? 'standings-row--playoff' : '',
                  isMyTeam ? 'standings-row--my-team' : '',
                  onMyTeamChange ? 'standings-row--clickable' : '',
                ].join(' ')}
                style={{
                  '--team-color': color,
                  ...(isMyTeam
                    ? { background: `${color}18`, borderLeft: `3px solid ${color}` }
                    : {}),
                }}
                onClick={() => handleRowClick(team.teamId)}
                title={onMyTeamChange ? (isMyTeam ? '클릭해서 해제' : '클릭해서 내 팀으로 설정') : undefined}
              >
                <span className="col-rank">
                  {isMyTeam ? (
                    <span className="rank-my-team-star">⭐</span>
                  ) : team.rank <= 3 ? (
                    <span className="rank-medal">
                      {team.rank === 1 ? '🥇' : team.rank === 2 ? '🥈' : '🥉'}
                    </span>
                  ) : (
                    <span className={`rank-num ${isTop5 ? 'rank-playoff' : ''}`}>
                      {team.rank}
                    </span>
                  )}
                </span>
                <span className="col-team">
                  {logo && (
                    <img
                      src={logo}
                      alt={team.teamName}
                      className="standings-logo"
                      style={{ background: color + '18' }}
                    />
                  )}
                  <span
                    className="standings-team-name"
                    style={isMyTeam ? { color, fontWeight: 800 } : {}}
                  >
                    {team.teamName}
                  </span>
                </span>
                <span className="col-num">{team.games}</span>
                <span className="col-num standings-wins">{team.wins}</span>
                <span className="col-num">{team.losses}</span>
                <span className="col-pct">{team.pct}</span>
                <span className="col-gb">{team.gb}</span>
              </div>
            )
          })
        )}
      </div>

      {/* 포스트시즌 구분선 설명 */}
      <div className="standings-legend">
        <span className="legend-dot playoff" />
        <span>포스트시즌 진출권 (1~5위)</span>
        {myTeam && (
          <>
            <span className="legend-dot" style={{ background: TEAM_COLORS[myTeam], marginLeft: 8 }} />
            <span>내 팀</span>
          </>
        )}
      </div>

      {/* KBO 바로가기 */}
      <a
        href="https://www.koreabaseball.com/Record/TeamRank/TeamRankDaily.aspx"
        target="_blank"
        rel="noopener noreferrer"
        className="standings-link"
      >
        KBO 공식 순위 보기 →
      </a>
    </aside>
  )
}
