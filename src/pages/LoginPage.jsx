import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function LoginPage({ onSwitchToSignup }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await login(email, password);
    } catch (err) {
      setError('이메일 또는 비밀번호가 올바르지 않습니다.');
    }
  };

  return (
    <div className="page-content" style={{ padding: '80px 40px', background: '#fff' }}>
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <h1 style={{ fontSize: 32, color: '#e94560', fontWeight: 900 }}>⚾ FULL COUNT</h1>
        <p style={{ color: '#888', marginTop: 8 }}>야구 팬을 위한 커뮤니티</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 6 }}>이메일</label>
          <input
            type="email"
            className="chip"
            style={{ width: '100%', borderRadius: 8, padding: 12, border: '1px solid #ddd' }}
            placeholder="example@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div style={{ marginBottom: 24 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 6 }}>비밀번호</label>
          <input
            type="password"
            className="chip"
            style={{ width: '100%', borderRadius: 8, padding: 12, border: '1px solid #ddd' }}
            placeholder="비밀번호를 입력하세요"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        {error && <p style={{ color: '#e94560', fontSize: 12, marginBottom: 16 }}>{error}</p>}

        <button
          type="submit"
          style={{
            width: '100%', padding: 14, background: '#e94560', color: '#fff',
            border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer',
            fontSize: 16
          }}
        >
          로그인
        </button>
      </form>

      <div style={{ marginTop: 24, textAlign: 'center', fontSize: 13, color: '#666' }}>
        계정이 없으신가요? <span
          onClick={onSwitchToSignup}
          style={{ color: '#e94560', fontWeight: 700, cursor: 'pointer' }}
        >회원가입</span>
      </div>
    </div>
  );
}
