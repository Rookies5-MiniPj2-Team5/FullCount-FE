import { useState, useEffect } from 'react'
import { TEAM_LOGO } from './TeamComponents'

// KBO 공식 팀명 → 내부 팀 ID 매핑
const KBO_TEAM_MAP = {
  'LG':   'LG',
  '두산':  'DU',
  'SSG':  'SSG',
  'KIA':  'KIA',
  '삼성':  'SA',
  '롯데':  'LO',
  '한화':  'HH',
  'KT':   'KT',
  'NC':   'NC',
  '키움':  'WO',
}

// 팀 색상
const TEAM_COLORS = {
  LG: '#C30452', DU: '#131230', SSG: '#CE0E2D', KIA: '#EA0029',
  SA: '#074CA1', LO: '#A50021', HH: '#FF6600', KT: '#222',
  NC: '#315288', WO: '#570514',
}

// KBO 공식 홈페이지 순위 HTML 파싱
// koreabaseball.com은 서버사이드 렌더링이라 fetch로 실제 테이블 데이터를 가져올 수 있음
async function fetchKboStandings() {
  const res = await fetch(
    '/kbo-official/Record/TeamRank/TeamRankDaily.aspx',
    {
      headers: {
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'ko-KR,ko;q=0.9',
      },
    }
  )
  if (!res.ok) throw new Error(`fetch failed: ${res.status}`)
  const html = await res.text()

  const parser = new DOMParser()
  const doc = parser.parseFromString(html, 'text/html')

  // KBO 공식 사이트 순위 테이블 셀렉터
  // 실제 구조: <table class="tData01 tt"> 또는 id="tblRecord"
  const tableSelectors = [
    '#content table tbody tr',
    'table.tData01 tbody tr',
    '#tblRecord tbody tr',
    '.record_list table tbody tr',
    'table tbody tr',
  ]

  let rows = []
  for (const selector of tableSelectors) {
    rows = doc.querySelectorAll(selector)
    if (rows.length >= 8) break
  }

  const standings = []
  rows.forEach((row) => {
    const cells = row.querySelectorAll('td')
    if (cells.length < 7) return

    // 첫 번째 셀이 순위(숫자)인지 확인
    const rankText = cells[0]?.textContent?.trim()
    const rank = parseInt(rankText, 10)
    if (isNaN(rank) || rank < 1 || rank > 10) return

    // 두 번째 셀이 팀명
    const teamName = cells[1]?.textContent?.trim()
    const teamId = KBO_TEAM_MAP[teamName]
    if (!teamId) return

    standings.push({
      rank,
      teamId,
      teamName,
      games: cells[2]?.textContent?.trim() || '-',
      wins: cells[3]?.textContent?.trim() || '-',
      draws: cells[4]?.textContent?.trim() || '-',
      losses: cells[5]?.textContent?.trim() || '-',
      pct: cells[6]?.textContent?.trim() || '-',
      gb: cells[7]?.textContent?.trim() || '-',
    })
  })

  // 순위순으로 정렬
  standings.sort((a, b) => a.rank - b.rank)
  return standings
}

// 파싱 실패 시 사용할 목업 데이터 (실제 순위를 불러오지 못했을 때 표시)
const MOCK_STANDINGS = [
  { rank: 1,  teamId: 'KIA', teamName: 'KIA',  games: '-', wins: '-', draws: '-', losses: '-', pct: '-', gb: '-' },
  { rank: 2,  teamId: 'LG',  teamName: 'LG',   games: '-', wins: '-', draws: '-', losses: '-', pct: '-', gb: '-' },
  { rank: 3,  teamId: 'SA',  teamName: '삼성',  games: '-', wins: '-', draws: '-', losses: '-', pct: '-', gb: '-' },
  { rank: 4,  teamId: 'SSG', teamName: 'SSG',  games: '-', wins: '-', draws: '-', losses: '-', pct: '-', gb: '-' },
  { rank: 5,  teamId: 'LO',  teamName: '롯데',  games: '-', wins: '-', draws: '-', losses: '-', pct: '-', gb: '-' },
  { rank: 6,  teamId: 'KT',  teamName: 'KT',   games: '-', wins: '-', draws: '-', losses: '-', pct: '-', gb: '-' },
  { rank: 7,  teamId: 'NC',  teamName: 'NC',   games: '-', wins: '-', draws: '-', losses: '-', pct: '-', gb: '-' },
  { rank: 8,  teamId: 'DU',  teamName: '두산',  games: '-', wins: '-', draws: '-', losses: '-', pct: '-', gb: '-' },
  { rank: 9,  teamId: 'HH',  teamName: '한화',  games: '-', wins: '-', draws: '-', losses: '-', pct: '-', gb: '-' },
  { rank: 10, teamId: 'WO',  teamName: '키움',  games: '-', wins: '-', draws: '-', losses: '-', pct: '-', gb: '-' },
]

export default function KboStandings() {
  const [standings, setStandings] = useState([])
  const [loading, setLoading] = useState(true)
  const [isMock, setIsMock] = useState(false)
  const [lastUpdated, setLastUpdated] = useState('')

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
          // 파싱 결과가 부족하면 목업 사용
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
            `${now.getMonth() + 1}/${now.getDate()} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`
          )
        }
      })

    return () => { cancelled = true }
  }, [])

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
            return (
              <div
                key={team.teamId}
                className={`standings-row ${isTop5 ? 'standings-row--playoff' : ''}`}
                style={{ '--team-color': color }}
              >
                <span className="col-rank">
                  {team.rank <= 3 ? (
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
                  <span className="standings-team-name">{team.teamName}</span>
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
