import { useState } from 'react';
import api from '../api/api';
import { TEAMS } from '../components/TeamComponents';

export default function SignupPage({ onSwitchToLogin }) {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    nickname: '',
    teamId: 'LG'
  });
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/auth/signup', formData);
      alert('회원가입이 완료되었습니다! 로그인해주세요.');
      onSwitchToLogin();
    } catch (err) {
      setError('회원가입에 실패했습니다. 다시 확인해주세요.');
    }
  };

  return (
    <div className="page-content" style={{ padding: '40px 40px', background: '#fff' }}>
      <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 30 }}>회원가입</h2>

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 6 }}>이메일</label>
          <input
            type="email"
            style={{ width: '100%', borderRadius: 8, padding: 12, border: '1px solid #ddd' }}
            value={formData.email}
            onChange={(e) => setFormData({...formData, email: e.target.value})}
            required
          />
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 6 }}>비밀번호</label>
          <input
            type="password"
            style={{ width: '100%', borderRadius: 8, padding: 12, border: '1px solid #ddd' }}
            value={formData.password}
            onChange={(e) => setFormData({...formData, password: e.target.value})}
            required
          />
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 6 }}>닉네임</label>
          <input
            type="text"
            style={{ width: '100%', borderRadius: 8, padding: 12, border: '1px solid #ddd' }}
            value={formData.nickname}
            onChange={(e) => setFormData({...formData, nickname: e.target.value})}
            required
          />
        </div>
        <div style={{ marginBottom: 30 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 6 }}>응원 팀</label>
          <select
            style={{ width: '100%', borderRadius: 8, padding: 12, border: '1px solid #ddd' }}
            value={formData.teamId}
            onChange={(e) => setFormData({...formData, teamId: Number(e.target.value)})}
          >
             {TEAMS.filter(t => t.id !== 'ALL').map((t, index) => (
                <option key={t.id} value={index + 1}>{t.name}</option>
             ))}
          </select>
        </div>

        {error && <p style={{ color: '#e94560', fontSize: 12, marginBottom: 16 }}>{error}</p>}

        <button
          type="submit"
          style={{
            width: '100%', padding: 14, background: '#1a2a4a', color: '#fff',
            border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer'
          }}
        >
          가입하기
        </button>
      </form>

      <div style={{ marginTop: 24, textAlign: 'center', fontSize: 13, color: '#666' }}>
        이미 계정이 있으신가요? <span
          onClick={onSwitchToLogin}
          style={{ color: '#1a2a4a', fontWeight: 700, cursor: 'pointer' }}
        >로그인</span>
      </div>
    </div>
  );
}
