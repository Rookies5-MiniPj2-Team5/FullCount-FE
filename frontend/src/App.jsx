import { useState } from 'react'
import { useAuth } from './context/AuthContext'
import MeetupPage from './pages/MeetupPage'
import CrewPage from './pages/CrewPage'
import MyPage from './pages/MyPage'
import SchedulePage from './pages/SchedulePage'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'
import './index.css'

const NAV_ITEMS = [
  { id: 'home',     label: '홈',     icon: '🏠' },
  { id: 'schedule', label: '경기일정', icon: '📅' },
  { id: 'meetup',   label: '모집글',  icon: '📋' },
  { id: 'crew',     label: '크루',    icon: '👥' },
  { id: 'my',       label: '마이페이지', icon: '👤' },
]

export default function App() {
  const { user, loading } = useAuth();
  const [tab, setTab] = useState('meetup')
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'signup'

  if (loading) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p>Loading...</p>
      </div>
    );
  }

  // 로그인하지 않은 경우
  if (!user) {
    return authMode === 'login' 
      ? <LoginPage onSwitchToSignup={() => setAuthMode('signup')} />
      : <SignupPage onSwitchToLogin={() => setAuthMode('login')} />;
  }

  const renderPage = () => {
    switch (tab) {
      case 'home':     return <HomePage />
      case 'schedule': return <SchedulePage />
      case 'meetup':   return <MeetupPage />
      case 'crew':     return <CrewPage />
      case 'my':       return <MyPage />
      default:         return <MeetupPage />
    }
  }

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
                onClick={() => setTab(item.id)}
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
    </div>
  )
}
