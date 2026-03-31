import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { TeamBadge } from '../components/TeamComponents'
import api from '../api/api'

// KBO 10개 구단 하드코딩 (실제 DB의 team_id와 맞춰야 합니다)
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
  const [isEditing, setIsEditing] = useState(false);
  const [newNickname, setNewNickname] = useState('');

  // --- 설정 모달 관련 State ---
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('profile'); // 'profile', 'team', 'noti'
  
  // 팀 변경 State
  const [selectedTeamId, setSelectedTeamId] = useState('');
  
  // 알림 설정 State (UI 전용)
  const [alerts, setAlerts] = useState({ chat: true, transfer: true, manner: true });

  useEffect(() => {
    if (user?.nickname) {
      setNewNickname(user.nickname);
    }
  }, [user]);

  if (!user) return <div className="loading">사용자 정보를 불러오는 중입니다...</div>;

  // 닉네임 수정 API 호출
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

  // 응원 팀 변경 API 호출
  const handleChangeTeam = async () => {
    if (!selectedTeamId) return alert('변경할 팀을 선택해주세요.');
    
    // 기획서 제약조건: 시즌당 1회 경고창
    if (!window.confirm('🚨 응원 팀 변경은 정규 시즌 중 1회만 가능합니다.\n정말 변경하시겠습니까?')) return;

    try {
      await api.put('/members/me/team', { teamId: parseInt(selectedTeamId) });
      await fetchMyInfo(); // 변경된 정보 다시 불러오기
      alert('응원 팀이 성공적으로 변경되었습니다.');
      setIsSettingsModalOpen(false); // 모달 닫기
    } catch (error) {
      // 이미 변경했거나 같은 팀인 경우 백엔드에서 에러 메시지를 줌
      alert(error.response?.data?.message || '팀 변경에 실패했습니다.');
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
              <span style={{ fontSize: 14, color: '#666' }}>{user.teamName} 팬</span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
          {/* 모달창 열기 버튼으로 변경 */}
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
      {/* ⚙️ 설정 모달 (팝업창) 구현부 */}
      {/* ==================================================== */}
      {isSettingsModalOpen && (
        <div className="modal-overlay" style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
          backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000,
          backdropFilter: 'blur(3px)'
        }}>
          <div className="modal-content" style={{
            background: '#fff', padding: '24px', borderRadius: '16px', width: '90%', maxWidth: '400px',
            display: 'flex', flexDirection: 'column', gap: '20px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)'
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
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label style={{ fontSize: 14, color: '#666', fontWeight: 600 }}>프로필 이미지</label>
                  <button onClick={() => alert('프로필 이미지 변경 기능은 준비 중입니다.')} style={{ width: '100%', marginTop: 8, padding: 12, border: '1px solid #ddd', borderRadius: 8, background: '#f8f9fa', cursor: 'pointer' }}>📷 갤러리에서 사진 선택</button>
                </div>
                <div>
                  <label style={{ fontSize: 14, color: '#666', fontWeight: 600 }}>비밀번호 변경</label>
                  <button onClick={() => alert('비밀번호 변경 API 연결 준비 중입니다.')} style={{ width: '100%', marginTop: 8, padding: 12, border: '1px solid #ddd', borderRadius: 8, background: '#f8f9fa', cursor: 'pointer' }}>🔒 새 비밀번호 설정</button>
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

            {/* 탭 3: 알림 설정 */}
            {activeTab === 'noti' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #f1f1f1' }}>
                  <span style={{ fontSize: 15 }}>💬 채팅 메시지 알림</span>
                  <input type="checkbox" checked={alerts.chat} onChange={(e) => setAlerts({...alerts, chat: e.target.checked})} style={{ transform: 'scale(1.3)' }}/>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #f1f1f1' }}>
                  <span style={{ fontSize: 15 }}>🎟️ 양도 거래 상태 변경 알림</span>
                  <input type="checkbox" checked={alerts.transfer} onChange={(e) => setAlerts({...alerts, transfer: e.target.checked})} style={{ transform: 'scale(1.3)' }}/>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0' }}>
                  <span style={{ fontSize: 15 }}>🔥 매너 평가 요청 알림</span>
                  <input type="checkbox" checked={alerts.manner} onChange={(e) => setAlerts({...alerts, manner: e.target.checked})} style={{ transform: 'scale(1.3)' }}/>
                </div>
                <p style={{ margin: 0, fontSize: 12, color: '#aaa', textAlign: 'center' }}>알림 설정은 즉시 자동 저장됩니다. (추후 구현 예정)</p>
              </div>
            )}
            
          </div>
        </div>
      )}
    </div>
  )
}