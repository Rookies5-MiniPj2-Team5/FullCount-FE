import ScheduleList from '../components/ScheduleList'

export default function SchedulePage() {
  const currentYear = new Date().getFullYear()

  return (
    <div className="schedule-page">
      <div className="page-header">
        <h2 className="page-title">경기 일정</h2>
        <p className="page-subtitle">KBO 리그 경기 일정과 결과를 확인하세요.</p>
      </div>

      <ScheduleList year={currentYear} />
    </div>
  )
}
