import { useState } from 'react'
import MeetupPage from './pages/MeetupPage'
import CrewPage from './pages/CrewPage'
import MyPage from './pages/MyPage'
import SchedulePage from './pages/SchedulePage'
import HomePage from './pages/HomePage'
import './index.css'

const NAV_ITEMS = [
  { id: 'home',     label: '홈',     icon: '🏠' },
  { id: 'schedule', label: '경기일정', icon: '📅' },
  { id: 'meetup',   label: '모집글',  icon: '📋' },
  { id: 'crew',     label: '크루',    icon: '👥' },
  { id: 'my',       label: '마이페이지', icon: '👤' },
]

export default function App() {
  const [tab, setTab] = useState('meetup')

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
    <div style={{ position: 'relative', minHeight: '100vh' }}>
      {renderPage()}

      {/* 하단 내비게이션 */}
      <nav className="bottom-nav">
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
    </div>
  )
}
