// pages/CrewDetailPage.jsx
// MeetupDetailPage와 동일한 디자인 시스템 사용
//
// ■ 디자인 기준
//   - 상단 바: ← 뒤로가기 (MeetupDetailPage top-bar 동일)
//   - 상단 배너: linear-gradient(135deg, #1a2a4a 0%, #e94560 100%)
//   - 카드: { background: '#fff', borderRadius: 12, border: '1px solid #eee' }
//   - 하단 고정 버튼 영역 (position: fixed, bottom: 60)
//
// ■ props
//   crew           - 크루 데이터 객체
//   currentUserId  - 현재 로그인 유저 id
//   onBack         - 목록으로 돌아가기
//   onOpenDmChat(crew)    - 크루장 1:1 문의 진입

import { useState } from "react";
import { StatusBadge } from "../components/StatusBadge";
import ApplyModal from "../components/ApplyModal";

// ─── 더미 멤버 데이터 ─────────────────────────────────
// TODO: BE 연동 - GET /api/crews/{crewId} 응답의 members 배열로 교체
// MemberDTO: { id, nickname, badgeLevel, mannerTemperature, isLeader }
const DUMMY_MEMBERS = [
  { id: 1, nickname: "야구왕김철수", badgeLevel: "ALL_STAR", mannerTemp: 38.2, isLeader: true },
  { id: 2, nickname: "두산곰팬이에요", badgeLevel: "PRO", mannerTemp: 36.5, isLeader: false },
  { id: 3, nickname: "선릉직관러", badgeLevel: "ROOKIE", mannerTemp: 37.1, isLeader: false },
];

const BADGE_EMOJI = { ROOKIE: "🌱", PRO: "⚡", ALL_STAR: "⭐", LEGEND: "🏆" };

const TEAM_COLORS = {
  "두산 베어스": "#1a1748",
  "LG 트윈스": "#C8102E",
  "SSG 랜더스": "#CE0E2D",
  "키움 히어로즈": "#820024",
  "KT 위즈": "#1b1a1a",
  "삼성 라이온즈": "#074CA1",
  "한화 이글스": "#F37321",
  "NC 다이노스": "#1D467A",
  "롯데 자이언츠": "#002561",
  "KIA 타이거즈": "#EA0029",
};

// ─── 멤버 아이템 ──────────────────────────────────────
function MemberItem({ member }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 12,
      padding: "10px 0",
      borderBottom: "1px solid #f5f5f5",
    }}>
      {/* 아바타 */}
      <div style={{
        width: 38, height: 38, borderRadius: "50%",
        background: "linear-gradient(135deg, #1a2a4a, #e94560)",
        color: "#fff", display: "flex", alignItems: "center",
        justifyContent: "center", fontWeight: 700, fontSize: 15, flexShrink: 0,
      }}>
        {member.nickname.slice(0, 1)}
      </div>

      {/* 닉네임 + 뱃지 */}
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
          {BADGE_EMOJI[member.badgeLevel]} {member.badgeLevel}
        </span>
      </div>

      {/* 매너온도 */}
      <div style={{ textAlign: "center", flexShrink: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: "#e94560" }}>
          {member.mannerTemp}°
        </div>
        <div style={{ fontSize: 10, color: "#bbb" }}>매너</div>
      </div>
    </div>
  );
}

// ─── 메인 ─────────────────────────────────────────────
export default function CrewDetailPage({
  crew,
  currentUserId,
  onBack,
  onOpenDmChat,
}) {
  const [tab, setTab] = useState("info"); // "info" | "members"
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [applyDone, setApplyDone] = useState(false);

  const isFull = crew?.currentMembers >= crew?.maxMembers;
  const teamColor = TEAM_COLORS[crew?.team] || "#e94560";

  // TODO: BE 연동 시 실제 members 데이터로 교체
  const members = DUMMY_MEMBERS;
  const isLeader = members.find((m) => m.isLeader)?.id === currentUserId;
  const isMember = isLeader || members.some((m) => m.id === currentUserId);

  const handleApply = async (message) => {
    try {
      // TODO: BE 연동 - POST /api/crews/{crewId}/apply  body: { message }
      await new Promise((r) => setTimeout(r, 800));
      setApplyDone(true);
      setIsApplyModalOpen(false);
    } catch {
      alert("신청 오류가 발생했습니다.");
    }
  };

  if (!crew) return null;

  return (
    <div>
      {/* ── 상단 바 (MeetupDetailPage top-bar 동일) ── */}
      <div className="top-bar" style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <button
          onClick={onBack}
          style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", padding: 0 }}
        >
          ←
        </button>
        <h1 style={{ fontSize: 18, margin: 0 }}>크루 상세</h1>
      </div>

      <div className="page-content" style={{ paddingBottom: 120 }}>

        {/* ── 상단 배너 (MeetupDetailPage 경기 배너 동일 스타일) ── */}
        <div style={{
          background: "linear-gradient(135deg, #1a2a4a 0%, #e94560 100%)",
          borderRadius: 16, padding: 20, color: "#fff", marginBottom: 16,
        }}>
          {/* 팀 이름 */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            marginBottom: 12,
          }}>
            <span style={{
              background: "rgba(255,255,255,0.2)", color: "#fff",
              padding: "4px 14px", borderRadius: 20, fontSize: 14, fontWeight: 700,
            }}>
              {crew.team}
            </span>
          </div>

          {/* 크루 제목 */}
          <div style={{ textAlign: "center", fontSize: 18, fontWeight: 800, marginBottom: 10 }}>
            {crew.title}
          </div>

          {/* 직관 정보 */}
          <div style={{
            display: "flex", justifyContent: "center", gap: 16,
            fontSize: 13, opacity: 0.85, flexWrap: "wrap",
          }}>
            <span>🏟️ {crew.stadium}</span>
            <span>📅 {crew.matchDate}</span>
            <span>🕐 {crew.matchTime}</span>
          </div>
        </div>

        {/* ── 모집 현황 카드 ── */}
        <div style={{
          background: "#fff", borderRadius: 12, padding: 16,
          marginBottom: 12, border: "1px solid #eee",
        }}>
          <div style={{
            display: "flex", alignItems: "center",
            justifyContent: "space-between", marginBottom: 10,
          }}>
            <StatusBadge status={crew.status} />
            <span style={{ fontSize: 13, color: "#e94560", fontWeight: 700 }}>
              👤 {crew.currentMembers} / {crew.maxMembers}명
            </span>
          </div>

          {/* 인원 진행 바 */}
          <div style={{
            height: 8, background: "#f0f0f0",
            borderRadius: 999, overflow: "hidden",
          }}>
            <div style={{
              height: "100%",
              width: `${(crew.currentMembers / crew.maxMembers) * 100}%`,
              background: isFull ? "#ef4444" : teamColor,
              borderRadius: 999,
              transition: "width 0.4s ease",
            }} />
          </div>
        </div>

        {/* ── 탭 ── */}
        <div style={{
          display: "flex", background: "#fff",
          borderRadius: 12, border: "1px solid #eee",
          marginBottom: 12, overflow: "hidden",
        }}>
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
                transition: "color 0.15s",
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* ── 정보 탭 ── */}
        {tab === "info" && (
          <>
            {/* 크루 소개 */}
            <div style={{
              background: "#fff", borderRadius: 12, padding: 16,
              marginBottom: 12, border: "1px solid #eee",
            }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#1a2a4a", marginBottom: 8 }}>
                📋 크루 소개
              </div>
              <div style={{ fontSize: 13, color: "#666", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>
                {crew.description}
              </div>
              {crew.tags?.length > 0 && (
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 10 }}>
                  {crew.tags.map((t) => (
                    <span key={t} style={{
                      fontSize: 11, color: "#888", background: "#f5f5f5",
                      padding: "3px 10px", borderRadius: 20,
                    }}>
                      #{t}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* 직관 정보 */}
            <div style={{
              background: "#fff", borderRadius: 12, padding: 16,
              marginBottom: 12, border: "1px solid #eee",
            }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#1a2a4a", marginBottom: 12 }}>
                🏟️ 직관 정보
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {[
                  ["경기장", crew.stadium],
                  ["날짜", crew.matchDate],
                  ["시간", crew.matchTime],
                  ["좌석 구역", crew.seatArea || "협의 예정"],
                ].map(([label, val]) => (
                  <div key={label} style={{
                    background: "#f9f9f9", borderRadius: 10, padding: 12,
                  }}>
                    <div style={{ fontSize: 11, color: "#aaa", fontWeight: 500, marginBottom: 4, textTransform: "uppercase" }}>
                      {label}
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#1a2a4a" }}>{val}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* 크루장 */}
            <div style={{
              background: "#fff", borderRadius: 12, padding: 16,
              marginBottom: 12, border: "1px solid #eee",
            }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#1a2a4a", marginBottom: 12 }}>
                ⚾ 크루장
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                {/* 아바타 */}
                <div style={{
                  width: 44, height: 44, borderRadius: "50%",
                  background: "linear-gradient(135deg, #1a2a4a, #e94560)",
                  color: "#fff", display: "flex", alignItems: "center",
                  justifyContent: "center", fontWeight: 700, fontSize: 18,
                  flexShrink: 0, boxShadow: `0 0 0 3px ${teamColor}40`,
                }}>
                  {crew.leaderNickname?.slice(0, 1)}
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "#1a2a4a", marginBottom: 4 }}>
                    {crew.leaderNickname}
                  </div>
                  <div style={{ display: "flex", gap: 10, fontSize: 12, color: "#999" }}>
                    <span>{BADGE_EMOJI[crew.leaderBadge]} {crew.leaderBadge}</span>
                    <span style={{ color: "#f97316" }}>🌡️ {crew.leaderMannerTemp}°</span>
                  </div>
                </div>

                {/* 비멤버: 1:1 문의 버튼 */}
                {!isMember && (
                  <button
                    onClick={() => onOpenDmChat?.(crew)}
                    style={{
                      padding: "8px 14px", borderRadius: 10,
                      background: "#f5f5f5", border: "1px solid #eee",
                      fontSize: 13, fontWeight: 700, color: "#1a2a4a",
                      cursor: "pointer", flexShrink: 0, whiteSpace: "nowrap",
                      fontFamily: "inherit",
                    }}
                  >
                    💬 1:1 문의
                  </button>
                )}
              </div>
            </div>
          </>
        )}

        {/* ── 멤버 탭 ── */}
        {tab === "members" && (
          <div style={{
            background: "#fff", borderRadius: 12, padding: "4px 16px",
            marginBottom: 12, border: "1px solid #eee",
          }}>
            {members.map((m) => (
              <MemberItem key={m.id} member={m} />
            ))}
          </div>
        )}
      </div>

      {/* ── 하단 고정 액션 영역 ── */}

      {/* 미마감 + 미신청: 신청하기 버튼 */}
      {!isFull && !applyDone && (
        <div style={{
          position: "fixed",
          bottom: 80, // 바닥에서 살짝 띄우기 (선택 사항)
          left: "50%",
          transform: "translateX(-50%)", // 화면 가로 중앙 정렬
          padding: "8px 16px",
          background: "#fff",
          borderRadius: "20px", // 배경 테두리 둥글게
          border: "1px solid #eee",
          boxShadow: "0 4px 12px rgba(0,0,0,0.1)", // 떠 있는 느낌을 위한 그림자
          zIndex: 100,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          width: "fit-content" // 배경을 버튼 콘텐츠 크기에 맞춤
        }}>
          <button
            onClick={() => setIsApplyModalOpen(true)}
            style={{
              padding: "12px 32px", // 버튼 내부 여백으로 크기 조절
              background: teamColor,
              color: "#fff",
              border: "none",
              borderRadius: "12px",
              fontWeight: 700,
              fontSize: 16,
              cursor: "pointer",
              fontFamily: "inherit",
              whiteSpace: "nowrap" // 텍스트 줄바꿈 방지
            }}
          >
            ⚾ 직관 크루 신청하기
          </button>
        </div>
      )}

      {/* 마감 안내 박스: 신청하기 버튼과 동일한 크기 및 중앙 배치 */}
      {isFull && !applyDone && (
        <div style={{
          position: "fixed",
          bottom: 80, // 버튼과 동일한 높이
          left: "50%",
          transform: "translateX(-50%)", // 가로 중앙 정렬
          padding: "8px 16px",
          background: "#fff",
          borderRadius: "20px",
          border: "1px solid #eee",
          boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
          zIndex: 100,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          width: "fit-content" // 배경을 내용 크기에 맞춤
        }}>
          <div style={{
            padding: "12px 32px", // 버튼과 동일한 패딩
            background: "#f5f5f5",
            color: "#aaa",
            borderRadius: "12px",
            fontWeight: 700,
            fontSize: 16,
            textAlign: "center",
            whiteSpace: "nowrap" // 텍스트 줄바꿈 방지
          }}>
            모집이 마감되었습니다
          </div>
        </div>
      )}

      {/* 신청 완료 */}
      {applyDone && (
        <div style={{
          position: "fixed", bottom: 60, left: 0, right: 0,
          padding: "12px 16px", background: "#fff",
          borderTop: "1px solid #eee", zIndex: 100,
        }}>
          <div style={{
            padding: 14, background: "#f0fdf4",
            border: "1px solid #bbf7d0", borderRadius: 10,
            textAlign: "center",
          }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#15803d", marginBottom: 2 }}>
              ✅ 가입 신청 완료!
            </div>
            <div style={{ fontSize: 12, color: "#86efac" }}>크루장의 수락을 기다려주세요.</div>
          </div>
        </div>
      )}

      {/* ApplyModal */}
      {isApplyModalOpen && (
        <ApplyModal
          post={{ authorNickname: crew.leaderNickname }}
          onClose={() => setIsApplyModalOpen(false)}
          onSubmit={handleApply}
        />
      )}
    </div>
  );
}