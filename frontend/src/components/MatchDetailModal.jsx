import { useState, useEffect, useCallback, useRef } from 'react'
import { TEAM_LOGO, TEAM_NAME } from './TeamComponents'
import WeatherWidget from './WeatherWidget'
import api from '../api/api'
import LiveChatPanel from './LiveChatPanel'

// ── 팀 색상 ──────────────────────────────────────────────
const TEAM_COLORS = {
  LG: '#C30452', DU: '#131230', SSG: '#CE0E2D', KIA: '#EA0029',
  SA: '#074CA1', LO: '#A50021', HH: '#FF6600', KT: '#222222',
  NC: '#315288', WO: '#570514',
}

// ── 홈팀 기본 구장 매핑 ───────────────────────────────────
const DEFAULT_STADIUM = {
  LG: '잠실', DU: '잠실', SSG: '인천', KIA: '광주',
  SA: '대구', LO: '부산', HH: '대전', KT: '수원',
  NC: '창원', WO: '서울',
}

// ── 구장명 → WeatherWidget key 매핑 ────────────────────
const STADIUM_WEATHER_KEY = {
  잠실: '잠실', 인천: '인천', 수원: '수원', 대구: '대구',
  부산: '부산', 광주: '광주', 대전: '대전', 창원: '창원',
  고척: '서울', 서울: '서울', 청주: '청주',
}

// ── 서버 팀명 → 내부 ID 매핑 ─────────────────────────────
const NAVER_TEAM_MAP = {
  LG: 'LG', OB: 'DU', DU: 'DU', SK: 'SSG', SSG: 'SSG',
  HT: 'KIA', KIA: 'KIA', SS: 'SA', SA: 'SA',
  LT: 'LO', LO: 'LO', HH: 'HH', KT: 'KT', NC: 'NC', WO: 'WO',
}

// ── 라이브 API 응답에서 이 경기 데이터 추출 ────────────────
function findGameInLiveData(liveGames = [], homeId, awayId) {
  return liveGames.find(g => {
    const h = NAVER_TEAM_MAP[g.homeTeamCode] || g.homeTeamCode
    const a = NAVER_TEAM_MAP[g.awayTeamCode] || g.awayTeamCode
    return h === homeId && a === awayId
  }) || null
}

// 날짜 문자열 "20260402" → "2026-04-02"
function normalizeDateForApi(raw) {
  if (!raw) return null
  const s = String(raw).replace(/-/g, '')
  if (s.length < 8) return null
  return `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`
}

// ── 스케줄 카드의 상태 판단 ───────────────────────────────
function resolveStatus(game) {
  if (game.isCanceled) return 'cancelled'
  const hasScore =
    game.homeScore != null && game.homeScore !== '' &&
    game.awayScore != null && game.awayScore !== ''
  if (hasScore) return 'final'
  const s = game.status || ''
  if (s.includes('종료') || s === 'RESULT' || s === 'FINAL') return 'final'
  if (s === 'PLAYING' || s === 'live') return 'live'
  return 'scheduled'
}

// ── 로딩 스피너 (모달 내부용) ─────────────────────────────
function ModalSpinner() {
  return (
    <div className="match-modal__loading">
      <div className="match-modal__spinner" />
      <p className="match-modal__loading-text">경기 정보를 불러오는 중...</p>
    </div>
  )
}

// ── 메인 모달 컴포넌트 ────────────────────────────────────
// ── 데모 모모드 설정 (발표용: 실시간 경기가 아닐 때도 채팅 버튼 활성화) ──────
const IS_DEMO_MODE = true;

export default function MatchDetailModal({ game, onClose, onJoinChat }) {
  const [detail, setDetail] = useState(null)   // 라이브 API 결과
  const [fetching, setFetching] = useState(true)
  const overlayRef = useRef(null)

  // ── ESC 닫기 ───────────────────────────────────────────
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  // ── body 스크롤 잠금 ───────────────────────────────────
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  // ── 라이브 API 호출 ────────────────────────────────────
  const fetchDetail = useCallback(async () => {
    setFetching(true)
    try {
      const dateStr = normalizeDateForApi(game.gameDate)
      if (!dateStr) return

      const res = await api.get(`/baseball/live?date=${dateStr}`)
      const liveGames = res.data?.result?.games || []
      const matched = findGameInLiveData(liveGames, game.homeTeam, game.awayTeam)

      if (matched) {
        setDetail({
          startTime:   matched.gameDateTime ? matched.gameDateTime.slice(11, 16) : null,
          stadium:     DEFAULT_STADIUM[game.homeTeam] || '구장미정',
          homeScore:   matched.homeTeamScore,
          awayScore:   matched.awayTeamScore,
          statusCode:  matched.statusCode,
          statusInfo:  matched.statusInfo || '',
        })
      }
    } catch (e) {
      console.warn('MatchDetailModal fetch 실패 — 스케줄 기본값 사용', e)
    } finally {
      setFetching(false)
    }
  }, [game])

  useEffect(() => { fetchDetail() }, [fetchDetail])

  // ── 표시할 최종 값 결정 ────────────────────────────────
  //   라이브 API 결과 우선, 없으면 스케줄 카드 기본값
  const fallbackStatus = resolveStatus(game)

  const displayTime    = detail?.startTime   || game.gameTime  || null
  const rawStadium     = (game.stadium && game.stadium !== '' && game.stadium !== '구장미정')
                           ? game.stadium
                           : DEFAULT_STADIUM[game.homeTeam] || '잠실'
  const displayStadium = rawStadium
  const weatherKey     = STADIUM_WEATHER_KEY[displayStadium] ?? '잠실'

  const homeScore = detail?.homeScore ?? game.homeScore ?? null
  const awayScore = detail?.awayScore ?? game.awayScore ?? null
  const hasScore  = homeScore != null && homeScore !== '' &&
                    awayScore != null && awayScore !== ''

  // API 상태 코드 → UI 상태
  let status = fallbackStatus
  if (detail) {
    const sc = detail.statusCode
    if (sc === 'PLAYING') status = 'live'
    else if (sc === 'RESULT' || sc === 'CANCEL') status = sc === 'CANCEL' ? 'cancelled' : 'final'
    else if (hasScore) status = 'final'
    else status = 'scheduled'
  }

  const homeColor = TEAM_COLORS[game.homeTeam] || '#e94560'
  const awayColor = TEAM_COLORS[game.awayTeam] || '#888'

  const homeWins = hasScore && Number(homeScore) > Number(awayScore)
  const awayWins = hasScore && Number(awayScore) > Number(homeScore)

  // ── 배경 클릭 닫기 ─────────────────────────────────────
  const handleOverlayClick = (e) => {
    if (e.target === overlayRef.current) onClose()
  }

  return (
    <>
    <div
      className="match-modal-overlay match-modal-overlay--visible"
      ref={overlayRef}
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-label="경기 상세 정보"
    >
      <div className="match-modal match-modal--visible">

        {/* ── 모달 헤더 ── */}
        <div className="match-modal__header">
          <span className="match-modal__title">경기 상세 정보</span>
          <button
            className="match-modal__close"
            onClick={onClose}
            aria-label="닫기"
          >
            ✕
          </button>
        </div>

        {/* ── 콘텐츠 ── */}
        {fetching ? (
          <ModalSpinner />
        ) : (
          <div className="match-modal__body">

            {/* 상단: [배지] 시간 • 구장 / 날씨 */}
            <div className="tgc-top">
              <div className="tgc-top-left">
                {/* 상태 배지 */}
                {status === 'live' && (
                  <span className="live-badge">
                    <span className="live-dot" />
                    LIVE
                  </span>
                )}
                {status === 'scheduled' && (
                  <span className="tgc-status tgc-status--scheduled">📅 예정</span>
                )}
                {status === 'final' && (
                  <span className="tgc-status tgc-status--final">🏁 종료</span>
                )}
                {status === 'cancelled' && (
                  <span className="tgc-status tgc-status--cancelled">🚫 취소</span>
                )}

                {/* 시간 • 구장 — 배지 오른쪽에 인라인으로 */}
                <span className="match-modal__meta-inline">
                  {displayTime && <>{displayTime} <span className="match-modal__sep">•</span> </>}
                  {displayStadium}
                </span>
              </div>

              {/* 날씨 위젯 */}
              <WeatherWidget stadiumKey={weatherKey} />
            </div>

            {/* 스코어보드 */}
            <div className="tgc-scoreboard match-modal__scoreboard">

              {/* 원정팀 */}
              <div className="tgc-team tgc-team--away">
                {TEAM_LOGO[game.awayTeam] && (
                  <img
                    src={TEAM_LOGO[game.awayTeam]}
                    alt={TEAM_NAME[game.awayTeam] ?? game.awayTeam}
                    className="match-modal__logo"
                  />
                )}
                <span
                  className="tgc-team-name match-modal__team-name"
                  style={{ color: awayColor }}
                >
                  {TEAM_NAME[game.awayTeam] ?? game.awayTeam}
                </span>
                <span className="tgc-role-label">원정</span>
              </div>

              {/* 센터: 스코어 or VS */}
              <div className="tgc-center">
                {status === 'scheduled' && !hasScore ? (
                  <div className="tgc-vs">VS</div>
                ) : (
                  <>
                    <div className="tgc-score-row">
                      <span
                        className="tgc-score"
                        style={{ color: awayWins ? awayColor : 'rgba(255,255,255,0.35)' }}
                      >
                        {awayScore ?? '-'}
                      </span>
                      <span className="tgc-score-sep">:</span>
                      <span
                        className="tgc-score"
                        style={{ color: homeWins ? homeColor : 'rgba(255,255,255,0.35)' }}
                      >
                        {homeScore ?? '-'}
                      </span>
                    </div>
                    {status === 'live' && detail?.statusInfo && (
                      <div className="tgc-inning">{detail.statusInfo}</div>
                    )}
                  </>
                )}
              </div>

              {/* 홈팀 */}
              <div className="tgc-team tgc-team--home">
                <span className="tgc-role-label">홈</span>
                <span
                  className="tgc-team-name match-modal__team-name"
                  style={{ color: homeColor }}
                >
                  {TEAM_NAME[game.homeTeam] ?? game.homeTeam}
                </span>
                {TEAM_LOGO[game.homeTeam] && (
                  <img
                    src={TEAM_LOGO[game.homeTeam]}
                    alt={TEAM_NAME[game.homeTeam] ?? game.homeTeam}
                    className="match-modal__logo"
                  />
                )}
              </div>
            </div>

            {/* 하단: 최종 스코어만 (종료 경기일 때만 표시) */}
            {status === 'final' && hasScore && (
              <div className="match-modal__footer match-modal__footer--score-only">
                <span className="match-modal__result">
                  최종 {awayScore} : {homeScore}
                </span>
              </div>
            )}

            {/* 하단: LIVE 경기일 때 응원 채팅 참여 버튼 (데모 모드 시 항상 활성화) */}
            {(status === 'live' || IS_DEMO_MODE) && (
              <div style={{ padding: '12px 16px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                <button
                  id="live-chat-join-btn"
                  onClick={() => {
                    onJoinChat && onJoinChat(game);
                    onClose();
                  }}
                  style={{
                    width: '100%', padding: '12px 0',
                    background: 'linear-gradient(135deg, #e94560, #c30452)',
                    color: '#fff', border: 'none', borderRadius: 12,
                    fontSize: 15, fontWeight: 800, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    boxShadow: '0 4px 15px rgba(233,69,96,0.4)',
                    fontFamily: 'inherit',
                    animation: 'pulse 1.5s ease-in-out infinite',
                  }}
                >
                  🔴 응원 채팅 참여하기
                </button>
              </div>
            )}

          </div>
        )}
      </div>
    </div>
    </>
  )
}
