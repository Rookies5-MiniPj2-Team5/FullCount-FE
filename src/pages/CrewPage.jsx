import { TeamBadge } from '../components/TeamComponents'

const CREWS = [
  {
    id: 1, name: '잠실 레드크루', teamId: 'LG',
    desc: 'LG 트윈스 열정 팬들의 모임! 매주 즐경기 때 모여서 응원합니다.',
    members: 24, activity: '주 2-3회',
  },
  {
    id: 2, name: 'SSG 직관단', teamId: 'SSG',
    desc: '인천 SSG 랜더스 정기 직관 모임입니다. 편한 분위기로 함께해요!',
    members: 18, activity: '주 1-2회',
  },
  {
    id: 3, name: 'KIA 부산 원정단', teamId: 'KIA',
    desc: '광주 KIA 타이거즈 팬들의 원정 직관 크루입니다.',
    members: 15, activity: '월 2-3회',
  },
  {
    id: 4, name: '두산 매니아', teamId: 'DU',
    desc: '두산 베어스를 진심으로 사랑하는 팬들의 모임. 함께 응원해요!',
    members: 31, activity: '주 2-4회',
  },
  {
    id: 5, name: '삼성 라이온즈 대구팬', teamId: 'SA',
    desc: '대구경기장을 사랑하는 현지 팬 모임입니다. 언제든지 환영!',
    members: 22, activity: '주 1-2회',
  },
]

export default function CrewPage() {
  return (
    <div className="crew-page">
      <div className="page-header">
        <h2 className="page-title">직관 크루</h2>
        <p className="page-subtitle">정기적으로 함께 열띤 응원을 펼칠 크루를 찾아보세요!</p>
      </div>

      <div className="page-content">
        <div className="card-grid">
          {CREWS.map(crew => (
            <div key={crew.id} className="card crew-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <div className="crew-name">{crew.name}</div>
              </div>
              <TeamBadge teamId={crew.teamId} />
              <div className="crew-desc" style={{ marginTop: 8 }}>{crew.desc}</div>
              <div className="crew-stats">
                <div className="crew-stat">
                  👤 멤버 <span>{crew.members}명</span>
                </div>
                <div className="crew-stat">
                  📅 활동 <span>{crew.activity}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <button className="fab">➕</button>
    </div>
  )
}
