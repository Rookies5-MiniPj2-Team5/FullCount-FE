import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const STADIUM_BG = "https://images.unsplash.com/photo-1508344928928-7165b67de128?q=80&w=2070&auto=format&fit=crop";

const styles = {
  wrapper: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    fontFamily: "'Inter', 'Segoe UI', sans-serif",
    overflow: 'hidden',
  },
  bgImage: {
    position: 'absolute',
    inset: 0,
    backgroundImage: `url('${STADIUM_BG}')`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    zIndex: 0,
  },
  bgOverlay: {
    position: 'absolute',
    inset: 0,
    background: 'linear-gradient(135deg, rgba(0,20,60,0.82) 0%, rgba(10,10,30,0.75) 100%)',
    zIndex: 1,
  },
  card: {
    position: 'relative',
    zIndex: 2,
    width: '100%',
    maxWidth: 420,
    margin: '0 16px',
    background: 'rgba(255,255,255,0.08)',
    backdropFilter: 'blur(18px)',
    WebkitBackdropFilter: 'blur(18px)',
    borderRadius: 20,
    border: '1px solid rgba(255,255,255,0.18)',
    boxShadow: '0 8px 48px rgba(0,0,0,0.55)',
    padding: '48px 40px 40px',
  },
  logo: {
    textAlign: 'center',
    marginBottom: 32,
  },
  logoEmoji: {
    fontSize: 48,
    display: 'block',
    marginBottom: 8,
    filter: 'drop-shadow(0 2px 8px rgba(255,120,0,0.5))',
  },
  logoTitle: {
    fontSize: 30,
    fontWeight: 900,
    color: '#ffffff',
    letterSpacing: 2,
    textShadow: '0 2px 16px rgba(255,100,0,0.4)',
    margin: 0,
  },
  logoSub: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 13,
    marginTop: 6,
    letterSpacing: 0.5,
  },
  divider: {
    width: 48,
    height: 3,
    background: 'linear-gradient(90deg, #FF6A00, #EE0979)',
    borderRadius: 99,
    margin: '12px auto 0',
  },
  label: {
    display: 'block',
    fontSize: 12,
    fontWeight: 700,
    color: 'rgba(255,255,255,0.75)',
    marginBottom: 6,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  input: {
    width: '100%',
    padding: '13px 16px',
    borderRadius: 10,
    border: '1.5px solid rgba(255,255,255,0.2)',
    background: 'rgba(255,255,255,0.1)',
    color: '#fff',
    fontSize: 15,
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color 0.2s, background 0.2s',
  },
  inputFocus: {
    borderColor: '#FF6A00',
    background: 'rgba(255,255,255,0.16)',
  },
  formGroup: {
    marginBottom: 18,
  },
  errorMsg: {
    color: '#FF6A7A',
    fontSize: 12,
    marginBottom: 16,
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  },
  button: {
    width: '100%',
    padding: '14px 0',
    background: 'linear-gradient(90deg, #FF6A00 0%, #EE0979 100%)',
    color: '#fff',
    border: 'none',
    borderRadius: 10,
    fontWeight: 800,
    fontSize: 16,
    cursor: 'pointer',
    letterSpacing: 1,
    boxShadow: '0 4px 24px rgba(255,106,0,0.45)',
    transition: 'transform 0.15s, box-shadow 0.15s',
    marginTop: 8,
  },
  switchText: {
    marginTop: 28,
    textAlign: 'center',
    fontSize: 13,
    color: 'rgba(255,255,255,0.55)',
  },
  switchLink: {
    color: '#FF8C42',
    fontWeight: 700,
    cursor: 'pointer',
    textDecoration: 'underline',
    textUnderlineOffset: 2,
  },
  badge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 5,
    background: 'rgba(255,106,0,0.18)',
    border: '1px solid rgba(255,106,0,0.35)',
    borderRadius: 99,
    padding: '3px 12px',
    fontSize: 11,
    color: '#FFB347',
    fontWeight: 700,
    letterSpacing: 1,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
};

export default function LoginPage({ onSwitchToSignup }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [focusedField, setFocusedField] = useState(null);
  const [btnHover, setBtnHover] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await login(username, password);
    } catch (err) {
        if (err.response && err.response.data) {
          setError(err.response.data.message || '로그인 중 오류가 발생했습니다.');
        } else {
          setError('서버와 통신할 수 없습니다. 잠시 후 다시 시도해주세요.');
        }
      }
  };

  return (
    <div style={styles.wrapper}>
      {/* Stadium Background */}
      <div style={styles.bgImage} />
      <div style={styles.bgOverlay} />

      {/* Login Card */}
      <div style={styles.card}>
        {/* Logo / Header */}
        <div style={styles.logo}>
          <span style={styles.badge}>⚾ Baseball Community</span>
          <h1 style={styles.logoTitle}>FULL COUNT</h1>
          <p style={styles.logoSub}>야구 팬을 위한 커뮤니티</p>
          <div style={styles.divider} />
        </div>

        {/* Form — action/names kept for Spring Security compatibility */}
        <form action="/login" method="post" onSubmit={handleSubmit}>
          <div style={styles.formGroup}>
            <label style={styles.label} htmlFor="username">아이디 / 이메일</label>
            <input
              id="username"
              name="username"
              type="text"
              style={{
                ...styles.input,
                ...(focusedField === 'username' ? styles.inputFocus : {}),
              }}
              placeholder="example@email.com"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onFocus={() => setFocusedField('username')}
              onBlur={() => setFocusedField(null)}
              required
              autoComplete="username"
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label} htmlFor="password">비밀번호</label>
            <input
              id="password"
              name="password"
              type="password"
              style={{
                ...styles.input,
                ...(focusedField === 'password' ? styles.inputFocus : {}),
              }}
              placeholder="비밀번호를 입력하세요"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onFocus={() => setFocusedField('password')}
              onBlur={() => setFocusedField(null)}
              required
              autoComplete="current-password"
            />
          </div>

          {error && (
            <p style={styles.errorMsg}>
              ⚠️ {error}
            </p>
          )}

          <button
            type="submit"
            style={{
              ...styles.button,
              ...(btnHover ? { transform: 'translateY(-2px)', boxShadow: '0 8px 32px rgba(255,106,0,0.6)' } : {}),
            }}
            onMouseEnter={() => setBtnHover(true)}
            onMouseLeave={() => setBtnHover(false)}
          >
            ⚾ 로그인
          </button>
        </form>

        <div style={styles.switchText}>
          계정이 없으신가요?{' '}
          <span onClick={onSwitchToSignup} style={styles.switchLink}>
            회원가입
          </span>
        </div>
      </div>
    </div>
  );
}
