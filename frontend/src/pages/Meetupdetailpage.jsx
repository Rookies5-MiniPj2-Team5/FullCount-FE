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
import { createOrGetMeetupDmRoom, createOrGetDmByNickname } from '../api/chat'

export default function MeetupDetailPage({ postId, onBack, onOpenChat }) {
    const id = postId
    const { user } = useAuth()

    const [post, setPost] = useState(null)
    const [applications, setApplications] = useState([])
    const [myApplication, setMyApplication] = useState(null)
    const [loading, setLoading] = useState(true)
    const [isApplyModalOpen, setIsApplyModalOpen] = useState(false)
    const [tab, setTab] = useState('info') // 'info' | 'apply'

    const isAuthor = !!user && !!post && user.nickname === post.authorNickname

    const handleOpenDm = async () => {
        if (!user) {
            alert('로그인이 필요합니다.')
            return
        }

        console.log('Initiating DM with Post:', {
            postId: post?.id,
            authorId: post?.authorId,
            authorNickname: post?.authorNickname,
        })

        if (!post?.id) {
            alert('게시글 정보를 불러오는 중입니다. 잠시 후 다시 시도해주세요.')
            return
        }

        try {
            let room;

            if (post?.authorId) {
                // authorId가 있으면 meetup 전용 엔드포인트 사용
                room = await createOrGetMeetupDmRoom(post.id, post.authorId);
            } else if (post?.authorNickname) {
                // authorId 없으면 닉네임으로 조회 (공통 유틸)
                console.warn('authorId 없음 - 닉네임으로 DM 생성 시도:', post.authorNickname)
                room = await createOrGetDmByNickname(post.authorNickname)
            } else {
                alert('작성자 정보를 찾을 수 없습니다.')
                return
            }

            const roomId = room?.chatRoomId || room?.id;
            if (!roomId) throw new Error('채팅방 ID가 응답에 없습니다. 응답: ' + JSON.stringify(room))

            onOpenChat?.({
                id: roomId,
                roomType: 'ONE_ON_ONE_DIRECT',
                title: post.authorNickname,
                isDm: true,
                dmTargetNickname: post.authorNickname,
            })
        } catch (err) {
            console.error('채팅방 생성 실패:', err)
            alert('채팅방을 열 수 없습니다.')
        }
    }

    // ── 데이터 조회 ───────────────────────────────────
    const fetchPost = async () => {
        try {
            setLoading(true)
            const res = await getMeetupPost(id)
            // BE: { success: true, data: { ... } } or { ... }
            const postData = res.data?.data || res.data;
            // ✅ 전체 응답 로깅 - 실제 필드명 확인용
            console.log('[MeetupDetail] 게시글 전체 데이터:', postData);
            setPost(postData)
        } catch (err) {
            console.error('게시글 로딩 실패:', err)
            alert('게시글을 불러오지 못했습니다.')
            onBack()
        } finally {
            setLoading(false)
        }
    }

    const fetchApplications = async () => {
        try {
            const res = await getApplications(id)
            setApplications(res.data?.data || res.data || [])
        } catch (err) {
            console.error('신청자 목록 로딩 실패:', err)
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
        if (isAuthor && post?.id) fetchApplications()
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
  };

  useEffect(() => {
    fetchPost();
    fetchMembers();
  }, [postId]);

  useEffect(() => {
    if (tab !== 'apply') return;
    fetchMembers();
  }, [tab, postId]);

  const handleApply = async (applyMessage) => {
    try {
      await applyMeetupMate(postId, applyMessage);
      alert('신청이 완료되었습니다.');
      setIsApplyModalOpen(false);
      await Promise.all([fetchPost(), fetchMembers()]);
      setTab('apply');
    } catch (error) {
      console.error('메이트 신청 실패:', error);
      const backendMessage =
        error?.response?.data?.message ||
        error?.response?.data?.error?.message ||
        error?.response?.data?.data?.message;
      alert(backendMessage || '신청에 실패했습니다.');
    }
  };

  const handleOpenDm = () => {
    if (!user) {
      alert('로그인이 필요합니다.');
      return;
    }

    if (onOpenChat && post?.authorNickname) {
      onOpenChat({
        id: `dm-${[user.nickname, post.authorNickname].sort().join('-')}`,
        postId: post?.id,
        roomType: 'ONE_ON_ONE',
        title: post.authorNickname,
        dmTargetNickname: post.authorNickname,
        lastMessage: '',
        lastMessageAt: new Date().toISOString(),
        unreadCount: 0,
      });
    }
  };

  const openGroupChat = (roomId, detailData) => {
    onOpenChat?.({
      id: roomId,
      postId,
      roomType: detailData?.roomType || detailData?.chatRoomType || 'GROUP_JOIN',
      title: detailData?.title || post?.title,
      crewTeam: post?.authorTeam,
      participants: detailData?.participants || [],
    });
  };

  const handleChatRoomButton = async () => {
    if (!chatButtonVisible || chatRoomLoading) return;

    try {
      setChatRoomLoading(true);

      const createRes = await createOrGetMeetupGroupJoinRoom(postId);
      const roomData = unwrapResponseData(createRes?.data);
      const targetRoomId = extractChatRoomId(roomData);

      if (!targetRoomId) {
        throw new Error('채팅방 ID가 없습니다.');
      }

      const detailRes = await fetchChatRoomDetail(targetRoomId);
      const detailData = unwrapResponseData(detailRes.data);

      setGroupChatRoomId(targetRoomId);
      openGroupChat(targetRoomId, detailData);
    } catch (error) {
      console.error('그룹 채팅방 처리 실패:', error);
      alert(error?.response?.data?.message || '채팅방 처리에 실패했습니다.');
    } finally {
      setChatRoomLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', flexDirection: 'column', gap: 12 }}>
        <div style={{ fontSize: 32 }}>⏳</div>
        <p style={{ color: '#999', fontSize: 14 }}>로딩 중...</p>
      </div>
    );
  }

  if (!post) return null;

  const applyTabLabel = isAuthor ? `신청 목록 (${members.length})` : '내 신청 현황';

  return (
    <div>
      <div className="top-bar" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', padding: 0 }}>←</button>
        <h1 style={{ fontSize: 18, margin: 0 }}>모집글 상세</h1>
      </div>

      <div className="page-content" style={{ paddingBottom: 120 }}>
        <div style={{ background: 'linear-gradient(135deg, #1a2a4a 0%, #e94560 100%)', borderRadius: 16, padding: '24px 20px', color: '#fff', marginBottom: 16, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <span style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', padding: '4px 14px', borderRadius: 20, fontSize: 13, fontWeight: 700 }}>{post.homeTeamName}</span>
            <span style={{ fontSize: 14, fontWeight: 800, opacity: 0.8 }}>VS</span>
            <span style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', padding: '4px 14px', borderRadius: 20, fontSize: 13, fontWeight: 700 }}>{post.awayTeamName}</span>
          </div>
          <div style={{ textAlign: 'center', fontSize: 18, fontWeight: 800, marginBottom: 14, wordBreak: 'keep-all', lineHeight: 1.4 }}>{post.title}</div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 14, fontSize: 13, opacity: 0.9, flexWrap: 'wrap' }}>
            <span>📍 {post.stadium || '경기장 미정'}</span>
            <span>📅 {post.matchDate}</span>
            {post.matchTime && <span>⏰ {post.matchTime}</span>}
          </div>
        </div>

        <div style={{ background: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, border: '1px solid #eee' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <StatusBadge status={post.status} />
            <span style={{ fontSize: 13, color: '#e94560', fontWeight: 700 }}>
              👥 {currentParticipants} / {maxParticipants > 0 ? maxParticipants : '?'}명
            </span>
          </div>
          <div style={{ height: 8, background: '#f0f0f0', borderRadius: 999, overflow: 'hidden', marginBottom: 10 }}>
            <div
              style={{
                height: '100%',
                width: `${progressRatio * 100}%`,
                background: isFull ? '#ef4444' : '#e94560',
                borderRadius: 999,
                transition: 'width 0.4s ease',
              }}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#999' }}>
            <span>조회수 {post.viewCount ?? 0}</span>
            <span>{post.createdAt?.slice(0, 10)}</span>
          </div>
        </div>

        <div style={{ display: 'flex', background: '#fff', borderRadius: 12, border: '1px solid #eee', marginBottom: 12, overflow: 'hidden' }}>
          {[{ key: 'info', label: '모집 정보' }, { key: 'apply', label: applyTabLabel }].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              style={{ flex: 1, padding: '12px 0', background: 'none', border: 'none', borderBottom: tab === key ? '2px solid #e94560' : '2px solid transparent', fontSize: 14, fontWeight: 700, color: tab === key ? '#e94560' : '#999', cursor: 'pointer', fontFamily: 'inherit' }}
            >
              {label}
            </button>
          ))}
        </div>

        {tab === 'info' && (
          <>
            <div style={{ background: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, border: '1px solid #eee' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#1a2a4a', marginBottom: 8 }}>상세 설명</div>
              <div style={{ fontSize: 13, color: '#666', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{post.content}</div>
            </div>

            <div style={{ background: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, border: '1px solid #eee' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#1a2a4a', marginBottom: 12 }}>경기 정보</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {[
                  ['홈팀', post.homeTeamName],
                  ['원정팀', post.awayTeamName],
                  ['경기장', post.stadium || '미정'],
                  ['날짜', post.matchDate],
                  ...(post.matchTime ? [['시간', post.matchTime]] : []),
                ].map(([label, value]) => (
                  <div key={label} style={{ background: '#f9f9f9', borderRadius: 10, padding: 12 }}>
                    <div style={{ fontSize: 11, color: '#aaa', fontWeight: 500, marginBottom: 4 }}>{label}</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#1a2a4a' }}>{value}</div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ background: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, border: '1px solid #eee' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#1a2a4a', marginBottom: 12 }}>작성자</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div
                  onClick={handleOpenDm}
                  style={{ width: 44, height: 44, borderRadius: '50%', background: 'linear-gradient(135deg, #1a2a4a, #e94560)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 18, flexShrink: 0, boxShadow: '0 0 0 3px #e9456040', overflow: 'hidden', cursor: 'pointer' }}
                >
                  {post.profileImage ? (
                    <img src={post.profileImage} alt={post.authorNickname} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    post.authorNickname?.substring(0, 1)
                  )}
                </div>
                <div style={{ flex: 1, cursor: 'pointer' }} onClick={handleOpenDm}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#1a2a4a', marginBottom: 4 }}>{post.authorNickname}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <TeamBadge teamId={authorTeamCode} />
                    <span style={{ fontSize: 12, color: '#777' }}>{post.authorTeam}</span>
                    <span style={{ fontSize: 12, color: '#bbb' }}>{post.createdAt?.slice(0, 10)}</span>
                    <span style={{ fontSize: 12, color: '#bbb' }}>조회 {post.viewCount ?? 0}</span>
                  </div>
                </div>
                {!isAuthor && (
                  <button onClick={handleOpenDm} style={{ padding: '8px 14px', borderRadius: 10, background: '#f5f5f5', border: '1px solid #eee', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                    1:1 문의
                  </button>
                )}
              </div>
            </div>
          </>
        )}

        {tab === 'apply' && (
          <>
            {chatButtonVisible && (
              <div style={{ background: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, border: '1px solid #eee' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#1a2a4a', marginBottom: 4 }}>그룹 채팅방</div>
                    <div style={{ fontSize: 12, color: '#888' }}>
                      모집 인원이 모두 차면 채팅방에 입장할 수 있습니다.
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleChatRoomButton}
                    disabled={!isFull || chatRoomLoading}
                    style={{ padding: '10px 14px', background: isFull && !chatRoomLoading ? '#e94560' : '#ccc', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 700, cursor: isFull && !chatRoomLoading ? 'pointer' : 'not-allowed', opacity: isFull && !chatRoomLoading ? 1 : 0.8, whiteSpace: 'nowrap', minWidth: 120 }}
                  >
                    {chatButtonLabel}
                  </button>
                </div>
              </div>
            )}

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
                                <div 
                                    onClick={handleOpenDm}
                                    style={{
                                        width: 44, height: 44, borderRadius: '50%',
                                        background: 'linear-gradient(135deg, #1a2a4a, #e94560)',
                                        color: '#fff', display: 'flex', alignItems: 'center',
                                        justifyContent: 'center', fontWeight: 700, fontSize: 18,
                                        flexShrink: 0, boxShadow: '0 0 0 3px #e9456040',
                                    }}>
                                    {post.authorNickname?.substring(0, 1)}
                                </div>
                                <div 
                                    style={{ flex: 1 }}
                                >
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
                                {!isAuthor && (
                                    <button 
                                        onClick={handleOpenDm}
                                        style={{ 
                                            padding: "8px 14px", borderRadius: 10, background: "#f5f5f5", 
                                            border: "1px solid #eee", fontSize: 13, fontWeight: 700, cursor: "pointer" 
                                        }}
                                    >
                                        💬 1:1 채팅으로 문의하기
                                    </button>
                                )}
                            </div>
                        </div>
                    </>
                )}
              </div>
            )}

            {membersLoading && (
              <div style={{ background: '#fff', borderRadius: 12, padding: '24px 16px', border: '1px solid #eee', textAlign: 'center', color: '#999', marginBottom: 12 }}>
                참여 멤버를 불러오는 중입니다.
              </div>
            )}

            {!membersLoading && members.length > 0 && (
              <div style={{ background: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, border: '1px solid #eee' }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#1a2a4a', marginBottom: 12 }}>참여 멤버 목록 ({members.length}명)</div>
                {members.map((member, index) => (
                  <MemberCard key={`${member.nickname}-${index}`} member={member} />
                ))}
              </div>
            )}

            {!membersLoading && isAuthor && members.length === 0 && (
              <div style={{ background: '#fff', borderRadius: 12, padding: '40px 16px', border: '1px solid #eee', textAlign: 'center' }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>📭</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#1a2a4a', marginBottom: 6 }}>아직 신청자가 없어요</div>
                <div style={{ fontSize: 13, color: '#999' }}>신청 멤버가 생기면 여기에서 바로 확인할 수 있습니다.</div>
              </div>
            )}

            {!membersLoading && !isAuthor && !myMemberInfo && (
              <div style={{ background: '#fff', borderRadius: 12, padding: '40px 16px', border: '1px solid #eee', textAlign: 'center' }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>📝</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#1a2a4a', marginBottom: 6 }}>아직 신청하지 않았어요</div>
                <div style={{ fontSize: 13, color: '#999' }}>하단의 신청 버튼을 눌러 메이트 신청을 진행해보세요.</div>
              </div>
            )}
          </>
        )}
      </div>

      {!isAuthor && post.status !== 'CLOSED' && (
        <div style={{ position: 'fixed', bottom: 80, left: '50%', transform: 'translateX(-50%)', padding: '8px 16px', background: '#fff', borderRadius: '20px', border: '1px solid #eee', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', zIndex: 100, display: 'flex', justifyContent: 'center', alignItems: 'center', width: 'fit-content' }}>
          <button
            onClick={() => {
              if (!user) {
                alert('로그인 후 이용 가능합니다.');
                return;
              }
              setIsApplyModalOpen(true);
            }}
            style={{ padding: '12px 32px', background: '#e94560', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 700, fontSize: 16, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}
          >
            직관 메이트 신청하기
          </button>
        </div>
      )}

      {post.status === 'CLOSED' && (
        <div style={{ position: 'fixed', bottom: 80, left: '50%', transform: 'translateX(-50%)', padding: '8px 16px', background: '#fff', borderRadius: '20px', border: '1px solid #eee', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', zIndex: 100 }}>
          <div style={{ padding: '12px 32px', background: '#f5f5f5', color: '#aaa', borderRadius: '12px', fontWeight: 700, fontSize: 15, textAlign: 'center', whiteSpace: 'nowrap' }}>
            모집이 마감되었습니다.
          </div>
        </div>
      )}

      {isApplyModalOpen && (
        <ApplyModal post={post} onClose={() => setIsApplyModalOpen(false)} onSubmit={handleApply} />
      )}
    </div>
  );
}
