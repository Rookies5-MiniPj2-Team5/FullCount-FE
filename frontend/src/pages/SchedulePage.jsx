import { TeamBadge } from '../components/TeamComponents'

const SCHEDULES = [
  { id: 1, date: '3월 28일 (금)', time: '18:30', stadium: '잠실야구장',    home: 'LG',  away: 'DU' },
  { id: 2, date: '3월 28일 (금)', time: '18:30', stadium: '인천SSG랜더스필드', home: 'SSG', away: 'KIA' },
  { id: 3, date: '3월 28일 (금)', time: '18:30', stadium: '대구삼성라이온즈파크', home: 'SA',  away: 'LO' },
  { id: 4, date: '3월 29일 (토)', time: '14:00', stadium: '수원KT위즈파크', home: 'KT',  away: 'NC' },
  { id: 5, date: '3월 29일 (토)', time: '14:00', stadium: '한화생명이글스파크', home: 'HH',  away: 'WO' },
]

export default function SchedulePage() {
  return (
    <div className="schedule-page">
      <div className="page-header">
        <h2 className="page-title">경기 일정</h2>
        <p className="page-subtitle">KBO 리그 전체 경기 일정을 확인하고 직관을 계획해보세요.</p>
      </div>
      <div className="page-content">
        <div className="card-grid">
        {SCHEDULES.map(s => (
          <div key={s.id} className="card">
            <div className="card-meta">📅 {s.date} · {s.time} · {s.stadium}</div>
            <div className="card-vs" style={{ marginTop: 8 }}>
              <TeamBadge teamId={s.home} />
              <span style={{ fontSize: 16, fontWeight: 700, color: '#999', margin: '0 8px' }}>VS</span>
              <TeamBadge teamId={s.away} />
            </div>
          </div>
        ))}
        </div>
      </div>
    </div>
  )
}
