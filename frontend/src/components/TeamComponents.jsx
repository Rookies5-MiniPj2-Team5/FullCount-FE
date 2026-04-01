// 팀 색상 클래스 매핑
export const TEAMS = [
  { id: 'ALL', name: '전체' },
  { id: 'LG', name: 'LG' },
  { id: 'DU', name: '두산' },
  { id: 'SSG', name: 'SSG' },
  { id: 'KIA', name: 'KIA' },
  { id: 'SA', name: '삼성' },
  { id: 'LO', name: '롯데' },
  { id: 'HH', name: '한화' },
  { id: 'KT', name: 'KT' },
  { id: 'NC', name: 'NC' },
  { id: 'WO', name: '키움' },
]

export const TEAM_NAME = {
  LG: 'LG', DU: '두산', SSG: 'SSG', KIA: 'KIA',
  SA: '삼성', LO: '롯데', HH: '한화', KT: 'KT', NC: 'NC', WO: '키움',
}

// 팀 ID → 로고 이미지 파일명 매핑
export const TEAM_LOGO = {
  LG: '/LG.png',
  DU: '/두산.png',
  SSG: '/SK.png',
  KIA: '/기아.png',
  SA: '/SS.png',
  LO: '/롯데.png',
  HH: '/HH.png',
  KT: '/KT.png',
  NC: '/NC.png',
  WO: '/키움.png',
}

export function TeamBadge({ teamId }) {
  const logo = TEAM_LOGO[teamId]
  return (
    <span className={`team-badge team-${teamId}`}>
      {logo && (
        <img
          src={logo}
          alt={TEAM_NAME[teamId] ?? teamId}
          className="team-badge-logo"
        />
      )}
      {TEAM_NAME[teamId] ?? teamId}
    </span>
  )
}

export function TeamFilter({ selected, onChange }) {
  return (
    <div className="team-filter">
      {TEAMS.map(t => (
        <button
          key={t.id}
          className={`chip ${selected === t.id ? 'active' : ''}`}
          onClick={() => onChange(t.id)}
        >
          {t.name}
        </button>
      ))}
    </div>
  )
}
