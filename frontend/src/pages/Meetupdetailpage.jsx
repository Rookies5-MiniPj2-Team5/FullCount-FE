// pages/MeetupDetailPage.jsx

import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { TeamBadge } from '../components/TeamComponents'
import { StatusBadge } from '../components/StatusBadge'
import ApplyModal from '../components/ApplyModal'
import ApplicationList from '../components/ApplicationList'
import MyApplicationStatus from '../components/MyApplicationStatus'
import {
    getMeetupPost,
    getApplications,
    getMyApplication,
    applyMeetup,
    cancelApplication,
    acceptApplication,
    rejectApplication,
} from '../api/meetup'

export default function MeetupDetailPage({ postId, onBack }) {
    const id = postId
    const { user } = useAuth()

    const [post, setPost] = useState(null)
    const [applications, setApplications] = useState([])
    const [myApplication, setMyApplication] = useState(null)
    const [loading, setLoading] = useState(true)
    const [isApplyModalOpen, setIsApplyModalOpen] = useState(false)
    const [tab, setTab] = useState('info') // 'info' | 'apply'

    const isAuthor = user?.nickname === post?.authorNickname

    // ── 데이터 조회 ───────────────────────────────────
    const fetchPost = async () => {
        try {
            setLoading(true)
            // TODO: BE 연동 시 아래 코드로 교체
            // const res = await getMeetupPost(id)
            // setPost(res.data)

            // 임시 더미 데이터
            setPost({
                id: 1, title: '잠실 LG vs 두산 같이 보실분!',
                content: '같이 응원해요! 잠실 3루 응원석 자리 있어요. 처음 직관 오시는 분도 환영합니다. 치킨이랑 맥주 같이 먹어요 🍺⚾',
                matchDate: '2026-04-05', homeTeamName: 'LG', awayTeamName: '두산',
                stadium: '잠실야구장',
                authorNickname: '테스트유저', teamName: 'LG', maxParticipants: 4,
                currentCount: 1, status: 'OPEN', createdAt: '2026-04-01'
            })
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
            setApplications(res.data)
        } catch {
            console.error('신청자 목록 로딩 실패')
        }
    }

    const fetchMyApplication = async () => {
        try {
            const res = await getMyApplication(id)
            setMyApplication(res.data)
        } catch {
            setMyApplication(null)
        }
    }

    useEffect(() => {
        fetchPost()
        // TODO: BE 연동 시 주석 해제
        // if (user) fetchMyApplication()
    }, [id])

    useEffect(() => {
        // TODO: BE 연동 시 주석 해제
        // if (isAuthor) fetchApplications()
    }, [post, isAuthor])

    // ── 핸들러 ────────────────────────────────────────
    const handleApply = async (message) => {
        try {
            await applyMeetup(id, message)
            alert('신청이 완료되었습니다!')
            setIsApplyModalOpen(false)
            fetchMyApplication()
            fetchPost()
        } catch {
            alert('신청에 실패했습니다. 이미 신청했거나 모집이 마감되었을 수 있어요.')
        }
    }

    const handleCancelApply = async () => {
        if (!window.confirm('신청을 취소하시겠습니까?')) return
        try {
            await cancelApplication(myApplication.id)
            alert('신청이 취소되었습니다.')
            setMyApplication(null)
            fetchPost()
        } catch {
            alert('신청 취소에 실패했습니다.')
        }
    }

    const handleAccept = async (applicationId) => {
        try {
            await acceptApplication(applicationId)
            alert('수락했습니다!')
            fetchApplications()
            fetchPost()
        } catch {
            alert('수락에 실패했습니다. 정원이 초과되었을 수 있어요.')
        }
    }

    const handleReject = async (applicationId) => {
        if (!window.confirm('거절하시겠습니까?')) return
        try {
            await rejectApplication(applicationId)
            fetchApplications()
        } catch {
            alert('거절에 실패했습니다.')
        }
    }

    // ── 로딩 ──────────────────────────────────────────
    if (loading) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', flexDirection: 'column', gap: 12 }}>
                <div style={{ fontSize: 32 }}>⚾</div>
                <p style={{ color: '#999', fontSize: 14 }}>로딩 중...</p>
            </div>
        )
    }

    if (!post) return null

    const isFull = (post.currentCount || 0) >= post.maxParticipants

    // 신청 현황 탭 라벨: 작성자면 신청자 수 표시
    const applyTabLabel = isAuthor
        ? `✋ 신청자 (${applications.length})`
        : '✋ 신청 현황'

    return (
        <div>
            {/* ── 상단 바 ── */}
            <div className="top-bar" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <button
                    onClick={onBack}
                    style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', padding: 0 }}
                >
                    ←
                </button>
                <h1 style={{ fontSize: 18, margin: 0 }}>모집글 상세</h1>
            </div>

            <div className="page-content" style={{ paddingBottom: 120 }}>

                {/* ── 상단 배너 ── */}
                <div style={{
                    background: 'linear-gradient(135deg, #1a2a4a 0%, #e94560 100%)',
                    borderRadius: 16, padding: '24px 20px', color: '#fff', marginBottom: 16,
                    display: 'flex', flexDirection: 'column', alignItems: 'center'
                }}>
                    {/* 홈팀 VS 원정팀 칩 */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                        <span style={{
                            background: 'rgba(255,255,255,0.2)', color: '#fff',
                            padding: '4px 14px', borderRadius: 20, fontSize: 13, fontWeight: 700,
                        }}>
                            {post.homeTeamName}
                        </span>
                        <span style={{ fontSize: 14, fontWeight: 800, opacity: 0.8 }}>VS</span>
                        <span style={{
                            background: 'rgba(255,255,255,0.2)', color: '#fff',
                            padding: '4px 14px', borderRadius: 20, fontSize: 13, fontWeight: 700,
                        }}>
                            {post.awayTeamName}
                        </span>
                    </div>

                    {/* 제목 */}
                    <div style={{
                        textAlign: 'center', fontSize: 18, fontWeight: 800,
                        marginBottom: 14, wordBreak: 'keep-all', lineHeight: 1.4
                    }}>
                        {post.title}
                    </div>

                    {/* 경기장 + 날짜 */}
                    <div style={{
                        display: 'flex', justifyContent: 'center', gap: 14,
                        fontSize: 13, opacity: 0.9, flexWrap: 'wrap',
                    }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            🏟️ {post.stadium || '경기장 미정'}
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            📅 {post.matchDate}
                        </span>
                        {post.matchTime && (
                            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                🕒 {post.matchTime}
                            </span>
                        )}
                    </div>
                </div>

                {/* ── 모집 현황 카드 ── */}
                <div style={{
                    background: '#fff', borderRadius: 12, padding: 16,
                    marginBottom: 12, border: '1px solid #eee',
                }}>
                    <div style={{
                        display: 'flex', alignItems: 'center',
                        justifyContent: 'space-between', marginBottom: 10,
                    }}>
                        <StatusBadge status={post.status} />
                        <span style={{ fontSize: 13, color: '#e94560', fontWeight: 700 }}>
                            👤 {post.currentCount || 0} / {post.maxParticipants}명
                        </span>
                    </div>

                    {/* 인원 진행 바 */}
                    <div style={{ height: 8, background: '#f0f0f0', borderRadius: 999, overflow: 'hidden' }}>
                        <div style={{
                            height: '100%',
                            width: `${((post.currentCount || 0) / post.maxParticipants) * 100}%`,
                            background: isFull ? '#ef4444' : '#e94560',
                            borderRadius: 999,
                            transition: 'width 0.4s ease',
                        }} />
                    </div>
                </div>

                {/* ── 탭 ── */}
                <div style={{
                    display: 'flex', background: '#fff',
                    borderRadius: 12, border: '1px solid #eee',
                    marginBottom: 12, overflow: 'hidden',
                }}>
                    {[
                        { key: 'info', label: '📋 모집 정보' },
                        { key: 'apply', label: applyTabLabel },
                    ].map(({ key, label }) => (
                        <button
                            key={key}
                            onClick={() => setTab(key)}
                            style={{
                                flex: 1, padding: '12px 0',
                                background: 'none', border: 'none',
                                borderBottom: tab === key ? '2px solid #e94560' : '2px solid transparent',
                                fontSize: 14, fontWeight: 700,
                                color: tab === key ? '#e94560' : '#999',
                                cursor: 'pointer', fontFamily: 'inherit',
                                transition: 'color 0.15s',
                            }}
                        >
                            {label}
                        </button>
                    ))}
                </div>

                {/* ── 모집 정보 탭 ── */}
                {tab === 'info' && (
                    <>
                        {/* 상세 설명 */}
                        <div style={{
                            background: '#fff', borderRadius: 12, padding: 16,
                            marginBottom: 12, border: '1px solid #eee',
                        }}>
                            <div style={{ fontSize: 13, fontWeight: 700, color: '#1a2a4a', marginBottom: 8 }}>
                                📋 상세 설명
                            </div>
                            <div style={{ fontSize: 13, color: '#666', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                                {post.content}
                            </div>
                        </div>

                        {/* 경기 정보 그리드 */}
                        <div style={{
                            background: '#fff', borderRadius: 12, padding: 16,
                            marginBottom: 12, border: '1px solid #eee',
                        }}>
                            <div style={{ fontSize: 13, fontWeight: 700, color: '#1a2a4a', marginBottom: 12 }}>
                                🏟️ 경기 정보
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                                {[
                                    ['홈팀', post.homeTeamName],
                                    ['원정팀', post.awayTeamName],
                                    ['경기장', post.stadium || '미정'],
                                    ['날짜', post.matchDate],
                                    ...(post.matchTime ? [['시간', post.matchTime]] : []),
                                ].map(([label, val]) => (
                                    <div key={label} style={{
                                        background: '#f9f9f9', borderRadius: 10, padding: 12,
                                    }}>
                                        <div style={{ fontSize: 11, color: '#aaa', fontWeight: 500, marginBottom: 4, textTransform: 'uppercase' }}>
                                            {label}
                                        </div>
                                        <div style={{ fontSize: 14, fontWeight: 700, color: '#1a2a4a' }}>{val}</div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* 작성자 */}
                        <div style={{
                            background: '#fff', borderRadius: 12, padding: 16,
                            marginBottom: 12, border: '1px solid #eee',
                        }}>
                            <div style={{ fontSize: 13, fontWeight: 700, color: '#1a2a4a', marginBottom: 12 }}>
                                ✍️ 작성자
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <div style={{
                                    width: 44, height: 44, borderRadius: '50%',
                                    background: 'linear-gradient(135deg, #1a2a4a, #e94560)',
                                    color: '#fff', display: 'flex', alignItems: 'center',
                                    justifyContent: 'center', fontWeight: 700, fontSize: 18,
                                    flexShrink: 0, boxShadow: '0 0 0 3px #e9456040',
                                }}>
                                    {post.authorNickname?.substring(0, 1)}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: 15, fontWeight: 700, color: '#1a2a4a', marginBottom: 4 }}>
                                        {post.authorNickname}
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <TeamBadge teamId={post.teamName || 'LG'} />
                                        <span style={{ fontSize: 12, color: '#bbb' }}>
                                            {post.createdAt?.slice(0, 10)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </>
                )}

                {/* ── 신청 현황 탭 ── */}
                {tab === 'apply' && (
                    <>
                        {/* 작성자: 신청자 목록 */}
                        {isAuthor && (
                            <ApplicationList
                                applications={applications}
                                onAccept={handleAccept}
                                onReject={handleReject}
                            />
                        )}

                        {/* 비작성자 + 신청 내역 있음 */}
                        {!isAuthor && myApplication && (
                            <MyApplicationStatus
                                application={myApplication}
                                onCancel={handleCancelApply}
                            />
                        )}

                        {/* 비작성자 + 신청 내역 없음 */}
                        {!isAuthor && !myApplication && (
                            <div style={{
                                background: '#fff', borderRadius: 12, padding: '40px 16px',
                                border: '1px solid #eee', textAlign: 'center',
                            }}>
                                <div style={{ fontSize: 32, marginBottom: 12 }}>⚾</div>
                                <div style={{ fontSize: 15, fontWeight: 700, color: '#1a2a4a', marginBottom: 6 }}>
                                    아직 신청하지 않았어요
                                </div>
                                <div style={{ fontSize: 13, color: '#999' }}>
                                    하단의 신청하기 버튼을 눌러보세요!
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* ── 하단 고정: 신청 버튼 (비작성자 & 모집중 & 미신청) ── */}
            {!isAuthor && post.status === 'OPEN' && !myApplication && (
                <div style={{
                    position: "fixed",
                    bottom: 80, // 바닥에서 살짝 띄움
                    left: "50%",
                    transform: "translateX(-50%)", // 화면 가로 중앙 정렬
                    padding: "8px 16px",
                    background: "#fff",
                    borderRadius: "20px", // 배경 테두리 둥글게
                    border: "1px solid #eee",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.1)", // 떠 있는 느낌의 그림자
                    zIndex: 100,
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    width: "fit-content" // 내용 크기에 맞춤
                }}>
                    <button
                        onClick={() => {
                            if (!user) {
                                alert('로그인 후 이용 가능합니다.');
                                return;
                            }
                            setIsApplyModalOpen(true);
                        }}
                        style={{
                            padding: "12px 32px",
                            background: '#e94560',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '12px',
                            fontWeight: 700,
                            fontSize: 16,
                            cursor: 'pointer',
                            fontFamily: 'inherit',
                            whiteSpace: "nowrap"
                        }}
                    >
                        ⚾ 직관 메이트 신청하기
                    </button>
                </div>
            )}

            {/* ── 하단 고정: 마감 안내 ── */}
            {post.status === 'CLOSED' && (
                <div style={{
                    position: "fixed",
                    bottom: 80,
                    left: "50%",
                    transform: "translateX(-50%)",
                    padding: "8px 16px",
                    background: "#fff",
                    borderRadius: "20px",
                    border: "1px solid #eee",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                    zIndex: 100,
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    width: "fit-content"
                }}>
                    <div style={{
                        padding: "12px 32px",
                        background: '#f5f5f5',
                        color: '#aaa',
                        borderRadius: '12px',
                        fontWeight: 700,
                        fontSize: 15,
                        textAlign: 'center',
                        whiteSpace: "nowrap"
                    }}>
                        모집이 마감되었습니다
                    </div>
                </div>
            )}

            {/* ── ApplyModal ── */}
            {isApplyModalOpen && (
                <ApplyModal
                    post={post}
                    onClose={() => setIsApplyModalOpen(false)}
                    onSubmit={handleApply}
                />
            )}
        </div>
    )
}
