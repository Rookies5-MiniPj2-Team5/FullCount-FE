import { useState, useEffect, useRef } from 'react'
import { TEAM_LOGO, TEAM_NAME } from './TeamComponents'
import WeatherWidget from './WeatherWidget'
import api from '../api/api'


// ─────────────────────────────────────────
// 라이브 스코어 API 설정 (백엔드 자체 API 호출)
// ─────────────────────────────────────────
const LIVE_SCORE_API_URL = '/api/baseball/live'
const POLLING_INTERVAL_MS = 30_000 // 30초

// 네이버 API 팀 코드 매핑
const NAVER_TEAM_MAP = {
  LG: 'LG', OB: 'DU', DU: 'DU', SK: 'SSG', SSG: 'SSG',
  HT: 'KIA', KIA: 'KIA', SS: 'SA', SA: 'SA',
  LT: 'LO', LO: 'LO', HH: 'HH', KT: 'KT', NC: 'NC', WO: 'WO'
}

const STADIUM_MAP = {
  LG: '잠실', DU: '잠실', SSG: '인천', KIA: '광주',
  SA: '대구', LO: '부산', HH: '대전', KT: '수원',
  NC: '창원', WO: '고척'
}

// 팀 컬러
const TEAM_COLORS = {
  LG: '#C30452', DU: '#131230', SSG: '#CE0E2D', KIA: '#EA0029',
  SA: '#074CA1', LO: '#A50021', HH: '#FF6600', KT: '#222',
  NC: '#315288', WO: '#570514',
}

// 구장 → 날씨 위젯 key 매핑
const STADIUM_WEATHER_KEY = {
  잠실: '잠실', 인천: '인천', 수원: '수원', 대구: '대구',
  부산: '부산', 광주: '광주', 대전: '대전', 창원: '창원',
  고척: '서울', 청주: '청주',
}

// Mock 데이터: 라이브 경기 중 상태 (Python 백엔드 준비 전 UI 시연용)
const MOCK_LIVE_GAMES = [
  {
    id: 'game-lg-du',
    status: 'live',       // 'scheduled' | 'live' | 'final' | 'cancelled'
    homeTeam: 'LG',
    awayTeam: 'DU',
    homeScore: 3,
    awayScore: 2,
    inning: 7,
    inningHalf: 'bottom', // 'top' | 'bottom'
    stadium: '잠실',
    startTime: '18:30',
    bases: [false, true, false], // [1루, 2루, 3루]
    outs: 1,
    pitcher: { home: '임찬규', away: '곽빈' },
  },
  {
    id: 'game-kia-sa',
    status: 'scheduled',
    homeTeam: 'KIA',
    awayTeam: 'SA',
    homeScore: null,
    awayScore: null,
    inning: null,
    inningHalf: null,
    stadium: '광주',
    startTime: '18:30',
    bases: [false, false, false],
    outs: 0,
    pitcher: { home: '양현종', away: '원태인' },
  },
  {
    id: 'game-hh-ssg',
    status: 'final',
    homeTeam: 'HH',
    awayTeam: 'SSG',
    homeScore: 5,
    awayScore: 3,
    inning: 9,
    inningHalf: 'bottom',
    stadium: '대전',
    startTime: '14:00',
    bases: [false, false, false],
    outs: 3,
    pitcher: { home: '문동주', away: '노경은' },
  },
]

// 주자 다이아몬드 (1루/2루/3루)
function BaseDiamond({ bases = [false, false, false] }) {
  const [first, second, third] = bases
  return (
    <div className="base-diamond" title="주자 현황">
      {/* 2루 */}
      <div className="base-row base-row--top">
        <div className={`base base--second ${second ? 'base--on' : ''}`} />
      </div>
      {/* 3루 · 1루 */}
      <div className="base-row base-row--mid">
        <div className={`base base--third ${third ? 'base--on' : ''}`} />
        <div className={`base base--first ${first ? 'base--on' : ''}`} />
      </div>
      {/* 홈 */}
      <div className="base-row base-row--bot">
        <div className="base base--home" />
      </div>
    </div>
  )
}

// ── 데모 모드 전용 (발표 시 실시간 경기가 아닐 때도 항상 활성화) ──
const IS_DEMO_MODE = true;

// 단일 경기 카드
function GameCard({ game, isMyTeam, onJoinChat }) {
  const homeColor = TEAM_COLORS[game.homeTeam] || '#e94560'
  const awayColor = TEAM_COLORS[game.awayTeam] || '#444'

  return (
    <div
      className={`todays-game-card ${isMyTeam ? 'todays-game-card--featured' : ''}`}
      style={isMyTeam ? { '--featured-color': homeColor } : {}}
    >
      {/* 상단: 상태 + 구장 + 날씨 */}
      <div className="tgc-top">
        <div className="tgc-top-left">
          {game.status === 'live' && (
            <span className="live-badge">
              <span className="live-dot" />
              LIVE
            </span>
          )}
          {game.status === 'scheduled' && (
            <span className="tgc-status tgc-status--scheduled">⏰ {game.startTime} 예정</span>
          )}
          {game.status === 'final' && (
            <span className="tgc-status tgc-status--final">🏁 경기 종료</span>
          )}
          {game.status === 'cancelled' && (
            <span className="tgc-status tgc-status--cancelled">🚫 취소</span>
          )}
          <span className="tgc-stadium">📍 {game.stadium}</span>
        </div>
        <WeatherWidget stadiumKey={STADIUM_WEATHER_KEY[game.stadium] ?? '잠실'} />
      </div>

      {/* 중앙: 스코어보드 */}
      <div className="tgc-scoreboard">
        {/* 원정팀 */}
        <div className="tgc-team tgc-team--away">
          {TEAM_LOGO[game.awayTeam] && (
            <img src={TEAM_LOGO[game.awayTeam]} alt={game.awayTeam} className="tgc-logo" />
          )}
          <span className="tgc-team-name" style={{ color: '#fff' }}>
            {TEAM_NAME[game.awayTeam] ?? game.awayTeam}
          </span>
          <span className="tgc-role-label">원정</span>
        </div>

        {/* 스코어 / 예정 */}
        <div className="tgc-center">
          {game.status === 'scheduled' ? (
            <div className="tgc-vs">VS</div>
          ) : (
            <>
              <div className="tgc-score-row">
                <span
                  className="tgc-score"
                  style={{ color: game.awayScore > game.homeScore ? '#FF4D4F' : '#888' }}
                >
                  {game.awayScore ?? '-'}
                </span>
                <span className="tgc-score-sep">:</span>
                <span
                  className="tgc-score"
                  style={{ color: game.homeScore > game.awayScore ? '#FF4D4F' : '#888' }}
                >
                  {game.homeScore ?? '-'}
                </span>
              </div>
              {game.status === 'live' && (
                <div className="tgc-inning">
                  {game.inningText || '진행중'}
                </div>
              )}
            </>
          )}
        </div>

        {/* 홈팀 */}
        <div className="tgc-team tgc-team--home">
          <span className="tgc-role-label">홈</span>
          <span className="tgc-team-name" style={{ color: '#fff' }}>
            {TEAM_NAME[game.homeTeam] ?? game.homeTeam}
          </span>
          {TEAM_LOGO[game.homeTeam] && (
            <img src={TEAM_LOGO[game.homeTeam]} alt={game.homeTeam} className="tgc-logo" />
          )}
        </div>
      </div>

      {/* 하단: 라이브 정보 (이닝 중일 때만) -- 하단 버튼과의 여백을 위해 마진 추가 가능 */}
      {(game.status === 'live') && (
        <div className="tgc-live-info">
          <div className="tgc-live-detail">
            <BaseDiamond bases={game.bases} />
            <div className="tgc-outs">
              <span className="tgc-outs-label">아웃</span>
              <div className="tgc-out-dots">
                {[0, 1, 2].map((i) => (
                  <span key={i} className={`out-dot ${i < game.outs ? 'out-dot--on' : ''}`} />
                ))}
              </div>
            </div>
          </div>
          <div className="tgc-pitchers">
            <span className="tgc-pitcher-label">선발</span>
            <span>{game.pitcher.away}</span>
            <span className="tgc-pitcher-sep">vs</span>
            <span>{game.pitcher.home}</span>
          </div>
        </div>
      )}

      {/* 예정 경기: 선발 투수 표시 */}
      {game.status === 'scheduled' && (
        <div className="tgc-scheduled-info">
          <span className="tgc-pitcher-label">선발</span>
          <span>{game.pitcher.away}</span>
          <span className="tgc-pitcher-sep">vs</span>
          <span>{game.pitcher.home}</span>
        </div>
      )}

      {/* 실시간 응원 참여 버튼 (데모 모드 시 항상 노출) */}
      {(game.status === 'live' || IS_DEMO_MODE) && (
        <button
          className="tgc-join-btn"
          onClick={(e) => {
            e.stopPropagation();
            onJoinChat && onJoinChat(game);
          }}
        >
          🔴 실시간 응원 참여
        </button>
      )}
    </div>
  )
}

// ─────────────────────────────────────────
// 메인 컴포넌트
// props: myTeam (string|null) — 내 팀 ID
// onJoinChat: (game) => void  — 채팅 참여 핸들러
// ─────────────────────────────────────────
export default function TodaysGame({ myTeam, onJoinChat }) {
  const [games, setGames] = useState(MOCK_LIVE_GAMES)
  const [lastFetched, setLastFetched] = useState(null)
  const [apiAvailable, setApiAvailable] = useState(false)
  const timerRef = useRef(null)

  async function fetchLiveScore() {
    try {
      // [시연용 임시 코드] 오늘이 월요일이라 데이터가 없으므로 어제 날짜로 강제 변경
      const demoDate = new Date();
      demoDate.setDate(demoDate.getDate() - 1);
      const today = demoDate.toISOString().slice(0, 10);
      
      const res = await api.get(`/baseball/live?date=${today}`)
      const data = res.data;

      // 스프링부트 글로벌 Response 래퍼(data: {...})가 있을 경우를 모두 대응
      const gamesArray = data?.data?.result?.games || data?.result?.games || [];

      const parsedGames = gamesArray.map(g => {
        const homeId = NAVER_TEAM_MAP[g.homeTeamCode] || g.homeTeamCode
        const awayId = NAVER_TEAM_MAP[g.awayTeamCode] || g.awayTeamCode

        let status = 'scheduled'
        if (g.statusCode === 'PLAYING') status = 'live'
        if (g.statusCode === 'RESULT') status = 'final'
        if (g.statusCode === 'CANCEL') status = 'cancelled'

        let startTime = g.gameDateTime ? g.gameDateTime.slice(11, 16) : ''

        return {
          id: g.gameId,
          status,
          homeTeam: homeId,
          awayTeam: awayId,
          homeScore: g.homeTeamScore,
          awayScore: g.awayTeamScore,
          inningText: g.statusInfo,
          stadium: STADIUM_MAP[homeId] || '잠실',
          startTime,
          bases: [false, false, false], // 이 API에는 주자/아웃 데이터가 없음
          outs: 0,
          pitcher: { home: '', away: '' }
        }
      })

      // API 호출이 성공했다면 경기가 없어도(휴식일) 데이터를 세팅합니다.
      setGames(parsedGames)
      setApiAvailable(true)
      setLastFetched(new Date())
    } catch (e) {
      console.error('라이브 스코어 패칭 실패:', e)
      // 에러 시 mock 데이터 유지
    }
  }

  useEffect(() => {
    fetchLiveScore()
    timerRef.current = setInterval(fetchLiveScore, POLLING_INTERVAL_MS)
    return () => clearInterval(timerRef.current)
  }, [])

  // myTeam 경기 우선 정렬
  const sortedGames = myTeam
    ? [...games].sort((a, b) => {
      const aIsMe = a.homeTeam === myTeam || a.awayTeam === myTeam
      const bIsMe = b.homeTeam === myTeam || b.awayTeam === myTeam
      return bIsMe - aIsMe
    })
    : games

  return (
    <div className="todays-game-section">
      <div className="home-section-title">
        ⚾ 오늘의 경기
        {!apiAvailable && (
          <span className="tgs-mock-badge">미리보기 데이터</span>
        )}
        {apiAvailable && lastFetched && (
          <span className="tgs-updated">
            {String(lastFetched.getHours()).padStart(2, '0')}:{String(lastFetched.getMinutes()).padStart(2, '0')} 업데이트
          </span>
        )}
      </div>

      <div className="todays-game-list">
        {sortedGames.length === 0 ? (
          <div className="rest-day-message" style={{ textAlign: 'center', padding: '40px 0', color: '#888' }}>
            <h3 style={{ marginBottom: '10px' }}>오늘은 KBO 정규리그 휴식일입니다 ⚾</h3>
            <p>선수들이 재충전하는 날입니다. 내일 열릴 멋진 경기를 기대해 주세요!</p>
          </div>
        ) : (
          sortedGames.map((game) => {
            const isMyTeam = myTeam && (game.homeTeam === myTeam || game.awayTeam === myTeam)
            return (
              <GameCard
                key={game.id}
                game={game}
                isMyTeam={!!isMyTeam}
                onJoinChat={onJoinChat}
              />
            )
          })
        )}
      </div>
    </div>
  )
}
