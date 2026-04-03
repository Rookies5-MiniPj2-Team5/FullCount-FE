import { useEffect, useState } from 'react';
import ApplyModal from '../components/ApplyModal';
import { StatusBadge } from '../components/StatusBadge';
import { TeamBadge } from '../components/TeamComponents';
import { createOrGetMeetupGroupJoinRoom, fetchChatRoomDetail } from '../api/chat';
import { applyMeetupMate, getMeetupMateMembers, getMeetupPost } from '../api/meetup';
import { useAuth } from '../context/AuthContext';

const AUTHOR_TEAM_MAP = {
  'LG 트윈스': 'LG',
  '두산 베어스': 'DU',
  'SSG 랜더스': 'SSG',
  'KIA 타이거즈': 'KIA',
  '삼성 라이온즈': 'SA',
  '롯데 자이언츠': 'LO',
  '한화 이글스': 'HH',
  'KT 위즈': 'KT',
  'NC 다이노스': 'NC',
  '키움 히어로즈': 'WO',
};

const unwrapResponseData = (responseData) => {
  if (responseData && typeof responseData === 'object' && 'data' in responseData) {
    return responseData.data;
  }
  return responseData;
};

const normalizePost = (post) => {
  if (!post) return post;

  return {
    ...post,
    currentParticipants: Number(post.currentParticipants) || 0,
    maxParticipants: Number(post.maxParticipants) || 0,
  };
};

const extractChatRoomId = (room) =>
  room?.chatRoomId ?? room?.roomId ?? room?.id ?? null;

const getAuthorTeamCode = (authorTeam) => {
  if (!authorTeam) return 'LG';
  if (AUTHOR_TEAM_MAP[authorTeam]) return AUTHOR_TEAM_MAP[authorTeam];

  const matchedEntry = Object.entries(AUTHOR_TEAM_MAP).find(([teamName]) =>
    authorTeam.includes(teamName.split(' ')[0]),
  );

  return matchedEntry?.[1] || 'LG';
};

function MemberCard({ member }) {
  const avatarLabel = member.nickname?.substring(0, 1) || '?';

  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 0', borderBottom: '1px solid #f5f5f5' }}>
      <div
        style={{
          width: 38,
          height: 38,
          borderRadius: '50%',
          background: '#1a2a4a',
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 700,
          fontSize: 15,
          flexShrink: 0,
          overflow: 'hidden',
        }}
      >
        {member.profileImage ? (
          <img src={member.profileImage} alt={member.nickname} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          avatarLabel
        )}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#1a2a4a' }}>{member.nickname}</div>
          {member.isLeader && (
            <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 999, background: '#fff0f3', color: '#e94560' }}>
              작성자
            </span>
          )}
          {typeof member.mannerTemperature === 'number' && (
            <span style={{ fontSize: 12, color: '#777' }}>
              매너온도 {member.mannerTemperature.toFixed(1)}
            </span>
          )}
        </div>

        {member.applyMessage && (
          <div style={{ fontSize: 12, color: '#666', lineHeight: 1.6, whiteSpace: 'pre-wrap', wordBreak: 'keep-all' }}>
            {member.applyMessage}
          </div>
        )}
      </div>
    </div>
  );
}

export default function MeetupDetailPage({ postId, onBack, onOpenChat }) {
  const { user } = useAuth();

  const [post, setPost] = useState(null);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [membersLoading, setMembersLoading] = useState(false);
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [tab, setTab] = useState('info');
  const [groupChatRoomId, setGroupChatRoomId] = useState(null);
  const [chatRoomLoading, setChatRoomLoading] = useState(false);

  const isAuthor = user?.nickname === post?.authorNickname;
  const currentParticipants = post?.currentParticipants || 0;
  const maxParticipants = post?.maxParticipants || 0;
  const isFull = maxParticipants > 0 && currentParticipants >= maxParticipants;
  const authorTeamCode = getAuthorTeamCode(post?.authorTeam);
  const myMemberInfo = members.find((member) => member.nickname === user?.nickname) || null;
  const progressRatio = maxParticipants > 0 ? Math.min(currentParticipants / maxParticipants, 1) : 0;

  const chatButtonVisible = isFull;
  const chatButtonLabel = chatRoomLoading
    ? '처리 중...'
    : groupChatRoomId
      ? '그룹 채팅방 입장'
      : '그룹 채팅방 생성';

  const fetchPost = async () => {
    try {
      setLoading(true);
      const res = await getMeetupPost(postId);
      const data = normalizePost(unwrapResponseData(res.data));
      setPost(data);
      if (data?.chatRoomId) {
        setGroupChatRoomId(data.chatRoomId);
      }
    } catch (error) {
      console.error('게시글 상세 조회 실패:', error);
      alert('게시글을 불러오지 못했습니다.');
      onBack();
    } finally {
      setLoading(false);
    }
  };

  const fetchMembers = async () => {
    try {
      setMembersLoading(true);
      const res = await getMeetupMateMembers(postId);
      const data = unwrapResponseData(res.data);
      setMembers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('참여 멤버 조회 실패:', error);
      setMembers([]);
    } finally {
      setMembersLoading(false);
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

            {!isAuthor && myMemberInfo && (
              <div style={{ borderRadius: 12, padding: 14, marginBottom: 12, border: '1px solid #ddd', background: '#fafafa' }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#333', marginBottom: 8 }}>내 신청 현황</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#1a2a4a', marginBottom: 4 }}>{myMemberInfo.nickname}</div>
                {myMemberInfo.applyMessage && (
                  <div style={{ fontSize: 12, color: '#666', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{myMemberInfo.applyMessage}</div>
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
