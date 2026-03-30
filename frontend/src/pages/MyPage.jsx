import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { TeamBadge } from '../components/TeamComponents'
import api from '../api/api'

export default function MyPage() {
  const { user, logout, fetchMyInfo } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [newNickname, setNewNickname] = useState('');

  // 컴포넌트 마운트 시 또는 user 정보가 변경될 때 초기 닉네임 설정
  useEffect(() => {
    if (user?.nickname) {
      setNewNickname(user.nickname);
    }
  }, [user]);

  if (!user) return <div className="loading">사용자 정보를 불러오는 중입니다...</div>;

  const handleUpdateNickname = async () => {
    if (!newNickname.trim()) return alert('닉네임을 입력해주세요.');
    
    try {
      await api.put('/members/me', { nickname: newNickname });
      await fetchMyInfo(); // 수정 후 최신 정보 다시 불러오기
      setIsEditing(false);
      alert('닉네임이 성공적으로 수정되었습니다.');
    } catch (error) {
      const errorMsg = error.response?.data?.message || '닉네임 수정에 실패했습니다.';
      alert(errorMsg);
    }
  };

  return (
    <div className="my-page">
      <div className="page-header">
        <h2 className="page-title">마이페이지</h2>
        <p className="page-subtitle">내 정보와 직관 일정을 관리해보세요.</p>
      </div>

      {/* 상단 프로필 섹션 */}
      <div className="my-profile-section">
        <div className="my-profile-row" style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
          {/* 닉네임 첫 글자로 아바타 생성 */}
          <div className="avatar-lg" style={{ 
            width: 60, height: 60, borderRadius: '50%', background: '#e94560', 
            color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 700 
          }}>
            {user.nickname?.substring(0, 1)}
          </div>
          
          <div style={{ flex: 1 }}>
            {isEditing ? (
              <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                <input 
                  type="text" 
                  value={newNickname} 
                  onChange={(e) => setNewNickname(e.target.value)}
                  style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #ddd', fontSize: 14 }}
                />
                <button onClick={handleUpdateNickname} style={{ background: '#e94560', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: 6, cursor: 'pointer' }}>저장</button>
                <button onClick={() => setIsEditing(false)} style={{ background: '#eee', border: 'none', padding: '6px 12px', borderRadius: 6, cursor: 'pointer' }}>취소</button>
              </div>
            ) : (
              <div className="my-name" style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 20, fontWeight: 700 }}>
                {user.nickname}
                <span onClick={() => setIsEditing(true)} style={{ fontSize: 16, cursor: 'pointer', filter: 'grayscale(1)' }}>✏️</span>
              </div>
            )}
            
            <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
              <TeamBadge teamId={user.teamShortName || 'LG'} />
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
          <button className="btn-edit" style={{ padding: '10px 16px', borderRadius: 8, border: '1px solid #ddd', background: '#fff', cursor: 'pointer' }} onClick={() => alert('프로필 이미지는 준비 중입니다.')}>⚙️ 설정</button>
          <button className="btn-edit" onClick={logout} style={{ padding: '10px 16px', borderRadius: 8, border: '1px solid #e94560', color: '#e94560', background: '#fff', cursor: 'pointer' }}>🚪 로그아웃</button>
        </div>
      </div>

      {/* 내 정보 섹션 */}
      <div className="my-section" style={{ marginTop: 30, padding: 20, background: '#f8f9fa', borderRadius: 12 }}>
        <div className="my-section-title" style={{ fontWeight: 800, marginBottom: 16 }}>🛡️ 내 활동 정보</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div className="my-stat-item" style={{ padding: 16, background: '#fff', borderRadius: 8, boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
            <div className="my-stat-label" style={{ fontSize: 12, color: '#888', marginBottom: 4 }}>🔥 매너 온도</div>
            <div className="my-stat-value" style={{ fontSize: 18, fontWeight: 700 }}>{user.mannerTemperature?.toFixed(1)}°</div>
          </div>
          <div className="my-stat-item" style={{ padding: 16, background: '#fff', borderRadius: 8, boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
            <div className="my-stat-label" style={{ fontSize: 12, color: '#888', marginBottom: 4 }}>🏆 뱃지 등급</div>
            <div className="my-stat-value" style={{ fontSize: 18, fontWeight: 700, color: '#0d6efd' }}>{user.badgeLevel}</div>
          </div>
        </div>
      </div>

      {/* 직관 일정 섹션 */}
      <div className="my-section" style={{ marginTop: 30 }}>
        <div className="my-section-title" style={{ fontWeight: 800, marginBottom: 16 }}>📅 내 직관 일정</div>
        <div className="schedule-card" style={{ background: '#2c3e50', padding: 20, borderRadius: 12, color: '#fff' }}>
          <div className="schedule-label" style={{ opacity: 0.7, fontSize: 12, marginBottom: 8 }}>다가오는 직관</div>
          <div className="schedule-date" style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>3월 28일 (금)</div>
          <div className="schedule-match" style={{ fontSize: 16 }}>LG vs 두산 (잠실 야구장)</div>
        </div>
        <button className="see-all" style={{ width: '100%', marginTop: 12, padding: 12, background: 'none', border: '1px solid #eee', borderRadius: 8, color: '#666', cursor: 'pointer' }}>전체 일정 보기 →</button>
      </div>
    </div>
  )
}