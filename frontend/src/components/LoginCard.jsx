import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { TEAM_LOGO, TEAM_NAME } from './TeamComponents';

/* ── KBO Team Brand Mapping ── */
const KBO_TEAMS = {
  LG:  { name: 'LG 트윈스',    color: '#C30452', colorDark: '#8c023a' },
  DU:  { name: '두산 베어스',   color: '#131230', colorDark: '#0a0b1e' },
  SSG: { name: 'SSG 랜더스',   color: '#CE0E2D', colorDark: '#9a0a22' },
  KIA: { name: 'KIA 타이거즈',  color: '#EA0029', colorDark: '#b3001f' },
  SA:  { name: '삼성 라이온즈',  color: '#074CA1', colorDark: '#053a7a' },
  LO:  { name: '롯데 자이언츠',  color: '#A50021', colorDark: '#7a0018' },
  HH:  { name: '한화 이글스',   color: '#FF6600', colorDark: '#cc5200' },
  KT:  { name: 'KT 위즈',     color: '#000000', colorDark: '#000000' },
  NC:  { name: 'NC 다이노스',   color: '#315288', colorDark: '#243d66' },
  WO:  { name: '키움 히어로즈',  color: '#570514', colorDark: '#3d030e' },
};

/* ── Helpers ── */
function hexToRgba(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

/** Check if color is dark enough to need lighter text */
function isColorDark(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance < 0.45;
}

/**
 * Resolve team info from multiple possible user fields.
 * Backend may provide: teamShortName ('LG'), teamName ('LG 트윈스'), or supportedTeam.
 */
function resolveTeam(user) {
  // 1) Try teamShortName first (most reliable)
  const shortName = user.teamShortName || user.supportedTeam || '';
  if (shortName && KBO_TEAMS[shortName]) {
    return {
      id: shortName,
      ...KBO_TEAMS[shortName],
      logo: TEAM_LOGO[shortName] || null,
    };
  }

  // 2) Reverse-lookup by TEAM_NAME values (e.g. '두산' → 'DU')
  for (const [id, name] of Object.entries(TEAM_NAME)) {
    if (shortName === name || user.teamName === name || user.teamName === KBO_TEAMS[id]?.name) {
      return {
        id,
        ...KBO_TEAMS[id],
        logo: TEAM_LOGO[id] || null,
      };
    }
  }

  return null; // no team matched
}

/* ── Baseball stitch SVG (low-opacity) ── */
const STITCH_BG = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='60' viewBox='0 0 60 60'%3E%3Cpath d='M15 5 Q30 15 45 5' stroke='%23c8342f' stroke-width='1' fill='none' opacity='0.08'/%3E%3Cpath d='M15 55 Q30 45 45 55' stroke='%23c8342f' stroke-width='1' fill='none' opacity='0.08'/%3E%3Ccircle cx='20' cy='8' r='0.8' fill='%23c8342f' opacity='0.10'/%3E%3Ccircle cx='25' cy='10' r='0.8' fill='%23c8342f' opacity='0.10'/%3E%3Ccircle cx='30' cy='11' r='0.8' fill='%23c8342f' opacity='0.10'/%3E%3Ccircle cx='35' cy='10' r='0.8' fill='%23c8342f' opacity='0.10'/%3E%3Ccircle cx='40' cy='8' r='0.8' fill='%23c8342f' opacity='0.10'/%3E%3Ccircle cx='20' cy='52' r='0.8' fill='%23c8342f' opacity='0.10'/%3E%3Ccircle cx='25' cy='50' r='0.8' fill='%23c8342f' opacity='0.10'/%3E%3Ccircle cx='30' cy='49' r='0.8' fill='%23c8342f' opacity='0.10'/%3E%3Ccircle cx='35' cy='50' r='0.8' fill='%23c8342f' opacity='0.10'/%3E%3Ccircle cx='40' cy='52' r='0.8' fill='%23c8342f' opacity='0.10'/%3E%3C/svg%3E")`;

export default function LoginCard({ onNavigate }) {
  const { user, login, logout } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [exiting, setExiting] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;

    setLoading(true);
    setError('');
    try {
      await login(email, password);
    } catch (err) {
      if (err.response && err.response.data) {
        setError(err.response.data.message || '로그인 실패');
      } else {
        setError('서버 통신 오류');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    setExiting(true);
    setTimeout(async () => {
      await logout();
      setEmail('');
      setPassword('');
      setExiting(false);
    }, 250);
  };

  /* ============================
   *  LOGGED-IN  — Fan ID Card
   * ============================ */
  if (user) {
    const team = resolveTeam(user);
    const teamColor = team?.color || '#e94560';
    const teamColorDark = team?.colorDark || '#c4334d';
    const teamLogo = team?.logo || null;
    const teamFullName = team?.name || user.teamName || '야구';

    // Adaptive text colors based on team brand brightness
    const dark = isColorDark(teamColor);
    const greetingColor = dark ? '#555' : '#666';
    const cheerTextColor = teamColorDark;

    return (
      <div
        className={`login-widget login-widget--fan ${exiting ? 'login-widget--exit' : ''}`}
        style={{
          background: `linear-gradient(135deg, ${hexToRgba(teamColor, 0.13)} 0%, #ffffff 55%, ${hexToRgba(teamColor, 0.06)} 100%)`,
          border: `1px solid ${hexToRgba(teamColor, 0.18)}`,
        }}
      >
        {/* colored accent bar at top */}
        <div
          className="fan-card-accent"
          style={{ background: `linear-gradient(90deg, ${teamColor}, ${hexToRgba(teamColor, 0.35)})` }}
        />

        <div className="login-profile">
          <div className="login-profile-info">
            {/* Team logo avatar */}
            {teamLogo ? (
              <div
                className="fan-avatar-ring"
                style={{ borderColor: hexToRgba(teamColor, 0.5) }}
              >
                <img
                  src={teamLogo}
                  alt={teamFullName}
                  className="fan-avatar-img"
                />
              </div>
            ) : (
              <div
                className="login-avatar"
                style={{ background: teamColor, color: '#fff' }}
              >
                {user.nickname ? user.nickname.charAt(0).toUpperCase() : '⚾'}
              </div>
            )}

            {/* Personalized greeting */}
            <div className="login-welcome">
              <span className="login-greeting" style={{ color: greetingColor }}>
                Hello,
              </span>
              <span className="login-username">
                <strong>{user.nickname || user.userId || '사용자'}</strong>님!
              </span>
              <span className="fan-cheer" style={{ color: cheerTextColor }}>
                ⚾ 오늘도 <strong>{teamFullName}</strong> 응원 준비 완료!
              </span>
            </div>
          </div>

          <button
            className="login-btn-logout login-btn-logout--ghost"
            onClick={handleLogout}
            style={{ borderColor: hexToRgba(teamColor, 0.3), color: teamColorDark }}
          >
            로그아웃
          </button>
        </div>
      </div>
    );
  }

  /* ============================
   *  LOGGED-OUT — Login Form
   * ============================ */
  return (
    <div className="login-widget login-widget--login">
      {/* title area */}
      <div className="login-header">
        <span className="login-header-icon">⚾</span>
        <span className="login-header-title">FULL COUNT</span>
      </div>

      <form className="login-form" onSubmit={handleLogin}>
        <div className="login-input-group">
          <input
            type="email"
            placeholder="이메일"
            className="login-input login-input--stitch"
            style={{ backgroundImage: STITCH_BG }}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="username"
          />
          <input
            type="password"
            placeholder="비밀번호"
            className="login-input login-input--stitch"
            style={{ backgroundImage: STITCH_BG }}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />
        </div>

        {error && (
          <div className="login-error">⚠️ {error}</div>
        )}

        <button
          type="submit"
          className="login-btn-submit"
          disabled={loading}
          style={{ opacity: loading ? 0.7 : 1 }}
        >
          {loading ? '로그인 중...' : '로그인'}
        </button>

        <div className="login-links">
          <a
            href="#signup"
            onClick={(e) => {
              e.preventDefault();
              if (onNavigate) onNavigate('signup');
            }}
          >
            회원가입
          </a>
          <span className="login-divider">|</span>
          <a href="#find-pw">아이디/비밀번호 찾기</a>
        </div>

        <p className="login-cta-text">
          가입하고 응원팀을 선택하면, 나만의 피드를 꾸밀 수 있어요! 🏟️
        </p>
      </form>
    </div>
  );
}
