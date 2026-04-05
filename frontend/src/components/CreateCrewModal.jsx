import { useState } from 'react'
import { TEAMS } from './TeamComponents'

const STADIUMS = [
  "잠실야구장", "고척 스카이돔", "인천 SSG 랜더스필드", "수원 KT 위즈 파크",
  "대전 한화생명 이글스 파크", "대구 삼성 라이온즈 파크", "광주 기아 챔피언스 필드",
  "부산 사직야구장", "창원 NC 파크"
];

const STADIUM_MAP = {
  "두산": "잠실야구장", "LG": "잠실야구장", "SSG": "인천 SSG 랜더스필드",
  "키움": "고척 스카이돔", "KT": "수원 KT 위즈 파크", "삼성": "대구 삼성 라이온즈 파크",
  "한화": "대전 한화생명 이글스 파크", "NC": "창원 NC 파크", "롯데": "부산 사직야구장", "KIA": "광주 기아 챔피언스 필드"
};

export default function CreateCrewModal({ onClose, onSubmit, initialData }) {
  const isEditMode = !!initialData;

  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    content: initialData?.content || '',
    teamId: initialData?.teamId || 1,             
    homeTeamId: initialData?.homeTeamId || 1,     
    awayTeamId: initialData?.awayTeamId || 2,     
    maxParticipants: initialData?.maxParticipants || 10,
    isPublic: initialData?.isPublic !== undefined ? initialData.isPublic : true,
    stadium: initialData?.stadium || '잠실야구장', 
    matchDate: initialData?.matchDate || '',
  })
  
  // 💡 수정 완료 시 변경 사항을 체크하기 위한 초기 상태값 복사본 저장
  const [initialFormState] = useState({ ...formData });
  const [loading, setLoading] = useState(false)

  const handleHomeTeamChange = (e) => {
    const homeId = Number(e.target.value);
    if (homeId === formData.awayTeamId) return alert("홈 팀과 어웨이 팀을 동일하게 선택할 수 없습니다.");

    const selectedTeam = TEAMS.filter(t => t.id !== 'ALL')[homeId - 1];
    let autoStadium = formData.stadium;
    if (selectedTeam) {
      const teamKey = Object.keys(STADIUM_MAP).find(key => selectedTeam.name.includes(key));
      if (teamKey) autoStadium = STADIUM_MAP[teamKey];
    }
    setFormData({ ...formData, homeTeamId: homeId, stadium: autoStadium });
  };

  const handleAwayTeamChange = (e) => {
    const awayId = Number(e.target.value);
    if (awayId === formData.homeTeamId) return alert("홈 팀과 어웨이 팀을 동일하게 선택할 수 없습니다.");
    setFormData({ ...formData, awayTeamId: awayId });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.homeTeamId === formData.awayTeamId) {
      return alert("홈팀과 어웨이팀을 동일하게 선택할 수 없습니다.");
    }

    // 💡 수정 모드일 때 변경사항 여부 검사
    if (isEditMode) {
      const hasChanged = Object.keys(formData).some(key => formData[key] !== initialFormState[key]);
      if (!hasChanged) {
        return alert("변경사항이 없습니다.");
      }
    }

    try {
      setLoading(true);
      await onSubmit(formData);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', zIndex: 1100, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <div style={{ background: '#fff', borderRadius: '24px 24px 0 0', width: '100%', maxWidth: 500, maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 -10px 40px rgba(0,0,0,0.2)' }}>
        <div style={{ width: 40, height: 4, background: '#eee', borderRadius: 2, margin: '16px auto 0' }} />

        <div style={{ padding: '24px 28px 0' }}>
          <h3 style={{ fontSize: 20, fontWeight: 800, marginBottom: 4, color: '#1a1a1a' }}>
            {isEditMode ? '크루 정보 수정하기 ⚾' : '새로운 크루 만들기 ⚾'}
          </h3>
          <p style={{ fontSize: 13, color: '#777', marginBottom: 0 }}>
            {isEditMode ? '수정할 모집글 정보를 확인하고 변경해주세요.' : '함께 직관하고 뜨겁게 응원할 동료를 모아보세요.'}
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ overflowY: 'auto', padding: '24px 28px 32px', flex: 1 }}>
          <div style={{ marginBottom: 18 }}>
            <label style={styles.label}>크루 활동 명칭 (제목)</label>
            <input placeholder="예: 잠실 3루 응원석 같이 가실 분!" style={styles.input} value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} required />
          </div>

          <div style={{ display: 'flex', gap: 12, marginBottom: 18 }}>
            <div style={{ flex: 1 }}>
              <label style={styles.label}>홈 팀</label>
              <select style={styles.select} value={formData.homeTeamId} onChange={handleHomeTeamChange} required>
                {TEAMS.filter(t => t.id !== 'ALL').map((t, i) => (<option key={t.id} value={i + 1}>{t.name}</option>))}
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label style={styles.label}>어웨이 팀</label>
              <select style={styles.select} value={formData.awayTeamId} onChange={handleAwayTeamChange} required>
                {TEAMS.filter(t => t.id !== 'ALL').map((t, i) => (<option key={t.id} value={i + 1}>{t.name}</option>))}
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12, marginBottom: 18 }}>
            <div style={{ flex: 1 }}>
              <label style={styles.label}>본인 응원 구단</label>
              <select style={styles.select} value={formData.teamId} onChange={e => setFormData({ ...formData, teamId: Number(e.target.value) })} required>
                {TEAMS.filter(t => t.id !== 'ALL').map((t, i) => (<option key={t.id} value={i + 1}>{t.name}</option>))}
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label style={styles.label}>최대 인원</label>
              <input type="number" min={2} max={100} style={styles.input} value={formData.maxParticipants} onChange={e => setFormData({ ...formData, maxParticipants: Number(e.target.value) })} required />
            </div>
          </div>

          <div style={{ marginBottom: 18 }}>
            <label style={styles.label}>장소 (경기장)</label>
            <select style={styles.select} value={formData.stadium} onChange={e => setFormData({ ...formData, stadium: e.target.value })} required>
              {STADIUMS.map(stadium => (<option key={stadium} value={stadium}>{stadium}</option>))}
            </select>
          </div>

          <div style={{ marginBottom: 18 }}>
            <label style={styles.label}>경기 날짜</label>
            <input type="date" style={styles.input} value={formData.matchDate} onChange={e => setFormData({ ...formData, matchDate: e.target.value })} required />
          </div>

          <div style={{ marginBottom: 18 }}>
            <label style={styles.label}>크루 상세 소개</label>
            <textarea placeholder="구체적인 활동 계획이나 준비물이 있다면 적어주세요." style={styles.textarea} value={formData.content} onChange={e => setFormData({ ...formData, content: e.target.value })} required />
          </div>

          <div style={styles.toggleRow}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#1a1a1a', marginBottom: 2 }}>공개 크루 설정</div>
              <div style={{ fontSize: 12, color: '#999' }}>{formData.isPublic ? '누구나 참여 신청 가능' : '승인된 유저만 참여 가능'}</div>
            </div>
            <input type="checkbox" checked={formData.isPublic} onChange={e => setFormData({ ...formData, isPublic: e.target.checked })} style={{ width: 20, height: 20, cursor: 'pointer', accentColor: '#e94560' }} />
          </div>

          {/* 💡 하단 버튼: 취소 & 수정 완료/만들기 분기 처리 */}
          <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
            <button type="button" onClick={onClose} style={styles.cancelBtn}>
              취소
            </button>
            <button type="submit" disabled={loading} style={{ ...styles.submitBtn, background: loading ? '#ccc' : '#e94560', cursor: loading ? 'not-allowed' : 'pointer' }}>
              {loading ? '처리 중...' : (isEditMode ? '수정 완료' : '⚾ 크루 만들기')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

const styles = {
  label: { display: 'block', fontSize: '13px', fontWeight: '800', color: '#333', marginBottom: '8px', marginLeft: '2px' },
  input: { width: '100%', borderRadius: '12px', padding: '12px 16px', border: '1px solid #e1e1e1', fontSize: '14px', boxSizing: 'border-box', outline: 'none', fontFamily: 'inherit', backgroundColor: '#fcfcfc' },
  select: { width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid #e1e1e1', fontSize: '14px', fontFamily: 'inherit', background: '#fcfcfc', outline: 'none', cursor: 'pointer' },
  textarea: { width: '100%', height: '100px', borderRadius: '12px', padding: '12px 16px', border: '1px solid #e1e1e1', fontSize: '14px', resize: 'none', boxSizing: 'border-box', fontFamily: 'inherit', lineHeight: '1.6', backgroundColor: '#fcfcfc', outline: 'none' },
  toggleRow: { marginBottom: '28px', padding: '14px 18px', background: '#f9f9f9', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '1px solid #f0f0f0' },
  cancelBtn: { flex: 1, padding: '16px', background: '#f5f5f5', border: 'none', borderRadius: '14px', fontWeight: '800', fontSize: '15px', cursor: 'pointer', fontFamily: 'inherit', color: '#666' },
  submitBtn: { flex: 2, padding: '16px', color: '#fff', border: 'none', borderRadius: '14px', fontWeight: '800', fontSize: '15px', fontFamily: 'inherit', transition: 'all 0.2s' },
};