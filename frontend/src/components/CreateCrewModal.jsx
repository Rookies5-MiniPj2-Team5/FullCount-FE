import { useState } from 'react'
import { TEAMS } from './TeamComponents'

export default function CreateCrewModal({ onClose, onSubmit }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    teamId: 1,
    maxMember: 10,
    isPublic: true,
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      setLoading(true)
      await onSubmit(formData)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
      background: 'rgba(0,0,0,0.5)', zIndex: 1000,
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
    }}>
      <div style={{
        background: '#fff', borderRadius: '20px 20px 0 0',
        width: '100%', maxWidth: 480,
        maxHeight: '90vh', display: 'flex', flexDirection: 'column',
      }}>
        {/* 핸들 바 */}
        <div style={{ width: 40, height: 4, background: '#eee', borderRadius: 2, margin: '16px auto 0' }} />

        {/* 헤더 */}
        <div style={{ padding: '16px 24px 0' }}>
          <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4, color: '#1a2a4a' }}>
            크루 만들기
          </h3>
          <p style={{ fontSize: 13, color: '#999', marginBottom: 0 }}>
            함께 직관할 크루를 만들어보세요 ⚾
          </p>
        </div>

        {/* 스크롤 가능한 폼 영역 */}
        <form
          onSubmit={handleSubmit}
          style={{ overflowY: 'auto', padding: '20px 24px 24px', flex: 1 }}
        >
          {/* 크루 이름 */}
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#1a2a4a', marginBottom: 6 }}>
              크루 이름
            </label>
            <input
              placeholder="크루 이름을 입력해주세요"
              style={{
                width: '100%', borderRadius: 10, padding: '10px 14px',
                border: '1px solid #ddd', fontSize: 14, boxSizing: 'border-box',
                outline: 'none', fontFamily: 'inherit',
              }}
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          {/* 응원 팀 */}
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#1a2a4a', marginBottom: 6 }}>
              응원 팀
            </label>
            <select
              style={{
                width: '100%', padding: '10px 14px', borderRadius: 10,
                border: '1px solid #ddd', fontSize: 14, fontFamily: 'inherit',
                background: '#fff',
              }}
              value={formData.teamId}
              onChange={e => setFormData({ ...formData, teamId: Number(e.target.value) })}
              required
            >
              {TEAMS.filter(t => t.id !== 'ALL').map((t, i) => (
                <option key={t.id} value={i + 1}>{t.name}</option>
              ))}
            </select>
          </div>

          {/* 크루 소개 */}
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#1a2a4a', marginBottom: 6 }}>
              크루 소개
            </label>
            <textarea
              placeholder="크루를 소개해주세요&#10;(예: 두산팬 모임, 응원석에서 같이 응원해요!)"
              style={{
                width: '100%', height: 90, borderRadius: 10, padding: '10px 14px',
                border: '1px solid #ddd', fontSize: 14, resize: 'none',
                boxSizing: 'border-box', fontFamily: 'inherit', lineHeight: 1.6,
              }}
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              required
            />
          </div>

          {/* 최대 인원 */}
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#1a2a4a', marginBottom: 6 }}>
              최대 인원
            </label>
            <input
              type="number" min={2} max={100}
              style={{
                width: '100%', borderRadius: 10, padding: '10px 14px',
                border: '1px solid #ddd', fontSize: 14, boxSizing: 'border-box',
                fontFamily: 'inherit',
              }}
              value={formData.maxMember}
              onChange={e => setFormData({ ...formData, maxMember: Number(e.target.value) })}
              required
            />
          </div>

          {/* 공개 여부 */}
          <div style={{
            marginBottom: 24, padding: '12px 14px',
            background: '#f9f9f9', borderRadius: 10,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#1a2a4a', marginBottom: 2 }}>공개 크루</div>
              <div style={{ fontSize: 12, color: '#999' }}>
                {formData.isPublic ? '누구나 가입 신청 가능' : '승인 후 가입 가능'}
              </div>
            </div>
            <input
              type="checkbox"
              checked={formData.isPublic}
              onChange={e => setFormData({ ...formData, isPublic: e.target.checked })}
              style={{ width: 18, height: 18, cursor: 'pointer' }}
            />
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1, padding: 14, background: '#eee',
                border: 'none', borderRadius: 10, fontWeight: 700,
                fontSize: 15, cursor: 'pointer', fontFamily: 'inherit',
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
                cursor: loading ? 'not-allowed' : 'pointer',
                fontFamily: 'inherit',
              }}
            >
              {loading ? '생성 중...' : '⚾ 크루 만들기'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
