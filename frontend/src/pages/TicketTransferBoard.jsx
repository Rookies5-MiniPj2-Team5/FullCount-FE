import { useState, useMemo, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/api';

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

// ─── 백엔드 팀 ID 매핑 ──────────────────────────────────────────
const TEAM_ID_MAP = {
  'LG': 1,
  '두산': 2,
  'SSG': 3,
  'KIA': 4,
  '삼성': 5,
  '롯데': 6,
  '한화': 7,
  'KT': 8,
  'NC': 9,
  '키움': 10
};

const getShortName = (fullName) => {
  if (!fullName) return "알수없음";
  if (fullName.includes("LG")) return "LG";
  if (fullName.includes("두산")) return "두산";
  if (fullName.includes("SSG")) return "SSG";
  if (fullName.includes("KIA")) return "KIA";
  if (fullName.includes("삼성")) return "삼성";
  if (fullName.includes("롯데")) return "롯데";
  if (fullName.includes("한화")) return "한화";
  if (fullName.includes("KT") || fullName.includes("케이티")) return "KT";
  if (fullName.includes("NC")) return "NC";
  if (fullName.includes("키움")) return "키움";
  return fullName;
};

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
function TicketCard({ ticket, onOpenDetail }) {
  const homeColor = TEAM_COLORS[ticket.homeTeam] || '#e94560';
  const isSold = ticket.status === 'sold';

  return (
    <div
      className={`ticket-card ${isSold ? 'ticket-card--sold' : ''}`}
      onClick={() => !isSold && onOpenDetail(ticket)}
      role={isSold ? undefined : 'button'}
      tabIndex={isSold ? -1 : 0}
      onKeyDown={(e) => e.key === 'Enter' && !isSold && onOpenDetail(ticket)}
    >
      <div className="ticket-card__accent" style={{ background: `linear-gradient(135deg, ${homeColor}, ${homeColor}cc)` }} />

      <div className="ticket-card__body">
        <div className="ticket-card__header">
          <span className="ticket-card__date">
            📅 {ticket.matchDate} · {ticket.matchTime}
          </span>
          <TicketStatusBadge status={ticket.status} />
        </div>

        <div className="ticket-card__match">
          <div className="ticket-card__team-badge" style={{ background: homeColor + '18', color: homeColor, borderColor: homeColor + '35' }}>
            {ticket.homeTeam}
          </div>
          <span className="ticket-card__vs">VS</span>
          <div className="ticket-card__team-badge" style={{ background: (TEAM_COLORS[ticket.awayTeam] || '#666') + '18', color: TEAM_COLORS[ticket.awayTeam] || '#666', borderColor: (TEAM_COLORS[ticket.awayTeam] || '#666') + '35' }}>
            {ticket.awayTeam}
          </div>
        </div>

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

        <div className="ticket-card__footer">
          <div className="ticket-card__price">
            ₩{Number(ticket.price || 0).toLocaleString()}
          </div>
          <div className="ticket-card__author">
            <div className="ticket-card__avatar" style={{ background: homeColor }}>
              {(ticket.author || '익').slice(0, 1)}
            </div>
            <span className="ticket-card__author-name">{ticket.author || '익명'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── 티켓 상세 모달 ───────────────────────────────────────────────
function TicketDetailModal({ ticket, onClose, onContact, currentUser }) {
  const overlayRef = useRef(null);
  const homeColor = TEAM_COLORS[ticket.homeTeam] || '#e94560';
  const awayColor = TEAM_COLORS[ticket.awayTeam] || '#666';
  const cfg = STATUS_CONFIG[ticket.status] || STATUS_CONFIG.selling;
  const isMyTicket = currentUser && currentUser.nickname === ticket.author;

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  const handleOverlayClick = (e) => {
    if (e.target === overlayRef.current) onClose();
  };

  return (
    <div className="ticket-modal-overlay" ref={overlayRef} onClick={handleOverlayClick}>
      <div className="ticket-modal ticket-detail-modal" role="dialog" aria-modal="true">
        <div className="ticket-detail__banner" style={{ background: `linear-gradient(135deg, ${homeColor} 0%, ${homeColor}99 100%)` }}>
          <div className="ticket-detail__banner-teams">
            <span className="ticket-detail__banner-team">{ticket.homeTeam}</span>
            <span className="ticket-detail__banner-vs">VS</span>
            <span className="ticket-detail__banner-team">{ticket.awayTeam}</span>
          </div>
          <button className="ticket-modal__close ticket-detail__close" onClick={onClose} aria-label="닫기">✕</button>
        </div>

        <div className="ticket-detail__body">
          <div className="ticket-detail__row ticket-detail__row--between">
            <span
              className="ticket-status-badge"
              style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}
            >
              {cfg.label}
            </span>
            <span className="ticket-detail__date">📅 {ticket.matchDate} {ticket.matchTime}</span>
          </div>

          <div className="ticket-detail__info-grid">
            <div className="ticket-detail__info-item">
              <span className="ticket-detail__info-label">🏟️ 경기장</span>
              <span className="ticket-detail__info-value">{ticket.stadium}</span>
            </div>
            <div className="ticket-detail__info-item">
              <span className="ticket-detail__info-label">💺 좌석 구역</span>
              <span className="ticket-detail__info-value">{ticket.seatArea}</span>
            </div>
            {ticket.seatBlock && (
              <div className="ticket-detail__info-item">
                <span className="ticket-detail__info-label">📦 블록</span>
                <span className="ticket-detail__info-value">{ticket.seatBlock}</span>
              </div>
            )}
            {ticket.seatRow && (
              <div className="ticket-detail__info-item">
                <span className="ticket-detail__info-label">🔢 열·번호</span>
                <span className="ticket-detail__info-value">{ticket.seatRow}</span>
              </div>
            )}
          </div>

          {ticket.description && (
            <div className="ticket-detail__desc">
              <p className="ticket-detail__desc-label">📝 추가 정보</p>
              <p className="ticket-detail__desc-text">{ticket.description}</p>
            </div>
          )}

          <div className="ticket-detail__footer">
            <div>
              <div className="ticket-detail__price-label">양도 가격</div>
              <div className="ticket-detail__price">₩{Number(ticket.price || 0).toLocaleString()}</div>
            </div>
            <div className="ticket-detail__author">
              <div className="ticket-card__avatar" style={{ background: homeColor, width: 36, height: 36, fontSize: 15 }}>
                {(ticket.author || '익').slice(0, 1)}
              </div>
              <div>
                <div className="ticket-detail__author-name">{ticket.author || '익명'}</div>
                <div className="ticket-detail__author-date">{ticket.createdAt || '방금 전'} 등록</div>
              </div>
            </div>
          </div>

          <div className="ticket-detail__actions">
            <button className="ticket-modal__btn-cancel" onClick={onClose}>닫기</button>
            {!isMyTicket && ticket.status !== 'sold' && (
              <button
                className="ticket-detail__contact-btn"
                onClick={() => { onClose(); onContact(ticket); }}
              >
                💬 연락하기
              </button>
            )}
            {isMyTicket && (
              <span className="ticket-detail__mine-badge">내가 등록한 티켓</span>
            )}
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

// ─── 글쓰기 모달 ───────────────────────────────────────────────────
const EMPTY_FORM = {
  homeTeam: 'LG',
  awayTeam: '두산',
  matchDate: '',
  matchTime: '14:00',
  stadium: '잠실종합운동장',
  seatArea: '',
  seatBlock: '',
  seatRow: '',
  price: '',
  description: '',
};

function TicketWriteModal({ onClose, onSubmit }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const overlayRef = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  const handleOverlayClick = (e) => {
    if (e.target === overlayRef.current) onClose();
  };

  const set = (key, val) => setForm((prev) => ({ ...prev, [key]: val }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.matchDate) { alert('경기 날짜를 선택해주세요.'); return; }
    if (!form.seatArea)  { alert('좌석 구역을 입력해주세요.'); return; }
    if (!form.price || isNaN(Number(form.price))) { alert('양도 가격을 숫자로 입력해주세요.'); return; }
    setSubmitting(true);
    try {
      await onSubmit({ ...form, price: Number(form.price) });
      onClose();
    } catch (err) {
      alert('등록 중 오류가 발생했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  const teams = ['LG', '두산', 'SSG', 'KIA', '삼성', '롯데', '한화', 'KT', 'NC', '키움'];
  const times = ['14:00', '17:00', '18:00', '18:30', '19:00'];

  return (
    <div className="ticket-modal-overlay" ref={overlayRef} onClick={handleOverlayClick}>
      <div className="ticket-modal" role="dialog" aria-modal="true" aria-label="티켓 양도 글쓰기">
        <div className="ticket-modal__header">
          <h3 className="ticket-modal__title">🎫 티켓 양도 등록</h3>
          <button className="ticket-modal__close" onClick={onClose} aria-label="닫기">✕</button>
        </div>

        <form className="ticket-modal__form" onSubmit={handleSubmit}>
          <div className="ticket-form-row ticket-form-row--2col">
            <div className="ticket-form-field">
              <label className="ticket-form-label">홈팀 <span className="required">*</span></label>
              <select className="ticket-form-select" value={form.homeTeam} onChange={(e) => set('homeTeam', e.target.value)}>
                {teams.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="ticket-form-field">
              <label className="ticket-form-label">원정팀 <span className="required">*</span></label>
              <select className="ticket-form-select" value={form.awayTeam} onChange={(e) => set('awayTeam', e.target.value)}>
                {teams.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>

          <div className="ticket-form-row ticket-form-row--2col">
            <div className="ticket-form-field">
              <label className="ticket-form-label">경기 날짜 <span className="required">*</span></label>
              <input
                type="date"
                className="ticket-form-input"
                value={form.matchDate}
                onChange={(e) => set('matchDate', e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                required
              />
            </div>
            <div className="ticket-form-field">
              <label className="ticket-form-label">경기 시간</label>
              <select className="ticket-form-select" value={form.matchTime} onChange={(e) => set('matchTime', e.target.value)}>
                {times.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>

          <div className="ticket-form-field">
            <label className="ticket-form-label">경기장 <span className="required">*</span></label>
            <select className="ticket-form-select" value={form.stadium} onChange={(e) => set('stadium', e.target.value)}>
              {STADIUMS.slice(1).map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div className="ticket-form-row ticket-form-row--3col">
            <div className="ticket-form-field">
              <label className="ticket-form-label">좌석 구역 <span className="required">*</span></label>
              <input
                type="text"
                className="ticket-form-input"
                placeholder="예) 1루 레드석"
                value={form.seatArea}
                onChange={(e) => set('seatArea', e.target.value)}
              />
            </div>
            <div className="ticket-form-field">
              <label className="ticket-form-label">블록</label>
              <input
                type="text"
                className="ticket-form-input"
                placeholder="예) 202블록"
                value={form.seatBlock}
                onChange={(e) => set('seatBlock', e.target.value)}
              />
            </div>
            <div className="ticket-form-field">
              <label className="ticket-form-label">열·번호</label>
              <input
                type="text"
                className="ticket-form-input"
                placeholder="예) F열 12번"
                value={form.seatRow}
                onChange={(e) => set('seatRow', e.target.value)}
              />
            </div>
          </div>

          <div className="ticket-form-field">
            <label className="ticket-form-label">양도 가격 (원) <span className="required">*</span></label>
            <input
              type="number"
              className="ticket-form-input"
              placeholder="예) 45000"
              value={form.price}
              onChange={(e) => set('price', e.target.value)}
              min="0"
              step="1000"
            />
          </div>

          <div className="ticket-form-field">
            <label className="ticket-form-label">추가 설명</label>
            <textarea
              className="ticket-form-textarea"
              rows={3}
              placeholder="거래 방법, 좌석 상세 정보, 연락 방법 등을 자유롭게 입력하세요."
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
            />
          </div>

          <div className="ticket-modal__actions">
            <button type="button" className="ticket-modal__btn-cancel" onClick={onClose} disabled={submitting}>
              취소
            </button>
            <button type="submit" className="ticket-modal__btn-submit" disabled={submitting}>
              {submitting ? '등록 중...' : '🎫 티켓 등록'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── 메인 페이지 ───────────────────────────────────────────────────
export default function TicketTransferBoard({ onOpenChat }) {
  const { user } = useAuth();
  const [filterDate, setFilterDate] = useState('전체');
  const [filterStadium, setFilterStadium] = useState('전체');
  const [filterTeam, setFilterTeam] = useState('전체');
  const [showWriteModal, setShowWriteModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/ticket-transfers');
      const data = response.data;
      let items = [];
      if (data && data.data) {
        items = Array.isArray(data.data) ? data.data : (data.data.content || []);
      } else if (data) {
        items = Array.isArray(data) ? data : (data.content || []);
      }

      const normalized = items.map(t => {
        const homeShort = getShortName(t.homeTeamName || t.homeTeam);
        const awayShort = getShortName(t.awayTeamName || t.awayTeam);

        return {
          ...t,
          authorId: t.authorId,
          author: t.authorNickname || t.author || t.nickname || t.userNickname || '익명',
          homeTeam: homeShort,
          awayTeam: awayShort,
          matchDate: t.matchDate || '',
          matchTime: t.matchTime || '시간 미정',
          price: t.ticketPrice ?? t.price ?? 0,
          stadium: t.stadium || STADIUMS[TEAM_ID_MAP[homeShort]] || '경기장 미상',
          seatArea: t.seatArea || '',
          seatBlock: t.seatBlock || '',
          seatRow: t.seatRow || '',
          description: t.content || t.description || '',
          createdAt: t.createdAt ? t.createdAt.split('T')[0] : '방금 전',
          status: t.status === 'CLOSED' ? 'sold' : (t.status === 'RESERVED' ? 'reserved' : 'selling'),
        };
      });

      setTickets(normalized);
    } catch (err) {
      console.error('Failed to fetch tickets:', err);
      setError('티켓 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleContact = async (ticket) => {
    if (!user) {
      alert('로그인이 필요합니다.');
      return;
    }

    if (!ticket.authorId) {
      alert('상대방 정보를 찾을 수 없습니다.');
      return;
    }

    try {
      const res = await api.post(`/chat/rooms/dm/user/${ticket.authorId}`);
      const roomId = res.data.data?.chatRoomId;

      if (onOpenChat) {
        onOpenChat({
          id: roomId,
          roomType: 'ONE_ON_ONE_DIRECT',
          title: ticket.author,
          isDm: true,
          dmTargetNickname: ticket.author,
        });
      }
    } catch (err) {
      console.error('DM 채팅방 생성 실패:', err);
      alert('채팅방 생성에 실패했습니다.');
    }
  };

  const handleWriteClick = () => {
    if (!user) {
      alert('로그인이 필요합니다. 홈 화면의 로그인 폼을 이용해주세요.');
      return;
    }
    setShowWriteModal(true);
  };

  const handleTicketSubmit = async (formData) => {
    const combinedSeatArea = [formData.seatArea, formData.seatBlock, formData.seatRow]
      .filter(Boolean)
      .join(" ");

    const payload = {
      homeTeam: formData.homeTeam,
      awayTeam: formData.awayTeam,
      matchDate: formData.matchDate,
      matchTime: formData.matchTime || "00:00:00",
      stadium: formData.stadium || "",
      seatArea: combinedSeatArea,
      seatBlock: formData.seatBlock || "",
      seatRow: formData.seatRow || "",
      price: Number(formData.price),
      description: formData.description || "",
    };

    await api.post('/ticket-transfers', payload);
    await fetchTickets();
  };

  const dateOptions = useMemo(() => {
    const dates = [...new Set(tickets.map((t) => t.matchDate))].sort();
    return ['전체', ...dates];
  }, [tickets]);

  const filtered = useMemo(() => {
    return tickets.filter((t) => {
      const dateMatch = filterDate === '전체' || t.matchDate === filterDate;
      const stadiumMatch = filterStadium === '전체' || t.stadium === filterStadium;
      const teamMatch = filterTeam === '전체' || t.homeTeam === filterTeam || t.awayTeam === filterTeam;
      return dateMatch && stadiumMatch && teamMatch;
    });
  }, [tickets, filterDate, filterStadium, filterTeam]);

  return (
    <div className="ticket-transfer-page">
      <div className="ticket-page-header">
        <div className="ticket-page-header__left">
          <h2 className="page-title">🎫 티켓 양도</h2>
          <p className="page-subtitle">원하는 경기의 티켓을 양도하거나 양수하세요</p>
        </div>
        <button className="ticket-write-btn" id="ticket-write-btn" onClick={handleWriteClick}>
          ✏️ 글쓰기
        </button>
      </div>

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

      {loading ? (
        <div className="empty-state">
          <div className="empty-icon">⏳</div>
          <p>티켓 목록을 불러오는 중입니다...</p>
        </div>
      ) : error ? (
        <div className="empty-state">
          <div className="empty-icon">⚠️</div>
          <p>{error}</p>
        </div>
      ) : filtered.length > 0 ? (
        <div className="ticket-card-grid" id="ticket-card-grid">
          {filtered.map((ticket) => (
            <TicketCard key={ticket.id} ticket={ticket} onOpenDetail={setSelectedTicket} />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-icon">🎫</div>
          <p>검색 조건에 맞는 티켓이 없습니다</p>
        </div>
      )}

      {showWriteModal && (
        <TicketWriteModal
          onClose={() => setShowWriteModal(false)}
          onSubmit={handleTicketSubmit}
        />
      )}

      {selectedTicket && (
        <TicketDetailModal
          ticket={selectedTicket}
          currentUser={user}
          onClose={() => setSelectedTicket(null)}
          onContact={handleContact}
        />
      )}
    </div>
  );
}