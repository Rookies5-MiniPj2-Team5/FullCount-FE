import { useState } from 'react';
import * as authApi from '../api/auth';
import { TEAMS, TEAM_LOGO, TEAM_NAME } from '../components/TeamComponents';

export default function SignupPage({ onSwitchToLogin }) {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    nickname: '',
    teamId: 1
  });
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await authApi.signup(formData);
      alert('회원가입이 완료되었습니다! 로그인해주세요.');
      onSwitchToLogin();
    } catch (err) {
      if (err.response && err.response.data) {
        setError(err.response.data.message || '회원가입 중 오류가 발생했습니다.');
      } else {
        setError('서버와 통신할 수 없습니다. 잠시 후 다시 시도해주세요.');
      }
    }
  };

  // KBO 팀 리스트 (ID: 1~10 매핑)
  const availableTeams = TEAMS.filter(t => t.id !== 'ALL');

  return (
    <div style={styles.container}>
      {/* ── 좌측: 몰입형 배경 ── */}
      <div style={styles.leftSection}>
        <div style={styles.overlay} />
        <div style={styles.welcomeText}>
          <div style={styles.badge}>KBO FAN COMMUNITY</div>
          <h1 style={styles.mainTitle}>
            야구팬들의 성지,<br />
            <span style={{ color: '#e94560' }}>FULL COUNT</span>에<br />
            오신 것을 환영합니다!
          </h1>
          <p style={styles.subTitle}>
            좋아하는 팀의 소식을 가장 먼저 접하고,<br />
            열광적인 팬들과 함께 진하게 응원하세요.
          </p>
        </div>
      </div>

      {/* ── 우측: 회원가입 폼 ── */}
      <div style={styles.rightSection}>
        <div style={styles.formWrapper}>
          <h2 style={styles.formTitle}>회원가입</h2>
          <p style={styles.formDesc}>오늘부터 '풀카운트'와 함께하세요.</p>

          <form onSubmit={handleSubmit}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>이메일</label>
              <input
                type="email"
                placeholder="example@email.com"
                style={styles.input}
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>비밀번호</label>
              <input
                type="password"
                placeholder="••••••••"
                style={styles.input}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
              />
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>닉네임</label>
              <input
                type="text"
                placeholder="닉네임을 입력해주세요"
                style={styles.input}
                value={formData.nickname}
                onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
                required
              />
            </div>

            {/* 비주얼 팀 셀렉터 */}
            <div style={styles.inputGroup}>
              <label style={styles.label}>응원 팀 선택</label>
              <div style={styles.teamGrid}>
                {availableTeams.map((t, index) => {
                  const dbId = index + 1;
                  const isSelected = formData.teamId === dbId;
                  return (
                    <div
                      key={t.id}
                      onClick={() => setFormData({ ...formData, teamId: dbId })}
                      style={{
                        ...styles.teamItem,
                        border: isSelected ? '2px solid #e94560' : '1px solid #eee',
                        backgroundColor: isSelected ? '#fff5f6' : '#fff',
                        transform: isSelected ? 'scale(1.05)' : 'scale(1)',
                        boxShadow: isSelected ? '0 4px 12px rgba(233, 69, 96, 0.2)' : 'none',
                      }}
                    >
                      <img
                        src={TEAM_LOGO[t.id]}
                        alt={t.name}
                        style={styles.teamLogo}
                      />
                      <span style={{
                        ...styles.teamName,
                        color: isSelected ? '#e94560' : '#666',
                        fontWeight: isSelected ? '800' : '500'
                      }}>
                        {t.name}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {error && <p style={styles.errorText}>{error}</p>}

            <button type="submit" style={styles.submitBtn}>
              무료로 시작하기
            </button>
          </form>

          <p style={styles.switchText}>
            이미 계정이 있으신가요? <span
              onClick={onSwitchToLogin}
              style={styles.switchLink}
            >로그인</span>
          </p>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    minHeight: '100vh',
    width: '100%',
    backgroundColor: '#fff',
    fontFamily: '"Pretendard", -apple-system, sans-serif',
  },
  leftSection: {
    flex: 1.2,
    position: 'relative',
    backgroundImage: 'url("/baseball_stadium_night.png")',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    display: 'flex',
    alignItems: 'center',
    padding: '60px',
    color: '#fff',
    overflow: 'hidden',
  },
  overlay: {
    position: 'absolute',
    inset: 0,
    background: 'linear-gradient(45deg, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.4) 100%)',
    zIndex: 1,
  },
  welcomeText: {
    position: 'relative',
    zIndex: 2,
    maxWidth: '500px',
  },
  badge: {
    display: 'inline-block',
    padding: '6px 12px',
    backgroundColor: '#e94560',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: '800',
    letterSpacing: '1px',
    marginBottom: '20px',
  },
  mainTitle: {
    fontSize: '44px',
    fontWeight: '900',
    lineHeight: '1.2',
    marginBottom: '24px',
  },
  subTitle: {
    fontSize: '18px',
    lineHeight: '1.6',
    opacity: '0.8',
  },
  rightSection: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px',
    backgroundColor: '#fff',
  },
  formWrapper: {
    width: '100%',
    maxWidth: '440px',
  },
  formTitle: {
    fontSize: '28px',
    fontWeight: '800',
    color: '#1a1a1a',
    marginBottom: '8px',
  },
  formDesc: {
    fontSize: '15px',
    color: '#666',
    marginBottom: '32px',
  },
  inputGroup: {
    marginBottom: '20px',
  },
  label: {
    display: 'block',
    fontSize: '13px',
    fontWeight: '700',
    color: '#333',
    marginBottom: '8px',
  },
  input: {
    width: '100%',
    padding: '12px 16px',
    borderRadius: '10px',
    border: '1px solid #e1e1e1',
    fontSize: '15px',
    outline: 'none',
    transition: 'border-color 0.2s',
    boxSizing: 'border-box',
  },
  teamGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(5, 1fr)',
    gap: '10px',
  },
  teamItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '10px 4px',
    borderRadius: '12px',
    cursor: 'pointer',
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
  },
  teamLogo: {
    width: '32px',
    height: '32px',
    objectFit: 'contain',
    marginBottom: '6px',
  },
  teamName: {
    fontSize: '11px',
  },
  errorText: {
    color: '#e94560',
    fontSize: '13px',
    margin: '12px 0',
  },
  submitBtn: {
    width: '100%',
    padding: '15px',
    backgroundColor: '#1a1a1a',
    color: '#fff',
    border: 'none',
    borderRadius: '10px',
    fontSize: '16px',
    fontWeight: '700',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
    marginTop: '10px',
  },
  switchText: {
    marginTop: '24px',
    textAlign: 'center',
    fontSize: '14px',
    color: '#666',
  },
  switchLink: {
    color: '#e94560',
    fontWeight: '700',
    cursor: 'pointer',
    marginLeft: '6px',
  },
};
