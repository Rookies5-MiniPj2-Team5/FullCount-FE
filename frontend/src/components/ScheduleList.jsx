import { useState, useEffect, useCallback } from 'react'
import { TeamBadge, TeamFilter } from './TeamComponents'
import MatchDetailModal from './MatchDetailModal'
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

// ── 홈팀 기본 구장 매핑 ───────────────────────────────────
const DEFAULT_STADIUM = {
  LG: '잠실', DU: '잠실', SSG: '인천', KIA: '광주',
  SA: '대구', LO: '부산', HH: '대전', KT: '수원',
  NC: '창원', WO: '서울',
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

// ── 라이브 API 팀 코드 매핑 ───────────────────────────────
const NAVER_TEAM_MAP = {
  LG: 'LG', OB: 'DU', DU: 'DU', SK: 'SSG', SSG: 'SSG',
  HT: 'KIA', KIA: 'KIA', SS: 'SA', SA: 'SA',
  LT: 'LO', LO: 'LO', HH: 'HH', KT: 'KT', NC: 'NC', WO: 'WO',
};

// ── 라이브 API 응답에서 이 경기 데이터 추출 ────────────────
function findGameInLiveData(liveGames = [], homeId, awayId) {
  return liveGames.find(g => {
    const h = NAVER_TEAM_MAP[g.homeTeamCode] || g.homeTeamCode
    const a = NAVER_TEAM_MAP[g.awayTeamCode] || g.awayTeamCode
    return h === homeId && a === awayId
  }) || null
}

// ── 경기 상태 배지 ───────────────────────────────────────
function GameStatusBadge({ isCanceled, status }) {
  if (isCanceled) {
    return (
      <span className="game-badge game-badge--canceled">☔ 우천취소</span>
    )
  }
  if (status === 'live') {
    return (
      <span className="game-badge game-badge--scheduled" style={{ background: '#fff0f3', color: '#e94560', border: '1px solid #ffccd5' }}>
        🔴 라이브
      </span>
    )
  }
  const isFinished = (status === 'RESULT' || status === 'FINAL' || (status && (status.includes('종료') || status === 'FINISHED')))
  
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
function GameCard({ game, onClick, liveData }) {
  const homeId = resolveTeamId(game.homeTeam)
  const awayId = resolveTeamId(game.awayTeam)

  // 실시간 데이터(liveData)가 있으면 우선적으로 사용
  const isCanceled   = liveData ? (liveData.statusCode === 'CANCEL') : (game.canceled || game.isCanceled)
  const displayTime  = liveData?.gameDateTime 
    ? liveData.gameDateTime.slice(11, 16) 
    : (game.gameTime || null)
  
  const displayStadium = (game.stadium && game.stadium !== '' && game.stadium !== '구장미정')
    ? game.stadium
    : DEFAULT_STADIUM[homeId] || '구장미정'

  const homeScore = liveData?.homeTeamScore ?? game.homeScore ?? null
  const awayScore = liveData?.awayTeamScore ?? game.awayScore ?? null
  
  const hasScore =
    homeScore != null && awayScore != null &&
    homeScore !== '' && awayScore !== ''

  const homeParsed = hasScore ? Number(homeScore) : null
  const awayParsed = hasScore ? Number(awayScore) : null

  const homeWins = homeParsed != null && awayParsed != null && homeParsed > awayParsed
  const awayWins = homeParsed != null && awayParsed != null && awayParsed > homeParsed

  // 상태 결정 로직 강화
  let currentStatus = game.status
  if (liveData) {
    const sc = liveData.statusCode
    if (sc === 'PLAYING') currentStatus = 'live'
    else if (sc === 'RESULT') currentStatus = 'RESULT'
    else if (sc === 'CANCEL') currentStatus = 'CANCEL'
    else if (sc === 'READY' || sc === 'SCHEDULED') currentStatus = 'SCHEDULED'
  }

  // 미래 경기인데 종료로 표시되는 것 방지 (시간 기반 가드)
  const isFinishedStatus = (currentStatus === 'RESULT' || currentStatus === 'FINAL' || (currentStatus && currentStatus.includes('종료')))
  let finalStatus = currentStatus
  
  if (isFinishedStatus) {
    // 1. 점수 기반 체크: 0:0 이면 일단 의심
    const isZeroZero = Number(homeScore) === 0 && Number(awayScore) === 0
    
    // 2. 시간 기반 체크
    const gameDateObj = parseDateStr(game.gameDate)
    if (gameDateObj) {
      const [hour, min] = (displayTime || "18:30").split(':').map(Number)
      const gameDateTime = new Date(gameDateObj.year, gameDateObj.month - 1, gameDateObj.day, hour, min)
      const now = new Date()
      
      // 경기 시작 전이라면 상태가 '종료'여도 '예정'으로 표시
      if (now < gameDateTime) {
        finalStatus = 'SCHEDULED'
      } else if (isZeroZero && !liveData) {
        // 과거 경기인데 점수가 0:0이고 실시간 데이터도 없다면 아직 결과 반영 전이므로 '예정' 혹은 초기상태 유지
        finalStatus = 'SCHEDULED'
      }
    }
  }

  return (
    <div
      className={`game-card game-card--clickable ${isCanceled ? 'game-card--canceled' : ''}`}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onClick?.()}
      aria-label={`${game.awayTeam} vs ${game.homeTeam} 경기 상세 보기`}
    >
      {/* 상태 배지 */}
      <div className="game-card__header">
        <span className="game-card__meta">
          🕒 {displayTime || '시간미정'} &nbsp;·&nbsp; 📍 {displayStadium || '구장미정'}
        </span>
        <GameStatusBadge
          isCanceled={isCanceled}
          status={finalStatus}
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
              {awayScore}
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
              {homeScore}
            </div>
          )}
        </div>
      </div>

      {/* 호버 힌트 */}
      <div className="game-card__hover-hint">🔍 자세히 보기</div>
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
  const [selectedGame, setSelectedGame] = useState(null) // 모달 대상 경기
  const [dailyLiveData, setDailyLiveData] = useState([]) // 해당 날짜 실시간 정보

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

  // ── 해당 날짜 실시간 정보 로드 ─────────────────────────────
  useEffect(() => {
    if (!selectedDate) return
    let cancelled = false

    async function fetchDailyLive() {
      try {
        const res = await api.get(`/baseball/live?date=${selectedDate}`)
        if (!cancelled) {
          setDailyLiveData(res.data?.result?.games || [])
        }
      } catch (e) {
        console.error('Daily live fetch failed', e)
        if (!cancelled) setDailyLiveData([])
      }
    }
    fetchDailyLive()
    return () => { cancelled = true }
  }, [selectedDate])

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
                      liveData={findGameInLiveData(dailyLiveData, resolveTeamId(game.homeTeam), resolveTeamId(game.awayTeam))}
                      onClick={() => setSelectedGame({
                        ...game,
                        homeTeam: resolveTeamId(game.homeTeam),
                        awayTeam: resolveTeamId(game.awayTeam),
                        // 백엔드의 canceled 필드명을 isCanceled로 나지화
                        isCanceled: game.canceled || game.isCanceled,
                      })}
                    />
                  ))}
                </div>
              </div>
            )
          })()}
        </div>
      )}

      {/* ── 경기 상세 모달 ── */}
      {selectedGame && (
        <MatchDetailModal
          game={selectedGame}
          onClose={() => setSelectedGame(null)}
        />
      )}
    </div>
  )
}
