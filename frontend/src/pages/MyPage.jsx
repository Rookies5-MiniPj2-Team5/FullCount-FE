import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { TeamBadge } from '../components/TeamComponents'
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
  
  // 닉네임 수정 State
  const [isEditing, setIsEditing] = useState(false);
  const [newNickname, setNewNickname] = useState('');

  // 설정 모달 관련 State
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('profile'); // 'profile', 'team', 'noti'
  
  // 팀 변경 State
  const [selectedTeamId, setSelectedTeamId] = useState('');
  
  // ⭐️ [수정된 부분] 알림 설정 State (DB에서 가져온 내 설정값으로 초기화)
  const [alerts, setAlerts] = useState({ 
    chat: user?.chatAlert ?? true, 
    transfer: user?.transferAlert ?? true, 
    manner: user?.mannerAlert ?? true 
  });

  // 프로필 이미지 & 비밀번호 변경 State
  const [newImageUrl, setNewImageUrl] = useState('');
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '' });

  // 유저 정보가 바뀔 때 닉네임 및 알림 설정 동기화
  useEffect(() => {
    if (user) {
      if (user.nickname) setNewNickname(user.nickname);
      
      // ⭐️ [추가된 부분] 유저 정보 로드 시 알림 상태 최신화
      setAlerts({
        chat: user.chatAlert ?? true,
        transfer: user.transferAlert ?? true,
        manner: user.mannerAlert ?? true
      });
    }
  }, [user]);

  if (!user) return (
    <div className="empty-state">
      <div className="empty-icon">🔒</div>
      <p>로그인이 필요합니다.</p>
      <p style={{ fontSize: 12, color: '#999', marginTop: 8 }}>홈 화면 우측의 로그인 폼을 이용해주세요.</p>
    </div>
  );

  // 1. 닉네임 수정 API 호출
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

  // 2. 응원 팀 변경 API 호출
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

  // 3-1. 내 컴퓨터에서 이미지 파일 선택 시 Base64로 변환하는 함수
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // 용량 제한 (안정성을 위해 2MB 이하로 제한)
    if (file.size > 2 * 1024 * 1024) {
      return alert('이미지 용량은 2MB를 초과할 수 없습니다.');
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onloadend = () => {
      setNewImageUrl(reader.result); // 변환된 긴 Base64 텍스트를 State에 저장
    };
  };

  // 3-2. 프로필 이미지 변경 API 호출 (서버로 전송)
  const handleUpdateProfileImage = async () => {
    if (!newImageUrl.trim()) return alert('이미지를 선택하거나 URL을 입력해주세요.');
    try {
      await api.put('/members/me/profile-image', { profileImageUrl: newImageUrl });
      await fetchMyInfo(); // 내 정보 다시 불러와서 이미지 즉시 갱신
      alert('프로필 이미지가 성공적으로 변경되었습니다.');
      setNewImageUrl('');
    } catch (error) {
      alert(error.response?.data?.message || '프로필 이미지 변경에 실패했습니다.');
    }
  };

  // 4. 비밀번호 변경 API 호출
  const handleUpdatePassword = async () => {
    if (!passwordForm.currentPassword || !passwordForm.newPassword) {
      return alert('현재 비밀번호와 새 비밀번호를 모두 입력해주세요.');
    }
    try {
      await api.put('/members/me/password', passwordForm);
      alert('비밀번호가 성공적으로 변경되었습니다. 안전을 위해 다시 로그인해주세요.');
      setIsSettingsModalOpen(false);
      logout(); // 비밀번호 변경 후 자동 로그아웃 처리
    } catch (error) {
      alert(error.response?.data?.message || '비밀번호 변경 실패 (기존 비밀번호를 확인하세요).');
    }
  };

  // 5. ⭐️ [추가된 부분] 체크박스를 누를 때마다 즉시 서버로 저장하는 함수
  const handleToggleAlert = async (type, newValue) => {
    // 1. 화면의 체크박스를 먼저 즉시 바꿈 (빠른 반응성을 위해)
    const newAlerts = { ...alerts, [type]: newValue };
    setAlerts(newAlerts);

    // 2. 백엔드에 바뀐 설정값 전송
    try {
      await api.put('/members/me/alerts', {
        chatAlert: newAlerts.chat,
        transferAlert: newAlerts.transfer,
        mannerAlert: newAlerts.manner
      });
      // 백엔드에도 정상 반영되도록 유저 정보 새로고침
      await fetchMyInfo(); 
    } catch (error) {
      alert('알림 설정 저장에 실패했습니다.');
      setAlerts(alerts); // 에러 발생 시 원래 상태로 되돌림
    }
  };

  return (
    <div className="my-page">
      <div className="page-header">
        <h2 className="page-title">마이페이지</h2>
        <p className="page-subtitle">내 정보와 직관 일정을 관리해보세요.</p>
      </div>

      {/* --- 상단 프로필 섹션 --- */}
      <div className="my-profile-section">
        <div className="my-profile-row" style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
          
          {/* 프로필 이미지가 있으면 이미지 출력, 없으면 닉네임 첫 글자 */}
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
              <span style={{ fontSize: 14, color: '#666' }}>{user.teamName} 팬</span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
          <button className="btn-edit" onClick={() => setIsSettingsModalOpen(true)} style={{ padding: '10px 16px', borderRadius: 8, border: '1px solid #ddd', background: '#fff', cursor: 'pointer' }}>⚙️ 설정</button>
          <button className="btn-edit" onClick={logout} style={{ padding: '10px 16px', borderRadius: 8, border: '1px solid #e94560', color: '#e94560', background: '#fff', cursor: 'pointer' }}>🚪 로그아웃</button>
        </div>
      </div>

      {/* --- 내 활동 정보 섹션 --- */}
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

      {/* --- 직관 일정 섹션 --- */}
      <div className="my-section" style={{ marginTop: 30 }}>
        <div className="my-section-title" style={{ fontWeight: 800, marginBottom: 16 }}>📅 내 직관 일정</div>
        <div className="schedule-card" style={{ background: '#2c3e50', padding: 20, borderRadius: 12, color: '#fff' }}>
          <div className="schedule-label" style={{ opacity: 0.7, fontSize: 12, marginBottom: 8 }}>다가오는 직관</div>
          <div className="schedule-date" style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>3월 28일 (금)</div>
          <div className="schedule-match" style={{ fontSize: 16 }}>LG vs 두산 (잠실 야구장)</div>
        </div>
      </div>

      {/* ==================================================== */}
      {/* ⚙️ 설정 모달 (팝업창) */}
      {/* ==================================================== */}
      {isSettingsModalOpen && (
        <div className="modal-overlay" style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
          backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000,
          backdropFilter: 'blur(3px)'
        }}>
          <div className="modal-content" style={{
            background: '#fff', padding: '24px', borderRadius: '16px', width: '90%', maxWidth: '400px',
            display: 'flex', flexDirection: 'column', gap: '20px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
            maxHeight: '90vh', overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: 20, fontWeight: 800 }}>⚙️ 환경 설정</h3>
              <button onClick={() => setIsSettingsModalOpen(false)} style={{ background: 'none', border: 'none', fontSize: 24, cursor: 'pointer', color: '#888' }}>&times;</button>
            </div>

            {/* 탭 메뉴 */}
            <div style={{ display: 'flex', borderBottom: '1px solid #eee' }}>
              <button onClick={() => setActiveTab('profile')} style={{ flex: 1, padding: '10px 0', border: 'none', background: 'none', borderBottom: activeTab === 'profile' ? '2px solid #e94560' : 'none', color: activeTab === 'profile' ? '#e94560' : '#888', fontWeight: activeTab === 'profile' ? 700 : 400, cursor: 'pointer' }}>계정</button>
              <button onClick={() => setActiveTab('team')} style={{ flex: 1, padding: '10px 0', border: 'none', background: 'none', borderBottom: activeTab === 'team' ? '2px solid #e94560' : 'none', color: activeTab === 'team' ? '#e94560' : '#888', fontWeight: activeTab === 'team' ? 700 : 400, cursor: 'pointer' }}>팀 변경</button>
              <button onClick={() => setActiveTab('noti')} style={{ flex: 1, padding: '10px 0', border: 'none', background: 'none', borderBottom: activeTab === 'noti' ? '2px solid #e94560' : 'none', color: activeTab === 'noti' ? '#e94560' : '#888', fontWeight: activeTab === 'noti' ? 700 : 400, cursor: 'pointer' }}>알림</button>
            </div>

            {/* 탭 1: 프로필 및 계정 설정 */}
            {activeTab === 'profile' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {/* 1. 프로필 이미지 변경 영역 */}
                <div>
                  <label style={{ fontSize: 14, color: '#666', fontWeight: 600 }}>프로필 이미지 변경</label>
                  
                  {/* 파일 업로드 버튼 */}
                  <div style={{ marginTop: 8, padding: '10px', border: '1px dashed #ccc', borderRadius: 8, background: '#fafafa' }}>
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleImageUpload}
                      style={{ width: '100%', fontSize: 13 }}
                    />
                  </div>

                  {/* 외부 URL 입력 및 저장 버튼 */}
                  <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                    <input 
                      type="text" 
                      placeholder="또는 외부 이미지 URL 직접 입력..." 
                      value={newImageUrl}
                      onChange={(e) => setNewImageUrl(e.target.value)}
                      style={{ flex: 1, padding: '10px 12px', border: '1px solid #ddd', borderRadius: 8, fontSize: 14 }}
                    />
                    <button onClick={handleUpdateProfileImage} style={{ padding: '0 16px', background: '#333', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold' }}>저장</button>
                  </div>
                  <p style={{ margin: '6px 0 0 0', fontSize: 11, color: '#999' }}>* 내 PC에서 사진을 고르거나 링크를 입력한 후 [저장]을 눌러주세요.</p>
                </div>

                <hr style={{ border: 0, borderTop: '1px solid #eee', width: '100%' }} />

                {/* 2. 비밀번호 변경 영역 */}
                <div>
                  <label style={{ fontSize: 14, color: '#666', fontWeight: 600 }}>비밀번호 변경</label>
                  <input 
                    type="password" 
                    placeholder="현재 비밀번호" 
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm({...passwordForm, currentPassword: e.target.value})}
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid #ddd', borderRadius: 8, marginTop: 8, fontSize: 14 }}
                  />
                  <input 
                    type="password" 
                    placeholder="새 비밀번호" 
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid #ddd', borderRadius: 8, marginTop: 8, fontSize: 14 }}
                  />
                  <button onClick={handleUpdatePassword} style={{ width: '100%', padding: '12px', marginTop: 12, background: '#e94560', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 'bold', cursor: 'pointer' }}>
                    비밀번호 재설정
                  </button>
                </div>
              </div>
            )}

            {/* 탭 2: 응원 팀 변경 */}
            {activeTab === 'team' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ padding: 12, background: '#fff3cd', color: '#856404', borderRadius: 8, fontSize: 13, lineHeight: 1.5 }}>
                  <strong>⚠️ 주의사항</strong><br/>
                  응원 팀 변경은 정규 시즌 중 <b>1회</b>만 가능합니다.<br/>팀을 변경하면 이전 팀 전용 게시판 접근이 제한됩니다.
                </div>
                
                <div>
                  <label style={{ fontSize: 14, color: '#666', fontWeight: 600 }}>현재 응원 팀</label>
                  <div style={{ padding: '10px 12px', background: '#f8f9fa', border: '1px solid #ddd', borderRadius: 8, marginTop: 8, color: '#333' }}>
                    {user.teamName || '선택 안됨'}
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: 14, color: '#666', fontWeight: 600 }}>새로운 응원 팀 선택</label>
                  <select 
                    value={selectedTeamId} 
                    onChange={(e) => setSelectedTeamId(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid #ddd', borderRadius: 8, marginTop: 8, fontSize: 14 }}
                  >
                    <option value="">팀을 선택해주세요</option>
                    {KBO_TEAMS.map(team => (
                      <option key={team.id} value={team.id}>{team.name}</option>
                    ))}
                  </select>
                </div>

                <button onClick={handleChangeTeam} style={{ width: '100%', padding: 14, background: '#e94560', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer', marginTop: 10 }}>
                  팀 변경 적용하기
                </button>
              </div>
            )}

            {/* ⭐️ [수정된 부분] 탭 3: 알림 설정 (onChange에 handleToggleAlert 연결 완료) */}
            {activeTab === 'noti' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #f1f1f1' }}>
                  <span style={{ fontSize: 15 }}>💬 채팅 메시지 알림</span>
                  <input type="checkbox" checked={alerts.chat} onChange={(e) => handleToggleAlert('chat', e.target.checked)} style={{ transform: 'scale(1.3)', cursor: 'pointer' }}/>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #f1f1f1' }}>
                  <span style={{ fontSize: 15 }}>🎟️ 양도 거래 상태 변경 알림</span>
                  <input type="checkbox" checked={alerts.transfer} onChange={(e) => handleToggleAlert('transfer', e.target.checked)} style={{ transform: 'scale(1.3)', cursor: 'pointer' }}/>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0' }}>
                  <span style={{ fontSize: 15 }}>🔥 매너 평가 요청 알림</span>
                  <input type="checkbox" checked={alerts.manner} onChange={(e) => handleToggleAlert('manner', e.target.checked)} style={{ transform: 'scale(1.3)', cursor: 'pointer' }}/>
                </div>
                <p style={{ margin: 0, fontSize: 12, color: '#aaa', textAlign: 'center' }}>💡 체크박스를 누르면 즉시 자동 저장됩니다.</p>
              </div>
            )}
            
          </div>
        </div>
      )}
    </div>
  )
}