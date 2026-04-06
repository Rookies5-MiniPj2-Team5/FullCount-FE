# 경기 일정 데이터 연동 문제 해결 가이드

실시간 경기 일정을 불러오지 못하는 문제가 발생했을 때, 단계별로 확인할 수 있는 체크리스트입니다.

---

## 1. Git 관련 이슈 확인 (Git Issue Check)

최근 `git pull` 이후에 문제가 발생했다면, 병합 과정에서 코드가 꼬였거나 설정이 덮어씌워졌을 가능성이 있습니다.

### ✅ 체크리스트
- **병합 충돌 확인**: `git pull` 시 충돌이 제대로 해결되지 않았는지 확인합니다.
  ```powershell
  git status
  ```
  *파일 목록 중 "Unmerged paths"가 있다면 충돌을 해결해야 합니다.*

- **최근 변경 사항 확인**: 경기 일정 관련 파일에 어떤 변경이 있었는지 확인합니다.
  ```powershell
  git log -p frontend/src/components/ScheduleList.jsx frontend/src/api/api.js
  ```

- **의존성(Dependency) 업데이트**: 팀원이 새로운 라이브러리를 추가했을 수 있습니다.
  ```powershell
  npm install
  ```

---

## 2. 코드 및 시스템 이슈 확인 (Code Issue Check)

Git 문제가 아니라면 데이터의 흐름을 추적해야 합니다. 문제 해결을 위해 아래 정보들을 확인해 주세요.

### 🌐 네트워크 로그 확인 (가장 중요)
브라우저 개발자 도구(**F12**) -> **Network** 탭에서 다음 요청들을 확인합니다.
- `GET /api/baseball/live?date=...` (실시간 점수 및 상태)
- `GET /api/baseball/season?year=...` (전체 일정)
- `POST /api/baseball/sync?year=...` (데이터 동기화)

**확인 사항:**
- **Status Code**: 404(경로 없음), 500(서버 에러), 503(서비스 불가) 등
- **Response**: 서버에서 보내주는 에러 메시지 내용

### 💻 콘솔 에러 확인
**Console** 탭에 빨간색 에러 메시지가 있는지 확인합니다.
- `CORS error`: 보안 정책으로 인해 API 호출이 차단됨
- `AxiosError`: 네트워크 연결 문제 또는 서버 응답 에러
- `Uncaught TypeError`: 자바스크립트 코드 내부의 데이터 처리 오류 (데이터가 null인데 접근하려 할 때 등)

### ⚙️ 백엔드(Server) 상태
- 백엔드 서버(Spring Boot)가 정상적으로 실행 중인가요? (**8080 포트**)
- 백엔드 로그에 `Scraping failed` 또는 `Naver API connection timeout` 같은 로그가 찍히나요? (네이버 스포츠의 구조가 변경되어 크롤링이 실패할 수도 있습니다.)

### 🔑 환경 설정 확인
- `frontend/src/api/api.js` 파일의 `baseURL`이 현재 구동 중인 백엔드 주소(`http://localhost:8080/api`)와 일치하는지 확인합니다.

---

## 3. 원인 파악을 위해 필요한 정보
문제를 제가 직접 분석하기 위해, 위 과정에서 발견된 **에러 로그**나 **네트워크 응답 내용**을 복사해서 알려주시면 바로 해결책을 제시해 드리겠습니다!
