import { useState, useEffect, useCallback } from 'react'
import { TeamBadge, TeamFilter } from './TeamComponents'
import api from '../api/api'

const DAY_NAMES = ['일', '월', '화', '수', '목', '금', '토']

// ── 백엔드 API 헬퍼 ──────────────────────────────────────
async function fetchSeasonSchedule(year) {
  const res = await api.get(`/baseball/season?year=${year}`)
  let data = res.data;
  if (data?.success && data?.data) {
    data = data.data;
  }
  return data;
}

async function syncSchedule(year) {
  const res = await api.post(`/baseball/sync?year=${year}`)
  return res.data
}

// ── 서버 팀명 → 내부 teamId 매핑 ────────────────────────
const TEAM_MAP = {
  'LG': 'LG', 'LG트윈스': 'LG',
  '두산': 'DU', '두산베어스': 'DU', 'OB': 'DU',
  'SSG': 'SSG', 'SSG랜더스': 'SSG', 'SK': 'SSG',
  'KIA': 'KIA', 'KIA타이거즈': 'KIA', '기아': 'KIA', 'HT': 'KIA',
  '삼성': 'SA', '삼성라이온즈': 'SA', 'SS': 'SA',
  '롯데': 'LO', '롯데자이언츠': 'LO', 'LT': 'LO',
  '한화': 'HH', '한화이글스': 'HH',
  'KT': 'KT', 'KT위즈': 'KT',
  'NC': 'NC', 'NC다이노스': 'NC',
  '키움': 'WO', '키움히어로즈': 'WO', 'WO': 'WO',
}
function resolveTeamId(raw) {
  return TEAM_MAP[raw] ?? raw ?? '?'
}

// ── 날짜 파싱 헬퍼 ───────────────────────────────────────
/**
 * gameDate 값은 "20260320" 또는 "2026-03-20" 형식 모두 지원
 */
function parseDateStr(raw) {
  if (!raw) return null
  const s = String(raw).replace(/-/g, '')
  if (s.length < 8) return null
  const year = parseInt(s.slice(0, 4), 10)
  const month = parseInt(s.slice(4, 6), 10)
  const day = parseInt(s.slice(6, 8), 10)
  if (isNaN(year) || isNaN(month) || isNaN(day)) return null
  return { year, month, day }
}

const getScheduleUrl = (dateString) => {
  // dateString 포맷 예: '2026-04-01'
  return `https://m.sports.naver.com/kbaseball/schedule/index?date=${dateString}`;
};

// ── 경기 상태 배지 ───────────────────────────────────────
function GameStatusBadge({ isCanceled, status, homeScore, awayScore }) {
  const hasScore = homeScore != null && awayScore != null && homeScore !== '' && awayScore !== ''
  const isFinished = hasScore || (status && (status.includes('종료') || status === 'RESULT' || status === 'FINAL'))

  if (isCanceled) {
    return (
      <span className="game-badge game-badge--canceled">☔ 우천취소</span>
    )
  }
  if (isFinished) {
    return (
      <span className="game-badge game-badge--finished">✔ 경기종료</span>
    )
  }
  return (
    <span className="game-badge game-badge--scheduled">📅 예정</span>
  )
}

// ── 단일 경기 카드 ───────────────────────────────────────
function GameCard({ game }) {
  const homeId = resolveTeamId(game.homeTeam)
  const awayId = resolveTeamId(game.awayTeam)

  const hasScore =
    game.homeScore != null && game.awayScore != null &&
    game.homeScore !== '' && game.awayScore !== ''

  const homeParsed = hasScore ? Number(game.homeScore) : null
  const awayParsed = hasScore ? Number(game.awayScore) : null

  const homeWins = homeParsed != null && awayParsed != null && homeParsed > awayParsed
  const awayWins = homeParsed != null && awayParsed != null && awayParsed > homeParsed

  return (
    <div className={`game-card ${game.isCanceled ? 'game-card--canceled' : ''}`}>
      {/* 상태 배지 */}
      <div className="game-card__header">
        <span className="game-card__meta">
          🕒 {game.gameTime || '시간미정'} &nbsp;·&nbsp; 📍 {game.stadium || '구장미정'}
        </span>
        <GameStatusBadge
          isCanceled={game.isCanceled}
          status={game.status}
          homeScore={game.homeScore}
          awayScore={game.awayScore}
        />
      </div>

      {/* 매치업 */}
      <div className="game-card__matchup">
        {/* 원정팀 */}
        <div className="game-card__team">
          <div className="game-card__team-label">원정</div>
          <TeamBadge teamId={awayId} />
          {hasScore && (
            <div className={`game-card__score ${awayWins ? 'game-card__score--win' : ''}`}>
              {game.awayScore}
            </div>
          )}
        </div>

        <div className="game-card__vs">VS</div>

        {/* 홈팀 */}
        <div className="game-card__team">
          <div className="game-card__team-label">홈</div>
          <TeamBadge teamId={homeId} />
          {hasScore && (
            <div className={`game-card__score ${homeWins ? 'game-card__score--win' : ''}`}>
              {game.homeScore}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── 메인 컴포넌트 ────────────────────────────────────────
export default function ScheduleList({ year = new Date().getFullYear() }) {
  const [games, setGames] = useState([])
  const [loading, setLoading] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [error, setError] = useState(null)
  const [teamFilter, setTeamFilter] = useState('ALL')
  const [month, setMonth] = useState(new Date().getMonth() + 1)
  const [selectedDate, setSelectedDate] = useState(null)

  // ── 데이터 로드 ─────────────────────────────────────
  const loadGames = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchSeasonSchedule(year)
      setGames(Array.isArray(data) ? data : [])
    } catch (e) {
      console.error(e)
      setError(e.message || '일정을 불러오지 못했습니다.')
      setGames([])
    } finally {
      setLoading(false)
    }
  }, [year])

  useEffect(() => { loadGames() }, [loadGames])

  // ── 최신 동기화 ─────────────────────────────────────
  const handleSync = async () => {
    setSyncing(true)
    setError(null)
    try {
      await syncSchedule(year)
      await loadGames()
    } catch (e) {
      console.error(e)
      setError(e.message || '동기화에 실패했습니다.')
    } finally {
      setSyncing(false)
    }
  }

  // ── 필터링 ──────────────────────────────────────────
  const filtered = games.filter(g => {
    const date = parseDateStr(g.gameDate)
    if (!date) return false
    if (date.month !== month) return false
    if (teamFilter === 'ALL') return true
    return resolveTeamId(g.homeTeam) === teamFilter ||
      resolveTeamId(g.awayTeam) === teamFilter
  })

  // ── 날짜별 그룹화 ────────────────────────────────────
  const grouped = filtered.reduce((acc, game) => {
    const d = parseDateStr(game.gameDate)
    if (!d) return acc
    const key = `${d.year}-${String(d.month).padStart(2, '0')}-${String(d.day).padStart(2, '0')}`
    if (!acc[key]) acc[key] = []
    acc[key].push(game)
    return acc
  }, {})

  const sortedKeys = Object.keys(grouped).sort()

  // ── 선택된 날짜 자동 지정 ────────────────────────────────
  useEffect(() => {
    if (sortedKeys.length > 0) {
      if (!selectedDate || !sortedKeys.includes(selectedDate)) {
        const today = new Date();
        const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
        if (sortedKeys.includes(todayStr)) {
          setSelectedDate(todayStr);
        } else {
          setSelectedDate(sortedKeys[0]);
        }
      }
    } else {
      setSelectedDate(null);
    }
  }, [sortedKeys.join(','), selectedDate]);

  // 사용 가능한 월 목록 (전체 데이터 기준)
  const availableMonths = [...new Set(
    games.map(g => parseDateStr(g.gameDate)?.month).filter(Boolean)
  )].sort((a, b) => a - b)

  return (
    <div className="schedule-list">
      {/* ── 컨트롤 바 ── */}
      <div className="schedule-controls">
        {/* 월 선택 탭 */}
        <div className="schedule-month-tabs">
          {availableMonths.length > 0
            ? availableMonths.map(m => (
              <button
                key={m}
                className={`month-tab ${m === month ? 'active' : ''}`}
                onClick={() => setMonth(m)}
              >
                {m}월
              </button>
            ))
            : [3, 4, 5, 6, 7, 8, 9, 10].map(m => (
              <button
                key={m}
                className={`month-tab ${m === month ? 'active' : ''}`}
                onClick={() => setMonth(m)}
              >
                {m}월
              </button>
            ))
          }
        </div>

        {/* 동기화 버튼 */}
        <button
          className="sync-btn"
          onClick={handleSync}
          disabled={syncing || loading}
          title="네이버 API에서 최신 일정을 동기화합니다"
        >
          {syncing ? (
            <>
              <span className="spinner-sm" />
              동기화 중...
            </>
          ) : (
            <>🔄 최신 동기화</>
          )}
        </button>
      </div>

      {/* 팀 필터 */}
      <TeamFilter selected={teamFilter} onChange={setTeamFilter} />

      {/* 일자 이동 네비게이션 */}
      {sortedKeys.length > 0 && selectedDate && (
        <div className="schedule-date-nav" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1.5rem', margin: '1rem 0 1.5rem 0' }}>
          <button 
            onClick={() => {
              const idx = sortedKeys.indexOf(selectedDate);
              if (idx > 0) setSelectedDate(sortedKeys[idx - 1]);
            }}
            disabled={sortedKeys.indexOf(selectedDate) <= 0}
            style={{ 
              background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', 
              opacity: sortedKeys.indexOf(selectedDate) <= 0 ? 0.3 : 1,
              padding: '0.5rem', color: 'inherit'
            }}
          >
            ◀
          </button>
          
          <div style={{ textAlign: 'center', minWidth: '150px' }}>
            <h3 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 'bold' }}>
              {(() => {
                const d = new Date(selectedDate + 'T00:00:00')
                return `${d.getMonth() + 1}월 ${d.getDate()}일 (${DAY_NAMES[d.getDay()]})`
              })()}
            </h3>
            <span style={{ fontSize: '0.9rem', color: '#666' }}>
              {grouped[selectedDate]?.length || 0}경기
            </span>
          </div>

          <button 
            onClick={() => {
              const idx = sortedKeys.indexOf(selectedDate);
              if (idx < sortedKeys.length - 1) setSelectedDate(sortedKeys[idx + 1]);
            }}
            disabled={sortedKeys.indexOf(selectedDate) >= sortedKeys.length - 1}
            style={{ 
              background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', 
              opacity: sortedKeys.indexOf(selectedDate) >= sortedKeys.length - 1 ? 0.3 : 1,
              padding: '0.5rem', color: 'inherit'
            }}
          >
            ▶
          </button>
        </div>
      )}

      {/* 에러 배너 */}
      {error && (
        <div className="schedule-error-banner">
          ⚠️ {error}
          <button onClick={loadGames} className="schedule-error-retry">재시도</button>
        </div>
      )}

      {/* ── 콘텐츠 ── */}
      {(loading || syncing) ? (
        <div className="schedule-loading">
          <div className="schedule-spinner" />
          <p>{syncing ? '최신 일정을 동기화하는 중입니다...' : '경기 일정을 불러오는 중입니다...'}</p>
        </div>
      ) : sortedKeys.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📅</div>
          <p>
            {games.length === 0
              ? `${year}년 경기 일정이 없습니다. 동기화 버튼을 눌러 데이터를 가져오세요.`
              : `${month}월 경기 일정이 없습니다.`}
          </p>
          {games.length === 0 && (
            <button className="sync-btn sync-btn--center" onClick={handleSync} disabled={syncing}>
              {syncing ? '동기화 중...' : '🔄 지금 동기화하기'}
            </button>
          )}
        </div>
      ) : (
        <div className="schedule-groups">
          {selectedDate && grouped[selectedDate] && (() => {
            const dateKey = selectedDate;
            const d = new Date(dateKey + 'T00:00:00')
            const dayOfWeek = DAY_NAMES[d.getDay()]
            const isWeekend = d.getDay() === 0 || d.getDay() === 6
            const dayLabel = `${d.getMonth() + 1}월 ${d.getDate()}일 (${dayOfWeek})`

            return (
              <div key={dateKey} className="schedule-day-group">
                <div className={`schedule-day-header ${isWeekend ? 'schedule-day-header--weekend' : ''}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span className="schedule-day-label">{dayLabel}</span>
                  </div>
                  <a
                    href={getScheduleUrl(dateKey)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="naver-schedule-link"
                    style={{ fontSize: '0.85rem', color: '#03c75a', textDecoration: 'none', fontWeight: 'bold' }}
                  >
                    네이버 보러가기 ↗
                  </a>
                </div>
                <div className="game-card-grid">
                  {grouped[dateKey].map((game, idx) => (
                    <GameCard
                      key={game.id ?? `${dateKey}-${idx}`}
                      game={game}
                    />
                  ))}
                </div>
              </div>
            )
          })()}
        </div>
      )}
    </div>
  )
}
