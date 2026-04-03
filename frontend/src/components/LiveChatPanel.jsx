/**
 * LiveChatPanel.jsx
 *
 * 실시간 응원 채팅 패널 (경기 중 전용).
 * 팀원이 담당하는 ChatFab / ChatPage와 독립된 별도 컴포넌트입니다.
 *
 * Props:
 *   - gameId    {string}  경기 고유 ID (예: "20260403_LG_SSG")
 *   - homeTeam  {string}  홈팀 코드 (예: "LG")
 *   - awayTeam  {string}  원정팀 코드 (예: "SSG")
 *   - onClose   {func}    패널 닫기 콜백
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { gsap } from 'gsap';
import { useAuth } from '../context/AuthContext';
import { createLiveCheerClient } from '../utils/stompLiveClient';
import { TEAM_NAME } from './TeamComponents';

// ── 팀 색상 ───────────────────────────────────────────────────────────
const TEAM_COLORS = {
  LG: '#C30452', DU: '#131230', SSG: '#CE0E2D', KIA: '#EA0029',
  SA: '#074CA1', LO: '#A50021', HH: '#FF6600', KT: '#222222',
  NC: '#315288', WO: '#570514',
};

// ── 리액션 버튼 목록 ──────────────────────────────────────────────────
const REACTIONS = [
  { id: 'homerun', emoji: '⚾💥', label: '홈런!',   count: 3 },
  { id: 'cheer',   emoji: '📣',   label: '응원!',   count: 5 },
  { id: 'strike',  emoji: '🔥',   label: '삼진!',   count: 4 },
  { id: 'good',    emoji: '👏',   label: '굿!',     count: 6 },
];

// ── 단어 필터 (프론트 1차 필터 — 백엔드에서도 처리) ─────────────────
function filterContent(text) {
  const blocked = ['욕설예시1', '욕설예시2'];
  let result = text;
  blocked.forEach((w) => { result = result.replaceAll(w, '***'); });
  return result;
}

// ── 메시지 아이템 ─────────────────────────────────────────────────────
function MessageItem({ msg, isMe, teamColor }) {
  if (msg.type === 'SYSTEM') {
    return (
      <div style={{ textAlign: 'center', fontSize: 11, color: '#a0aec0',
        background: 'rgba(255,255,255,0.06)', borderRadius: 8,
        padding: '4px 10px', margin: '4px 0' }}>
        📢 {msg.content}
      </div>
    );
  }
  if (msg.type === 'REACTION') {
    return null; // 리액션은 overlay에서 GSAP로 처리 (채팅창에 표시 안 함)
  }
  return (
    <div style={{ display: 'flex', flexDirection: isMe ? 'row-reverse' : 'row',
      alignItems: 'flex-end', gap: 6, marginBottom: 8 }}>
      {!isMe && (
        <div style={{ width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
          background: `${TEAM_COLORS[msg.teamCode] || '#555'}cc`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 12, color: '#fff', fontWeight: 700 }}>
          {msg.senderNickname?.slice(0, 1)}
        </div>
      )}
      <div style={{ maxWidth: '75%', display: 'flex', flexDirection: 'column',
        alignItems: isMe ? 'flex-end' : 'flex-start', gap: 2 }}>
        {!isMe && (
          <span style={{ fontSize: 10, color: '#718096', marginLeft: 4 }}>
            {msg.senderNickname}
          </span>
        )}
        <div style={{
          padding: '7px 12px', borderRadius: 14, fontSize: 13, color: '#fff',
          wordBreak: 'break-word', lineHeight: 1.5,
          background: isMe ? teamColor : '#2d3748',
          borderBottomRightRadius: isMe ? 4 : 14,
          borderBottomLeftRadius:  isMe ? 14 : 4,
        }}>
          {msg.content}
        </div>
        <span style={{ fontSize: 10, color: '#4a5568', paddingBottom: 2 }}>
          {msg.timestamp}
        </span>
      </div>
    </div>
  );
}

// ── 데모 모드 설정 (발표용: 봇이 자동으로 채팅과 리액션을 생성) ──────
const IS_DEMO_MODE = true;

const DEMO_BOTS = [
  { nickname: '홈런왕강타자', team: 'LG', messages: ['오오오!! 홈런 가나요?!', '와 대박ㅋㅋㅋㅋ', '오늘 경기 진짜 쫄깃하네'] },
  { nickname: '잠실요정', team: 'DU', messages: ['두산 화이팅!!', '호수비 지렸다 ㄷㄷ', '역전 가즈아아아아'] },
  { nickname: '랜더스정상', team: 'SSG', messages: ['SSG 저력이 있네', '이걸 잡네 역시', '오늘 관중 꽉 찼네여'] },
  { nickname: '타이거즈v12', team: 'KIA', messages: ['기아 없이는 못살아~', '안치홍 가자ㅏㅏ', '나성범 홈런!!'] },
];

// ── 메인 컴포넌트 ─────────────────────────────────────────────────────
export default function LiveChatPanel({ gameId, homeTeam, awayTeam, onClose }) {
  const { user } = useAuth();

  const [messages, setMessages]   = useState([]);
  const [inputText, setInputText] = useState('');
  const [connected, setConnected] = useState(false);

  const clientRef    = useRef(null);
  const endRef       = useRef(null);
  const overlayRef   = useRef(null); // GSAP 이모지 렌더 대상

  // ── 데모 모드 봇 로직 ──────────────────────────────────────────────
  useEffect(() => {
    if (!IS_DEMO_MODE) return;

    // 1. 주기적인 가짜 메시지 생성 (7~12초 간격)
    const msgInterval = setInterval(() => {
      const bot = DEMO_BOTS[Math.floor(Math.random() * DEMO_BOTS.length)];
      const text = bot.messages[Math.floor(Math.random() * bot.messages.length)];
      
      const fakeMsg = {
        type: 'CHAT',
        content: text,
        senderNickname: bot.nickname,
        teamCode: bot.team,
        timestamp: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
      };
      
      setMessages((prev) => [...prev, fakeMsg]);
    }, 8000 + Math.random() * 5000);

    // 2. 주기적인 가짜 리액션 생성 (4~7초 간격)
    const reactInterval = setInterval(() => {
      const reactionId = REACTIONS[Math.floor(Math.random() * REACTIONS.length)].id;
      triggerReactionAnimation(reactionId);
    }, 5000 + Math.random() * 3000);

    return () => {
      clearInterval(msgInterval);
      clearInterval(reactInterval);
    };
  }, []);

  // 사용자 응원팀 색상
  const userTeamCode  = user?.team?.shortName || user?.teamCode || homeTeam || 'LG';
  const teamColor     = TEAM_COLORS[userTeamCode] || '#e94560';
  const gameTitle     = `${TEAM_NAME[awayTeam] ?? awayTeam} vs ${TEAM_NAME[homeTeam] ?? homeTeam}`;

  // ── 스크롤 하단 고정 ─────────────────────────────────────────────
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ── STOMP 연결 ──────────────────────────────────────────────────
  useEffect(() => {
    if (!gameId) return;

    clientRef.current = createLiveCheerClient({
      gameId,
      onConnected: () => {
        setConnected(true);
        setMessages((prev) => [...prev, {
          type: 'SYSTEM', content: '응원 채팅에 연결되었습니다! ⚾',
          timestamp: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
        }]);
      },
      onDisconnected: () => setConnected(false),
      onMessage: (msg) => {
        if (msg.type === 'REACTION') {
          triggerReactionAnimation(msg.reactionId);
        } else {
          setMessages((prev) => [...prev, msg]);
        }
      },
    });

    clientRef.current.connect();

    return () => { clientRef.current?.disconnect(); };
  }, [gameId]);

  // ── GSAP 리액션 애니메이션 ─────────────────────────────────────────
  /**
   * 화면 하단에서 랜덤한 궤적으로 이모지가 솟구치는 효과.
   * 여러 이모지가 동시에 버스트처럼 터집니다.
   */
  const triggerReactionAnimation = useCallback((reactionId) => {
    const reaction = REACTIONS.find((r) => r.id === reactionId);
    if (!reaction || !overlayRef.current) return;

    for (let i = 0; i < reaction.count; i++) {
      const el = document.createElement('div');
      el.textContent = reaction.emoji;
      el.style.cssText = `
        position: absolute;
        bottom: 80px;
        left: ${20 + Math.random() * 60}%;
        font-size: ${20 + Math.random() * 16}px;
        pointer-events: none;
        user-select: none;
        z-index: 9999;
        filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
      `;
      overlayRef.current.appendChild(el);

      gsap.to(el, {
        y: -(150 + Math.random() * 250),
        x: (Math.random() - 0.5) * 120,
        opacity: 0,
        scale: 0.5 + Math.random() * 0.8,
        duration: 1.2 + Math.random() * 0.8,
        delay: i * 0.08,
        ease: 'power2.out',
        onComplete: () => el.remove(),
      });
    }
  }, []);

  // ── 메시지 전송 ──────────────────────────────────────────────────
  const handleSend = useCallback(() => {
    if (!inputText.trim() || !connected) return;
    const filtered = filterContent(inputText.trim());
    clientRef.current?.sendChat(filtered);
    setInputText('');
  }, [inputText, connected]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  // ── 리액션 버튼 클릭 ─────────────────────────────────────────────
  const handleReaction = useCallback((reactionId) => {
    if (!connected) return;
    clientRef.current?.sendReaction(reactionId);
    // 내 리액션도 즉시 로컬 애니메이션 (낙관적 업데이트)
    triggerReactionAnimation(reactionId);
  }, [connected, triggerReactionAnimation]);

  return (
    <div style={styles.wrapper}>
      {/* GSAP 이모지 오버레이 레이어 */}
      <div ref={overlayRef} style={styles.reactionOverlay} />

      {/* ── 헤더 ── */}
      <div style={{ ...styles.header, background: teamColor }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
          <span style={{ fontSize: 16 }}>🔴</span>
          <div>
            <div style={{ fontSize: 13, fontWeight: 800, color: '#fff' }}>
              {gameTitle}
            </div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.8)', marginTop: 2 }}>
              {connected ? '● LIVE 응원 채팅' : '○ 연결 중...'}
            </div>
          </div>
        </div>
        <button onClick={onClose} style={styles.closeBtn}>✕</button>
      </div>

      {/* ── 메시지 목록 ── */}
      <div style={styles.msgList}>
        {messages.length === 0 && (
          <div style={{ textAlign: 'center', color: '#4a5568', fontSize: 13, marginTop: 20 }}>
            {connected ? '첫 응원 메시지를 보내보세요! ⚾' : '연결 중...'}
          </div>
        )}
        {messages.map((msg, idx) => (
          <MessageItem
            key={idx}
            msg={msg}
            isMe={msg.senderNickname === user?.nickname}
            teamColor={teamColor}
          />
        ))}
        <div ref={endRef} />
      </div>

      {/* ── 리액션 바 ── */}
      <div style={styles.reactionBar}>
        {REACTIONS.map((r) => (
          <button
            key={r.id}
            id={`live-reaction-${r.id}`}
            onClick={() => handleReaction(r.id)}
            disabled={!connected || !user}
            style={{
              ...styles.reactionBtn,
              opacity: (connected && user) ? 1 : 0.4,
              cursor: (connected && user) ? 'pointer' : 'not-allowed',
            }}
            title={r.label}
          >
            <span style={{ fontSize: 18 }}>{r.emoji}</span>
            <span style={{ fontSize: 10, color: '#a0aec0', marginTop: 2 }}>{r.label}</span>
          </button>
        ))}
      </div>

      {/* ── 입력창 ── */}
      <div style={styles.inputArea}>
        {!user ? (
          <div style={{
            flex: 1, textAlign: 'center', color: '#a0aec0', fontSize: 13,
            padding: '8px 0', background: 'rgba(255,255,255,0.06)', borderRadius: 20
          }}>
            로그인한 회원만 채팅에 참여할 수 있습니다.
          </div>
        ) : (
          <>
            <input
              id="live-chat-input"
              style={styles.input}
              placeholder={connected ? '응원 메시지 입력... (Enter)' : '연결 중...'}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={!connected}
            />
            <button
              id="live-chat-send"
              onClick={handleSend}
              disabled={!connected || !inputText.trim()}
              style={{
                ...styles.sendBtn,
                background: (connected && inputText.trim()) ? teamColor : '#4a5568',
                cursor: (connected && inputText.trim()) ? 'pointer' : 'not-allowed',
              }}
            >
              ➤
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ── 스타일 ────────────────────────────────────────────────────────────
const styles = {
  wrapper: {
    position: 'fixed', bottom: 0, right: 0,
    width: 360, height: 560,
    background: '#1a202c',
    borderRadius: '16px 16px 0 0',
    display: 'flex', flexDirection: 'column',
    boxShadow: '0 -8px 30px rgba(0,0,0,0.5)',
    zIndex: 1100,
    overflow: 'hidden',
    border: '1px solid rgba(255,255,255,0.08)',
    fontFamily: 'inherit',
  },
  reactionOverlay: {
    position: 'absolute', inset: 0,
    pointerEvents: 'none',
    zIndex: 9999,
    overflow: 'hidden',
  },
  header: {
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '12px 16px', flexShrink: 0,
    transition: 'background 0.3s ease',
  },
  closeBtn: {
    background: 'rgba(255,255,255,0.2)', border: 'none',
    color: '#fff', borderRadius: 8, width: 28, height: 28,
    fontSize: 13, cursor: 'pointer', display: 'flex',
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  msgList: {
    flex: 1, overflowY: 'auto', padding: '12px 14px',
    display: 'flex', flexDirection: 'column',
    scrollbarWidth: 'thin',
    scrollbarColor: '#4a5568 transparent',
  },
  reactionBar: {
    display: 'flex', gap: 4, padding: '8px 12px',
    background: '#2d3748', borderTop: '1px solid rgba(255,255,255,0.06)',
    flexShrink: 0,
  },
  reactionBtn: {
    flex: 1, background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10,
    padding: '6px 4px', display: 'flex', flexDirection: 'column',
    alignItems: 'center', transition: 'background 0.15s',
    fontFamily: 'inherit',
  },
  inputArea: {
    display: 'flex', padding: '10px 12px', gap: 8,
    background: '#2d3748', borderTop: '1px solid rgba(255,255,255,0.06)',
    flexShrink: 0,
  },
  input: {
    flex: 1, background: '#1a202c',
    border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20,
    color: '#fff', padding: '8px 14px', outline: 'none',
    fontSize: 13, fontFamily: 'inherit',
  },
  sendBtn: {
    border: 'none', borderRadius: '50%',
    width: 36, height: 36, color: '#fff', fontSize: 14,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0, transition: 'background 0.2s',
  },
};
