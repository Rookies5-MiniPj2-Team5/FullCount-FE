// 모집 상태 배지 (OPEN / CLOSED / CANCELLED)
export function StatusBadge({ status }) {
  const styles = {
    OPEN:      { label: '모집중',   color: '#e94560', bg: '#fff0f3' },
    CLOSED:    { label: '모집완료', color: '#888',    bg: '#f5f5f5' },
    CANCELLED: { label: '취소됨',   color: '#aaa',    bg: '#f5f5f5' },
  }
  const s = styles[status] || { label: status, color: '#888', bg: '#f5f5f5' }

  return (
    <span style={{
      fontSize: 12, fontWeight: 700, padding: '3px 10px', borderRadius: 20,
      color: s.color, background: s.bg
    }}>
      {s.label}
    </span>
  )
}

// 신청 상태 배지 (PENDING / ACCEPTED / REJECTED)
export function ApplicationStatusBadge({ status }) {
  const styles = {
    PENDING:  { label: '대기중', color: '#BA7517', bg: '#FAEEDA' },
    ACCEPTED: { label: '수락됨', color: '#0F6E56', bg: '#E1F5EE' },
    REJECTED: { label: '거절됨', color: '#A32D2D', bg: '#FCEBEB' },
  }
  const s = styles[status] || { label: status, color: '#888', bg: '#f5f5f5' }

  return (
    <span style={{
      fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 20,
      color: s.color, background: s.bg
    }}>
      {s.label}
    </span>
  )
}
