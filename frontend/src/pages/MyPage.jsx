import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { TeamBadge } from '../components/TeamComponents'
import AttendanceCalendar from './AttendanceCalendar' 
import api from '../api/api'

// KBO 10개 구단 하드코딩 (백엔드 data.sql의 id 값과 정확히 일치)
const KBO_TEAMS = [
  { id: 1, name: 'LG 트윈스' },
  { id: 2, name: '두산 베어스' },
  { id: 3, name: 'SSG 랜더스' },
  { id: 4, name: 'KIA 타이거즈' },
  { id: 5, name: '삼성 라이온즈' },
  { id: 6, name: '롯데 자이언츠' },
  { id: 7, name: '한화 이글스' },
  { id: 8, name: 'KT 위즈' },
  { id: 9, name: 'NC 다이노스' },
  { id: 10, name: '키움 히어로즈' }
];

export default function MyPage() {
  const { user, logout, fetchMyInfo } = useAuth();
  
  // 상태 관리
  const [isEditing, setIsEditing] = useState(false);
  const [newNickname, setNewNickname] = useState('');
  const [view, setView] = useState('main'); 
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('profile'); 
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [alerts, setAlerts] = useState({ 
    chat: true, 
    transfer: true, 
    manner: true 
  });
  const [newImageUrl, setNewImageUrl] = useState('');
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '' });

  // 유저 정보 로드 시 초기화
  useEffect(() => {
    if (user) {
      if (user.nickname) setNewNickname(user.nickname);
      setAlerts({
        chat: user.chatAlert ?? true,
        transfer: user.transferAlert ?? true,
        manner: user.mannerAlert ?? true
      });
      if (user.teamId) setSelectedTeamId(user.teamId.toString());
    }
  }, [user]);

  if (!user) return (
    <div className="empty-state">
      <div className="empty-icon">🔒</div>
      <p>로그인이 필요합니다.</p>
      <p style={{ fontSize: 12, color: '#999', marginTop: 8 }}>홈 화면 우측의 로그인 폼을 이용해주세요.</p>
    </div>
  );

  // --- API 호출 함수들 ---
  const handleUpdateNickname = async () => {
    if (!newNickname.trim()) return alert('닉네임을 입력해주세요.');
    try {
      await api.put('/members/me', { nickname: newNickname });
      await fetchMyInfo();
      setIsEditing(false);
      alert('닉네임이 성공적으로 수정되었습니다.');
    } catch (error) {
      alert(error.response?.data?.message || '닉네임 수정에 실패했습니다.');
    }
  };

  const handleChangeTeam = async () => {
    if (!selectedTeamId) return alert('변경할 팀을 선택해주세요.');
    if (!window.confirm('🚨 응원 팀 변경은 정규 시즌 중 1회만 가능합니다.\n정말 변경하시겠습니까?')) return;
    try {
      await api.put('/members/me/team', { teamId: parseInt(selectedTeamId) });
      await fetchMyInfo();
      alert('응원 팀이 성공적으로 변경되었습니다.');
      setIsSettingsModalOpen(false);
    } catch (error) {
      alert(error.response?.data?.message || '팀 변경에 실패했습니다.');
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) return alert('이미지 용량은 2MB를 초과할 수 없습니다.');
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onloadend = () => { setNewImageUrl(reader.result); };
  };

  const handleUpdateProfileImage = async () => {
    if (!newImageUrl.trim()) return alert('이미지를 선택하거나 URL을 입력해주세요.');
    try {
      await api.put('/members/me/profile-image', { profileImageUrl: newImageUrl });
      await fetchMyInfo();
      alert('프로필 이미지가 성공적으로 변경되었습니다.');
      setNewImageUrl('');
    } catch (error) {
      alert(error.response?.data?.message || '프로필 이미지 변경에 실패했습니다.');
    }
  };

  const handleUpdatePassword = async () => {
    if (!passwordForm.currentPassword || !passwordForm.newPassword) return alert('모든 필드를 입력해주세요.');
    try {
      await api.put('/members/me/password', passwordForm);
      alert('비밀번호 변경 성공! 다시 로그인해주세요.');
      setIsSettingsModalOpen(false);
      logout();
    } catch (error) {
      alert(error.response?.data?.message || '비밀번호 변경 실패');
    }
  };

  const handleToggleAlert = async (type, newValue) => {
    const newAlerts = { ...alerts, [type]: newValue };
    setAlerts(newAlerts);
    try {
      await api.put('/members/me/alerts', {
        chatAlert: newAlerts.chat,
        transferAlert: newAlerts.transfer,
        mannerAlert: newAlerts.manner
      });
      await fetchMyInfo(); 
    } catch (error) {
      alert('알림 설정 저장 실패');
      setAlerts(alerts);
    }
  };

  // 달력 뷰 전환 처리
  if (view === 'calendar') {
    return <AttendanceCalendar onBack={() => setView('main')} />;
  }

  return (
    <div className="my-page">
      <div className="page-header">
        <h2 className="page-title">마이페이지</h2>
        <p className="page-subtitle">내 정보와 직관 일정을 관리해보세요.</p>
      </div>

      <div className="my-profile-section">
        <div className="my-profile-row" style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
          <div className="avatar-lg" style={{ 
            width: 60, height: 60, borderRadius: '50%', background: '#e94560', overflow: 'hidden',
            color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 700 
          }}>
            {user.profileImageUrl ? (
              <img src={user.profileImageUrl} alt="프로필" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              user.nickname?.substring(0, 1)
            )}
          </div>
          
          <div style={{ flex: 1 }}>
            {isEditing ? (
              <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                <input type="text" value={newNickname} onChange={(e) => setNewNickname(e.target.value)} style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #ddd', fontSize: 14 }} />
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
              <span style={{ fontSize: 14, color: '#666' }}>{user.teamName} 팬</span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
          <button className="btn-edit" onClick={() => setIsSettingsModalOpen(true)} style={{ padding: '10px 16px', borderRadius: 8, border: '1px solid #ddd', background: '#fff', cursor: 'pointer' }}>⚙️ 설정</button>
          <button className="btn-edit" onClick={logout} style={{ padding: '10px 16px', borderRadius: 8, border: '1px solid #e94560', color: '#e94560', background: '#fff', cursor: 'pointer' }}>🚪 로그아웃</button>
        </div>
      </div>

      <div className="my-section" style={{ marginTop: 30, padding: 20, background: '#f8f9fa', borderRadius: 12 }}>
        <div className="my-section-title" style={{ fontWeight: 800, marginBottom: 16 }}>🛡️ 내 활동 정보</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div className="my-stat-item" style={{ padding: 16, background: '#fff', borderRadius: 8, boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
            <div className="my-stat-label" style={{ fontSize: 12, color: '#888', marginBottom: 4 }}>🔥 매너 온도</div>
            <div className="my-stat-value" style={{ fontSize: 18, fontWeight: 700 }}>{user.mannerTemperature?.toFixed(1) ?? '36.5'}°</div>
          </div>
          <div className="my-stat-item" style={{ padding: 16, background: '#fff', borderRadius: 8, boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
            <div className="my-stat-label" style={{ fontSize: 12, color: '#888', marginBottom: 4 }}>🏆 뱃지 등급</div>
            <div className="my-stat-value" style={{ fontSize: 18, fontWeight: 700, color: '#0d6efd' }}>{user.badgeLevel ?? 'ROOKIE'}</div>
          </div>
        </div>
      </div>

      <div className="my-section" style={{ marginTop: 30 }}>
        <div className="my-section-title" style={{ fontWeight: 800, marginBottom: 16 }}>📅 내 직관 일정</div>
        <div className="schedule-card" style={{ background: '#2c3e50', padding: 20, borderRadius: 12, color: '#fff' }}>
          <div className="schedule-label" style={{ opacity: 0.7, fontSize: 12, marginBottom: 8 }}>다가오는 직관</div>
          <div className="schedule-date" style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>3월 28일 (금)</div>
          <div className="schedule-match" style={{ fontSize: 16 }}>LG vs 두산 (잠실 야구장)</div>
        </div>
        <button className="see-all" onClick={() => setView('calendar')} style={{ width: '100%', marginTop: 12, padding: 12, background: 'none', border: '1px solid #eee', borderRadius: 8, color: '#666', cursor: 'pointer' }}>
          전체 일정 보기 →
        </button>
      </div>

      {isSettingsModalOpen && (
        <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, backdropFilter: 'blur(3px)' }}>
          <div className="modal-content" style={{ background: '#fff', padding: '24px', borderRadius: '16px', width: '90%', maxWidth: '400px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ margin: 0, fontSize: 20, fontWeight: 800 }}>⚙️ 환경 설정</h3>
              <button onClick={() => setIsSettingsModalOpen(false)} style={{ background: 'none', border: 'none', fontSize: 24, cursor: 'pointer', color: '#888' }}>&times;</button>
            </div>
            <div style={{ display: 'flex', borderBottom: '1px solid #eee', marginBottom: 20 }}>
              <button onClick={() => setActiveTab('profile')} style={{ flex: 1, padding: '10px 0', border: 'none', background: 'none', borderBottom: activeTab === 'profile' ? '2px solid #e94560' : 'none', color: activeTab === 'profile' ? '#e94560' : '#888', fontWeight: activeTab === 'profile' ? 700 : 400, cursor: 'pointer' }}>계정</button>
              <button onClick={() => setActiveTab('team')} style={{ flex: 1, padding: '10px 0', border: 'none', background: 'none', borderBottom: activeTab === 'team' ? '2px solid #e94560' : 'none', color: activeTab === 'team' ? '#e94560' : '#888', fontWeight: activeTab === 'team' ? 700 : 400, cursor: 'pointer' }}>팀 변경</button>
              <button onClick={() => setActiveTab('noti')} style={{ flex: 1, padding: '10px 0', border: 'none', background: 'none', borderBottom: activeTab === 'noti' ? '2px solid #e94560' : 'none', color: activeTab === 'noti' ? '#e94560' : '#888', fontWeight: activeTab === 'noti' ? 700 : 400, cursor: 'pointer' }}>알림</button>
            </div>

            {activeTab === 'profile' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div>
                  <label style={{ fontSize: 14, color: '#666', fontWeight: 600 }}>프로필 이미지 변경</label>
                  <div style={{ marginTop: 8, padding: '10px', border: '1px dashed #ccc', borderRadius: 8, background: '#fafafa' }}>
                    <input type="file" accept="image/*" onChange={handleImageUpload} style={{ width: '100%', fontSize: 13 }} />
                  </div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                    <input type="text" placeholder="외부 URL 입력..." value={newImageUrl} onChange={(e) => setNewImageUrl(e.target.value)} style={{ flex: 1, padding: '10px 12px', border: '1px solid #ddd', borderRadius: 8, fontSize: 14 }} />
                    <button onClick={handleUpdateProfileImage} style={{ padding: '0 16px', background: '#333', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold' }}>저장</button>
                  </div>
                </div>
                <hr style={{ border: 0, borderTop: '1px solid #eee' }} />
                <div>
                  <label style={{ fontSize: 14, color: '#666', fontWeight: 600 }}>비밀번호 변경</label>
                  <input type="password" placeholder="현재 비밀번호" value={passwordForm.currentPassword} onChange={(e) => setPasswordForm({...passwordForm, currentPassword: e.target.value})} style={{ width: '100%', padding: '10px 12px', border: '1px solid #ddd', borderRadius: 8, marginTop: 8 }} />
                  <input type="password" placeholder="새 비밀번호" value={passwordForm.newPassword} onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})} style={{ width: '100%', padding: '10px 12px', border: '1px solid #ddd', borderRadius: 8, marginTop: 8 }} />
                  <button onClick={handleUpdatePassword} style={{ width: '100%', padding: '12px', marginTop: 12, background: '#e94560', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 'bold' }}>비밀번호 재설정</button>
                </div>
              </div>
            )}

            {activeTab === 'team' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ padding: 12, background: '#fff3cd', color: '#856404', borderRadius: 8, fontSize: 13 }}>응원 팀 변경은 정규 시즌 중 1회만 가능합니다.</div>
                <div>
                  <label style={{ fontSize: 14, color: '#666', fontWeight: 600 }}>새로운 응원 팀 선택</label>
                  <select value={selectedTeamId} onChange={(e) => setSelectedTeamId(e.target.value)} style={{ width: '100%', padding: '10px 12px', border: '1px solid #ddd', borderRadius: 8, marginTop: 8 }}>
                    <option value="">팀 선택</option>
                    {KBO_TEAMS.map(team => <option key={team.id} value={team.id}>{team.name}</option>)}
                  </select>
                </div>
                <button onClick={handleChangeTeam} style={{ width: '100%', padding: 14, background: '#e94560', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700 }}>팀 변경 적용</button>
              </div>
            )}

            {activeTab === 'noti' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>💬 채팅 알림</span>
                  <input type="checkbox" checked={alerts.chat} onChange={(e) => handleToggleAlert('chat', e.target.checked)} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>🎟️ 양도 알림</span>
                  <input type="checkbox" checked={alerts.transfer} onChange={(e) => handleToggleAlert('transfer', e.target.checked)} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>🔥 매너 평가 알림</span>
                  <input type="checkbox" checked={alerts.manner} onChange={(e) => handleToggleAlert('manner', e.target.checked)} />
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}