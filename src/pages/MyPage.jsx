import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { TeamBadge } from '../components/TeamComponents'
import api from '../api/api'

export default function MyPage() {
  const { user, logout, fetchMyInfo } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [newNickname, setNewNickname] = useState(user?.nickname || '');

  if (!user) return null;

  const handleUpdateNickname = async () => {
    try {
      await api.put('/members/me', { nickname: newNickname });
      await fetchMyInfo();
      setIsEditing(false);
      alert('닉네임이 수정되었습니다.');
    } catch (error) {
      alert('닉네임 수정에 실패했습니다.');
    }
  };

  return (
    <div className="my-page">
      <div className="page-header">
        <h2 className="page-title">마이페이지</h2>
        <p className="page-subtitle">내 정보와 직관 일정을 관리해보세요.</p>
      </div>

      <div className="my-profile-section">
        <div className="my-profile-row">
          <div className="avatar-lg">{user.nickname.substring(0, 1)}</div>
          <div>
            {isEditing ? (
              <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                <input 
                  type="text" 
                  value={newNickname} 
                  onChange={(e) => setNewNickname(e.target.value)}
                  style={{ padding: '4px 8px', borderRadius: 4, border: '1px solid #ddd' }}
                />
                <button onClick={handleUpdateNickname} style={{ background: '#e94560', color: '#fff', border: 'none', padding: '4px 8px', borderRadius: 4 }}>저장</button>
                <button onClick={() => setIsEditing(false)} style={{ background: '#eee', border: 'none', padding: '4px 8px', borderRadius: 4 }}>취소</button>
              </div>
            ) : (
              <div className="my-name" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {user.nickname}
                <span onClick={() => setIsEditing(true)} style={{ fontSize: 12, color: '#999', cursor: 'pointer' }}>✏️</span>
              </div>
            )}
            <TeamBadge teamId={user.team?.id || 'LG'} />
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn-edit" onClick={() => alert('프로필 이미지는 준비 중입니다.')}>⚙️ 프로필 수정</button>
          <button className="btn-edit" onClick={logout} style={{ color: '#e94560', borderColor: '#e94560' }}>🚪 로그아웃</button>
        </div>
      </div>

      <div className="my-section">
        <div className="my-section-title">🛡️ 내 정보</div>
        <div className="my-stat-item">
          <div className="my-stat-label">🔥 매너 온도</div>
          <div className="my-stat-value">{user.mannerTemperature.toFixed(1)}°</div>
        </div>
        <div className="my-stat-item">
          <div className="my-stat-label">🏆 뱃지 등급</div>
          <div className="my-stat-value" style={{ color: '#0d6efd' }}>{user.badgeLevel}</div>
        </div>
      </div>

      <div className="my-section">
        <div className="my-section-title">📅 내 직관 일정</div>
        <div className="schedule-card" style={{ background: '#2c3e50' }}>
          <div className="schedule-label">다가오는 직관</div>
          <div className="schedule-date">3월 28일 (금)</div>
          <div className="schedule-match">LG vs 두산</div>
        </div>
        <button className="see-all">전체 일정 보기 →</button>
      </div>
    </div>
  )
}
