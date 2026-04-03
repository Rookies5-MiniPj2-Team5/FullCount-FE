import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { TeamBadge } from '../components/TeamComponents'
import { StatusBadge } from '../components/StatusBadge'
import ApplyModal from '../components/ApplyModal'
import ApplicationList from '../components/ApplicationList'
import MyApplicationStatus from '../components/MyApplicationStatus'
import api from '../api/api' 
import {
    getMeetupPost,
    getApplications,
    getMyApplication,
    applyMeetup,
    cancelApplication,
    acceptApplication,
    rejectApplication,
} from '../api/meetup'

const TEAMS = [
    { id: 'LG', name: 'LG 트윈스' }, { id: 'DU', name: '두산 베어스' },
    { id: 'SSG', name: 'SSG 랜더스' }, { id: 'KIA', name: 'KIA 타이거즈' },
    { id: 'SA', name: '삼성 라이온즈' }, { id: 'LO', name: '롯데 자이언츠' },
    { id: 'HH', name: '한화 이글스' }, { id: 'KT', name: 'KT 위즈' },
    { id: 'NC', name: 'NC 다이노스' }, { id: 'WO', name: '키움 히어로즈' },
];

const STADIUMS = {
    LG: '잠실야구장', DU: '잠실야구장', SSG: '인천 SSG 랜더스필드', KIA: '광주-기아 챔피언스 필드',
    SA: '대구 삼성 라이온즈 파크', LO: '사직야구장', HH: '한화생명 이글스 파크', KT: '수원 KT 위즈 파크',
    NC: '창원 NC 파크', WO: '고척 스카이돔',
    1: '잠실야구장', 2: '잠실야구장', 3: '인천 SSG 랜더스필드', 4: '광주-기아 챔피언스 필드',
    5: '대구 삼성 라이온즈 파크', 6: '사직야구장', 7: '한화생명 이글스 파크', 8: '수원 KT 위즈 파크',
    9: '창원 NC 파크', 10: '고척 스카이돔'
};

const ID_TO_TEAM_NAME = {
    1: "LG", 2: "두산", 3: "SSG", 4: "KIA", 5: "삼성",
    6: "롯데", 7: "한화", 8: "KT", 9: "NC", 10: "키움"
};

const TEAM_NAME_TO_ID = {
    "LG": "LG", "두산": "DU", "SSG": "SSG", "KIA": "KIA", "삼성": "SA",
    "롯데": "LO", "한화": "HH", "KT": "KT", "NC": "NC", "키움": "WO"
};

const STADIUM_OPTIONS = [
  "잠실야구장", "고척 스카이돔", "인천 SSG 랜더스필드", "수원 KT 위즈 파크", 
  "광주-기아 챔피언스 필드", "창원 NC 파크", "대구 삼성 라이온즈 파크", 
  "사직야구장", "한화생명 이글스 파크"
];

const getNormalizedTeamName = (id, name) => {
    if (id && ID_TO_TEAM_NAME[id]) return ID_TO_TEAM_NAME[id];
    if (typeof name === 'string') {
        if (name.includes('LG')) return 'LG';
        if (name.includes('두산') || name === 'DU') return '두산';
        if (name.includes('SSG')) return 'SSG';
        if (name.includes('KIA') || name.includes('기아')) return 'KIA';
        if (name.includes('삼성') || name === 'SA') return '삼성';
        if (name.includes('롯데') || name === 'LO') return '롯데';
        if (name.includes('한화') || name === 'HH') return '한화';
        if (name.includes('KT')) return 'KT';
        if (name.includes('NC')) return 'NC';
        if (name.includes('키움') || name === 'WO') return '키움';
    }
    return "미정";
};

export default function MeetupDetailPage({ postId, onBack }) {
    const id = postId
    const { user } = useAuth()

    const [post, setPost] = useState(null)
    const [applications, setApplications] = useState([])
    const [myApplication, setMyApplication] = useState(null)
    const [loading, setLoading] = useState(true)
    const [isApplyModalOpen, setIsApplyModalOpen] = useState(false)
    const [tab, setTab] = useState('info')

    const [isEditMode, setIsEditMode] = useState(false)
    const [editForm, setEditForm] = useState({ title: '', content: '', homeTeamId: '', awayTeamId: '', matchDate: '', maxParticipants: 2, stadium: '' })

    const isAuthor = user?.nickname === post?.authorNickname

    const fetchPost = async () => {
        try {
            setLoading(true)
            const res = await getMeetupPost(id)
            const postData = res.data?.data || res.data?.content || res.data;
            setPost(postData)

            if (sessionStorage.getItem('autoOpenEdit') === 'true') {
                handleEditClick(postData)
                sessionStorage.removeItem('autoOpenEdit')
            }
        } catch {
            alert('게시글을 불러오지 못했습니다.')
            onBack()
        } finally {
            setLoading(false)
        }
    }

    const fetchApplications = async () => {
        try {
            const res = await getApplications(id)
            const appsData = res.data?.data || res.data?.content || res.data;
            setApplications(Array.isArray(appsData) ? appsData : [])
        } catch {
            console.error('신청자 목록 로딩 실패')
            setApplications([])
        }
    }

    const fetchMyApplication = async () => {
        try {
            const res = await getMyApplication(id)
            setMyApplication(res.data?.data || res.data)
        } catch {
            setMyApplication(null)
        }
    }

    useEffect(() => {
        fetchPost()
        if (user) fetchMyApplication()
    }, [id, user])

    useEffect(() => {
        if (isAuthor) fetchApplications()
    }, [post, isAuthor])

    const handleEditClick = (postData) => {
        const target = (postData && postData.title) ? postData : post;
        if(!target) return;

        const homeName = getNormalizedTeamName(target.homeTeamId, target.homeTeamName)
        const awayName = getNormalizedTeamName(target.awayTeamId, target.awayTeamName)
        
        setEditForm({ 
            title: target.title || '', 
            content: target.content || '',
            homeTeamId: TEAM_NAME_TO_ID[homeName] || '',
            awayTeamId: TEAM_NAME_TO_ID[awayName] || '',
            matchDate: target.matchDate || '',
            maxParticipants: target.maxParticipants || 2,
            stadium: target.stadium || STADIUMS[TEAM_NAME_TO_ID[homeName]] || '' 
        })
        setIsEditMode(true)
    }

    const handleUpdatePost = async () => {
        if (!editForm.title.trim() || !editForm.content.trim() || !editForm.stadium.trim()) {
            alert('제목, 내용, 경기장을 모두 입력해주세요.')
            return
        }
        if (editForm.homeTeamId && editForm.homeTeamId === editForm.awayTeamId) {
            alert('홈 팀과 어웨이 팀은 같을 수 없습니다.')
            return
        }
        try {
            const payload = {
                title: editForm.title,
                content: editForm.content,
                homeTeamId: String(editForm.homeTeamId),
                awayTeamId: String(editForm.awayTeamId),
                matchDate: editForm.matchDate,
                stadium: editForm.stadium,
                maxParticipants: parseInt(editForm.maxParticipants, 10)
            }
            await api.put(`/posts/${id}`, payload)
            alert('성공적으로 수정되었습니다!')
            setIsEditMode(false)
            fetchPost() 
        } catch (error) {
            alert('수정에 실패했습니다. (서버 연결을 확인해주세요)')
        }
    }

    const handleDelete = async () => {
        if (!window.confirm('정말 이 모집글을 삭제하시겠습니까?')) return;
        try { await api.delete(`/posts/${id}`); alert('삭제되었습니다.'); onBack(); } 
        catch (error) { alert(error.response?.data?.message || '삭제에 실패했습니다.'); }
    }

    const handleApply = async (message) => {
        try { await applyMeetup(id, message); alert('신청 완료!'); setIsApplyModalOpen(false); fetchMyApplication(); fetchPost(); } 
        catch { alert('신청에 실패했습니다. 이미 신청했거나 모집이 마감되었을 수 있어요.') }
    }
    const handleCancelApply = async () => {
        if (!window.confirm('신청을 취소하시겠습니까?')) return;
        try { await cancelApplication(myApplication.id); alert('신청이 취소되었습니다.'); setMyApplication(null); fetchPost(); } 
        catch { alert('신청 취소에 실패했습니다.') }
    }
    const handleAccept = async (appId) => { try { await acceptApplication(appId); alert('수락 완료!'); fetchApplications(); fetchPost(); } catch { alert('수락에 실패했습니다.') } }
    const handleReject = async (appId) => { if (!window.confirm('거절하시겠습니까?')) return; try { await rejectApplication(appId); fetchApplications(); } catch { alert('거절 실패.') } }

    if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', flexDirection: 'column', gap: 12 }}><div style={{ fontSize: 32 }}>⚾</div><p style={{ color: '#999', fontSize: 14 }}>로딩 중...</p></div>
    if (!post) return null

    const homeTeam = getNormalizedTeamName(post.homeTeamId, post.homeTeamName)
    const awayTeam = getNormalizedTeamName(post.awayTeamId, post.awayTeamName)
    const isFull = (post.currentParticipants || 0) >= (post.maxParticipants || 1)
    const applyTabLabel = isAuthor ? `✋ 신청자 (${applications.length})` : '✋ 신청 현황'

    return (
        <div>
            <div className="top-bar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <button onClick={onBack} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', padding: 0 }}>←</button>
                    <h1 style={{ fontSize: 18, margin: 0 }}>모집글 상세</h1>
                </div>

                {isAuthor && (
                    <div style={{ display: 'flex', gap: 8 }}>
                        {isEditMode ? (
                            <>
                                <button onClick={handleUpdatePost} style={{ padding: '6px 12px', background: '#4CAF50', color: '#fff', border: 'none', borderRadius: '6px', fontSize: 13, cursor: 'pointer', fontWeight: 600 }}>수정 완료</button>
                                <button onClick={() => setIsEditMode(false)} style={{ padding: '6px 12px', background: '#eee', color: '#333', border: 'none', borderRadius: '6px', fontSize: 13, cursor: 'pointer', fontWeight: 600 }}>취소</button>
                            </>
                        ) : (
                            <>
                                <button onClick={() => handleEditClick(post)} style={{ padding: '6px 12px', background: '#eee', border: 'none', borderRadius: '6px', fontSize: 13, cursor: 'pointer', fontWeight: 600 }}>수정</button>
                                <button onClick={handleDelete} style={{ padding: '6px 12px', background: '#e94560', color: '#fff', border: 'none', borderRadius: '6px', fontSize: 13, cursor: 'pointer', fontWeight: 600 }}>삭제</button>
                            </>
                        )}
                    </div>
                )}
            </div>

            <div className="page-content" style={{ paddingBottom: 120 }}>
                <div style={{ background: 'linear-gradient(135deg, #1a2a4a 0%, #e94560 100%)', borderRadius: 16, padding: '24px 20px', color: '#fff', marginBottom: 16, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    {isEditMode ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%', alignItems: 'center' }}>
                            <input value={editForm.title} onChange={(e) => setEditForm({...editForm, title: e.target.value})} style={{ textAlign: 'center', fontSize: 18, fontWeight: 800, width: '90%', padding: '10px', borderRadius: '8px', border: 'none', color: '#333' }} placeholder="제목" />
                            <div style={{ display: 'flex', gap: '10px', width: '90%' }}>
                                <select style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', color: '#333' }} value={editForm.homeTeamId} onChange={e => { 
                                    const val = e.target.value;
                                    if(val === editForm.awayTeamId && val !== '') { alert('어웨이 팀과 같을 수 없습니다.'); return; } 
                                    setEditForm({...editForm, homeTeamId: val, stadium: STADIUMS[val] || ''}) 
                                }}>
                                    <option value="">홈 팀</option>{TEAMS.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                </select>
                                <span style={{ fontWeight: 'bold', alignSelf: 'center' }}>VS</span>
                                <select style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', color: '#333' }} value={editForm.awayTeamId} onChange={e => { 
                                    if(e.target.value === editForm.homeTeamId && e.target.value !== '') { alert('홈 팀과 같을 수 없습니다.'); return; } 
                                    setEditForm({...editForm, awayTeamId: e.target.value}) 
                                }}>
                                    <option value="">어웨이 팀</option>{TEAMS.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                </select>
                            </div>
                            
                            <select 
                                style={{ width: '90%', padding: '10px', borderRadius: '8px', border: 'none', color: '#333', appearance: 'auto' }} 
                                value={editForm.stadium} 
                                onChange={e => setEditForm({ ...editForm, stadium: e.target.value })} 
                                required 
                            >
                                <option value="">경기장 선택</option>
                                {STADIUM_OPTIONS.map(stadium => (
                                    <option key={stadium} value={stadium}>{stadium}</option>
                                ))}
                            </select>

                            <div style={{ display: 'flex', gap: '10px', width: '90%' }}>
                                <input 
                                  type="date" 
                                  value={editForm.matchDate} 
                                  onChange={e => setEditForm({...editForm, matchDate: e.target.value})} 
                                  style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', color: '#333' }} 
                                  required
                                />
                                <div style={{ flex: 1, display: 'flex', alignItems: 'center', padding: '0 12px', borderRadius: '8px', background: '#fff', boxSizing: 'border-box' }}>
                                    <span style={{ fontSize: '13px', color: '#666', fontWeight: '600', whiteSpace: 'nowrap' }}>모집 인원</span>
                                    <input 
                                      type="number" 
                                      min="2" 
                                      max="50" 
                                      style={{ flex: 1, width: '100%', border: 'none', outline: 'none', textAlign: 'right', fontSize: '14px', color: '#333', background: 'transparent' }} 
                                      value={editForm.maxParticipants} 
                                      onChange={e => setEditForm({...editForm, maxParticipants: e.target.value})} 
                                      required 
                                    />
                                    <span style={{ fontSize: '13px', color: '#333', marginLeft: '4px', fontWeight: '600' }}>명</span>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                                <span style={{ background: 'rgba(255,255,255,0.2)', padding: '4px 14px', borderRadius: 20, fontSize: 13, fontWeight: 700 }}>{homeTeam}</span>
                                <span style={{ fontSize: 14, fontWeight: 800, opacity: 0.8 }}>VS</span>
                                <span style={{ background: 'rgba(255,255,255,0.2)', padding: '4px 14px', borderRadius: 20, fontSize: 13, fontWeight: 700 }}>{awayTeam}</span>
                            </div>
                            <div style={{ textAlign: 'center', fontSize: 18, fontWeight: 800, marginBottom: 14, wordBreak: 'keep-all', lineHeight: 1.4 }}>{post.title}</div>
                            <div style={{ display: 'flex', justifyContent: 'center', gap: 14, fontSize: 13, opacity: 0.9, flexWrap: 'wrap' }}>
                                <span>🏟️ {post.stadium || '경기장 미정'}</span>
                                <span>📅 {post.matchDate}</span>
                            </div>
                        </>
                    )}
                </div>

                {!isEditMode && (
                    <div style={{ background: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, border: '1px solid #eee' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                            <StatusBadge status={post.status} />
                            <span style={{ fontSize: 13, color: '#e94560', fontWeight: 700 }}>👤 {post.currentParticipants || 0} / {post.maxParticipants || 1}명</span>
                        </div>
                        <div style={{ height: 8, background: '#f0f0f0', borderRadius: 999, overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${((post.currentParticipants || 0) / (post.maxParticipants || 1)) * 100}%`, background: isFull ? '#ef4444' : '#e94560', borderRadius: 999, transition: 'width 0.4s ease' }} />
                        </div>
                    </div>
                )}

                <div style={{ display: 'flex', background: '#fff', borderRadius: 12, border: '1px solid #eee', marginBottom: 12, overflow: 'hidden' }}>
                    {[{ key: 'info', label: '📋 모집 정보' }, { key: 'apply', label: applyTabLabel }].map(({ key, label }) => (
                        <button key={key} onClick={() => setTab(key)} style={{ flex: 1, padding: '12px 0', background: 'none', border: 'none', borderBottom: tab === key ? '2px solid #e94560' : '2px solid transparent', fontSize: 14, fontWeight: 700, color: tab === key ? '#e94560' : '#999', cursor: 'pointer', transition: 'color 0.15s' }}>{label}</button>
                    ))}
                </div>

                {tab === 'info' && (
                    <>
                        <div style={{ background: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, border: '1px solid #eee' }}>
                            <div style={{ fontSize: 13, fontWeight: 700, color: '#1a2a4a', marginBottom: 8 }}>📋 상세 설명</div>
                            {isEditMode ? (
                                <textarea value={editForm.content} onChange={(e) => setEditForm({...editForm, content: e.target.value})} style={{ width: '100%', height: '150px', padding: '10px', fontSize: 13, color: '#333', lineHeight: 1.7, borderRadius: '8px', border: '1px solid #ddd', resize: 'none', boxSizing: 'border-box' }} />
                            ) : (
                                <div style={{ fontSize: 13, color: '#666', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{post.content}</div>
                            )}
                        </div>

                        {!isEditMode && (
                            <>
                                <div style={{ background: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, border: '1px solid #eee' }}>
                                    <div style={{ fontSize: 13, fontWeight: 700, color: '#1a2a4a', marginBottom: 12 }}>🏟️ 경기 정보</div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                                        {[ ['홈팀', homeTeam], ['원정팀', awayTeam], ['경기장', post.stadium || '미정'], ['날짜', post.matchDate] ].map(([label, val]) => (
                                            <div key={label} style={{ background: '#f9f9f9', borderRadius: 10, padding: 12 }}>
                                                <div style={{ fontSize: 11, color: '#aaa', fontWeight: 500, marginBottom: 4 }}>{label}</div>
                                                <div style={{ fontSize: 14, fontWeight: 700, color: '#1a2a4a' }}>{val}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div style={{ background: '#fff', borderRadius: 12, padding: 16, border: '1px solid #eee' }}>
                                    <div style={{ fontSize: 13, fontWeight: 700, color: '#1a2a4a', marginBottom: 12 }}>✍️ 작성자</div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                        <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'linear-gradient(135deg, #1a2a4a, #e94560)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 18 }}>
                                            {post.authorNickname?.substring(0, 1)}
                                        </div>
                                        <div>
                                            <div style={{ fontSize: 15, fontWeight: 700, color: '#1a2a4a', marginBottom: 4 }}>{post.authorNickname}</div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                <TeamBadge teamId={post.teamName || 'LG'} />
                                                <span style={{ fontSize: 12, color: '#bbb' }}>{post.createdAt?.slice(0, 10)}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}
                    </>
                )}

                {tab === 'apply' && !isEditMode && (
                    <>
                        {isAuthor && <ApplicationList applications={applications} onAccept={handleAccept} onReject={handleReject} />}
                        {!isAuthor && myApplication && <MyApplicationStatus application={myApplication} onCancel={handleCancelApply} />}
                        {!isAuthor && !myApplication && (
                            <div style={{ background: '#fff', borderRadius: 12, padding: '40px 16px', border: '1px solid #eee', textAlign: 'center' }}>
                                <div style={{ fontSize: 32, marginBottom: 12 }}>⚾</div>
                                <div style={{ fontSize: 15, fontWeight: 700, color: '#1a2a4a', marginBottom: 6 }}>아직 신청하지 않았어요</div>
                            </div>
                        )}
                    </>
                )}
            </div>

            {!isAuthor && post.status === 'OPEN' && !myApplication && (
                <div style={{ position: "fixed", bottom: 80, left: "50%", transform: "translateX(-50%)", padding: "8px 16px", background: "#fff", borderRadius: "20px", border: "1px solid #eee", boxShadow: "0 4px 12px rgba(0,0,0,0.1)", zIndex: 100, display: "flex", justifyContent: "center", alignItems: "center" }}>
                    <button onClick={() => setIsApplyModalOpen(true)} style={{ padding: "12px 32px", background: '#e94560', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 700, fontSize: 16, cursor: 'pointer' }}>⚾ 직관 메이트 신청하기</button>
                </div>
            )}
            {isApplyModalOpen && <ApplyModal post={post} onClose={() => setIsApplyModalOpen(false)} onSubmit={handleApply} />}
        </div>
    )
}