import { ApplicationStatusBadge } from './StatusBadge'

export default function ApplicationList({ applications, onAccept, onReject }) {
  return (
    <div style={{
      background: '#fff', borderRadius: 12, padding: 16,
      marginBottom: 12, border: '1px solid #eee'
    }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: '#1a2a4a', marginBottom: 12 }}>
        📋 신청자 목록 ({applications.length}명)
      </div>

      {applications.length === 0 ? (
        <div style={{ textAlign: 'center', color: '#bbb', fontSize: 13, padding: '16px 0' }}>
          아직 신청자가 없어요
        </div>
      ) : (
        applications.map(app => (
          <div key={app.id} style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '10px 0', borderBottom: '1px solid #f5f5f5'
          }}>
            {/* 아바타 */}
            <div style={{
              width: 34, height: 34, borderRadius: '50%',
              background: '#1a2a4a', color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 700, fontSize: 14, flexShrink: 0
            }}>
              {app.applicantNickname?.substring(0, 1)}
            </div>

            {/* 닉네임 + 메시지 */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 700 }}>{app.applicantNickname}</div>
              {app.message && (
                <div style={{
                  fontSize: 12, color: '#888', marginTop: 2,
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                }}>
                  {app.message}
                </div>
              )}
            </div>

            {/* 상태 배지 */}
            <ApplicationStatusBadge status={app.status} />

            {/* 수락/거절 버튼 (대기중일 때만) */}
            {app.status === 'PENDING' && onAccept && onReject && (
              <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                <button
                  onClick={() => onAccept(app.id)}
                  style={{
                    fontSize: 12, background: '#e94560', color: '#fff',
                    border: 'none', borderRadius: 6, padding: '6px 10px',
                    cursor: 'pointer', fontWeight: 700
                  }}
                >
                  수락
                </button>
                <button
                  onClick={() => onReject(app.id)}
                  style={{
                    fontSize: 12, background: '#eee', color: '#666',
                    border: 'none', borderRadius: 6, padding: '6px 10px', cursor: 'pointer'
                  }}
                >
                  거절
                </button>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  )
}
