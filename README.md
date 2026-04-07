# ⚾ FULL COUNT - Frontend Repository

<p align="center">
  <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB"/>
  <img src="https://img.shields.io/badge/Vite-B73BFE?style=for-the-badge&logo=vite&logoColor=FFD62E"/>
  <img src="https://img.shields.io/badge/Axios-5A29E4?style=for-the-badge&logo=axios&logoColor=white"/>
  <img src="https://img.shields.io/badge/Vanilla_CSS-1572B6?style=for-the-badge&logo=css3&logoColor=white"/>
</p>

## 📖 1. 프로젝트 개요 (Overview)
FULL COUNT 프로젝트의 **프론트엔드 레포지토리**입니다. React와 Vite를 기반으로 구축된 본 어플리케이션은 KBO(한국 프로야구) 팬들을 위한 실시간 채팅, 에스크로 기반의 안전한 티켓 양도 시스템, 직관 크루/메이트 매칭 기능을 제공하는 완벽한 SPA(Single Page Application) 환경을 목표로 개발되었습니다.

## ✨ 2. 핵심 기술 및 구현 하이라이트

### ⚡ 커스텀 브라우저 히스토리 및 라우팅 동기화
- 무거운 외부 라이브러리에 100% 의존하는 대신, HTML5 `History API` (`pushState`, `popstate`)를 활용하여 브라우저의 URL과 React 내부 상태(State)를 일치시켰습니다.
- 이를 통해 복잡한 모달 창과 상세 페이지 전환 시 풀 페이지 리로드 없이, 완벽한 '뒤로 가기/앞으로 가기' 네비게이션 경험을 제공합니다.

### 🔌 실시간 전역 채팅 리스너 및 FAB (Floating Action Button) 시스템
- **`GlobalChatListener`**: 애플리케이션 최상단에 배치된 웹소켓(WebSocket) 컴포넌트로, 서버로부터 전송되는 STOMP 메시지를 백그라운드 환경에서 실시간으로 파싱합니다.
- **스마트 푸시 시스템**: 새로운 메시지가 도착했을 때, 사용자가 현재 해당 채팅방을 보고 있지 않은 경우에만 자동 DM 팝업을 발생시키며 알림 뱃지의 최신 상태를 전역으로 관리합니다.
- **메모리 누수 차단**: React Portals를 활용한 `ChatFab` 구현체에 언마운트 시 인터벌을 해제하는 안전장치(`clearInterval`)를 설계하여 불필요한 백그라운드 API 호출을 원천 차단했습니다.

### 🛡️ 모듈화된 API 및 Interceptor 아키텍처
- 모든 REST API 호출 로직은 View 레이어와 분리되어 `src/api/` 폴더 하위로 완전히 캡슐화되어 있습니다.
- `Axios` 인터셉터를 구축하여 `sessionStorage`에 보관된 JWT 토큰을 인증이 필요한 요청에만 자동으로 탈부착하도록 설계했습니다.
- 백엔드의 다변화된 DTO 스펙을 프론트엔드에서 일관되게 처리할 수 있도록 정규화(Normalization) 레이어를 두어 안정적인 서버 통신을 보장합니다.

### 🎨 데이터 기반의 동적 UI 테마 렌더링
- `TEAM_COLORS` 매핑 딕셔너리를 설계하여, 경기 일정 및 팀 매칭 화면 렌더링 시 상대 팀에 맞춰 UI의 메인 액센트 컬러를 자동으로 전환합니다.
- 공통 컴포넌트(`StatusBadge`, `TicketCard`)가 넘겨받은 상태값 하나만으로 즉각적인 시각적 변화(글래스모피즘, 컬러 변경)를 가져올 수 있도록 컴포넌트 주도 개발 방식을 채택했습니다.

## 🏗️ 3. 프론트엔드 아키텍처 및 폴더 구조
`[프로젝트 아키텍처 다이어그램 이미지 삽입]`

**핵심 폴더 구조**:
- `/src/api`: Axios 통신 인스턴스 및 비즈니스 로직별 API 추상화 모듈
- `/src/components`: 재사용 가능한 전역 UI 모듈 모음 (모달, 배지, 드롭다운, FAB 팝업)
- `/src/context`: JWT 인증 라이프사이클 등 전역 상태를 관장하는 React Context Providers
- `/src/pages`: 각각의 핵심 도메인 뷰(페이지)를 독립적으로 렌더링하는 컨테이너 컴포넌트

## 🚀 4. 설치 및 실행 가이드

```bash
# 1. 레포지토리 클론
git clone [프론트엔드 깃허브 URL 삽입]
cd fullcount-frontend

# 2. 패키지 설치
npm install

# 3. 환경 변수 설정
# 루트 디렉토리에 .env 파일을 생성하고 백엔드 API 주소를 연결합니다.
echo "VITE_API_BASE_URL=http://localhost:8080/api" > .env

# 4. 개발 서버 실행
npm run dev
```

`[채팅 모달 연동 혹은 티켓 양도 화면 UI를 보여주는 GIF / 스크린샷 삽입]`
