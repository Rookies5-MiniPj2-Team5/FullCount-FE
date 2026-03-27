import { TeamBadge } from '../components/TeamComponents'

export default function MyPage() {
  const user = {
    nickname: '야구매니아',
    teamId: 'LG',
    initial: '야',
    schedule: { date: '3월 28일 (금)', match: 'LG vs 두산' },
    myPosts: 1,
    applied: 2,
    crew: '잠실 레드크루',
  }

  return (
    <div className="my-page">
      {/* 상단 */}
      <div className="top-bar">
        <h1><span className="icon">👤</span> 마이페이지</h1>
      </div>

      {/* 프로필 */}
      <div className="my-profile-section">
        <div className="my-profile-row">
          <div className="avatar-lg">{user.initial}</div>
          <div>
            <div className="my-name">{user.nickname}</div>
            <TeamBadge teamId={user.teamId} />
          </div>
        </div>
        <button className="btn-edit">⚙️ 프로필 수정</button>
      </div>

      {/* 내 직관 일정 */}
      <div className="my-section">
        <div className="my-section-title">📅 내 직관 일정</div>
        <div className="schedule-card">
          <div className="schedule-label">다가오는 직관</div>
          <div className="schedule-date">{user.schedule.date}</div>
          <div className="schedule-match">{user.schedule.match}</div>
        </div>
        <button className="see-all">전체 일정 보기 →</button>
      </div>

      {/* 통계 섹션 */}
      <div className="my-section">
        <div className="my-stat-item">
          <div className="my-stat-label">📋 내가 쓴 모집글</div>
          <div className="my-stat-value">{user.myPosts}개</div>
        </div>
        <div className="my-stat-item">
          <div className="my-stat-label">📅 신청한 모집글</div>
          <div className="my-stat-value">{user.applied}개</div>
        </div>
        <div className="my-stat-item">
          <div className="my-stat-label">👥 내 크루</div>
          <div className="my-stat-value">{user.crew}</div>
        </div>
      </div>
    </div>
  )
}
