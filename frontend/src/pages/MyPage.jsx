import { useEffect, useState } from 'react';
import { TeamBadge } from '../components/TeamComponents';
import api from '../api/api';
import { useAuth } from '../context/AuthContext';
import AttendanceCalendar from './AttendanceCalendar';
import { StatusBadge } from '../components/StatusBadge'; 

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
  { id: 10, name: '키움 히어로즈' },
];

const QUICK_CHARGE_AMOUNTS = [10000, 30000, 50000, 100000];

const inputStyle = {
  width: '100%',
  padding: '10px 12px',
  border: '1px solid #ddd',
  borderRadius: 8,
  fontSize: 14,
};

const primaryButtonStyle = {
  background: '#e94560',
  color: '#fff',
  border: 'none',
  borderRadius: 8,
  cursor: 'pointer',
  fontWeight: 700,
};

const modalOverlayStyle = {
  position: 'fixed',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  backgroundColor: 'rgba(0,0,0,0.6)',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  zIndex: 1000,
  backdropFilter: 'blur(3px)',
};

const modalContentStyle = {
  background: '#fff',
  padding: '24px',
  borderRadius: '16px',
  width: '90%',
  maxWidth: '420px',
  boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
  maxHeight: '90vh',
  overflowY: 'auto',
};

const formatBalance = (value) => `${Number(value ?? 0).toLocaleString('ko-KR')}원`;

export default function MyPage() {
  const { user, logout, fetchMyInfo } = useAuth();

  const [isEditing, setIsEditing] = useState(false);
  const [newNickname, setNewNickname] = useState('');
  const [view, setView] = useState('main');
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isChargeModalOpen, setIsChargeModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [alerts, setAlerts] = useState({
    chat: true,
    transfer: true,
    manner: true,
  });
  const [newImageUrl, setNewImageUrl] = useState('');
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '' });
  const [chargeBalance, setChargeBalance] = useState('');
  const [isCharging, setIsCharging] = useState(false);

  // 💡 [기능 추가] 참여 목록 상태
  const [participatingActivities, setParticipatingActivities] = useState({ crews: [], mates: [], transfers: [] });
  const [currentTab, setCurrentTab] = useState('crew');
  const [loadingList, setLoadingList] = useState(false);

  useEffect(() => {
    if (!user) return;

    if (user.nickname) setNewNickname(user.nickname);
    setAlerts({
      chat: user.chatAlert ?? true,
      transfer: user.transferAlert ?? true,
      manner: user.mannerAlert ?? true,
    });

    if (user.teamId) {
      setSelectedTeamId(String(user.teamId));
    }

    // 초기 로드 시 실행
    fetchParticipatingList();
  }, [user]);

  // 데이터 불러오기 함수
  const fetchParticipatingList = async () => {
    setLoadingList(true);
    try {
      const [crewRes, mateRes, transferRes] = await Promise.all([
        api.get('/posts', { params: { boardType: 'CREW', participating: true } }),
        api.get('/posts', { params: { boardType: 'MATE', participating: true } }),
        api.get('/transfers/me')
      ]);
      
      setParticipatingActivities({
        crews: crewRes.data?.data?.content || [],
        mates: mateRes.data?.data?.content || [],
        transfers: transferRes.data?.data?.content || []
      });
    } catch (error) {
      console.error("참여 목록 로드 실패", error);
    } finally {
      setLoadingList(false);
    }
  };

  if (!user) {
    return (
      <div className="empty-state">
        <div className="empty-icon">🔒</div>
        <p>로그인이 필요합니다.</p>
        <p style={{ fontSize: 12, color: '#999', marginTop: 8 }}>
          마이페이지는 로그인한 사용자만 이용할 수 있습니다.
        </p>
      </div>
    );
  }

  const handleUpdateNickname = async () => {
    if (!newNickname.trim()) {
      alert('닉네임을 입력해 주세요.');
      return;
    }

    try {
      await api.put('/members/me', { nickname: newNickname });
      await fetchMyInfo();
      setIsEditing(false);
      alert('닉네임이 수정되었습니다.');
    } catch (error) {
      alert(error.response?.data?.message || '닉네임 수정에 실패했습니다.');
    }
  };

  const handleChangeTeam = async () => {
    if (!selectedTeamId) {
      alert('변경할 팀을 선택해 주세요.');
      return;
    }

    if (!window.confirm('응원 팀은 시즌 기준 1회만 변경할 수 있습니다.\n변경하시겠습니까?')) {
      return;
    }

    try {
      await api.put('/members/me/team', { teamId: parseInt(selectedTeamId, 10) });
      await fetchMyInfo();
      alert('응원 팀이 변경되었습니다.');
      setIsSettingsModalOpen(false);
    } catch (error) {
      alert(error.response?.data?.message || '팀 변경에 실패했습니다.');
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert('이미지 용량은 2MB를 초과할 수 없습니다.');
      return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onloadend = () => {
      setNewImageUrl(reader.result);
    };
  };

  const handleUpdateProfileImage = async () => {
    if (!newImageUrl.trim()) {
      alert('이미지를 선택하거나 URL을 입력해 주세요.');
      return;
    }

    try {
      await api.put('/members/me/profile-image', { profileImageUrl: newImageUrl });
      await fetchMyInfo();
      setNewImageUrl('');
      alert('프로필 이미지가 변경되었습니다.');
    } catch (error) {
      alert(error.response?.data?.message || '프로필 이미지 변경에 실패했습니다.');
    }
  };

  const handleUpdatePassword = async () => {
    if (!passwordForm.currentPassword || !passwordForm.newPassword) {
      alert('모든 비밀번호 항목을 입력해 주세요.');
      return;
    }

    try {
      await api.put('/members/me/password', passwordForm);
      alert('비밀번호가 변경되었습니다. 다시 로그인해 주세요.');
      setIsSettingsModalOpen(false);
      logout();
    } catch (error) {
      alert(error.response?.data?.message || '비밀번호 변경에 실패했습니다.');
    }
  };

  const handleToggleAlert = async (type, newValue) => {
    const previousAlerts = alerts;
    const nextAlerts = { ...alerts, [type]: newValue };

    setAlerts(nextAlerts);

    try {
      await api.put('/members/me/alerts', {
        chatAlert: nextAlerts.chat,
        transferAlert: nextAlerts.transfer,
        mannerAlert: nextAlerts.manner,
      });
      await fetchMyInfo();
    } catch (error) {
      alert(error.response?.data?.message || '알림 설정 저장에 실패했습니다.');
      setAlerts(previousAlerts);
    }
  };

  const handleChargeBalance = async () => {
    const parsedBalance = Number(chargeBalance);

    if (!Number.isInteger(parsedBalance) || parsedBalance < 0) {
      alert('0 이상의 충전 금액을 입력해 주세요.');
      return;
    }

    setIsCharging(true);

    try {
      await api.put('/members/me/charge', { balance: parsedBalance });
      await fetchMyInfo();
      setChargeBalance('');
      setIsChargeModalOpen(false);
      alert('잔액이 충전되었습니다.');
    } catch (error) {
      alert(error.response?.data?.message || '잔액 충전에 실패했습니다.');
    } finally {
      setIsCharging(false);
    }
  };

  if (view === 'calendar') {
    return <AttendanceCalendar onBack={() => setView('main')} user={user} />;
  }

  // ─── 다가오는 직관 일정 계산 (이미 로드된 participatingActivities 활용) ───
  const _todayStr = new Date().toISOString().split('T')[0];
  const upcomingGame = [...participatingActivities.crews, ...participatingActivities.mates]
    .filter(a => a.matchDate && a.matchDate >= _todayStr)
    .sort((a, b) => a.matchDate.localeCompare(b.matchDate))[0] || null;

  const _formatMatchDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr + 'T00:00:00');
    const days = ['일', '월', '화', '수', '목', '금', '토'];
    return `${d.getMonth() + 1}월 ${d.getDate()}일 (${days[d.getDay()]})`;
  };

  return (
    <div className="my-page">
      <div className="page-header">
        <h2 className="page-title">마이페이지</h2>
        <p className="page-subtitle">내 정보와 직관 일정을 관리해보세요.</p>
      </div>

      <div className="my-profile-section">
        <div className="my-profile-row" style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
          <div
            className="avatar-lg"
            style={{
              width: 60,
              height: 60,
              borderRadius: '50%',
              background: '#e94560',
              overflow: 'hidden',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 24,
              fontWeight: 700,
            }}
          >
            {user.profileImageUrl ? (
              <img
                src={user.profileImageUrl}
                alt="프로필"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
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
                  style={{ ...inputStyle, padding: '6px 12px' }}
                />
                <button onClick={handleUpdateNickname} style={{ ...primaryButtonStyle, padding: '6px 12px' }}>
                  저장
                </button>
                <button
                  onClick={() => setIsEditing(false)}
                  style={{
                    background: '#eee',
                    border: 'none',
                    padding: '6px 12px',
                    borderRadius: 6,
                    cursor: 'pointer',
                  }}
                >
                  취소
                </button>
              </div>
            ) : (
              <div className="my-name" style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 20, fontWeight: 700 }}>
                {user.nickname}
                <span onClick={() => setIsEditing(true)} style={{ fontSize: 16, cursor: 'pointer', filter: 'grayscale(1)' }}>
                  ✎
                </span>
              </div>
            )}

            <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
              <TeamBadge teamId={user.teamShortName || 'LG'} />
              <span style={{ fontSize: 14, color: '#666' }}>{user.teamName || '응원 팀 미설정'}</span>
            </div>

            <div
              style={{
                marginTop: 12,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 12px',
                borderRadius: 999,
                background: '#fff4f6',
                color: '#c1274a',
                fontWeight: 700,
                fontSize: 14,
              }}
            >
              <span>잔액</span>
              <span>{formatBalance(user.balance)}</span>
              <button
                type="button"
                onClick={() => setIsChargeModalOpen(true)}
                style={{
                  border: '1px solid #f1b8c5',
                  background: '#fff',
                  color: '#e94560',
                  borderRadius: 999,
                  padding: '4px 10px',
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                충전
              </button>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
          <button
            className="btn-edit"
            onClick={() => setIsSettingsModalOpen(true)}
            style={{ padding: '10px 16px', borderRadius: 8, border: '1px solid #ddd', background: '#fff', cursor: 'pointer' }}
          >
            설정
          </button>
          <button
            className="btn-edit"
            onClick={logout}
            style={{ padding: '10px 16px', borderRadius: 8, border: '1px solid #e94560', color: '#e94560', background: '#fff', cursor: 'pointer' }}
          >
            로그아웃
          </button>
        </div>
      </div>

      <div className="my-section" style={{ marginTop: 30, padding: 20, background: '#f8f9fa', borderRadius: 12 }}>
        <div className="my-section-title" style={{ fontWeight: 800, marginBottom: 16 }}>활동 정보</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div className="my-stat-item" style={{ padding: 16, background: '#fff', borderRadius: 8, boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
            <div className="my-stat-label" style={{ fontSize: 12, color: '#888', marginBottom: 4 }}>매너 온도</div>
            <div className="my-stat-value" style={{ fontSize: 18, fontWeight: 700 }}>{user.mannerTemperature?.toFixed(1) ?? '36.5'}°</div>
          </div>
          <div className="my-stat-item" style={{ padding: 16, background: '#fff', borderRadius: 8, boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
            <div className="my-stat-label" style={{ fontSize: 12, color: '#888', marginBottom: 4 }}>배지 등급</div>
            <div className="my-stat-value" style={{ fontSize: 18, fontWeight: 700, color: '#0d6efd' }}>{user.badgeLevel ?? 'ROOKIE'}</div>
          </div>
        </div>
      </div>

      {/* 💡 [기능 추가] 참여 중인 목록 섹션 */}
      <div className="my-section" style={{ marginTop: 30 }}>
        <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 12 }}>참여 중인 목록</h3>
        <div style={{ display: 'flex', gap: 8, marginBottom: 15 }}>
          {['crew', 'mate', 'transfer'].map(tab => (
            <button
              key={tab}
              onClick={() => setCurrentTab(tab)}
              style={{
                padding: '8px 16px', borderRadius: 20, border: 'none', fontWeight: 700, cursor: 'pointer', fontSize: 13,
                background: currentTab === tab ? '#2c3e50' : '#f0f0f0',
                color: currentTab === tab ? '#fff' : '#666'
              }}
            >
              {tab === 'crew' ? '크루' : tab === 'mate' ? '메이트' : '티켓양도'}
              <span style={{ marginLeft: 4, fontSize: 11, opacity: 0.7 }}>
                {tab === 'crew' ? participatingActivities.crews.length : tab === 'mate' ? participatingActivities.mates.length : participatingActivities.transfers.length}
              </span>
            </button>
          ))}
        </div>

        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #eee', overflow: 'hidden' }}>
          {loadingList ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#999' }}>불러오는 중...</div>
          ) : (
            <>
              {currentTab === 'crew' && (participatingActivities.crews.length > 0 ? participatingActivities.crews.map(item => <ListItem key={item.id} item={item} />) : <EmptyState type="크루" />)}
              {currentTab === 'mate' && (participatingActivities.mates.length > 0 ? participatingActivities.mates.map(item => <ListItem key={item.id} item={item} />) : <EmptyState type="메이트" />)}
              {currentTab === 'transfer' && (participatingActivities.transfers.length > 0 ? participatingActivities.transfers.map(item => <ListItem key={item.id} item={item} isTransfer />) : <EmptyState type="티켓" />)}
            </>
          )}
        </div>
      </div>

      <div className="my-section" style={{ marginTop: 30 }}>
        <div className="my-section-title" style={{ fontWeight: 800, marginBottom: 16 }}>직관 일정</div>
        {loadingList ? (
          <div className="schedule-card" style={{ background: '#2c3e50', padding: 20, borderRadius: 12, color: '#fff', textAlign: 'center' }}>
            <div style={{ opacity: 0.7, fontSize: 13 }}>⏳ 일정 불러오는 중...</div>
          </div>
        ) : upcomingGame ? (
          <div className="schedule-card" style={{ background: '#2c3e50', padding: 20, borderRadius: 12, color: '#fff' }}>
            <div className="schedule-label" style={{ opacity: 0.7, fontSize: 12, marginBottom: 8 }}>다가오는 직관</div>
            <div className="schedule-date" style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>
              {_formatMatchDate(upcomingGame.matchDate)}
            </div>
            <div className="schedule-match" style={{ fontSize: 16 }}>
              {upcomingGame.title} · 🏟️ {upcomingGame.stadium || '경기장 미정'}
            </div>
          </div>
        ) : (
          <div className="schedule-card" style={{ background: '#2c3e50', padding: 20, borderRadius: 12, color: '#fff', textAlign: 'center' }}>
            <div style={{ opacity: 0.7, fontSize: 13 }}>다가오는 직관 일정이 없습니다.</div>
          </div>
        )}
        <button
          className="see-all"
          onClick={() => setView('calendar')}
          style={{ width: '100%', marginTop: 12, padding: 12, background: 'none', border: '1px solid #eee', borderRadius: 8, color: '#666', cursor: 'pointer' }}
        >
          전체 일정 보기
        </button>
      </div>

      {isSettingsModalOpen && (
        <div className="modal-overlay" style={modalOverlayStyle}>
          <div className="modal-content" style={modalContentStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ margin: 0, fontSize: 20, fontWeight: 800 }}>계정 설정</h3>
              <button onClick={() => setIsSettingsModalOpen(false)} style={{ background: 'none', border: 'none', fontSize: 24, cursor: 'pointer', color: '#888' }}>
                &times;
              </button>
            </div>

            <div style={{ display: 'flex', borderBottom: '1px solid #eee', marginBottom: 20 }}>
              <button
                onClick={() => setActiveTab('profile')}
                style={{
                  flex: 1,
                  padding: '10px 0',
                  border: 'none',
                  background: 'none',
                  borderBottom: activeTab === 'profile' ? '2px solid #e94560' : 'none',
                  color: activeTab === 'profile' ? '#e94560' : '#888',
                  fontWeight: activeTab === 'profile' ? 700 : 400,
                  cursor: 'pointer',
                }}
              >
                계정
              </button>
              <button
                onClick={() => setActiveTab('team')}
                style={{
                  flex: 1,
                  padding: '10px 0',
                  border: 'none',
                  background: 'none',
                  borderBottom: activeTab === 'team' ? '2px solid #e94560' : 'none',
                  color: activeTab === 'team' ? '#e94560' : '#888',
                  fontWeight: activeTab === 'team' ? 700 : 400,
                  cursor: 'pointer',
                }}
              >
                팀 변경
              </button>
              <button
                onClick={() => setActiveTab('noti')}
                style={{
                  flex: 1,
                  padding: '10px 0',
                  border: 'none',
                  background: 'none',
                  borderBottom: activeTab === 'noti' ? '2px solid #e94560' : 'none',
                  color: activeTab === 'noti' ? '#e94560' : '#888',
                  fontWeight: activeTab === 'noti' ? 700 : 400,
                  cursor: 'pointer',
                }}
              >
                알림
              </button>
            </div>

            {activeTab === 'profile' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div>
                  <label style={{ fontSize: 14, color: '#666', fontWeight: 600 }}>프로필 이미지 변경</label>
                  <div style={{ marginTop: 8, padding: '10px', border: '1px dashed #ccc', borderRadius: 8, background: '#fafafa' }}>
                    <input type="file" accept="image/*" onChange={handleImageUpload} style={{ width: '100%', fontSize: 13 }} />
                  </div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                    <input
                      type="text"
                      placeholder="이미지 URL 입력"
                      value={newImageUrl}
                      onChange={(e) => setNewImageUrl(e.target.value)}
                      style={{ ...inputStyle, flex: 1 }}
                    />
                    <button onClick={handleUpdateProfileImage} style={{ ...primaryButtonStyle, padding: '0 16px' }}>
                      저장
                    </button>
                  </div>
                </div>

                <hr style={{ border: 0, borderTop: '1px solid #eee' }} />

                <div>
                  <label style={{ fontSize: 14, color: '#666', fontWeight: 600 }}>비밀번호 변경</label>
                  <input
                    type="password"
                    placeholder="현재 비밀번호"
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                    style={{ ...inputStyle, marginTop: 8 }}
                  />
                  <input
                    type="password"
                    placeholder="새 비밀번호"
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    style={{ ...inputStyle, marginTop: 8 }}
                  />
                  <button onClick={handleUpdatePassword} style={{ ...primaryButtonStyle, width: '100%', padding: '12px', marginTop: 12 }}>
                    비밀번호 변경
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'team' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ padding: 12, background: '#fff3cd', color: '#856404', borderRadius: 8, fontSize: 13 }}>
                  응원 팀은 시즌 기준 1회만 변경할 수 있습니다.
                </div>
                <div>
                  <label style={{ fontSize: 14, color: '#666', fontWeight: 600 }}>새 응원 팀 선택</label>
                  <select value={selectedTeamId} onChange={(e) => setSelectedTeamId(e.target.value)} style={{ ...inputStyle, marginTop: 8 }}>
                    <option value="">팀 선택</option>
                    {KBO_TEAMS.map((team) => (
                      <option key={team.id} value={team.id}>
                        {team.name}
                      </option>
                    ))}
                  </select>
                </div>
                <button onClick={handleChangeTeam} style={{ ...primaryButtonStyle, width: '100%', padding: 14 }}>
                  팀 변경 적용
                </button>
              </div>
            )}

            {activeTab === 'noti' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>채팅 알림</span>
                  <input type="checkbox" checked={alerts.chat} onChange={(e) => handleToggleAlert('chat', e.target.checked)} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>양도 알림</span>
                  <input type="checkbox" checked={alerts.transfer} onChange={(e) => handleToggleAlert('transfer', e.target.checked)} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>매너 평가 알림</span>
                  <input type="checkbox" checked={alerts.manner} onChange={(e) => handleToggleAlert('manner', e.target.checked)} />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {isChargeModalOpen && (
        <div className="modal-overlay" style={modalOverlayStyle}>
          <div className="modal-content" style={modalContentStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 20, fontWeight: 800 }}>금액 충전</h3>
                <p style={{ margin: '8px 0 0', color: '#666', fontSize: 13 }}>
                  잔액을 입력하면 즉시 충전 요청을 보냅니다.
                </p>
              </div>
              <button onClick={() => setIsChargeModalOpen(false)} style={{ background: 'none', border: 'none', fontSize: 24, cursor: 'pointer', color: '#888' }}>
                &times;
              </button>
            </div>

            <div
              style={{
                padding: 16,
                borderRadius: 12,
                background: '#fff4f6',
                border: '1px solid #ffd4dd',
                marginBottom: 16,
              }}
            >
              <div style={{ fontSize: 12, color: '#a64a5d', marginBottom: 6 }}>현재 잔액</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#e94560' }}>{formatBalance(user.balance)}</div>
            </div>

            <label style={{ display: 'block', fontSize: 14, color: '#666', fontWeight: 600, marginBottom: 8 }}>충전 금액</label>
            <input
              type="number"
              min="0"
              step="1"
              placeholder="충전할 금액을 입력하세요"
              value={chargeBalance}
              onChange={(e) => setChargeBalance(e.target.value)}
              style={inputStyle}
            />

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, marginTop: 12 }}>
              {QUICK_CHARGE_AMOUNTS.map((amount) => (
                <button
                  key={amount}
                  type="button"
                  onClick={() => setChargeBalance(String(amount))}
                  style={{
                    padding: '10px 12px',
                    borderRadius: 8,
                    border: '1px solid #f1c6cf',
                    background: '#fff',
                    color: '#c1274a',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  +{amount.toLocaleString('ko-KR')}원
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <button
                type="button"
                onClick={() => setIsChargeModalOpen(false)}
                disabled={isCharging}
                style={{
                  flex: 1,
                  padding: '12px 16px',
                  borderRadius: 10,
                  border: '1px solid #ddd',
                  background: '#fff',
                  cursor: isCharging ? 'not-allowed' : 'pointer',
                }}
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleChargeBalance}
                disabled={isCharging}
                style={{
                  ...primaryButtonStyle,
                  flex: 1,
                  padding: '12px 16px',
                  opacity: isCharging ? 0.7 : 1,
                  cursor: isCharging ? 'not-allowed' : 'pointer',
                }}
              >
                {isCharging ? '충전 중...' : '충전하기'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── 내부 도우미 컴포넌트 ───
function ListItem({ item, isTransfer }) {
  return (
    <div style={{ padding: '16px 20px', borderBottom: '1px solid #f5f5f5', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>{item.title}</div>
        <div style={{ fontSize: 12, color: '#999' }}>
          {isTransfer ? `💰 ${item.price?.toLocaleString()}원` : `📅 ${item.matchDate}`} | 🏟️ {item.stadium || '구장 정보 없음'}
        </div>
      </div>
      <StatusBadge status={item.status} />
    </div>
  );
}

function EmptyState({ type }) {
  return <div style={{ padding: 40, textAlign: 'center', color: '#bbb', fontSize: 14 }}>참여 중인 {type}가 없습니다.</div>;
}