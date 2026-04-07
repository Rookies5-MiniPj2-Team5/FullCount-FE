import { useState, useEffect } from "react";
import { StatusBadge } from "../components/StatusBadge";
import ApplyModal from "../components/ApplyModal";
import api from "../api/api";

const BADGE_EMOJI = { ROOKIE: "🌱", PRO: "⚡", ALL_STAR: "⭐", LEGEND: "🏆" };

const TEAM_COLORS = {
  "두산": "#1a1748", "LG": "#C8102E", "SSG": "#CE0E2D",
  "키움": "#820024", "KT": "#1b1a1a", "삼성": "#074CA1",
  "한화": "#F37321", "NC": "#1D467A", "롯데": "#002561",
  "KIA": "#EA0029",
};

// ─── 멤버 아이템 컴포넌트 (기존 100% 유지) ───
function MemberItem({ member, onClick }) {
  return (
    <div 
      onClick={() => onClick?.(member.nickname)}
      style={{
        display: "flex", alignItems: "center", gap: 12, padding: "12px 0",
        borderBottom: "1px solid #f5f5f5", cursor: "pointer", transition: "background 0.2s",
      }}
      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#fcfcfc'; }}
      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
    >
      <div style={{
        width: 38, height: 38, borderRadius: "50%",
        background: "linear-gradient(135deg, #1a2a4a, #e94560)",
        color: "#fff", display: "flex", alignItems: "center",
        justifyContent: "center", fontWeight: 700, fontSize: 15, flexShrink: 0,
        boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
      }}>
        {member.nickname?.slice(0, 1)}
      </div>

      <div style={{ flex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: "#1a2a4a" }}>
            {member.nickname}
          </span>
          {member.isLeader && (
            <span style={{
              fontSize: 11, fontWeight: 700, color: "#e94560",
              background: "#fff0f3", border: "1px solid #e9456030",
              padding: "1px 7px", borderRadius: 20,
            }}>
              ⚾ 크루장
            </span>
          )}
        </div>
        <span style={{ fontSize: 12, color: "#999" }}>
          {BADGE_EMOJI[member.badgeLevel] || "🌱"} {member.badgeLevel || "ROOKIE"}
        </span>
      </div>

      <div style={{ textAlign: "center", flexShrink: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: "#e94560" }}>
          {member.mannerTemperature || 36.5}°
        </div>
        <div style={{ fontSize: 10, color: "#bbb" }}>매너</div>
      </div>
    </div>
  );
}

// ─── 메인 페이지 컴포넌트 ───
export default function CrewDetailPage({
  crew,
  currentUser,
  onBack,
  onOpenDmChat,
  onEdit,
  onDelete
}) {
  // ✅ [Hook 규칙] useState/useEffect를 모두 높은 후 조건부 반환 수행
  const currentUserId = currentUser?.nickname;

  const [tab, setTab] = useState("info");
  const [members, setMembers] = useState([]); 
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [applyDone, setApplyDone] = useState(false);
  const [loadingMembers, setLoadingMembers] = useState(false);

  const teamKey = crew?.supportTeamName?.split(' ')[0] || crew?.team?.split(' ')[0];
  const teamColor = TEAM_COLORS[teamKey] || "#e94560";

  const fetchMembers = async () => {
    setLoadingMembers(true);
    try {
      const res = await api.get(`/posts/${crew.id}/members`);
      setMembers(res.data.data);
    } catch (err) {
      console.error("멤버 목록 조회 실패:", err);
    } finally {
      setLoadingMembers(false);
    }
  };

  useEffect(() => {
    if (crew?.id) fetchMembers();
  }, [crew?.id]);

  const isAuthor = currentUser?.nickname === crew?.authorNickname;

  // ✅ [Hook 규칙 준수] 모든 Hook(useState, useEffect) 호출 이후에 조건부 반환
  if (!crew) return null;

  // 1. 크루 신청 함수
  const handleApply = async (message) => {
    try {
      await api.post(`/posts/${crew.id}/join`, { applyMessage: message });
      setApplyDone(true);
      setIsApplyModalOpen(false);
      fetchMembers(); 
    } catch (err) {
      alert(err.response?.data?.message || "신청에 실패했습니다. 이미 참여 중이거나 정원이 찼을 수 있습니다.");
    }
  };
  
  // 승인 처리 함수
  const handleApprove = async (targetMemberId) => {
    if (!targetMemberId) {
      alert("에러: 멤버 ID가 없습니다."); return;
    }
    try {
      await api.post(`/posts/${crew.id}/members/${targetMemberId}/approve`);
      alert("크루원으로 승인되었습니다!");
      fetchMembers();
    } catch (err) {
      alert(err.response?.data?.message || "승인에 실패했습니다.");
    }
  };

  // 거절 처리 함수
  const handleReject = async (targetMemberId) => {
    if (!targetMemberId) {
      alert("에러: 멤버 ID가 없습니다."); return;
    }
    if (!window.confirm("이 멤버의 신청을 거절하시겠습니까?")) return;
    try {
      await api.delete(`/posts/${crew.id}/members/${targetMemberId}/reject`);
      alert("신청이 거절되었습니다.");
      fetchMembers();
    } catch (err) {
      alert(err.response?.data?.message || "거절에 실패했습니다.");
    }
  };

  // 나가기 처리 함수
  const handleLeave = async () => {
    if (!window.confirm("정말 이 크루에서 나가시겠습니까?")) return;
    try {
      await api.delete(`/posts/${crew.id}/leave`);
      alert("크루에서 나갔습니다.");
      onBack(); // 나가기 후 목록으로 이동
    } catch (err) {
      alert(err.response?.data?.message || "나가기에 실패했습니다.");
    }
  };

  // 강제 퇴장 처리 함수
  const handleExpel = async (targetMemberId) => {
    if (!window.confirm("이 멤버를 정말 퇴장시키겠습니까?")) return;
    try {
      await api.delete(`/posts/${crew.id}/members/${targetMemberId}/expel`);
      alert("멤버를 퇴장시켰습니다.");
      fetchMembers();
    } catch (err) {
      alert(err.response?.data?.message || "퇴장 처리에 실패했습니다.");
    }
  };

  const approvedMembers = members.filter(m => m.isApproved !== false);
  const pendingMembers = members.filter(m => m.isApproved === false);

  const isUserInCrew = approvedMembers.some(m => m.nickname === currentUser?.nickname);
  const isPendingUser = pendingMembers.some(m => m.nickname === currentUser?.nickname);
  const currentParticipantsCount = approvedMembers.length;
  const isFull = currentParticipantsCount >= crew.maxParticipants;

  return (
    <div> 
      <div className="top-bar" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button
            onClick={onBack}
            style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", padding: 0 }}
          >
            ←
          </button>
          <h1 style={{ fontSize: 18, margin: 0 }}>크루 상세</h1>
        </div>

        {isAuthor && (
          <div style={{ display: "flex", gap: "6px" }}>
            {onEdit && (
              <button
                onClick={() => onEdit(crew)}
                style={{ padding: "6px 12px", borderRadius: "8px", background: "#f5f5f5", border: "1px solid #e1e1e1", fontSize: 13, fontWeight: 700, cursor: "pointer", color: "#333" }}
              >
                수정
              </button>
            )}
            {onDelete && (
              <button
                onClick={() => onDelete(crew)}
                style={{ padding: "6px 12px", borderRadius: "8px", background: "#fff5f5", border: "1px solid #ffcccc", fontSize: 13, fontWeight: 700, cursor: "pointer", color: "#d32f2f" }}
              >
                삭제
              </button>
            )}
          </div>
        )}
      </div>

      <div className="page-content" style={{ paddingBottom: 120 }}>
        <div style={{
          background: "linear-gradient(135deg, #1a2a4a 0%, #e94560 100%)",
          borderRadius: 16, padding: 20, color: "#fff", marginBottom: 16,
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
            <span style={{
              background: "rgba(255,255,255,0.2)", color: "#fff",
              padding: "4px 14px", borderRadius: 20, fontSize: 14, fontWeight: 700,
            }}>
              {crew.supportTeamName || crew.team}
            </span>
          </div>
          <div style={{ textAlign: "center", fontSize: 18, fontWeight: 800, marginBottom: 10 }}>
            {crew.title}
          </div>
          <div style={{ display: "flex", justifyContent: "center", gap: 16, fontSize: 13, opacity: 0.85, flexWrap: "wrap" }}>
            <span>🏟️ {crew.stadium}</span>
            <span>📅 {crew.matchDate}</span>
            {crew.matchTime && <span>🕐 {crew.matchTime}</span>}
          </div>
        </div>

        {/* 인원수 표시 바 */}
        <div style={{ background: "#fff", borderRadius: 12, padding: 16, marginBottom: 12, border: "1px solid #eee" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <StatusBadge status={crew.status} />
            <span style={{ fontSize: 13, color: "#e94560", fontWeight: 700 }}>
              👤 {currentParticipantsCount} / {crew.maxParticipants}명
            </span>
          </div>
          <div style={{ height: 8, background: "#f0f0f0", borderRadius: 999, overflow: "hidden" }}>
            <div style={{
              height: "100%",
              width: `${(currentParticipantsCount / crew.maxParticipants) * 100}%`,
              background: isFull ? "#ef4444" : teamColor,
              borderRadius: 999,
              transition: "width 0.4s ease",
            }} />
          </div>
        </div>

        <div style={{ display: "flex", background: "#fff", borderRadius: 12, border: "1px solid #eee", marginBottom: 12, overflow: "hidden" }}>
          {[
            { key: "info", label: "📋 직관 정보" },
            { key: "members", label: `👥 멤버 (${currentParticipantsCount})` },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              style={{
                flex: 1, padding: "12px 0",
                background: "none", border: "none",
                borderBottom: tab === key ? `2px solid ${teamColor}` : "2px solid transparent",
                fontSize: 14, fontWeight: 700,
                color: tab === key ? teamColor : "#999",
                cursor: "pointer", fontFamily: "inherit",
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {tab === "info" && (
          <>
            <div style={{ background: "#fff", borderRadius: 12, padding: 16, marginBottom: 12, border: "1px solid #eee" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#1a2a4a", marginBottom: 8 }}>📋 크루 소개</div>
              <div style={{ fontSize: 13, color: "#666", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{crew.content || crew.description}</div>
              {crew.tags?.length > 0 && (
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 10 }}>
                  {crew.tags.map((t) => (
                    <span key={t} style={{ fontSize: 11, color: "#888", background: "#f5f5f5", padding: "3px 10px", borderRadius: 20 }}>#{t}</span>
                  ))}
                </div>
              )}
            </div>

            <div style={{ background: "#fff", borderRadius: 12, padding: 16, border: "1px solid #eee" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#1a2a4a", marginBottom: 12 }}>⚾ 크루장</div>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div 
                  style={{ 
                    width: 44, height: 44, borderRadius: "50%", 
                    background: "linear-gradient(135deg, #1a2a4a, #e94560)", 
                    color: "#fff", display: "flex", alignItems: "center", 
                    justifyContent: "center", fontWeight: 700, fontSize: 18, 
                    flexShrink: 0, boxShadow: `0 0 0 3px ${teamColor}40`,
                  }}
                >
                  {crew.authorNickname?.slice(0, 1)}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "#1a2a4a" }}>{crew.authorNickname}</div>
                  <div style={{ fontSize: 12, color: "#999" }}>🌡️ 매너온도 {crew.mannerTemperature || 36.5}°</div>
                </div>
                {!isAuthor && !isUserInCrew && (
                  <button onClick={() => onOpenDmChat?.(crew.authorNickname)} style={{ padding: "8px 14px", borderRadius: 10, background: "#f5f5f5", border: "1px solid #eee", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>💬 크루장에게 1:1 문의하기</button>
                )}
              </div>
            </div>
          </>
        )}

        {/* 멤버 탭 UI (강제퇴장 버튼 포함) */}
        {tab === "members" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 12 }}>
            
            {/* 1. 승인된 정식 멤버 목록 */}
            <div style={{ background: "#fff", borderRadius: 12, padding: "4px 16px", border: "1px solid #eee" }}>
              {loadingMembers ? (
                <div style={{ padding: 20, textAlign: "center" }}>로딩 중...</div>
              ) : (
                approvedMembers.map((m, idx) => (
                  <div key={idx} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ flex: 1 }}>
                      <MemberItem 
                        member={m} 
                        onClick={(nickname) => {
                          if (onOpenDmChat && nickname !== currentUser?.nickname) {
                            onOpenDmChat(nickname);
                          }
                        }}
                      />
                    </div>
                    {/* 방장이면서 내가 아닌 멤버일 때 [내보내기] 버튼 노출 */}
                    {isAuthor && m.nickname !== currentUser?.nickname && (
                      <button 
                        onClick={() => handleExpel(m.memberId || m.id)}
                        style={{ padding: "4px 8px", background: "#fff", color: "#e94560", border: "1px solid #e94560", borderRadius: "6px", fontSize: 11, fontWeight: "bold", cursor: "pointer", marginLeft: 8 }}
                      >
                        내보내기
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* 2. 가입 대기열 (방장에게만 보임) */}
            {isAuthor && pendingMembers.length > 0 && (
              <div style={{ background: "#fff0f3", borderRadius: 12, padding: "4px 16px", border: "1px solid #ffcccc" }}>
                <div style={{ padding: "12px 0", fontSize: 13, fontWeight: 700, color: "#e94560", borderBottom: "1px solid #ffcccc" }}>
                  ⏳ 가입 대기 중인 멤버 ({pendingMembers.length})
                </div>
                
                {pendingMembers.map((m, idx) => (
                  <div key={`pending-${idx}`} style={{ padding: "12px 0", borderBottom: idx !== pendingMembers.length - 1 ? "1px solid #ffcccc" : "none" }}>
                    <MemberItem member={m} />
                    
                    {/* 지원 메시지 */}
                    {m.applyMessage && (
                      <div style={{ fontSize: 13, color: "#555", padding: "8px 12px", background: "#fff", borderRadius: 8, marginTop: 8, marginLeft: 50 }}>
                        💬 "{m.applyMessage}"
                      </div>
                    )}
                    
                    {/* 승인 / 거절 버튼 */}
                    <div style={{ display: "flex", gap: 8, marginTop: 12, marginLeft: 50 }}>
                      <button 
                        onClick={() => handleApprove(m.memberId || m.id)} 
                        style={{ flex: 1, padding: "8px", background: teamColor, color: "#fff", border: "none", borderRadius: "8px", fontSize: 13, fontWeight: "bold", cursor: "pointer" }}
                      >
                        ✅ 승인하기
                      </button>
                      <button 
                        onClick={() => handleReject(m.memberId || m.id)} 
                        style={{ flex: 1, padding: "8px", background: "#fff", color: "#666", border: "1px solid #ccc", borderRadius: "8px", fontSize: 13, fontWeight: "bold", cursor: "pointer" }}
                      >
                        ❌ 거절하기
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 승인 전 (신청 가능) */}
      {!isFull && !applyDone && !isUserInCrew && !isPendingUser && (
        <div style={{ position: "fixed", bottom: 80, left: "50%", transform: "translateX(-50%)", padding: "8px 16px", background: "#fff", borderRadius: "20px", border: "1px solid #eee", boxShadow: "0 4px 12px rgba(0,0,0,0.1)", zIndex: 100 }}>
          <button
            onClick={() => {
              if (!currentUserId) {
                alert('로그인 후 이용 가능합니다.'); return;
              }
              setIsApplyModalOpen(true);
            }}
            style={{ padding: "12px 32px", background: teamColor, color: "#fff", border: "none", borderRadius: "12px", fontWeight: 700, fontSize: 16, cursor: "pointer" }}
          >
            ⚾ 직관 크루 신청하기
          </button>
        </div>
      )}

      {/* 승인 대기 중 / 모집 마감 표시 */}
      {(isFull || applyDone || isPendingUser) && !isUserInCrew && (
        <div style={{ position: "fixed", bottom: 80, left: "50%", transform: "translateX(-50%)", padding: "8px 16px", background: "#fff", borderRadius: "20px", border: "1px solid #eee", boxShadow: "0 4px 12px rgba(0,0,0,0.1)", zIndex: 100 }}>
          <div style={{ padding: "12px 32px", background: "#f5f5f5", color: "#aaa", borderRadius: "12px", fontWeight: 700, fontSize: 16 }}>
            {isPendingUser || applyDone ? "⏳ 방장의 승인 대기 중" : "모집이 마감되었습니다"}
          </div>
        </div>
      )}

      {/* 승인 완료된 멤버에게 보이는 [크루 나가기] 버튼 */}
      {isUserInCrew && !isAuthor && (
        <div style={{ position: "fixed", bottom: 80, left: "50%", transform: "translateX(-50%)", padding: "8px 16px", background: "#fff", borderRadius: "20px", border: "1px solid #eee", boxShadow: "0 4px 12px rgba(0,0,0,0.1)", zIndex: 100 }}>
          <button
            onClick={handleLeave}
            style={{ padding: "12px 32px", background: "#f5f5f5", color: "#666", border: "1px solid #ddd", borderRadius: "12px", fontWeight: 700, fontSize: 16, cursor: "pointer" }}
          >
            🚪 크루 나가기
          </button>
        </div>
      )}

      {isApplyModalOpen && (
        <ApplyModal
          post={crew}
          onClose={() => setIsApplyModalOpen(false)}
          onSubmit={handleApply}
        />
      )}

    </div>
  );
}