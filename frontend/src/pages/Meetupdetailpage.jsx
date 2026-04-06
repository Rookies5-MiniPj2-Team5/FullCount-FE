import { useEffect, useState } from 'react';
import ApplyModal from '../components/ApplyModal';
import { StatusBadge } from '../components/StatusBadge';
import { TeamBadge } from '../components/TeamComponents';
import { createOrGetMeetupGroupJoinRoom, fetchChatRoomDetail } from '../api/chat';
import { applyMeetupMate, getMeetupMateMembers, getMeetupPost } from '../api/meetup';
import { useAuth } from '../context/AuthContext';

const AUTHOR_TEAM_MAP = {
  'LG 트윈스': 'LG', '두산 베어스': 'DU', 'SSG 랜더스': 'SSG', 'KIA 타이거즈': 'KIA',
  '삼성 라이온즈': 'SA', '롯데 자이언츠': 'LO', '한화 이글스': 'HH', 'KT 위즈': 'KT',
  'NC 다이노스': 'NC', '키움 히어로즈': 'WO',
};

const unwrapResponseData = (responseData) => {
  if (responseData && typeof responseData === 'object' && 'data' in responseData) return responseData.data;
  return responseData;
};

const normalizePost = (post) => ({
  ...post,
  currentParticipants: Number(post?.currentParticipants) || 0,
  maxParticipants: Number(post?.maxParticipants) || 0,
});

const extractChatRoomId = (room) => room?.chatRoomId ?? room?.roomId ?? room?.id ?? null;
const normalizeChatRoomId = (roomId) => (roomId == null ? null : Number(roomId));

const getAuthorTeamCode = (authorTeam) => {
  if (!authorTeam) return 'LG';
  if (AUTHOR_TEAM_MAP[authorTeam]) return AUTHOR_TEAM_MAP[authorTeam];
  const matchedEntry = Object.entries(AUTHOR_TEAM_MAP).find(([teamName]) => authorTeam.includes(teamName.split(' ')[0]));
  return matchedEntry?.[1] || 'LG';
};

function MemberCard({ member }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 0', borderBottom: '1px solid #f5f5f5' }}>
      <div style={{ width: 38, height: 38, borderRadius: '50%', background: '#1a2a4a', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 15, overflow: 'hidden' }}>
        {member.profileImage ? <img src={member.profileImage} alt={member.nickname} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : member.nickname?.substring(0, 1) || '?'}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#1a2a4a' }}>{member.nickname}</div>
          {member.isLeader && <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 999, background: '#fff0f3', color: '#e94560' }}>작성자</span>}
          {typeof member.mannerTemperature === 'number' && <span style={{ fontSize: 12, color: '#777' }}>매너온도 {member.mannerTemperature.toFixed(1)}</span>}
        </div>
        {member.applyMessage && <div style={{ fontSize: 12, color: '#666', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{member.applyMessage}</div>}
      </div>
    </div>
  );
}

export default function MeetupDetailPage({ postId, onBack, onOpenChat, onEdit, onDelete }) {
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
  const myMemberInfo = members.find((member) => member.nickname === user?.nickname) || null;
  const progressRatio = maxParticipants > 0 ? Math.min(currentParticipants / maxParticipants, 1) : 0;
  const authorTeamCode = getAuthorTeamCode(post?.authorTeam);

  const syncGroupChatRoom = async ({ openChat = false } = {}) => {
    const createRes = await createOrGetMeetupGroupJoinRoom(postId);
    const roomData = unwrapResponseData(createRes.data);
    const roomId = extractChatRoomId(roomData);

    if (!roomId) throw new Error('채팅방 ID가 없습니다.');

    const normalizedRoomId = normalizeChatRoomId(roomId);
    setGroupChatRoomId(normalizedRoomId);
    setPost((prev) => (prev ? { ...prev, chatRoomId: normalizedRoomId } : prev));

    if (!openChat) return normalizedRoomId;

    const detailRes = await fetchChatRoomDetail(normalizedRoomId);
    const detailData = unwrapResponseData(detailRes.data);
    onOpenChat?.({
      id: normalizedRoomId,
      postId,
      roomType: detailData?.roomType || detailData?.chatRoomType || 'GROUP_JOIN',
      title: detailData?.title || post?.title,
      crewTeam: post?.authorTeam,
    });

    return normalizedRoomId;
  };

  useEffect(() => {
    const fetchAll = async () => {
      try {
        setLoading(true);
        const [postRes, membersRes] = await Promise.all([ getMeetupPost(postId), getMeetupMateMembers(postId) ]);
        const postData = normalizePost(unwrapResponseData(postRes.data));
        const memberData = unwrapResponseData(membersRes.data);
        setPost(postData);
        setMembers(Array.isArray(memberData) ? memberData : []);
        if (postData?.chatRoomId) setGroupChatRoomId(normalizeChatRoomId(postData.chatRoomId));
      } catch (error) {
        alert('게시글을 불러오지 못했습니다.');
        onBack?.();
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [onBack, postId]);

  useEffect(() => {
    if (tab !== 'apply') return;
    setMembersLoading(true);
    getMeetupMateMembers(postId)
      .then((res) => { const data = unwrapResponseData(res.data); setMembers(Array.isArray(data) ? data : []); })
      .catch(() => setMembers([]))
      .finally(() => setMembersLoading(false));
  }, [postId, tab]);

  useEffect(() => {
    if (!post || !isFull || groupChatRoomId) return;

    syncGroupChatRoom().catch((error) => {
      console.error('Failed to ensure meetup group chat room', error);
    });
  }, [groupChatRoomId, isFull, post, postId]);

  const handleApply = async (applyMessage) => {
    try {
      await applyMeetupMate(postId, applyMessage);
      alert('신청이 완료되었습니다.');
      setIsApplyModalOpen(false);
      setTab('apply');
      const [postRes, membersRes] = await Promise.all([getMeetupPost(postId), getMeetupMateMembers(postId)]);
      const postData = normalizePost(unwrapResponseData(postRes.data));
      const memberData = unwrapResponseData(membersRes.data);
      setPost(postData);
      setMembers(Array.isArray(memberData) ? memberData : []);
      if (postData?.chatRoomId) {
        setGroupChatRoomId(normalizeChatRoomId(postData.chatRoomId));
      } else if (postData.maxParticipants > 0 && postData.currentParticipants >= postData.maxParticipants) {
        await syncGroupChatRoom();
      }
    } catch (error) {
      alert('신청에 실패했습니다.');
    }
  };

  const handleOpenGroupChat = async () => {
    if (!isFull || chatRoomLoading) return;
    try {
      setChatRoomLoading(true);
      await syncGroupChatRoom({ openChat: true });
      return;
      /*
      const createRes = await createOrGetMeetupGroupJoinRoom(postId);
      const roomData = unwrapResponseData(createRes.data);
      const roomId = extractChatRoomId(roomData);
      if (!roomId) throw new Error('채팅방 ID가 없습니다.');
      const detailRes = await fetchChatRoomDetail(roomId);
      const detailData = unwrapResponseData(detailRes.data);
      setGroupChatRoomId(roomId);
      onOpenChat?.({ id: roomId, postId, roomType: detailData?.roomType || detailData?.chatRoomType || 'GROUP_JOIN', title: detailData?.title || post?.title, crewTeam: post?.authorTeam });
      */
    } catch (error) {
      alert('채팅방 처리에 실패했습니다.');
    } finally {
      setChatRoomLoading(false);
    }
  };

  if (loading || !post) return <div style={{ textAlign: 'center', padding: 40 }}>로딩 중...</div>;

  return (
    <div>
      {/* Top Bar: CrewDetailPage와 동일한 스타일 및 버튼 구조 적용 */}
      <div className="top-bar" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button
            onClick={onBack}
            style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", padding: 0 }}
          >
            ←
          </button>
          <h1 style={{ fontSize: 18, margin: 0 }}>모집글 상세</h1>
        </div>

        {/* 작성자 본인일 경우 [수정] / [삭제] 버튼 노출 (CrewDetailPage 코드 이식) */}
        {isAuthor && (
          <div style={{ display: "flex", gap: "6px" }}>
            {onEdit && (
              <button
                onClick={() => onEdit(post)}
                style={{ padding: "6px 12px", borderRadius: "8px", background: "#f5f5f5", border: "1px solid #e1e1e1", fontSize: 13, fontWeight: 700, cursor: "pointer", color: "#333" }}
              >
                수정
              </button>
            )}
            {onDelete && (
              <button
                onClick={() => onDelete(post)}
                style={{ padding: "6px 12px", borderRadius: "8px", background: "#fff5f5", border: "1px solid #ffcccc", fontSize: 13, fontWeight: 700, cursor: "pointer", color: "#d32f2f" }}
              >
                삭제
              </button>
            )}
          </div>
        )}
      </div>

      <div className="page-content" style={{ paddingBottom: 120 }}>
        <div style={{ background: 'linear-gradient(135deg, #1a2a4a 0%, #e94560 100%)', borderRadius: 16, padding: '24px 20px', color: '#fff', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 12 }}>
            <span style={{ background: 'rgba(255,255,255,0.2)', padding: '4px 14px', borderRadius: 20, fontSize: 13, fontWeight: 700 }}>{post.homeTeamName}</span>
            <span style={{ fontSize: 14, fontWeight: 800 }}>VS</span>
            <span style={{ background: 'rgba(255,255,255,0.2)', padding: '4px 14px', borderRadius: 20, fontSize: 13, fontWeight: 700 }}>{post.awayTeamName}</span>
          </div>
          <div style={{ textAlign: 'center', fontSize: 18, fontWeight: 800, marginBottom: 14 }}>{post.title}</div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 14, fontSize: 13, flexWrap: 'wrap' }}>
            <span>📍 {post.stadium || '경기장 미정'}</span>
            <span>📅 {post.matchDate}</span>
            {post.matchTime && <span>⏰ {post.matchTime}</span>}
          </div>
        </div>

        <div style={{ background: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, border: '1px solid #eee' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <StatusBadge status={post.status} />
            <span style={{ fontSize: 13, color: '#e94560', fontWeight: 700 }}>👥 {currentParticipants} / {maxParticipants || '?'}명</span>
          </div>
          <div style={{ height: 8, background: '#f0f0f0', borderRadius: 999, overflow: 'hidden', marginBottom: 10 }}>
            <div style={{ height: '100%', width: `${progressRatio * 100}%`, background: isFull ? '#ef4444' : '#e94560', borderRadius: 999 }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#999' }}>
            <span>조회수 {post.viewCount ?? 0}</span>
            <span>{post.createdAt?.slice(0, 10)}</span>
          </div>
        </div>

        <div style={{ display: 'flex', background: '#fff', borderRadius: 12, border: '1px solid #eee', marginBottom: 12, overflow: 'hidden' }}>
          {[{ key: 'info', label: '모집 정보' }, { key: 'apply', label: isAuthor ? `신청 목록 (${members.length})` : '내 신청 현황' }].map(({ key, label }) => (
            <button key={key} onClick={() => setTab(key)} style={{ flex: 1, padding: '12px 0', background: 'none', border: 'none', borderBottom: tab === key ? '2px solid #e94560' : '2px solid transparent', fontSize: 14, fontWeight: 700, color: tab === key ? '#e94560' : '#999', cursor: 'pointer' }}>
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
              <div style={{ fontSize: 13, fontWeight: 700, color: '#1a2a4a', marginBottom: 12 }}>작성자</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'linear-gradient(135deg, #1a2a4a, #e94560)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 18 }}>
                  {post.authorNickname?.substring(0, 1)}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#1a2a4a', marginBottom: 4 }}>{post.authorNickname}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <TeamBadge teamId={authorTeamCode} />
                    <span style={{ fontSize: 12, color: '#777' }}>{post.authorTeam}</span>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {tab === 'apply' && (
          <>
            {isFull && (
              <div style={{ background: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, border: '1px solid #eee', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#1a2a4a', marginBottom: 4 }}>그룹 채팅방</div>
                  <div style={{ fontSize: 12, color: '#888' }}>모집 인원이 모두 차면 입장할 수 있습니다.</div>
                </div>
                <button type="button" onClick={handleOpenGroupChat} disabled={chatRoomLoading} style={{ padding: '10px 14px', background: chatRoomLoading ? '#ccc' : '#e94560', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 700, cursor: chatRoomLoading ? 'not-allowed' : 'pointer' }}>
                  {chatRoomLoading ? '처리 중...' : groupChatRoomId ? '그룹 채팅방 입장' : '그룹 채팅방 생성'}
                </button>
              </div>
            )}

            {!isAuthor && myMemberInfo && (
              <div style={{ borderRadius: 12, padding: 14, marginBottom: 12, border: '1px solid #ddd', background: '#fafafa' }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#333', marginBottom: 8 }}>내 신청 현황</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#1a2a4a', marginBottom: 4 }}>{myMemberInfo.nickname}</div>
                {myMemberInfo.applyMessage && <div style={{ fontSize: 12, color: '#666', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{myMemberInfo.applyMessage}</div>}
              </div>
            )}

            {membersLoading ? (
              <div style={{ background: '#fff', borderRadius: 12, padding: '24px 16px', border: '1px solid #eee', textAlign: 'center', color: '#999', marginBottom: 12 }}>참여 멤버를 불러오는 중입니다.</div>
            ) : members.length > 0 ? (
              <div style={{ background: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, border: '1px solid #eee' }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#1a2a4a', marginBottom: 12 }}>참여 멤버 목록 ({members.length}명)</div>
                {members.map((member, index) => <MemberCard key={`${member.nickname}-${index}`} member={member} />)}
              </div>
            ) : (
              <div style={{ background: '#fff', borderRadius: 12, padding: '40px 16px', border: '1px solid #eee', textAlign: 'center' }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#1a2a4a', marginBottom: 6 }}>{isAuthor ? '아직 신청자가 없어요' : '아직 신청하지 않았어요'}</div>
              </div>
            )}
          </>
        )}
      </div>

      {!isAuthor && post.status !== 'CLOSED' && (
        <div style={{ position: 'fixed', bottom: 80, left: '50%', transform: 'translateX(-50%)', padding: '8px 16px', background: '#fff', borderRadius: '20px', border: '1px solid #eee', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', zIndex: 100 }}>
          <button onClick={() => { if (!user) return alert('로그인 후 이용 가능합니다.'); setIsApplyModalOpen(true); }} style={{ padding: '12px 32px', background: '#e94560', color: '#fff', border: 'none', borderRadius: 12, fontWeight: 700, fontSize: 16, cursor: 'pointer' }}>
            직관 메이트 신청하기
          </button>
        </div>
      )}

      {isApplyModalOpen && <ApplyModal post={post} onClose={() => setIsApplyModalOpen(false)} onSubmit={handleApply} />}
    </div>
  );
}
