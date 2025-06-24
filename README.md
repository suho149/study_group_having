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

<details>
<summary><strong>📚 스터디 및 프로젝트 그룹 관리</strong></summary>

- **모집 유형 구분**: 학습 목적의 '스터디'와 결과물 제작 목적의 '프로젝트'를 명확히 구분하여 생성 및 필터링
- **그룹 생성 및 검색**: 원하는 주제와 유형의 그룹을 만들거나 키워드, 태그 기반으로 검색
- **멤버 관리 시스템**: 스터디장이 멤버의 참여 신청을 수락/거절하고, 기존 멤버를 초대/강제 탈퇴/관리
- **참여 및 탈퇴**: 자유로운 참여 신청 및 자진 탈퇴 기능
- **관심 그룹 '좋아요'**: 관심 있는 스터디/프로젝트에 '좋아요'를 눌러 북마크처럼 활용
- **스터디 캘린더**: FullCalendar 라이브러리를 연동하여 그룹별 일정을 생성, 수정, 삭제하고 드래그 앤 드롭으로 쉽게 관리

</details>

<details>
<summary><strong>💬 실시간 소통 기능</strong></summary>

- **그룹/개인 채팅**: 스터디 전용 그룹 채팅방 및 사용자 간 1:1 DM(다이렉트 메시지) 기능 제공
- **실시간 메시징**: `WebSocket`과 `STOMP` 프로토콜 기반의 실시간 양방향 통신 구현
- **동시 접속자 수 표시**: `Redis`와 `WebSocket`을 연동하여, 스터디/게시글 상세 페이지에 현재 함께 보고 있는 사용자 수를 실시간으로 표시하여 생동감 부여
- **시스템 메시지**: 사용자의 입장/퇴장/초대 등 주요 이벤트가 채팅방에 시스템 메시지로 자동 표시

</Deteils>

<details>
<summary><strong>📝 커뮤니티 게시판</strong></summary>

- **콘텐츠 에디터**: TOAST UI Editor를 도입하여 Markdown과 WYSIWYG 모드를 모두 지원하고, 이미지 첨부 기능 제공
- **추천/비추천 시스템**: 유용한 게시물이나 댓글에 대한 긍정/부정 피드백 시스템
- **계층형 댓글**: 댓글과 대댓글(답글)을 통해 깊이 있는 논의 구조 지원
- **인기 게시물 캐싱**: 주간 추천 수를 기반으로 '핫 게시물'을 선정하고, `Redis`에 결과를 캐싱하여 매우 빠른 속도로 제공

</details>

<details>
<summary><strong>🤝 소셜 및 알림 시스템</strong></summary>

- **친구 시스템**: 사용자 간 친구 신청, 수락/거절, 친구 목록 관리 기능
- **활동 피드**: 친구의 새로운 스터디/게시글 작성 소식을 받아보는 뉴스피드 기능
- **스마트 알림**: 스터디/채팅방 초대, 참여 신청 결과, 친구 요청, 새 댓글, 좋아요 등 10가지 이상의 다양한 활동을 `SSE(Server-Sent Events)`를 통해 실시간 알림으로 제공
- **읽음 처리 및 바로가기**: 알림 확인 후 클릭 시 관련 페이지로 즉시 이동

</details>

<details>
<summary><strong>👤 사용자 및 관리자 기능</strong></summary>

- **소셜 로그인**: Google OAuth2를 이용한 간편하고 안전한 로그인 지원
- **JWT 기반 인증**: Stateless 아키텍처를 위한 Access/Refresh Token 기반의 API 접근 제어
- **마이페이지**: 프로필, 포인트/레벨, 활동 내역, 친구/알림 등 종합적인 사용자 정보 관리
- **신고 시스템**: 부적절한 게시물/댓글/스터디를 관리자에게 신고
- **관리자 대시보드**: `Recharts`를 활용한 서비스 통계 시각화 및 신고 내역 관리 기능

</details>

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

## 🚀 시작하기 (Getting Started)

### Prerequisites
- Java 17
- Node.js (v18.x 이상)
- MariaDB
- Redis
- Docker (권장)

### Installation & Run

1.  **Backend**
    ```bash
    # 1. 레포지토리 클론
    git clone https://github.com/[YOUR_GITHUB_ID]/having-backend.git
    cd having-backend

    # 2. application-dev.properties 생성 및 설정 (application.properties 참조)
    # DB, Redis, OAuth2, JWT 관련 환경변수 설정
    
    # 3. 애플리케이션 실행
    ./gradlew bootRun
    ```

2.  **Frontend**
    ```bash
    # 1. 레포지토리 클론
    git clone https://github.com/[YOUR_GITHUB_ID]/having-frontend.git
    cd having-frontend

    # 2. 의존성 설치
    npm install

    # 3. 개발 서버 실행
    npm start
    ```

<br>

## 👨‍💻 팀원 (Contributors)

- **[당신의 이름]** - Full-Stack Developer
  - GitHub: `https://github.com/[YOUR_GITHUB_ID]`
  - Email: `your-email@example.com`
