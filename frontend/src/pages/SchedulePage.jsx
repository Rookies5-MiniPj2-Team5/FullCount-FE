import { useState, useEffect } from 'react'
import { TeamBadge } from '../components/TeamComponents'

// 네이버 스포츠 팀 코드 → 내부 팀 ID 매핑
const NAVER_TEAM_MAP = {
  'LG':   'LG',
  'OB':   'DU',  // 두산
  'SK':   'SSG', // SSG
  'HT':   'KIA',
  'SS':   'SA',  // 삼성
  'LT':   'LO',  // 롯데
  'HH':   'HH',  // 한화
  'KT':   'KT',
  'NC':   'NC',
  'WO':   'WO',  // 키움
  // 팀명으로도 매핑
  'LG트윈스': 'LG',
  '두산베어스': 'DU',
  'SSG랜더스': 'SSG',
  'KIA타이거즈': 'KIA',
  '삼성라이온즈': 'SA',
  '롯데자이언츠': 'LO',
  '한화이글스': 'HH',
  'KT위즈': 'KT',
  'NC다이노스': 'NC',
  '키움히어로즈': 'WO',
}

const MONTH_NAMES = ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월']
const DAY_NAMES = ['일','월','화','수','목','금','토']

// 날짜를 YYYYMMDD 형식으로
function formatDate(year, month, day = 1) {
  return `${year}${String(month).padStart(2,'0')}${String(day).padStart(2,'0')}`
}

// 네이버 스포츠 내부 API: 월 전체 일정
async function fetchNaverSchedule(year, month) {
  const dateStr = formatDate(year, month)
  // 네이버 스포츠 KBO 월 달력 API
  const url = `/naver-api/kbaseball/v2/schedule/monthlySchedule?category=kbo&date=${dateStr}00`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Naver API error: ${res.status}`)
  const json = await res.json()
  return json
}

// 네이버 스포츠 내부 API: 날짜별 경기 상세
async function fetchNaverDaySchedule(year, month, day) {
  const dateStr = formatDate(year, month, day)
  const url = `/naver-api/kbaseball/v2/schedule/gameList?category=kbo&date=${dateStr}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Naver API error: ${res.status}`)
  const json = await res.json()
  return json
}

// 네이버 API 응답을 내부 포맷으로 변환
function parseNaverGames(json, year, month) {
  // 응답 구조에 따라 유연하게 파싱
  const games = []

  // 구조 1: { result: { games: [...] } }
  // 구조 2: { games: [...] }
  // 구조 3: { scheduleList: [...] }
  const rawGames =
    json?.result?.games ||
    json?.result?.scheduleList ||
    json?.games ||
    json?.scheduleList ||
    []

  rawGames.forEach(g => {
    const homeCode = g.homeTeamCode || g.homeTeamId || g.home
    const awayCode = g.awayTeamCode || g.awayTeamId || g.away
    const homeId = NAVER_TEAM_MAP[homeCode] || homeCode
    const awayId = NAVER_TEAM_MAP[awayCode] || awayCode

    if (!homeId || !awayId) return

    const gameDate = g.gameDate || g.date || ''
    const day = parseInt(gameDate.substring(6, 8), 10) || 0

    games.push({
      id: g.gameId || `${gameDate}-${awayId}-${homeId}`,
      year, month, date: day,
      time: g.gameTime || g.time || '',
      stadium: g.stadium || g.stadiumName || '',
      home: homeId,
      away: awayId,
      homeScore: g.homeScore != null ? String(g.homeScore) : null,
      awayScore: g.awayScore != null ? String(g.awayScore) : null,
      status: g.statusInfo || g.gameState || g.status || '',
      isFinished: g.statusInfo === '경기종료' || g.gameState === 'RESULT' || (g.homeScore != null && g.awayScore != null),
      isCanceled: (g.statusInfo || '').includes('취소') || (g.gameState || '') === 'CANCEL',
    })
  })

  return games
}

export default function SchedulePage() {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [schedules, setSchedules] = useState([])
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState(null)
  const [teamFilter, setTeamFilter] = useState('ALL')

  useEffect(() => { loadSchedule() }, [year, month])

  const loadSchedule = async () => {
    setLoading(true)
    setErrorMsg(null)
    try {
      // 방법 1: 월별 달력 API
      let json = await fetchNaverSchedule(year, month)
      let games = parseNaverGames(json, year, month)

      // 달력 API 실패 시 방법 2: 현재 날짜 기준 주간 API 시도
      if (games.length === 0) {
        // 월의 첫 날 ~ 마지막 날까지 날짜별로 개별 요청 (최대 5개 날짜 샘플)
        const today = now.getDate()
        const sampleDays = [today, today+1, today+2, today-1, today-2].filter(d => d >= 1 && d <= 31)
        const promises = sampleDays.map(d => fetchNaverDaySchedule(year, month, d).catch(() => null))
        const results = await Promise.all(promises)
        results.forEach(r => {
          if (r) games.push(...parseNaverGames(r, year, month))
        })
        // 중복 제거
        const seen = new Set()
        games = games.filter(g => { if (seen.has(g.id)) return false; seen.add(g.id); return true })
      }

      setSchedules(games)
      if (games.length === 0) {
        setErrorMsg('이번 달 일정을 불러오지 못했습니다. API 응답 구조가 변경되었을 수 있습니다.')
      }
    } catch (e) {
      console.error('Schedule fetch error:', e)
      setErrorMsg('일정을 불러오지 못했습니다. 네트워크를 확인하거나 잠시 후 다시 시도해주세요.')
      setSchedules([])
    } finally {
      setLoading(false)
    }
  }

  const prevMonth = () => {
    if (month === 1) { setYear(y => y - 1); setMonth(12) }
    else setMonth(m => m - 1)
  }
  const nextMonth = () => {
    if (month === 12) { setYear(y => y + 1); setMonth(1) }
    else setMonth(m => m + 1)
  }

  const TEAMS = ['ALL','LG','DU','SSG','KIA','SA','LO','HH','KT','NC','WO']
  const TEAM_LABELS = { ALL:'전체', LG:'LG', DU:'두산', SSG:'SSG', KIA:'KIA', SA:'삼성', LO:'롯데', HH:'한화', KT:'KT', NC:'NC', WO:'키움' }

  const filtered = teamFilter === 'ALL'
    ? schedules
    : schedules.filter(s => s.home === teamFilter || s.away === teamFilter)

  // 날짜별 그룹화
  const grouped = filtered.reduce((acc, game) => {
    const key = `${game.year}-${String(game.month).padStart(2,'0')}-${String(game.date).padStart(2,'0')}`
    if (!acc[key]) acc[key] = []
    acc[key].push(game)
    return acc
  }, {})

  return (
    <div className="schedule-page">
      <div className="page-header">
        <h2 className="page-title">경기 일정</h2>
        <p className="page-subtitle">KBO 리그 경기 일정 및 결과를 확인하세요.</p>
      </div>

      {/* 월 네비게이션 */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:16, marginBottom:20 }}>
        <button
          onClick={prevMonth}
          style={{ background:'none', border:'1px solid #ddd', borderRadius:8, padding:'6px 14px', cursor:'pointer', fontSize:18 }}
        >‹</button>
        <span style={{ fontWeight:700, fontSize:18 }}>{year}년 {MONTH_NAMES[month-1]}</span>
        <button
          onClick={nextMonth}
          style={{ background:'none', border:'1px solid #ddd', borderRadius:8, padding:'6px 14px', cursor:'pointer', fontSize:18 }}
        >›</button>
        <button
          onClick={loadSchedule}
          style={{ background:'#e94560', color:'#fff', border:'none', borderRadius:8, padding:'6px 12px', cursor:'pointer', fontSize:13, fontWeight:600 }}
        >새로고침</button>
      </div>

      {/* 팀 필터 */}
      <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:20, justifyContent:'center' }}>
        {TEAMS.map(t => (
          <button key={t} onClick={() => setTeamFilter(t)} style={{
            padding:'5px 12px', borderRadius:20, border:'none', cursor:'pointer', fontSize:12, fontWeight:600,
            background: teamFilter === t ? '#e94560' : '#f0f0f0',
            color: teamFilter === t ? '#fff' : '#333',
          }}>{TEAM_LABELS[t]}</button>
        ))}
      </div>

      {/* 에러 배너 */}
      {errorMsg && (
        <div style={{ background:'#fff3cd', border:'1px solid #ffc107', borderRadius:8, padding:'10px 16px', marginBottom:16, fontSize:13, color:'#856404', display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
          ⚠️ {errorMsg}
          <a href="https://www.koreabaseball.com/Schedule/Schedule.aspx" target="_blank" rel="noreferrer"
            style={{ color:'#e94560', fontWeight:700 }}>KBO 공식 사이트 →</a>
        </div>
      )}

      <div className="page-content">
        {loading ? (
          <div className="empty-state">
            <div style={{ fontSize:40, marginBottom:12 }}>⏳</div>
            <p>일정 불러오는 중...</p>
          </div>
        ) : Object.keys(grouped).length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📅</div>
            <p>이번 달 경기 일정이 없습니다.</p>
          </div>
        ) : (
          Object.entries(grouped).sort(([a],[b]) => a.localeCompare(b)).map(([dateKey, games]) => {
            const d = new Date(dateKey + 'T00:00:00')
            const dayLabel = `${month}월 ${d.getDate()}일 (${DAY_NAMES[d.getDay()]})`
            const isWeekend = d.getDay() === 0 || d.getDay() === 6
            return (
              <div key={dateKey} style={{ marginBottom:24 }}>
                <div style={{
                  fontWeight:700, fontSize:14, padding:'7px 14px',
                  background: isWeekend ? '#fff0f3' : '#f8f9fa',
                  borderLeft: `4px solid ${isWeekend ? '#e94560' : '#aaa'}`,
                  borderRadius:4, marginBottom:10, color: isWeekend ? '#e94560' : '#333'
                }}>{dayLabel} · {games.length}경기</div>
                <div className="card-grid">
                  {games.map(game => (
                    <div key={game.id} className="card" style={{ position:'relative' }}>
                      {/* 상태 배지 */}
                      {game.isCanceled ? (
                        <span style={{ position:'absolute', top:8, right:8, background:'#f5f5f5', color:'#999', fontSize:10, fontWeight:700, padding:'2px 8px', borderRadius:10 }}>취소</span>
                      ) : game.isFinished ? (
                        <span style={{ position:'absolute', top:8, right:8, background:'#e8f5e9', color:'#2e7d32', fontSize:10, fontWeight:700, padding:'2px 8px', borderRadius:10 }}>경기종료</span>
                      ) : (
                        <span style={{ position:'absolute', top:8, right:8, background:'#e3f2fd', color:'#1565c0', fontSize:10, fontWeight:700, padding:'2px 8px', borderRadius:10 }}>예정</span>
                      )}
                      <div className="card-meta">🕒 {game.time || '시간미정'} · 📍 {game.stadium || '구장미정'}</div>
                      <div className="card-vs" style={{ marginTop:8, alignItems:'flex-start' }}>
                        <div style={{ textAlign:'center', flex:1 }}>
                          <div style={{ fontSize:11, color:'#999', marginBottom:4 }}>원정</div>
                          <TeamBadge teamId={game.away} />
                          {game.isFinished && (
                            <div style={{ fontSize:24, fontWeight:900, marginTop:6, color: game.awayScore > game.homeScore ? '#e94560' : '#333' }}>
                              {game.awayScore}
                            </div>
                          )}
                        </div>
                        <span style={{ fontSize:16, fontWeight:700, color:'#ccc', margin:'20px 8px 0' }}>VS</span>
                        <div style={{ textAlign:'center', flex:1 }}>
                          <div style={{ fontSize:11, color:'#999', marginBottom:4 }}>홈</div>
                          <TeamBadge teamId={game.home} />
                          {game.isFinished && (
                            <div style={{ fontSize:24, fontWeight:900, marginTop:6, color: game.homeScore > game.awayScore ? '#e94560' : '#333' }}>
                              {game.homeScore}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
