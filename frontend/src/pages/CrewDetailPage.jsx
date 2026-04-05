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

// ─── 멤버 아이템 컴포넌트 ───
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
  if (!crew) return null;

  const currentUserId = currentUser?.nickname; 
  const [tab, setTab] = useState("info");
  const [members, setMembers] = useState([]); 
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [applyDone, setApplyDone] = useState(false);
  const [loadingMembers, setLoadingMembers] = useState(false);

  const teamKey = crew.supportTeamName?.split(' ')[0] || crew.team?.split(' ')[0];
  const teamColor = TEAM_COLORS[teamKey] || "#e94560";
  const isFull = crew.currentParticipants >= crew.maxParticipants;

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
  const isUserInCrew = members.some(m => m.nickname === currentUser?.nickname);

  const handleApply = async (message) => {
    try {
      await api.post(`/posts/${crew.id}/join`);
      setApplyDone(true);
      setIsApplyModalOpen(false);
      fetchMembers(); 
    } catch (err) {
      alert(err.response?.data?.message || "신청에 실패했습니다. 이미 참여 중이거나 정원이 찼을 수 있습니다.");
    }
  };

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

        {/* 💡 작성자 본인일 경우 [수정] / [삭제] 버튼 노출 */}
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

        <div style={{ background: "#fff", borderRadius: 12, padding: 16, marginBottom: 12, border: "1px solid #eee" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <StatusBadge status={crew.status} />
            <span style={{ fontSize: 13, color: "#e94560", fontWeight: 700 }}>
              👤 {crew.currentParticipants || crew.currentMembers} / {crew.maxParticipants}명
            </span>
          </div>
          <div style={{ height: 8, background: "#f0f0f0", borderRadius: 999, overflow: "hidden" }}>
            <div style={{
              height: "100%",
              width: `${((crew.currentParticipants || crew.currentMembers) / crew.maxParticipants) * 100}%`,
              background: isFull ? "#ef4444" : teamColor,
              borderRadius: 999,
              transition: "width 0.4s ease",
            }} />
          </div>
        </div>

        <div style={{ display: "flex", background: "#fff", borderRadius: 12, border: "1px solid #eee", marginBottom: 12, overflow: "hidden" }}>
          {[
            { key: "info", label: "📋 직관 정보" },
            { key: "members", label: `👥 멤버 (${members.length})` },
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

        {tab === "members" && (
          <div style={{ background: "#fff", borderRadius: 12, padding: "4px 16px", marginBottom: 12, border: "1px solid #eee" }}>
            {loadingMembers ? (
              <div style={{ padding: 20, textAlign: "center" }}>로딩 중...</div>
            ) : (
              members.map((m, idx) => (
                <MemberItem 
                  key={idx} 
                  member={m} 
                  onClick={(nickname) => {
                    if (onOpenDmChat && nickname !== currentUser?.nickname) {
                      onOpenDmChat(nickname);
                    }
                  }}
                />
              ))
            )}
          </div>
        )}
      </div>

      {!isFull && !applyDone && !isUserInCrew && (
        <div style={{ position: "fixed", bottom: 80, left: "50%", transform: "translateX(-50%)", padding: "8px 16px", background: "#fff", borderRadius: "20px", border: "1px solid #eee", boxShadow: "0 4px 12px rgba(0,0,0,0.1)", zIndex: 100 }}>
          <button
            onClick={() => {
              if (!currentUserId) {
                alert('로그인 후 이용 가능합니다.');
                return;
              }
              setIsApplyModalOpen(true);
            }}
            style={{ padding: "12px 32px", background: teamColor, color: "#fff", border: "none", borderRadius: "12px", fontWeight: 700, fontSize: 16, cursor: "pointer" }}
          >
            ⚾ 직관 크루 신청하기
          </button>
        </div>
      )}

      {(isFull || applyDone) && (
        <div style={{ position: "fixed", bottom: 80, left: "50%", transform: "translateX(-50%)", padding: "8px 16px", background: "#fff", borderRadius: "20px", border: "1px solid #eee", boxShadow: "0 4px 12px rgba(0,0,0,0.1)", zIndex: 100 }}>
          <div style={{ padding: "12px 32px", background: "#f5f5f5", color: "#aaa", borderRadius: "12px", fontWeight: 700, fontSize: 16 }}>{applyDone ? "✅ 신청 완료" : "모집이 마감되었습니다"}</div>
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