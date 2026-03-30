import { ApplicationStatusBadge } from './StatusBadge'

export default function MyApplicationStatus({ application, onCancel }) {
  return (
    <div style={{
      borderRadius: 12, padding: 14, marginBottom: 12,
      border: '1px solid #ddd', background: '#fafafa'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#333', marginBottom: 6 }}>
            내 신청 상태
          </div>
          <ApplicationStatusBadge status={application.status} />
        </div>

        {/* 대기중일 때만 취소 버튼 */}
        {application.status === 'PENDING' && (
          <button
            onClick={onCancel}
            style={{
              fontSize: 12, color: '#e94560', background: 'none',
              border: '1px solid #e94560', borderRadius: 6,
              padding: '6px 12px', cursor: 'pointer'
            }}
          >
            신청 취소
          </button>
        )}
      </div>
    </div>
  )
}
