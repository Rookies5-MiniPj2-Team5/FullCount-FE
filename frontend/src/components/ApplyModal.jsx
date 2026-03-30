import { useState } from 'react'

export default function ApplyModal({ post, onClose, onSubmit }) {
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      setLoading(true)
      await onSubmit(message)
      setMessage('')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
      background: 'rgba(0,0,0,0.5)', zIndex: 1000,
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center'
    }}>
      <div style={{
        background: '#fff', borderRadius: '20px 20px 0 0',
        width: '100%', maxWidth: 480, padding: 24,
      }}>
        {/* 핸들 바 */}
        <div style={{ width: 40, height: 4, background: '#eee', borderRadius: 2, margin: '0 auto 20px' }} />

        <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 6, color: '#1a2a4a' }}>
          직관 메이트 신청
        </h3>
        <p style={{ fontSize: 13, color: '#999', marginBottom: 16 }}>
          <strong style={{ color: '#1a2a4a' }}>{post.authorNickname}</strong>님의 모집글에 신청합니다
        </p>

        <form onSubmit={handleSubmit}>
          <textarea
            placeholder="신청 메시지를 입력해주세요 (선택)"
            style={{
              width: '100%', height: 100, borderRadius: 10, padding: 12,
              border: '1px solid #ddd', fontSize: 14, resize: 'none',
              marginBottom: 16, boxSizing: 'border-box'
            }}
            value={message}
            onChange={e => setMessage(e.target.value)}
          />
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1, padding: 14, background: '#eee',
                border: 'none', borderRadius: 10, fontWeight: 700, cursor: 'pointer'
              }}
            >
              취소
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                flex: 2, padding: 14,
                background: loading ? '#ccc' : '#e94560',
                color: '#fff', border: 'none', borderRadius: 10,
                fontWeight: 700, fontSize: 15,
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
            >
              {loading ? '신청 중...' : '신청하기'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
