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
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20
    }}>
      <div style={{
        background: '#fff', borderRadius: 16,
        width: '100%', maxWidth: 480, padding: 24
      }}>
        <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20, color: '#1a2a4a' }}>
          크루 만들기
        </h3>
        <form onSubmit={handleSubmit}>
          {/* 크루 이름 */}
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 6 }}>
              크루 이름
            </label>
            <input
              placeholder="크루 이름을 입력해주세요"
              style={{ width: '100%', borderRadius: 8, padding: 10, border: '1px solid #ddd', boxSizing: 'border-box' }}
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          {/* 응원 팀 */}
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 6 }}>
              응원 팀
            </label>
            <select
              style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #ddd' }}
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
            <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 6 }}>
              크루 소개
            </label>
            <textarea
              placeholder="크루를 소개해주세요"
              style={{ width: '100%', height: 80, borderRadius: 8, padding: 10, border: '1px solid #ddd', resize: 'none', boxSizing: 'border-box' }}
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              required
            />
          </div>

          {/* 최대 인원 */}
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 6 }}>
              최대 인원
            </label>
            <input
              type="number" min={2} max={100}
              style={{ width: '100%', borderRadius: 8, padding: 10, border: '1px solid #ddd', boxSizing: 'border-box' }}
              value={formData.maxMember}
              onChange={e => setFormData({ ...formData, maxMember: Number(e.target.value) })}
              required
            />
          </div>

          {/* 공개 여부 */}
          <div style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
            <label style={{ fontSize: 13, fontWeight: 700 }}>공개 크루</label>
            <input
              type="checkbox"
              checked={formData.isPublic}
              onChange={e => setFormData({ ...formData, isPublic: e.target.checked })}
            />
            <span style={{ fontSize: 12, color: '#999' }}>
              {formData.isPublic ? '누구나 가입 가능' : '승인 후 가입 가능'}
            </span>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button
              type="button"
              onClick={onClose}
              style={{ flex: 1, padding: 12, background: '#eee', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}
            >
              취소
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                flex: 2, padding: 12,
                background: loading ? '#ccc' : '#e94560',
                color: '#fff', border: 'none', borderRadius: 8,
                fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer'
              }}
            >
              {loading ? '생성 중...' : '크루 만들기'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}