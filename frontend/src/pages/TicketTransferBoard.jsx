import { useState, useMemo } from 'react';

// ─── KBO 팀 컬러 ───────────────────────────────────────────────────
const TEAM_COLORS = {
  "LG":   "#C8102E",
  "두산": "#1a1748",
  "SSG":  "#CE0E2D",
  "KIA":  "#EA0029",
  "삼성": "#074CA1",
  "롯데": "#002561",
  "한화": "#F37321",
  "KT":   "#1b1a1a",
  "NC":   "#1D467A",
  "키움": "#820024",
};

// ─── Mock 티켓 데이터 ──────────────────────────────────────────────
const MOCK_TICKETS = [
  {
    id: 1,
    homeTeam: 'LG',
    awayTeam: 'SSG',
    matchDate: '2026-04-05',
    matchTime: '14:00',
    stadium: '잠실종합운동장',
    seatArea: '1루 레드석',
    seatBlock: '202블록',
    seatRow: 'F열 12번',
    price: 45000,
    status: 'selling',
    author: '야구좋아',
    createdAt: '2026-04-01',
  },
  {
    id: 2,
    homeTeam: '두산',
    awayTeam: 'KIA',
    matchDate: '2026-04-06',
    matchTime: '17:00',
    stadium: '잠실종합운동장',
    seatArea: '3루 블루석',
    seatBlock: '308블록',
    seatRow: 'C열 5번',
    price: 38000,
    status: 'reserved',
    author: '베어스팬',
    createdAt: '2026-04-01',
  },
  {
    id: 3,
    homeTeam: 'KIA',
    awayTeam: '삼성',
    matchDate: '2026-04-06',
    matchTime: '14:00',
    stadium: '광주-기아 챔피언스 필드',
    seatArea: '중앙 지정석',
    seatBlock: '110블록',
    seatRow: 'A열 22번',
    price: 55000,
    status: 'sold',
    author: '타이거즈만세',
    createdAt: '2026-03-31',
  },
  {
    id: 4,
    homeTeam: '한화',
    awayTeam: 'NC',
    matchDate: '2026-04-12',
    matchTime: '14:00',
    stadium: '한화생명 이글스파크',
    seatArea: '외야 잔디석',
    seatBlock: '자유석',
    seatRow: '',
    price: 15000,
    status: 'selling',
    author: '이글스사랑',
    createdAt: '2026-04-01',
  },
  {
    id: 5,
    homeTeam: 'SSG',
    awayTeam: '롯데',
    matchDate: '2026-04-13',
    matchTime: '14:00',
    stadium: '인천SSG랜더스필드',
    seatArea: '프리미엄 테이블석',
    seatBlock: 'T1블록',
    seatRow: '1열 3-4번',
    price: 120000,
    status: 'selling',
    author: '랜더스왕팬',
    createdAt: '2026-03-30',
  },
];

// ─── 상수 ──────────────────────────────────────────────────────────
const STADIUMS = [
  '전체', '잠실종합운동장', '광주-기아 챔피언스 필드',
  '한화생명 이글스파크', '인천SSG랜더스필드', '고척스카이돔',
  '수원KT위즈파크', '사직야구장', '창원NC파크', '대구삼성라이온즈파크',
];

const KBO_TEAMS = ['전체', 'LG', '두산', 'SSG', 'KIA', '삼성', '롯데', '한화', 'KT', 'NC', '키움'];

const STATUS_CONFIG = {
  selling:  { label: '판매중', bg: '#e6f9f0', color: '#14a85b', border: '#a8e6c7' },
  reserved: { label: '예약중', bg: '#fff8e1', color: '#e6a817', border: '#ffe082' },
  sold:     { label: '판매완료', bg: '#f0f0f0', color: '#999', border: '#ddd' },
};

// ─── 상태 뱃지 ─────────────────────────────────────────────────────
function TicketStatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.selling;
  return (
    <span
      className="ticket-status-badge"
      style={{
        background: cfg.bg,
        color: cfg.color,
        border: `1px solid ${cfg.border}`,
      }}
    >
      {cfg.label}
    </span>
  );
}

// ─── 티켓 카드 컴포넌트 ────────────────────────────────────────────
function TicketCard({ ticket }) {
  const homeColor = TEAM_COLORS[ticket.homeTeam] || '#e94560';
  const isSold = ticket.status === 'sold';

  return (
    <div className={`ticket-card ${isSold ? 'ticket-card--sold' : ''}`}>
      {/* 팀 컬러 상단 악센트 */}
      <div className="ticket-card__accent" style={{ background: `linear-gradient(135deg, ${homeColor}, ${homeColor}cc)` }} />

      <div className="ticket-card__body">
        {/* 헤더: 날짜 + 상태 */}
        <div className="ticket-card__header">
          <span className="ticket-card__date">
            📅 {ticket.matchDate} · {ticket.matchTime}
          </span>
          <TicketStatusBadge status={ticket.status} />
        </div>

        {/* 매치 정보 */}
        <div className="ticket-card__match">
          <div className="ticket-card__team-badge" style={{ background: homeColor + '18', color: homeColor, borderColor: homeColor + '35' }}>
            {ticket.homeTeam}
          </div>
          <span className="ticket-card__vs">VS</span>
          <div className="ticket-card__team-badge" style={{ background: (TEAM_COLORS[ticket.awayTeam] || '#666') + '18', color: TEAM_COLORS[ticket.awayTeam] || '#666', borderColor: (TEAM_COLORS[ticket.awayTeam] || '#666') + '35' }}>
            {ticket.awayTeam}
          </div>
        </div>

        {/* 좌석 & 경기장 정보 */}
        <div className="ticket-card__info">
          <div className="ticket-card__info-row">
            <span className="ticket-card__info-icon">🏟️</span>
            <span>{ticket.stadium}</span>
          </div>
          <div className="ticket-card__info-row">
            <span className="ticket-card__info-icon">💺</span>
            <span>{ticket.seatArea} · {ticket.seatBlock}{ticket.seatRow ? ` · ${ticket.seatRow}` : ''}</span>
          </div>
        </div>

        {/* 가격 & 작성자 */}
        <div className="ticket-card__footer">
          <div className="ticket-card__price">
            ₩{ticket.price.toLocaleString()}
          </div>
          <div className="ticket-card__author">
            <div className="ticket-card__avatar" style={{ background: homeColor }}>
              {ticket.author.slice(0, 1)}
            </div>
            <span className="ticket-card__author-name">{ticket.author}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── 필터 드롭다운 컴포넌트 ────────────────────────────────────────
function FilterSelect({ label, icon, value, onChange, options }) {
  return (
    <div className="ticket-filter-select">
      <span className="ticket-filter-icon">{icon}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((opt) => (
          <option key={opt} value={opt}>{opt === '전체' ? `${label} ${opt}` : opt}</option>
        ))}
      </select>
    </div>
  );
}

// ─── 메인 페이지 ───────────────────────────────────────────────────
export default function TicketTransferBoard() {
  const [filterDate, setFilterDate] = useState('전체');
  const [filterStadium, setFilterStadium] = useState('전체');
  const [filterTeam, setFilterTeam] = useState('전체');

  // 날짜 옵션 생성 (mock 데이터에서 추출)
  const dateOptions = useMemo(() => {
    const dates = [...new Set(MOCK_TICKETS.map((t) => t.matchDate))].sort();
    return ['전체', ...dates];
  }, []);

  // 필터링
  const filtered = useMemo(() => {
    return MOCK_TICKETS.filter((t) => {
      const dateMatch = filterDate === '전체' || t.matchDate === filterDate;
      const stadiumMatch = filterStadium === '전체' || t.stadium === filterStadium;
      const teamMatch = filterTeam === '전체' || t.homeTeam === filterTeam || t.awayTeam === filterTeam;
      return dateMatch && stadiumMatch && teamMatch;
    });
  }, [filterDate, filterStadium, filterTeam]);

  return (
    <div className="ticket-transfer-page">
      {/* ── 페이지 헤더 ── */}
      <div className="ticket-page-header">
        <div className="ticket-page-header__left">
          <h2 className="page-title">🎫 티켓 양도</h2>
          <p className="page-subtitle">원하는 경기의 티켓을 양도하거나 양수하세요</p>
        </div>
        <button className="ticket-write-btn" id="ticket-write-btn">
          ✏️ 글쓰기
        </button>
      </div>

      {/* ── 필터 바 ── */}
      <div className="ticket-filter-bar" id="ticket-filter-bar">
        <FilterSelect
          label="날짜"
          icon="📅"
          value={filterDate}
          onChange={setFilterDate}
          options={dateOptions}
        />
        <FilterSelect
          label="구장"
          icon="🏟️"
          value={filterStadium}
          onChange={setFilterStadium}
          options={STADIUMS}
        />
        <FilterSelect
          label="팀"
          icon="⚾"
          value={filterTeam}
          onChange={setFilterTeam}
          options={KBO_TEAMS}
        />
        <div className="ticket-filter-count">
          검색결과 <strong>{filtered.length}</strong>건
        </div>
      </div>

      {/* ── 티켓 카드 그리드 ── */}
      {filtered.length > 0 ? (
        <div className="ticket-card-grid" id="ticket-card-grid">
          {filtered.map((ticket) => (
            <TicketCard key={ticket.id} ticket={ticket} />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-icon">🎫</div>
          <p>검색 조건에 맞는 티켓이 없습니다</p>
        </div>
      )}
    </div>
  );
}
