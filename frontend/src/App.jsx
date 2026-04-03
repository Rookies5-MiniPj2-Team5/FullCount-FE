import { useState, useEffect } from 'react'
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
import GlobalChatListener from './components/GlobalChatListener'
import TicketTransferBoard from './pages/TicketTransferBoard'
import './index.css'

const NAV_ITEMS = [
  { id: 'home', label: '홈', icon: '🏠' },
  { id: 'schedule', label: '경기일정', icon: '📅' },
  { id: 'meetup', label: '모집글', icon: '📋' },
  { id: 'crew', label: '크루', icon: '👥' },
  { id: 'ticket', label: '티켓양도', icon: '🎫' },
  { id: 'my', label: '마이페이지', icon: '👤' },
]

export default function App() {
  const { user, loading } = useAuth()
  const [tab, setTab] = useState('home')
  const [selectedPostId, setSelectedPostId] = useState(null)
  const [chatRoom, setChatRoom] = useState(null)
  const [roomRefreshToggle, setRoomRefreshToggle] = useState(0) // ChatFab 리스트 갱신용

  // 🌟 1. 브라우저 주소창과 React 상태(State) 동기화 (뒤로가기 해결)
  useEffect(() => {
    const handlePopState = () => {
      const searchParams = new URLSearchParams(window.location.search);
      const urlTab = searchParams.get('tab') || 'home';
      const urlPostId = searchParams.get('postId');

      setTab(urlTab);
      setSelectedPostId(urlPostId ? urlPostId : null); 
    };

    handlePopState();

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);


  // 🌟 2. 상태 변경과 동시에 브라우저 방문 기록(History) 업데이트
  const navigateTo = (newTab, newPostId = null) => {
    const searchParams = new URLSearchParams();
    searchParams.set('tab', newTab);
    if (newPostId) {
      searchParams.set('postId', newPostId);
    }

    const newUrl = `${window.location.pathname}?${searchParams.toString()}`;

    if (window.location.search !== `?${searchParams.toString()}`) {
      window.history.pushState({}, '', newUrl);
    }

    setTab(newTab);
    setSelectedPostId(newPostId);
  };

  if (loading) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p>Loading...</p>
      </div>
    )
  }

  const handleTabChange = (newTab) => {
    const PROTECTED_TABS = ['my', 'meetup-create'];
    if (PROTECTED_TABS.includes(newTab) && !user) {
      alert('로그인이 필요합니다. 홈 화면의 로그인 폼을 이용해주세요.');
      navigateTo('home');
      return;
    }
    navigateTo(newTab, null);
  }

  const handleOpenChat = (room) => {
    setChatRoom(room)
  }

  const handleCloseChat = () => {
    setChatRoom(null)
  }

  // 🌟 실시간 알림 수신 시 동작 (자동 팝업 및 목록 갱신)
  const handleIncomingNotification = (notif) => {
    // 1. 목록 즉시 갱신
    setRoomRefreshToggle(prev => prev + 1);

    // 2. 자동 팝업 (이미 그 방을 보고 있지 않을 때만)
    if (chatRoom?.id !== notif.roomId) {
      handleOpenChat({
        id: notif.roomId,
        title: notif.title || notif.senderNickname || "새 메시지",
        roomType: notif.roomType || "ONE_ON_ONE",
        dmTargetNickname: notif.senderNickname,
      });
    }
  };

  const renderPage = () => {
    // 🌟 3. 보안 게이트키퍼: 로그아웃 상태에서 뒤로가기로 접근하는 것 차단
    const PROTECTED_TABS = ['my', 'meetup-create'];
    if (PROTECTED_TABS.includes(tab) && !user) {
      return <HomePage onNavigate={(t) => handleTabChange(t)} onSelectPost={(id) => navigateTo('home', id)} />;
    }

    switch (tab) {
      case 'home':
        return selectedPostId
          ? <MeetupDetailPage postId={selectedPostId} onBack={() => navigateTo('home')} onOpenChat={handleOpenChat} />
          : <HomePage onNavigate={(t) => handleTabChange(t)} onSelectPost={(id) => navigateTo('home', id)} />;

      case 'schedule':
        return <SchedulePage />;

      case 'meetup':
        return selectedPostId
          ? <MeetupDetailPage postId={selectedPostId} onBack={() => navigateTo('meetup')} onOpenChat={handleOpenChat} />
          : <MeetupPage key="meetup" onSelectPost={(id) => navigateTo('meetup', id)} />;

      case 'meetup-create':
        return <MeetupPage key="meetup-create" initialOpen={true} onSelectPost={(id) => navigateTo('meetup', id)} />;

      case 'crew':
        return <CrewPage currentUser={user} onOpenChat={handleOpenChat} />;

      case 'ticket':
      case 'ticket-transfer':
        return <TicketTransferBoard onOpenChat={handleOpenChat} />;

      case 'my':
        return <MyPage />;

      case 'signup':
        return <SignupPage onSwitchToLogin={() => navigateTo('home')} />;

      default:
        return <MeetupPage onSelectPost={(id) => navigateTo('meetup', id)} />;
    }
  };

  return (
    <div className="app-layout">
      <header className="app-header">
        <div className="container header-inner">
          <div className="header-logo" onClick={() => navigateTo('home')}>
            <h1><span className="icon">⚾</span> FULL COUNT</h1>
          </div>
          <nav className="nav-list">
            {NAV_ITEMS.map(item => (
              <button
                key={item.id}
                className={`nav-item ${
                  tab === item.id || 
                  (item.id === 'ticket' && tab === 'ticket-transfer') ||
                  (item.id === 'meetup' && tab === 'meetup-create') 
                    ? 'active' : ''
                }`}
                onClick={() => handleTabChange(item.id)}
              >
                <span className="nav-icon">{item.icon}</span>
                <span className="nav-label">{item.label}</span>
              </button>
            ))}
          </nav>
          <div className="header-actions">
          </div>
        </div>
      </header>

      <main className="page-content">
        <div className="container">
          {renderPage()}
        </div>
      </main>

      {user && (
        <>
          <GlobalChatListener 
            user={user} 
            onNotification={handleIncomingNotification} 
          />
          <ChatFab
            currentUser={user}
            onOpenChat={handleOpenChat}
            refreshToggle={roomRefreshToggle}
          />
        </>
      )}

      {chatRoom && (
        <ChatPage
          crew={{ title: chatRoom.title, team: chatRoom.crewTeam }}
          crewId={chatRoom.crewId}
          postId={chatRoom.postId}
          roomType={chatRoom.roomType}
          roomId={chatRoom.id}
          currentUser={user}
          isDm={chatRoom.isDm || chatRoom.roomType === 'ONE_ON_ONE' || chatRoom.roomType === 'ONE_ON_ONE_DIRECT'}
          dmTargetNickname={chatRoom.dmTargetNickname || (chatRoom.roomType?.includes('ONE_ON_ONE') ? chatRoom.title : undefined)}
          onBack={handleCloseChat}
        />
      )}
    </div>
  )
}