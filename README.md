# Having - 함께하는 성장의 모든 것

**Having**은 개발자, 디자이너, 기획자 등 성장을 원하는 모든 이들이 함께 모여 스터디와 프로젝트를 진행하며 시너지를 창출하는 온라인 커뮤니티 플랫폼입니다. 스터디/프로젝트 그룹 매칭부터 실시간 소통, 정보 공유, 그리고 동기부여를 위한 소셜 기능까지, 성공적인 그룹 활동에 필요한 모든 경험을 제공합니다.

<br>

<p align="center">
  <img src="https://img.shields.io/badge/java-%23ED8B00.svg?style=for-the-badge&logo=openjdk&logoColor=white" />
  <img src="https://img.shields.io/badge/spring_boot-%236DB33F.svg?style=for-the-badge&logo=spring-boot&logoColor=white" />
  <img src="https://img.shields.io/badge/react-%2320232A.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB" />
  <img src="https://img.shields.io/badge/typescript-%233178C6.svg?style=for-the-badge&logo=typescript&logoColor=white" />
  <img src="https://img.shields.io/badge/MariaDB-003545?style=for-the-badge&logo=mariadb&logoColor=white" />
  <img src="https://img.shields.io/badge/redis-%23DD0031.svg?style=for-the-badge&logo=redis&logoColor=white" />
  <img src="https://img.shields.io/badge/docker-%232496ED.svg?style=for-the-badge&logo=docker&logoColor=white" />
  <img src="https://img.shields.io/badge/WebSocket-010101?style=for-the-badge&logo=websocket&logoColor=white" />
</p>

<br>

## ✨ 주요 기능 (Features)

### 📚 스터디 및 프로젝트 그룹 관리
- **모집 유형 구분**: 학습 목적의 '스터디'와 결과물 제작 목적의 '프로젝트'를 명확히 구분하여 생성 및 필터링할 수 있습니다.
- **그룹 생성 및 검색**: 원하는 주제와 유형의 그룹을 만들거나 키워드, 태그, 지도 기반(주변 스터디)으로 검색할 수 있습니다.
- **멤버 관리 시스템**: 스터디장은 멤버의 참여 신청을 승인/거절하고, 기존 멤버를 초대하거나 강제 탈퇴시키는 등 그룹을 체계적으로 관리합니다.
- **참여 및 탈퇴**: 사용자는 원하는 그룹에 자유롭게 참여 신청을 하거나 자진 탈퇴할 수 있습니다.
- **스터디 캘린더**: `FullCalendar` 라이브러리를 연동하여 그룹별 일정을 생성, 수정, 삭제하고 드래그 앤 드롭으로 쉽게 관리합니다.

### 💬 실시간 소통 기능
- **그룹/개인 채팅**: 각 스터디 그룹 전용 그룹 채팅방 및 사용자 간 1:1 DM(다이렉트 메시지) 기능을 제공합니다.
- **실시간 메시징**: `WebSocket`과 `STOMP` 프로토콜을 기반으로 실시간 양방향 통신을 구현하여 끊김 없는 대화 환경을 제공합니다.
- **동시 접속자 수 표시**: `Redis`와 `WebSocket`을 연동하여, 스터디/게시글 상세 페이지에 현재 함께 보고 있는 사용자 수를 실시간으로 표시하여 서비스에 생동감을 더합니다.

### 📝 커뮤니티 게시판
- **콘텐츠 에디터**: `TOAST UI Editor`를 도입하여 Markdown과 WYSIWYG 모드를 모두 지원하며, `Axios`를 이용한 비동기 이미지 업로드 기능을 구현했습니다.
- **추천/비추천 시스템**: 유용한 게시물이나 댓글에 대한 긍정/부정 피드백 시스템을 통해 양질의 콘텐츠가 주목받도록 합니다.
- **계층형 댓글**: 댓글과 대댓글(답글) 기능을 통해 특정 주제에 대한 깊이 있는 논의 구조를 지원합니다.
- **인기 게시물**: 주간 추천 수를 기준으로 '핫 게시물'을 선정하고, `Redis`에 결과를 캐싱하여 매우 빠른 속도로 제공합니다.

### 🤝 소셜 및 알림 시스템
- **친구 시스템**: 사용자 간 친구 신청, 수락/거절, 친구 목록 관리 및 삭제 기능을 구현하여 커뮤니티 내 네트워킹을 강화합니다.
- **활동 피드**: 친구의 새로운 스터디/게시글 작성 소식을 받아보는 뉴스피드 기능을 통해 사용자의 지속적인 서비스 참여를 유도합니다.
- **스마트 알림**: 스터디/채팅방 초대, 참여 신청 결과, 친구 요청, 새 댓글, 좋아요 등 10가지 이상의 다양한 활동을 `SSE(Server-Sent Events)`를 통해 실시간 푸시 알림으로 제공합니다.

### 👤 사용자 및 관리자 기능
- **소셜 로그인**: `Spring Security`와 `OAuth2`를 연동하여 Google 소셜 로그인을 구현했습니다.
- **JWT 기반 인증**: Stateless 아키텍처를 위해 Access Token과 Refresh Token(Redis 저장)을 사용하는 API 접근 제어 방식을 채택했습니다.
- **게임화 요소**: 사용자 활동(글 작성, 좋아요 등)에 따라 포인트와 레벨이 상승하고, 특정 조건을 만족하면 뱃지를 획득하는 시스템으로 사용자의 동기를 부여합니다.
- **신고 및 블라인드**: 부적절한 콘텐츠(게시글, 댓글, 스터디)를 신고하고, 관리자가 이를 검토하여 '숨김(블라인드)' 처리하는 기능을 구현하여 커뮤니티의 건전성을 유지합니다.
- **관리자 대시보드**: `Recharts` 라이브러리를 활용하여 서비스의 주요 지표(가입자, 콘텐츠 수 등)를 시각화하고, 신고 내역을 효율적으로 관리할 수 있는 페이지를 제공합니다.

<br>

## 🚀 기술적 도전 및 최적화 경험

본 프로젝트는 단순히 기능을 구현하는 것을 넘어, 실제 서비스 환경에서 발생할 수 있는 문제들을 예측하고 해결하는 데 중점을 두었습니다.

### 1. Redis를 활용한 성능 최적화
RDBMS의 부하를 줄이고 사용자 응답 속도를 향상시키기 위해, 데이터의 특성에 따라 Redis를 다각도로 활용했습니다.
- **Refresh Token 저장소**: 빈번한 인증 I/O 작업을 DB에서 분리하고, Redis의 TTL을 이용해 만료된 토큰을 자동 관리함으로써 인증 성능과 운영 효율성을 높였습니다.
- **읽기 성능 최적화 (Look-Aside Caching)**: 반복 조회되는 스터디/게시글 상세 정보에 Spring Cache(`@Cacheable`, `@CacheEvict`)를 적용하여 DB 부하를 줄이고 응답 속도를 개선했습니다. 데이터 변경 시 캐시를 동기화하는 전략을 구현했습니다.
- **랭킹보드 캐싱**: 집계 연산이 많은 '핫 게시물' 목록을 `@Scheduled`를 통해 주기적으로 미리 계산하고, Redis의 **Sorted Set(ZSET)**에 저장하여 DB 접근 없이 매우 빠른 랭킹 조회가 가능하도록 설계했습니다.
- **조회수 중복 방지 및 업데이트 최적화**: 모든 조회 요청마다 발생하던 DB `UPDATE` 작업을 Redis의 `INCR` 명령어로 대체하여 쓰기 부하를 획기적으로 줄였습니다. Redis에 누적된 조회수는 스케줄러를 통해 주기적으로 DB에 동기화됩니다.

### 2. 이벤트 기반 비동기 아키텍처
사용자의 활동(글 작성, 스터디 생성 등)에 따른 부가적인 작업(포인트 부여, 뱃지 수여, 활동 피드 생성)을 비동기적으로 처리하기 위해 Spring의 **`ApplicationEventPublisher`**를 도입했습니다.
- `@TransactionalEventListener`와 `@Async`를 조합하여, 메인 트랜잭션이 성공적으로 커밋된 후에만 별도의 스레드에서 부가 작업을 실행하도록 보장했습니다.
- 이를 통해 **메인 요청의 응답 시간을 단축**하고, 부가 기능의 실패가 원래의 비즈니스 로직에 영향을 주지 않는 **안정적이고 확장 가능한 시스템**을 구축했습니다.

### 3. 실시간 통신 및 동시성 관리
`WebSocket(STOMP)`과 `SSE`를 목적에 맞게 사용하여 실시간 기능을 구현했습니다.
- **채팅/DM**: 양방향 통신이 필수적인 채팅 기능에는 STOMP 프로토콜을 사용했습니다.
- **알림**: 서버에서 클라이언트로의 단방향 데이터 전송만 필요한 실시간 알림에는 더 가벼운 SSE를 채택했습니다.
- **동시 접속자 수**: `Redis Set`을 이용하여 각 페이지(채널)별 접속자를 실시간으로 집계하고, 사용자의 입장/퇴장/연결종료 이벤트를 처리하여 현재 접속자 수를 모든 클라이언트에게 브로드캐스팅하는 기능을 구현했습니다.

<br>

## 🛠️ 기술 스택 (Tech Stack)

### Backend
- **Framework**: `Spring Boot 3.3.0`
- **Language**: `Java 17`
- **Database**: `MariaDB`
- **Data-Access**: `Spring Data JPA` (Hibernate)
- **Security**: `Spring Security`, `OAuth2`, `JWT (jjwt)`
- **Real-time**: `Spring WebSocket` (with `STOMP`), `Server-Sent Events (SSE)`
- **Caching & Messaging**: `Redis`
- **Asynchronous**: `Spring ApplicationEvent`, `@Async`
- **Build Tool**: `Gradle`

### Frontend
- **Framework**: `React` (with `TypeScript`)
- **UI Library**: `Material-UI (MUI) v5`
- **Routing**: `React Router v6`
- **State Management**: `React Context API`
- **API Client**: `Axios` (with Interceptors)
- **Real-time**: `@stomp/stompjs`, `SockJS`, `EventSource`
- **Charts & Editor**: `Recharts`, `TOAST UI Editor`

### Infrastructure
- **Containerization**: `Docker`, `Docker Compose`
- **CI/CD**: `GitHub Actions`
- **Deployment**: `AWS EC2`, `AWS RDS`

<br>

## 🏛️ 아키텍처 & ERD

<p align="center">
  <img src="[YOUR_ARCHITECTURE_DIAGRAM_URL]" alt="Architecture Diagram" width="800"/>
  <br>
  <em>(여기에 아키텍처 다이어그램 이미지를 추가하세요)</em>
</p>
<br>
<p align="center">
  <img src="[YOUR_ERD_IMAGE_URL]" alt="ERD" width="800"/>
  <br>
  <em>(여기에 ERD 이미지를 추가하세요. Mermaid.js로 생성한 다이어그램 스크린샷 추천)</em>
</p>

<br>

🚀 시작하기 (Getting Started)
Prerequisites (필수 요구사항)
Docker Desktop (최신 버전 설치 권장)
Git
💻 Installation & Run
1단계: 프로젝트 소스 코드 복제 (Clone)
먼저, 터미널을 열고 원하는 디렉토리에서 아래 명령어를 실행하여 GitHub 레포지토리를 복제합니다.

Bash

git clone https://github.com/[YOUR_GITHUB_ID]/having.git
cd having
Note: 위 주소의 [YOUR_GITHUB_ID] 부분은 실제 GitHub 사용자 ID로 변경해주세요.

2단계: 환경 변수 설정 (.env 파일 생성)
프로젝트를 실행하기 위해서는 데이터베이스 비밀번호, 구글 OAuth2 클라이언트 ID/Secret, JWT 시크릿 키 등 민감한 정보들이 필요합니다. 이러한 정보들은 보안을 위해 .env 파일에서 관리합니다.

프로젝트의 루트 디렉토리(최상위 폴더)에 .env 라는 이름으로 새 파일을 생성하고, 아래 내용을 복사하여 붙여넣으세요. #으로 설명된 부분을 참고하여, <...> 로 표시된 곳을 자신의 실제 값으로 모두 채워주세요.

코드 스니펫

# .env

# --- Docker Compose에서 사용할 데이터베이스 비밀번호 ---
# MariaDB 컨테이너의 root 계정 비밀번호로 사용됩니다.
COMPOSE_DB_PASSWORD=<your_strong_db_password>

# --- JWT(JSON Web Token) 시크릿 키 ---
# 64바이트 이상의 매우 긴 무작위 문자열을 권장합니다.
COMPOSE_JWT_SECRET=<your_super_long_and_random_jwt_secret_key>

# --- Google OAuth2 클라이언트 정보 ---
# (아래 가이드 참고하여 발급)
COMPOSE_GOOGLE_CLIENT_ID=<your_google_client_id.apps.googleusercontent.com>
COMPOSE_GOOGLE_CLIENT_SECRET=<your_google_client_secret_code>

# --- 프론트엔드에서 사용할 카카오맵 API 키 ---
# (아래 가이드 참고하여 발급)
COMPOSE_REACT_APP_KAKAO_MAP_API_KEY=<your_kakao_maps_javascript_api_key>

# --- 이메일 발송을 위한 Gmail 계정 정보 (선택 사항) ---
# 2단계 인증을 사용하는 경우 '앱 비밀번호'를 발급받아 사용해야 합니다.
COMPOSE_GMAIL_USERNAME=<your_gmail_address@gmail.com>
COMPOSE_GMAIL_APP_PASSWORD=<your_gmail_app_password>
3단계: 애플리케이션 실행
모든 설정이 완료되었습니다. 터미널에서 아래 명령어 하나만 실행하면, Docker가 모든 서비스(백엔드, 프론트엔드, DB, Redis)를 자동으로 빌드하고 실행합니다.

Bash

docker-compose up --build
--build: 최초 실행 시에는 반드시 이 옵션을 사용하여 로컬 소스 코드로 새로운 Docker 이미지를 생성합니다.
이후 다시 실행할 때는 docker-compose up만 입력하면 기존 이미지를 재사용하여 더 빠르게 시작할 수 있습니다.
최초 빌드는 환경에 따라 몇 분 정도 소요될 수 있습니다. 여러 서비스의 로그가 터미널에 출력되다가, 에러 없이 안정화되면 모든 준비가 완료된 것입니다.

4단계: 서비스 접속
웹 브라우저를 열고 아래 주소로 접속하여 "Having" 서비스를 확인해보세요.

👉 http://localhost:3000

⏹️ 애플리케이션 종료
프로젝트 실행을 종료하고 싶을 때는, docker-compose up 명령어를 실행했던 터미널에서 Ctrl + C를 누릅니다. 모든 컨테이너가 함께 안전하게 종료됩니다.

만약 백그라운드에서 실행했다면 (-d 옵션), docker-compose down 명령어로 종료할 수 있습니다.

🔑 참고: API 키 발급 가이드
1. Google OAuth 2.0 클라이언트 ID 및 시크릿 발급 방법
Google Cloud Console에 접속하여 새 프로젝트를 생성합니다.
API 및 서비스 > 사용자 인증 정보 메뉴로 이동합니다.
+ 사용자 인증 정보 만들기 > OAuth 클라이언트 ID를 선택합니다.
애플리케이션 유형을 웹 애플리케이션으로 선택합니다.
승인된 리디렉션 URI 섹션에서 + URI 추가 버튼을 누르고 아래 주소를 입력합니다.
http://localhost:8080/login/oauth2/code/google
만들기 버튼을 누르면 클라이언트 ID와 클라이언트 보안 비밀이 발급됩니다. 이 값들을 .env 파일에 각각 입력합니다.
2. Kakao Maps API JavaScript 키 발급 방법
Kakao Developers에 로그인하고 내 애플리케이션으로 이동합니다.
+ 애플리케이션 추가하기를 통해 새 앱을 생성합니다.
생성된 앱을 선택하고, 앱 설정 > 플랫폼 메뉴로 이동합니다.
Web 플랫폼 등록 버튼을 누르고, 사이트 도메인에 http://localhost:3000을 등록합니다.
앱 설정 > 요약 정보 메뉴로 이동하여, JavaScript 키를 복사합니다.
복사한 키를 .env 파일의 COMPOSE_REACT_APP_KAKAO_MAP_API_KEY 값으로 입력합니다.
❓ Q&amp;A
Q: docker-compose.yml 파일을 GitHub에 올려도 괜찮나요?

A: 네, 괜찮습니다. docker-compose.yml 파일은 여러 서비스(백엔드, 프론트엔드, DB 등)를 어떻게 구성하고 연결할지에 대한 **"설계도"**와 같습니다. 이 파일 자체에는 민감한 정보가 없으며, ${...} 형태로 .env 파일의 변수를 참조하도록 만들어져 있어 안전합니다. 이 설계도 파일이 있어야 다른 사람도 docker-compose up 명령어로 프로젝트를 쉽게 실행할 수 있습니다.

Q: .env 파일은 왜 .gitignore에 추가해야 하나요?

A: .env 파일에는 DB 비밀번호, API 시크릿 키 등 절대 외부에 노출되어서는 안 되는 민감한 정보가 들어갑니다. 따라서 이 파일은 .gitignore에 등록하여 GitHub에 올라가지 않도록 하고, 각 사용자가 자신의 로컬 환경에 직접 생성하여 사용하도록 하는 것이 표준적인 보안 방식입니다.
