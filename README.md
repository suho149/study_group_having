🚀 Having - 함께 성장하는 IT 스터디 플랫폼
Having은 개발자, 디자이너, 기획자 등 IT 분야의 모든 이들이 함께 모여 스터디와 프로젝트를 진행하며 성장할 수 있는 온라인 커뮤니티 플랫폼입니다. 스터디 그룹 생성부터 멤버 관리, 실시간 채팅, 정보 공유 게시판까지, 성공적인 그룹 활동에 필요한 모든 기능을 제공합니다.
<br>
![alt text](https://img.shields.io/badge/java-%23ED8B00.svg?style=for-the-badge&logo=openjdk&logoColor=white)

![alt text](https://img.shields.io/badge/spring-%236DB33F.svg?style=for-the-badge&logo=spring&logoColor=white)

![alt text](https://img.shields.io/badge/react-%2320232A.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)

![alt text](https://img.shields.io/badge/MariaDB-003545?style=for-the-badge&logo=mariadb&logoColor=white)

![alt text](https://img.shields.io/badge/WebSocket-010101?style=for-the-badge&logo=websocket&logoColor=white)
<br>
✨ 주요 기능 (Features)
Having은 사용자들이 원활하게 협업하고 소통할 수 있도록 다음과 같은 핵심 기능들을 제공합니다.
📚 스터디 그룹 관리
스터디 생성 및 검색: 원하는 주제의 스터디를 만들거나 키워드, 태그로 검색할 수 있습니다.
멤버 관리 시스템: 스터디장이 멤버의 참여 신청을 승인/거절하거나, 기존 멤버를 초대/관리할 수 있습니다.
참여 및 탈퇴: 사용자는 원하는 스터디에 자유롭게 참여 신청을 하거나 탈퇴할 수 있습니다.
좋아요 기능: 관심 있는 스터디에 '좋아요'를 눌러 북마크처럼 활용할 수 있습니다.
💬 실시간 그룹 채팅
스터디 전용 채팅방: 각 스터디 그룹은 자신들만의 채팅방을 가집니다.
실시간 메시징: WebSocket(STOMP) 기반의 실시간 양방향 통신으로 끊김 없는 대화가 가능합니다.
멤버 초대 및 관리: 채팅방에 스터디 멤버를 초대하거나, 방장이 멤버를 관리할 수 있습니다.
시스템 메시지: 사용자의 입장/퇴장/초대 등 주요 이벤트가 시스템 메시지로 자동 표시됩니다.
📝 커뮤니티 게시판
다양한 카테고리: 자유, 질문, 토론, 정보공유 등 다양한 주제로 소통할 수 있습니다.
추천/비추천 시스템: 유용한 게시물이나 좋은 의견을 추천하여 커뮤니티 활성화에 기여할 수 있습니다.
계층형 댓글: 댓글과 대댓글을 통해 깊이 있는 논의를 이어갈 수 있습니다.
인기 게시물: 주간 추천 수를 기반으로 '핫 게시물'을 선정하여 보여줍니다.
🔔 스마트 알림 시스템
주요 활동 알림: 스터디/채팅방 초대, 참여 신청 및 결과 등 주요 활동을 실시간 알림으로 받아볼 수 있습니다.
읽음 처리 및 바로가기: 알림을 확인하고 클릭하면 관련 페이지로 즉시 이동할 수 있습니다.
👤 사용자 인증 및 프로필
소셜 로그인: Google OAuth2를 이용한 간편하고 안전한 로그인을 지원합니다.
JWT 기반 인증: Stateless한 JWT(Access/Refresh Token) 방식으로 API 접근을 제어합니다.
마이페이지: 자신의 프로필 정보와 활동 내역(참여 스터디, 작성 글 등)을 확인할 수 있습니다.
<br>
🛠️ 기술 스택 (Tech Stack)
Backend
Framework: Spring Boot 3.3.0
Language: Java 17
Database: MariaDB
ORM: Spring Data JPA (Hibernate)
Security: Spring Security, OAuth2, JWT (jjwt)
Real-time: Spring WebSocket (with STOMP)
Build Tool: Gradle
Frontend
Framework: React
UI Library: Material-UI (MUI)
Language: TypeScript (또는 JavaScript)
Routing: React Router
State Management: React Context API
API Client: Axios
Real-time: @stomp/stompjs, SockJS
Infrastructure & Deployment (예시)
Server: AWS EC2
Database: AWS RDS
CI/CD: GitHub Actions, Docker
<br>
🏛️ 아키텍처 (Architecture)
<p align="center">
<img src="https://example.com/architecture.png" alt="Architecture Diagram" width="700"/>
<br>
<em>(여기에 아키텍처 다이어그램 이미지를 추가하세요)</em>
</p>
Backend: 계층형 아키텍처 (Controller - Service - Repository)를 채택하여 각 계층의 역할을 명확히 분리하고 코드의 유지보수성과 테스트 용이성을 높였습니다.
Frontend: 컴포넌트 기반 아키텍처 (Pages - Components)를 사용하여 UI의 재사용성과 개발 효율을 극대화했습니다. Context API를 통해 전역 상태를 효과적으로 관리합니다.
Communication: 프론트엔드와 백엔드는 RESTful API로 통신하며, 실시간 기능은 WebSocket(STOMP) 프로토콜을 사용합니다. 모든 통신은 JWT 기반으로 인증됩니다.
<br>
📖 ERD (Entity Relationship Diagram)
<p align="center">
<img src="https://example.com/erd.png" alt="ERD" width="700"/>
<br>
<em>(여기에 ERD 이미지를 추가하세요. Mermaid.js로 생성한 다이어그램 스크린샷 추천)</em>
</p>
주요 엔티티는 User, StudyGroup, BoardPost, ChatRoom 등으로 구성되며, N:M 관계는 중간 테이블을 통해 효율적으로 관리됩니다.
<br>
🚀 시작하기 (Getting Started)
Prerequisites
Java 17
Node.js (v18.x 이상 권장)
MariaDB
Installation & Run
Backend
# 1. 레포지토리 클론
git clone https://github.com/your-username/having-backend.git
cd having-backend

# 2. .env 파일 생성 및 설정 (application.properties 참조)
# DB_URL, DB_USERNAME, DB_PASSWORD
# GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, JWT_SECRET

# 3. 애플리케이션 실행
./gradlew bootRun
Use code with caution.
Bash
Frontend
# 1. 레포지토리 클론
git clone https://github.com/your-username/having-frontend.git
cd having-frontend

# 2. 의존성 설치
npm install

# 3. 개발 서버 실행
npm start
Use code with caution.
Bash
<br>
👨‍💻 팀원 (Contributors)
[당신의 이름] - Backend & Frontend Developer
