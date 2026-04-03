import { useState } from 'react'
import { TEAMS } from './TeamComponents'

export default function CreateCrewModal({ onClose, onSubmit }) {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    teamId: 1,
    maxParticipants: 10,
    isPublic: true,
    stadium: '',
    matchDate: '',
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
      background: 'rgba(0,0,0,0.5)', zIndex: 1100,
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
    }}>
      <div style={{
        background: '#fff', borderRadius: '24px 24px 0 0',
        width: '100%', maxWidth: 500,
        maxHeight: '90vh', display: 'flex', flexDirection: 'column',
        boxShadow: '0 -10px 40px rgba(0,0,0,0.2)',
      }}>
        {/* 핸들 바 */}
        <div style={{ width: 40, height: 4, background: '#eee', borderRadius: 2, margin: '16px auto 0' }} />

        {/* 헤더 */}
        <div style={{ padding: '24px 28px 0' }}>
          <h3 style={{ fontSize: 20, fontWeight: 800, marginBottom: 4, color: '#1a1a1a' }}>
            새로운 크루 만들기 ⚾
          </h3>
          <p style={{ fontSize: 13, color: '#777', marginBottom: 0 }}>
            함께 직관하고 뜨겁게 응원할 동료를 모아보세요.
          </p>
        </div>

        {/* 스크롤 가능한 폼 영역 */}
        <form
          onSubmit={handleSubmit}
          style={{ overflowY: 'auto', padding: '24px 28px 32px', flex: 1 }}
        >
          {/* 크루 이름 (Title) */}
          <div style={{ marginBottom: 18 }}>
            <label style={styles.label}>크루 활동 명칭 (제목)</label>
            <input
              placeholder="예: 잠실 3루 응원석 같이 가실 분!"
              style={styles.input}
              value={formData.title}
              onChange={e => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>

          <div style={{ display: 'flex', gap: 12, marginBottom: 18 }}>
            {/* 응원 팀 */}
            <div style={{ flex: 1 }}>
              <label style={styles.label}>응원 구단</label>
              <select
                style={styles.select}
                value={formData.teamId}
                onChange={e => setFormData({ ...formData, teamId: Number(e.target.value) })}
                required
              >
                {TEAMS.filter(t => t.id !== 'ALL').map((t, i) => (
                  <option key={t.id} value={i + 1}>{t.name}</option>
                ))}
              </select>
            </div>
            {/* 최대 인원 */}
            <div style={{ flex: 1 }}>
              <label style={styles.label}>최대 인원</label>
              <input
                type="number" min={2} max={100}
                style={styles.input}
                value={formData.maxParticipants}
                onChange={e => setFormData({ ...formData, maxParticipants: Number(e.target.value) })}
                required
              />
            </div>
          </div>

          {/* 날짜 */}
          <div style={{ marginBottom: 18 }}>
            <label style={styles.label}>경기 날짜</label>
            <input
              type="date"
              style={styles.input}
              value={formData.matchDate}
              onChange={e => setFormData({ ...formData, matchDate: e.target.value })}
              required
            />
          </div>

          {/* 경기장 */}
          <div style={{ marginBottom: 18 }}>
            <label style={styles.label}>장소 (경기장)</label>
            <input
              placeholder="예: 잠실야구장, 인천 SSG 랜더스필드 등"
              style={styles.input}
              value={formData.stadium}
              onChange={e => setFormData({ ...formData, stadium: e.target.value })}
              required
            />
          </div>

          {/* 큐레이션/소개 (Content) */}
          <div style={{ marginBottom: 18 }}>
            <label style={styles.label}>크루 상세 소개</label>
            <textarea
              placeholder="구체적인 활동 계획이나 준비물이 있다면 적어주세요. (예: 유니폼 지참, 치맥 동반 등)"
              style={styles.textarea}
              value={formData.content}
              onChange={e => setFormData({ ...formData, content: e.target.value })}
              required
            />
          </div>

          {/* 공개 여부 */}
          <div style={styles.toggleRow}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#1a1a1a', marginBottom: 2 }}>공개 크루 설정</div>
              <div style={{ fontSize: 12, color: '#999' }}>
                {formData.isPublic ? '누구나 참여 신청 가능' : '승인된 유저만 참여 가능'}
              </div>
            </div>
            <input
              type="checkbox"
              checked={formData.isPublic}
              onChange={e => setFormData({ ...formData, isPublic: e.target.checked })}
              style={{ width: 20, height: 20, cursor: 'pointer', accentColor: '#e94560' }}
            />
          </div>

          <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
            <button
              type="button"
              onClick={onClose}
              style={styles.cancelBtn}
            >
              취소
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                ...styles.submitBtn,
                background: loading ? '#ccc' : '#e94560',
                cursor: loading ? 'not-allowed' : 'pointer',
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

const styles = {
  label: {
    display: 'block', fontSize: '13px', fontWeight: '800', 
    color: '#333', marginBottom: '8px', marginLeft: '2px'
  },
  input: {
    width: '100%', borderRadius: '12px', padding: '12px 16px',
    border: '1px solid #e1e1e1', fontSize: '14px', boxSizing: 'border-box',
    outline: 'none', fontFamily: 'inherit', backgroundColor: '#fcfcfc'
  },
  select: {
    width: '100%', padding: '12px 16px', borderRadius: '12px',
    border: '1px solid #e1e1e1', fontSize: '14px', fontFamily: 'inherit',
    background: '#fcfcfc', outline: 'none'
  },
  textarea: {
    width: '100%', height: '100px', borderRadius: '12px', padding: '12px 16px',
    border: '1px solid #e1e1e1', fontSize: '14px', resize: 'none',
    boxSizing: 'border-box', fontFamily: 'inherit', lineHeight: '1.6',
    backgroundColor: '#fcfcfc', outline: 'none'
  },
  toggleRow: {
    marginBottom: '28px', padding: '14px 18px',
    background: '#f9f9f9', borderRadius: '14px',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    border: '1px solid #f0f0f0'
  },
  cancelBtn: {
    flex: 1, padding: '16px', background: '#f5f5f5',
    border: 'none', borderRadius: '14px', fontWeight: '800',
    fontSize: '15px', cursor: 'pointer', fontFamily: 'inherit',
    color: '#666'
  },
  submitBtn: {
    flex: 2, padding: '16px',
    color: '#fff', border: 'none', borderRadius: '14px',
    fontWeight: '800', fontSize: '15px',
    fontFamily: 'inherit', transition: 'all 0.2s'
  },
};
