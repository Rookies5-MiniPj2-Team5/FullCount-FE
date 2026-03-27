// 팀 색상 클래스 매핑
export const TEAMS = [
  { id: 'ALL', name: '전체' },
  { id: 'LG',  name: 'LG' },
  { id: 'DU',  name: '두산' },
  { id: 'SSG', name: 'SSG' },
  { id: 'KIA', name: 'KIA' },
  { id: 'SA',  name: '삼성' },
  { id: 'LO',  name: '롯데' },
  { id: 'HH',  name: '한화' },
  { id: 'KT',  name: 'KT' },
  { id: 'NC',  name: 'NC' },
  { id: 'WO',  name: '키움' },
]

export const TEAM_NAME = {
  LG: 'LG', DU: '두산', SSG: 'SSG', KIA: 'KIA',
  SA: '삼성', LO: '롯데', HH: '한화', KT: 'KT', NC: 'NC', WO: '키움',
}

export function TeamBadge({ teamId }) {
  return (
    <span className={`team-badge team-${teamId}`}>
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
