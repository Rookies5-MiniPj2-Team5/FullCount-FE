import { useState } from 'react'
import { useAuth } from './context/AuthContext'
import MeetupPage from './pages/MeetupPage'
import MeetupDetailPage from './pages/MeetupDetailPage'
import CrewPage from './pages/CrewPage'
import MyPage from './pages/MyPage'
import SchedulePage from './pages/SchedulePage'
import HomePage from './pages/HomePage'
import SignupPage from './pages/SignupPage'
import ChatPage from './pages/ChatPage'
import ChatFab from './components/ChatFab'
import './index.css'

const NAV_ITEMS = [
  { id: 'home', label: '홈', icon: '🏠' },
  { id: 'schedule', label: '경기일정', icon: '📅' },
  { id: 'meetup', label: '모집글', icon: '📋' },
  { id: 'crew', label: '크루', icon: '👥' },
  { id: 'my', label: '마이페이지', icon: '👤' },
]

export default function App() {
  const { user, loading } = useAuth()
  const [tab, setTab] = useState('home')
  const [selectedPostId, setSelectedPostId] = useState(null)
  const [chatRoom, setChatRoom] = useState(null)

  if (loading) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p>Loading...</p>
      </div>
    )
  }

  // 로그인 필요한 탭을 클릭했을 때 홈으로 돌려보내는 안전 핸들러
  const handleTabChange = (newTab) => {
    const PROTECTED_TABS = ['my', 'meetup-create'];
    if (PROTECTED_TABS.includes(newTab) && !user) {
      alert('로그인이 필요합니다. 홈 화면의 로그인 폼을 이용해주세요.');
      setTab('home');
      return;
    }
    setSelectedPostId(null);
    setTab(newTab);
  }

  // ChatFab에서 채팅방 클릭 시 호출
  const handleOpenChat = (room) => {
    setChatRoom(room)
  }

  // ChatPage 뒤로가기 시 호출
  const handleCloseChat = () => {
    setChatRoom(null)
  }

  const renderPage = () => {
    switch (tab) {
      case 'home':
        return selectedPostId
          ? <MeetupDetailPage postId={selectedPostId} onBack={() => setSelectedPostId(null)} />
          : <HomePage onNavigate={(t) => handleTabChange(t)} onSelectPost={(id) => setSelectedPostId(id)} />;

      case 'schedule':
        return <SchedulePage />;

      case 'meetup':
        return selectedPostId
          ? <MeetupDetailPage postId={selectedPostId} onBack={() => setSelectedPostId(null)} />
          : <MeetupPage key="meetup" onSelectPost={(id) => setSelectedPostId(id)} />;

      // Meetup 생성 모드
      case 'meetup-create':
        return <MeetupPage key="meetup-create" initialOpen={true} onSelectPost={(id) => setSelectedPostId(id)} />;

      // CrewPage에 currentUser(user) 데이터 전달 로직 적용
      case 'crew':
        return <CrewPage currentUser={user} />;

      case 'my':
        return <MyPage />;

      case 'signup':
        return <SignupPage onSwitchToLogin={() => setTab('home')} />;

      default:
        return <MeetupPage onSelectPost={(id) => setSelectedPostId(id)} />;
    }
  };

  return (
    <div className="app-layout">
      {/* 상단 헤더 & 내비게이션 */}
      <header className="app-header">
        <div className="container header-inner">
          <div className="header-logo" onClick={() => setTab('home')}>
            <h1><span className="icon">⚾</span> FULL COUNT</h1>
          </div>
          <nav className="nav-list">
            {NAV_ITEMS.map(item => (
              <button
                key={item.id}
                className={`nav-item ${tab === item.id ? 'active' : ''}`}
                onClick={() => handleTabChange(item.id)}
              >
                <span className="nav-icon">{item.icon}</span>
                <span className="nav-label">{item.label}</span>
              </button>
            ))}
          </nav>
          <div className="header-actions">
            {/* 알림, 프로필 등 추가 기능 공간 */}
          </div>
        </div>
      </header>

      <main className="page-content">
        <div className="container">
          {renderPage()}
        </div>
      </main>

      {/* 채팅 FAB (모든 탭 공통) */}
      <ChatFab
        currentUser={user}
        onOpenChat={handleOpenChat}
      />

      {/* 채팅 팝업 — 기존 페이지 위에 오버레이로 표시 */}
      {chatRoom && (
        <ChatPage
          crew={{ title: chatRoom.title, team: chatRoom.crewTeam }}
          roomType={chatRoom.roomType}
          roomId={chatRoom.id}
          currentUser={user}
          isDm={chatRoom.roomType === 'ONE_ON_ONE'}
          dmTargetNickname={chatRoom.roomType === 'ONE_ON_ONE' ? chatRoom.title : undefined}
          onBack={handleCloseChat}
        />
      )}
    </div>
  )
}