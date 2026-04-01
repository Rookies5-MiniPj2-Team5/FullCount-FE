# ⚾ 풀카운트 (Full Count) - Frontend

야구 팬들을 위한 커뮤니티 및 안전한 에스크로 티켓 양도 플랫폼, **풀카운트**의 프론트엔드 저장소입니다.

## 🚀 주요 기능 (Frontend)
- **직관 메이트 모집**: 구단별 직관 파티원 모집글 조회, 상세 확인 및 신청 기능 (`CrewPage`, `CrewDetailPage`)
- **에스크로 티켓 양도**: 안전한 티켓 거래를 위한 프로세스 UI (`MeetupPage`, `MeetupDetailPage`)
- **실시간 채팅**: WebSocket(STOMP)을 활용한 1:1 및 단체 채팅 인터페이스 (`ChatPage`, `ChatFab`)
- **경기 정보 제공**: KBO 실시간 경기 일정, 순위 및 날씨 정보 위젯 (`HomePage`, `SchedulePage`)
- **마이페이지**: 사용자 프로필 관리, 직관 신청 현황 및 참여 통계 (`MyPage`, `MyApplicationStatus`)

## 🛠 기술 스택
- **Framework**: React 18 (Vite)
- **Language**: JavaScript (ES6+)
- **Styling**: Vanilla CSS (Custom Mobile-First Design)
- **State Management**: React Context API (`AuthContext`)
- **Networking**: Axios, StompJS, SockJS

## 🔗 Repository
- **Frontend**: [FullCount-FE](https://github.com/Rookies5-MiniPj2-Team5/FullCount-FE)
- **Backend**: [FullCount-BE](https://github.com/Rookies5-MiniPj2-Team5/FullCount-BE)

---

## 🏃 실행 방법

프론트엔드 개발 서버를 기동하기 위한 단계입니다.

```powershell
# 레포지토리 클론
git clone https://github.com/Rookies5-MiniPj2-Team5/FullCount-FE.git
cd FullCount-FE

# 의존성 설치
npm install

# 로컬 개발 서버 실행
npm run dev
```
- **URL**: [http://localhost:5173](http://localhost:5173)

---

## 📁 프로젝트 구조
```text
src/
├── api/          # API 호출 로직 (Auth, Chat, Crew, Meetup 등)
├── assets/       # 이미지 및 정적 리소스
├── components/   # 재사용 가능한 UI 컴포넌트 (Modal, Badge, Widget 등)
├── context/      # 전역 상태 관리 (AuthContext)
├── hooks/        # 커스텀 훅 (useChat 등)
├── pages/        # 주요 서비스 페이지
├── utils/        # 공통 유틸리티 함수
└── App.jsx       # 라우팅 및 앱 엔트리포인트
```

---

## 🛠 Git Branch Strategy

본 프로젝트는 원활한 협업을 위해 다음과 같은 브랜치 전략을 따릅니다.

- **main**: 코드 통합 및 배포를 위한 기준 브랜치입니다.
- **feature/{기능명}**: 각자 맡은 기능 개발을 진행하는 개인 작업 브랜치입니다.
  - 예: `feature/login-ui`, `feature/chat-stomp`

### 협업 프로세스
1. 본인의 작업 브랜치에서 개발을 완료합니다. (`git checkout -b feature/ui-update`)
2. 작업 내용을 원격 레포지토리에 Push 합니다.
3. GitHub에서 **Pull Request(PR)**를 생성하여 팀원들에게 공유합니다.
4. 팀원의 리뷰 또는 확인을 거친 후 `main` 브랜치로 **Merge** 합니다.
### 원격 저장소 설정 방법
기존 프로젝트의 원격 저장소를 프론트엔드 전용 레포지토리로 교체하려면 아래 명령어를 사용하세요.
```powershell
# 기존 origin 삭제
git remote remove origin

# 새 origin 등록 (Frontend 기준)
git remote add origin https://github.com/Rookies5-MiniPj2-Team5/FullCount-FE.git

# 현재 연결 상태 확인
git remote -v
```
