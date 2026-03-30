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

    const isAuthor = user?.nickname === post?.authorNickname

    // 게시글 상세 조회
    const fetchPost = async () => {
        try {
            setLoading(true)
            // TODO: BE 연동 시 아래 코드로 교체
            // const res = await getMeetupPost(id)
            // setPost(res.data)

            // 임시 더미 데이터
            setPost({
                id: 1, title: '잠실 LG vs 두산 같이 보실분!', content: '같이 응원해요!',
                matchDate: '2026-04-05', homeTeamName: 'LG', awayTeamName: 'DU',
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

    // 신청자 목록 조회
    const fetchApplications = async () => {
        try {
            const res = await getApplications(id)
            setApplications(res.data)
        } catch {
            console.error('신청자 목록 로딩 실패')
        }
    }

    // 내 신청 상태 조회
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
        // TODO: BE 연동 시 아래 코드 주석 해제
        // if (user) fetchMyApplication()
    }, [id])

    useEffect(() => {
        // TODO: BE 연동 시 아래 코드 주석 해제
        // if (isAuthor) fetchApplications()
    }, [post, isAuthor])

    // 신청하기
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

    // 신청 취소
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

    // 수락
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

    // 거절
    const handleReject = async (applicationId) => {
        if (!window.confirm('거절하시겠습니까?')) return
        try {
            await rejectApplication(applicationId)
            fetchApplications()
        } catch {
            alert('거절에 실패했습니다.')
        }
    }

    if (loading) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', flexDirection: 'column', gap: 12 }}>
                <div style={{ fontSize: 32 }}>⚾</div>
                <p style={{ color: '#999', fontSize: 14 }}>로딩 중...</p>
            </div>
        )
    }

    if (!post) return null

    return (
        <div>
            {/* 상단 바 */}
            <div className="top-bar" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <button
                    onClick={onBack}
                    style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', padding: 0 }}
                >
                    ←
                </button>
                <h1 style={{ fontSize: 18, margin: 0 }}>모집글 상세</h1>
            </div>

            <div className="page-content" style={{ paddingBottom: 100 }}>

                {/* 경기 정보 배너 */}
                <div style={{
                    background: 'linear-gradient(135deg, #1a2a4a 0%, #e94560 100%)',
                    borderRadius: 16, padding: 20, color: '#fff', marginBottom: 16,
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, marginBottom: 12 }}>
                        <TeamBadge teamId={post.homeTeamName || 'LG'} />
                        <span style={{ fontSize: 18, fontWeight: 800 }}>VS</span>
                        <TeamBadge teamId={post.awayTeamName || 'DU'} />
                    </div>
                    <div style={{ textAlign: 'center', fontSize: 13, opacity: 0.85 }}>
                        📅 {post.matchDate}
                    </div>
                </div>

                {/* 모집 상태 & 제목 & 내용 */}
                <div style={{ background: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, border: '1px solid #eee' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                        <StatusBadge status={post.status} />
                        <span style={{ fontSize: 13, color: '#e94560', fontWeight: 700 }}>
                            👤 {post.currentCount || 0} / {post.maxParticipants}명
                        </span>
                    </div>
                    <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 8, color: '#1a2a4a' }}>{post.title}</div>
                    <div style={{ fontSize: 13, color: '#666', lineHeight: 1.6 }}>{post.content}</div>
                </div>

                {/* 작성자 정보 */}
                <div style={{ background: '#fff', borderRadius: 12, padding: 14, marginBottom: 12, border: '1px solid #eee', display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{
                        width: 40, height: 40, borderRadius: '50%',
                        background: 'linear-gradient(135deg, #1a2a4a, #e94560)',
                        color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: 700, fontSize: 16, flexShrink: 0
                    }}>
                        {post.authorNickname?.substring(0, 1)}
                    </div>
                    <div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: '#1a2a4a' }}>{post.authorNickname}</div>
                        <TeamBadge teamId={post.teamName || 'LG'} />
                    </div>
                    <div style={{ marginLeft: 'auto', fontSize: 12, color: '#bbb' }}>
                        {post.createdAt?.slice(0, 10)}
                    </div>
                </div>

                {/* 내 신청 상태 (비작성자) */}
                {!isAuthor && myApplication && (
                    <MyApplicationStatus
                        application={myApplication}
                        onCancel={handleCancelApply}
                    />
                )}

                {/* 신청자 목록 (작성자 전용) */}
                {isAuthor && (
                    <ApplicationList
                        applications={applications}
                        onAccept={handleAccept}
                        onReject={handleReject}
                    />
                )}
            </div>

            {/* 신청 버튼 (비작성자 & 모집중 & 미신청) */}
            {!isAuthor && post.status === 'OPEN' && !myApplication && (
                <div style={{
                    position: 'fixed', bottom: 60, left: 0, right: 0,
                    padding: '12px 16px', background: '#fff', borderTop: '1px solid #eee', zIndex: 100
                }}>
                    <button
                        onClick={() => setIsApplyModalOpen(true)}
                        style={{
                            width: '100%', padding: 14, background: '#e94560', color: '#fff',
                            border: 'none', borderRadius: 10, fontWeight: 700, fontSize: 16, cursor: 'pointer'
                        }}
                    >
                        ⚾ 직관 메이트 신청하기
                    </button>
                </div>
            )}

            {/* 모집 마감 안내 */}
            {post.status === 'CLOSED' && (
                <div style={{
                    position: 'fixed', bottom: 60, left: 0, right: 0,
                    padding: '12px 16px', background: '#fff', borderTop: '1px solid #eee', zIndex: 100
                }}>
                    <div style={{
                        width: '100%', padding: 14, background: '#f5f5f5', color: '#aaa',
                        borderRadius: 10, fontWeight: 700, fontSize: 15, textAlign: 'center'
                    }}>
                        모집이 마감되었습니다
                    </div>
                </div>
            )}

            {/* 신청 모달 */}
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