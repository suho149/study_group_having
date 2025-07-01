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
- **목적별 그룹 관리**: 학습 중심의 '스터디'와 결과물 제작 중심의 '프로젝트'를 명확히 구분하여, 목적에 맞는 팀원을 효율적으로 모집하고 참여할 수 있습니다.
- **다차원 검색**: 키워드, 기술 스택(태그) 검색은 물론, 카카오맵 API를 연동한 위치 기반(주변 스터디) 검색 기능을 제공하여 오프라인 모임의 접근성을 높였습니다.
- **체계적인 멤버 관리**: 스터디장은 멤버의 참여 신청을 승인/거절하고, 기존 멤버를 초대하거나 강제 탈퇴시키는 등 그룹을 체계적으로 관리합니다.
- **참여 및 탈퇴**: 사용자는 원하는 그룹에 자유롭게 참여 신청을 하거나 자진 탈퇴할 수 있습니다.
- **스터디 캘린더**: `FullCalendar` 라이브러리를 연동하여 그룹별 일정을 생성, 수정, 삭제하고 드래그 앤 드롭으로 쉽게 관리합니다.

### 💬 실시간 소통 기능
- **그룹/개인 채팅**: 각 스터디 그룹 전용 그룹 채팅방 및 사용자 간 1:1 DM(다이렉트 메시지) 기능을 제공합니다.
- **실시간 메시징**: `WebSocket`과 `STOMP` 프로토콜을 기반으로 실시간 양방향 통신을 구현하여 끊김 없는 대화 환경을 제공합니다.
- **동시 접속자 수 표시**: Redis와 WebSocket을 연동, 스터디/게시글 상세 페이지에 현재 접속자 수를 실시간으로 표시하여 서비스에 생동감을 더하고 사용자 인터랙션을 유도합니다.

### 📝 커뮤니티 게시판
- **콘텐츠 에디터**: TOAST UI Editor를 도입하여 Markdown과 WYSIWYG 모드를 모두 지원하며, Axios를 이용한 비동기 이미지 업로드 기능을 구현하여 사용자 편의성을 극대화했습니다.
- **추천/비추천 시스템**: 유용한 게시물이나 댓글에 대한 추천/비추천 시스템을 통해 커뮤니티 내 양질의 콘텐츠가 자연스럽게 주목받도록 설계했습니다.
- **계층형 댓글**: 단순한 댓글 기능을 넘어, 특정 댓글에 대한 답글(대댓글)을 지원하여 주제에 대한 심도 깊은 논의가 가능하도록 했습니다.
- **인기 게시물**: 주간 추천 수를 기준으로 '인기 게시물'을 선정하고, Redis에 결과를 캐싱하여 메인 페이지에서 DB 접근 없이 매우 빠른 속도로 랭킹을 제공합니다.

### 🤝 소셜 및 알림 시스템
- **친구 시스템**: 사용자 간 친구 신청, 수락/거절, 친구 목록 관리 및 삭제 기능을 구현하여 커뮤니티 내 네트워킹을 강화합니다.
- **활동 피드**: 친구의 새로운 스터디/게시글 작성 소식을 받아보는 뉴스피드 기능을 통해 사용자의 지속적인 서비스 참여를 유도합니다.
- **스마트 알림**: 스터디/채팅방 초대, 참여 신청 결과, 친구 요청, 새 댓글, 좋아요 등 10가지 이상의 다양한 활동을 `SSE(Server-Sent Events)`를 통해 실시간 푸시 알림으로 제공합니다.

### 👤 사용자 및 관리자 기능
- **소셜 로그인**: `Spring Security`와 `OAuth2`를 연동하여 Google 소셜 로그인을 구현했습니다.
- **JWT 기반 인증**: Stateless 아키텍처를 위해 Access Token과 Refresh Token(Redis 저장)을 사용하는 API 인증 방식을 채택하여 보안성과 확장성을 모두 확보했습니다.
- **동기부여 시스템**: 사용자 활동(글 작성, 좋아요 등)에 따라 포인트와 레벨이 상승하고, 특정 조건을 만족하면 뱃지를 획득하는 시스템으로 서비스에 대한 사용자의 몰입도와 성취감을 높입니다.
- **신고 및 블라인드**: 부적절한 콘텐츠(게시글, 댓글, 스터디)를 신고하고, 관리자가 이를 검토하여 '숨김(블라인드)' 처리하는 기능을 구현하여 커뮤니티의 건전성을 유지합니다.
- **관리자 대시보드**: Recharts 라이브러리를 활용, 서비스의 주요 지표(일별 가입자, 콘텐츠 생성 수 등)를 시각화하고 신고 내역을 효율적으로 관리할 수 있는 관리자 전용 페이지를 제공합니다.

<br>

## 🎥 주요 기능 시연

### 1. 소셜 로그인
<p align="center">
  <img src="https://github.com/user-attachments/assets/c52c4723-75b1-423f-8167-57008533c312" alt="소셜 로그인" width="80%"/>
</p>
<br>

### 2. 스터디 생성 및 상세화면
<p align="center">
  <img src="https://github.com/user-attachments/assets/ab60882b-00d1-41be-bc3a-53798bd57842" alt="스터디 생성 및 상세화면" width="80%"/>
</p>
<br>

### 3. 스터디 신청하기
<p align="center">
  <img src="https://github.com/user-attachments/assets/fcb7ccb8-bd06-4e5c-aa26-48acd655a1b8" alt="스터디 신청하기" width="80%"/>
</p>
<br>

### 4. 친구 신청 및 DM
<p align="center">
  <img src="https://github.com/user-attachments/assets/06d64488-606b-4712-b82b-ddba7b309ca9" alt="친구 신청 및 DM" width="80%"/>
</p>
<br>

### 5. 스터디 멤버 초대
<p align="center">
  <img src="https://github.com/user-attachments/assets/1d7ac18a-559b-4707-92bd-bc6dad7afe0c" alt="스터디 멤버 초대" width="80%"/>
</p>
<br>

### 6. 스터디 일정 추가 및 수정
<p align="center">
  <img src="https://github.com/user-attachments/assets/5a6cc3ea-701a-4ec5-b137-dde0789e06e2" alt="스터디 일정 추가 및 수정" width="80%"/>
</p>
<br>

### 7. 채팅방 초대 및 채팅
<p align="center">
  <img src="https://github.com/user-attachments/assets/9dafc5d0-56ea-4a07-a57c-2f91bd6a2db1" alt="채팅방 초대 및 채팅" width="80%"/>
</p>
<br>

### 8. 채팅방 멤버 내보내기
<p align="center">
  <img src="https://github.com/user-attachments/assets/4712067e-cdf1-42be-93c5-15c192683f13" alt="채팅방 멤버 내보내기" width="80%"/>
</p>
<br>

### 9. 카카오맵으로 주변 스터디 찾기
<p align="center">
  <img src="" alt="카카오맵으로 주변 스터디 찾기" width="80%"/>
</p>
<br>

### 10. 게시물 작성 및 댓글 작성
<p align="center">
  <img src="https://github.com/user-attachments/assets/b2abe27e-e03e-4af1-b628-c5eb1348e213" alt="게시물 작성 및 댓글 작성" width="80%"/>
</p>
<br>

### 11. 신고 기능 및 관리자 신고 처리
<p align="center">
  <img src="https://github.com/user-attachments/assets/49785b2b-da4c-476e-b497-576448d8932c" alt="소셜 로그인" width="80%"/>
</p>
<br>

## 🌊 동작 시나리오 (Sequence Flow)

### 신규 사용자의 소셜 로그인
```mermaid
sequenceDiagram
    participant User as 사용자(브라우저)
    participant FE as 프론트엔드(Nginx)
    participant BE as 백엔드(Spring Boot)
    participant Google as Google 인증 서버
    participant Redis

    User->>+FE: 1. 'Google로 로그인' 클릭
    FE->>+BE: 2. /oauth2/authorization/google 요청
    BE->>+Google: 3. Google 로그인 페이지로 리다이렉트
    Google-->>-User: 4. Google 로그인 창 표시
    User->>+Google: 5. ID/PW 입력 및 인증
    Google-->>-BE: 6. 인증 코드(code)와 함께 /login/oauth2/code/google로 리다이렉트
    
    Note over BE: CustomOAuth2UserService 실행
    BE->>BE: 7. DB에서 이메일로 사용자 조회
    alt 신규 사용자인 경우
        BE->>BE: 8a. User 엔티티 생성 및 DB에 저장 (회원가입)
        BE->>BE: 9a. 회원가입 이벤트 발행 (포인트/뱃지 부여 등)
    else 기존 사용자인 경우
        BE->>BE: 8b. 기존 사용자 정보 로드
    end

    Note over BE: OAuth2AuthenticationSuccessHandler 실행
    BE->>BE: 10. Access/Refresh Token 생성 (by TokenProvider)
    BE->>+Redis: 11. Refresh Token 저장 (Key: "RT:[userId]")
    Redis-->>-BE: 12. 저장 완료
    
    BE-->>-User: 13. 토큰을 담아 프론트엔드로 리다이렉트<br>(.../oauth2/redirect?token=...)
    
    User->>+FE: 14. 리다이렉션 페이지 요청
    Note over User: 프론트, 토큰을 localStorage에 저장 후 메인 페이지로 이동
    
    User->>+FE: 15. (이후) API 요청 (Authorization: Bearer [Token])
    FE->>+BE: 16. API 요청 전달
    
    Note over BE: TokenAuthenticationFilter 실행
    BE->>BE: 17. 토큰 유효성 검증 (by TokenProvider)
    BE->>BE: 18. SecurityContext에 인증 정보 저장
    BE->>BE: 19. 컨트롤러 로직 실행
    BE-->>-User: 20. API 응답 반환
```
<br>

### 스터디 그룹 관리 (생성)
```mermaid
sequenceDiagram
    participant User as 사용자(브라우저)
    participant FE as 프론트엔드(React)
    participant API as API 게이트웨이(Nginx)
    participant Controller as StudyGroupController
    participant Service as StudyGroupService
    participant Repo as Repository (JPA)
    participant Event as ApplicationEventPublisher

    User->>+FE: 1. 스터디 정보 입력 후 '만들기' 클릭
    FE->>+API: 2. POST /api/studies (요청 DTO 전송)
    API->>+Controller: 3. createStudyGroup() 호출
    
    Note over Controller: @Valid로 DTO 유효성 검증
    Controller->>+Service: 4. createStudyGroup(request, userId) 호출
    
    Service->>+Repo: 5. findById(userId)로 User 엔티티 조회
    Repo-->>-Service: 6. User(리더) 정보 반환

    Note over Service: StudyGroup 엔티티 생성
    Service->>Service: 7. StudyGroup.builder()...build()

    Note over Service: 태그(Tag) 처리 (동적 생성 및 연결)
    loop 각 태그에 대하여
        Service->>Repo: 8. findByName(tagName)로 Tag 조회
        Note right of Repo: DB에 태그가 없으면 새로 생성 후 반환,<br>있으면 기존 태그 반환
        Repo->>Service: 9. Tag 엔티티 반환
        Service->>Service: 10. StudyGroupTag 중간 엔티티 생성 및 연결
    end
    
    Note over Service: 리더를 멤버로 자동 등록
    Service->>Service: 11. StudyMember 엔티티 생성 (Role: LEADER, Status: APPROVED)
    
    Service->>+Repo: 12. studyGroupRepository.save(studyGroup)
    Note over Repo: CascadeType.ALL 옵션으로<br/>StudyGroup, StudyMember, StudyGroupTag가<br/>하나의 트랜잭션으로 함께 저장됨
    Repo-->>-Service: 13. 저장된 StudyGroup 엔티티 반환

    Note over Service: 스터디 생성 이벤트 발행
    Service->>+Event: 14. eventPublisher.publishEvent(activityEvent)
    Event-->>-Service: 
    
    Service-->>-Controller: 15. 생성된 스터디 정보(DTO) 반환
    Controller-->>-API: 16. ResponseEntity (200 OK) 반환
    API-->>-FE: 17. API 응답 전달
    FE-->>-User: 18. 메인 페이지로 이동 또는 생성된 스터디 페이지로 이동
```
<br>

### 스터디 그룹 관리 (상세/목록 조회)
```mermaid
sequenceDiagram
    participant User as 사용자(브라우저)
    participant API as API(Nginx+Spring)
    participant Service as StudyGroupService
    participant Event as ApplicationEventPublisher
    participant Repo as Repository (JPA)
    participant Session as HttpSession

    User->>+API: 1. 특정 스터디 클릭 (GET /api/studies/{id})
    API->>+Service: 2. getStudyGroupDetail(id, userPrincipal) 호출
    
    Service->>+Repo: 3. studyGroupRepository.findById(id)
    Repo-->>-Service: 4. StudyGroup 엔티티 반환
    
    Note over Service: 조회수 중복 방지 로직 실행
    Service->>+Session: 5. 세션에서 해당 스터디의 마지막 조회 시간 확인
    alt 첫 조회 또는 1초 경과 후 조회
        Session-->>-Service: 6a. 시간이 없거나 오래됨
        Service->>Service: 7a. studyGroup.incrementViewCount() 호출
        Service->>+Session: 8a. 현재 시간을 세션에 기록
    else 1초 내 중복 조회
        Session-->>-Service: 6b. 시간이 얼마 지나지 않음
    end

    Note over Service: 사용자 관심사 분석을 위한 이벤트 발행
    Service->>+Event: 9. publishEvent(TagInteractionEvent)
    
    Note over Service: 현재 사용자의 '좋아요' 여부 확인
    Service->>+Repo: 10. studyLikeRepository.existsByUserAndStudyGroup(...)
    Repo-->>-Service: 11. boolean (true/false) 값 반환

    Service->>Service: 12. StudyGroupDetailResponse DTO로 변환
    Service-->>-API: 13. DTO 반환
    API-->>-User: 14. 상세 정보 응답 (JSON)
```
<br>

### 스터디 그룹 관리 (멤버 및 일정)
```mermaid
sequenceDiagram
    participant User as 참여 신청자
    participant Leader as 스터디장
    participant API as API(Nginx+Spring)
    participant Service as StudyGroupService
    participant Noti as NotificationService

    User->>+API: 1. '참여 신청' 버튼 클릭 (POST /api/studies/{id}/apply)
    API->>+Service: 2. applyToStudyGroup(studyId, applicantId) 호출

    Note over Service: 다양한 예외 조건 검증
    Service->>Service: 3. 스터디 모집 상태, 정원, 중복 신청 여부 등 확인
    
    Service->>Service: 4. StudyMember 엔티티 생성 (status: PENDING)
    Service->>Service: 5. studyGroup.addMember() 호출
    
    Service->>+Noti: 6. 스터디장에게 알림 생성 요청
    Noti-->>-Service: 7. 알림 생성 완료

    Service-->>-API: 8. 성공 응답 (200 OK)
    API-->>-User: 9. "신청이 완료되었습니다."

    Leader->>+API: 10. '신청 승인' 버튼 클릭 (PUT /api/studies/{id}/members/{userId}/status)
    API->>+Service: 11. updateStudyMemberStatus(..., newStatus: APPROVED) 호출

    Note over Service: 요청자가 스터디장인지 권한 확인
    Service->>Service: 12. memberToUpdate.updateStatus(APPROVED) 호출

    Service->>+Noti: 13. 신청자에게 '승인' 알림 생성 요청
    Noti-->>-Service: 14. 알림 생성 완료

    Service-->>-API: 15. 성공 응답 (200 OK)
    API-->>-Leader: 16. 멤버 목록 UI 업데이트
```
<br>

### 위치 기반 주변 스터디 조회 (지도 연동)
```mermaid
sequenceDiagram
    participant User as 사용자(브라우저)
    participant MapPage as 지도 페이지(React)
    participant API as API(Nginx+Spring)
    participant Controller as StudyGroupController
    participant Service as StudyGroupService
    participant Repo as StudyGroupRepository
    
    User->>+MapPage: 1. 주변 스터디 지도 페이지 접속
    MapPage->>+API: 2. GET /api/studies/map 요청
    API->>+Controller: 3. getStudiesForMap() 호출
    Controller->>+Service: 4. getStudiesForMap() 호출
    
    Note over Service: DB에서 지도에 표시할 스터디 필터링
    Service->>+Repo: 5. findByStatusAndStudyTypeInAndLatitudeIsNotNull() 호출
    Repo-->>-Service: 6. List<StudyGroup> 엔티티 목록 반환
    
    Note over Service: API 성능 최적화를 위한 DTO 변환
    Service->>Service: 7. 각 StudyGroup을 StudyForMapDto로 변환
    
    Service-->>-Controller: 8. List<StudyForMapDto> 반환
    Controller-->>-API: 9. ResponseEntity (200 OK) 반환
    API-->>-MapPage: 10. 스터디 위치 정보 목록 (JSON) 수신
    
    Note over MapPage: 카카오맵 API를 사용하여 마커 렌더링
    loop 각 스터디 정보에 대하여
        MapPage->>MapPage: 11. 지도 위에 마커(핀) 생성
    end
    MapPage-->>-User: 12. 주변 스터디가 표시된 지도 UI 제공
```
<br>

### 커뮤니티 게시판
```mermaid
sequenceDiagram
    participant User as 사용자
    participant Editor as TOAST UI Editor
    participant API as API(Nginx+Spring)
    participant Controller as BoardController
    participant Service as BoardService
    participant Redis as Redis
    participant Event as ApplicationEventPublisher

    User->>+Editor: 1. 게시글 내용 작성 및 이미지 삽입
    Editor->>+API: 2. (이미지 삽입 시) POST /api/images/upload
    API-->>-Editor: 3. 업로드된 이미지 URL 반환
    Editor-->>-User: 4. 본문에 이미지 렌더링
    
    User->>+API: 5. '작성 완료' 클릭 (POST /api/board/posts)
    API->>+Controller: 6. createPost() 호출
    Controller->>+Service: 7. createPost(request, userId) 호출
    
    Service->>Service: 8. BoardPost 엔티티 생성 및 저장
    Service->>+Event: 9. 게시글 작성 이벤트 발행 (포인트 부여 등)
    Service-->>-API: 10. 생성된 게시글 정보(DTO) 반환
    API-->>-User: 11. "작성 완료" 및 페이지 이동

    Note over User: 다른 사용자가 게시글에 '추천'을 누름
    User->>+API: 12. POST /api/board/posts/{id}/vote (voteType: LIKE)
    API->>+Controller: 13. voteForPost() 호출
    Controller->>+Service: 14. voteForPost(postId, userId, 'LIKE') 호출
    
    Service->>Service: 15. PostLike 엔티티 생성/수정/삭제 로직 처리
    Service->>Service: 16. BoardPost의 likeCount 업데이트
    
    Service->>+Redis: 17. ZINCRBY hot_posts 1 "postId" (핫 게시물 점수 1 증가)
    Redis-->>-Service: 18. 업데이트 완료
    
    Service->>+Event: 19. '좋아요 받음' 이벤트 발행 (작성자 포인트 부여)
    Service->>+API: 20. 알림 생성 요청 (NotificationService)
    Service-->>-API: 21. 성공 응답 (200 OK)
    API-->>-User: 22. UI 업데이트 (추천 버튼 활성화)
```
<br>

### 커뮤니티 게시판 (계층형 댓글)
```mermaid
sequenceDiagram
    participant User as 사용자
    participant API as API(Nginx+Spring)
    participant Controller as BoardController
    participant Service as BoardService
    participant Repo as Repository(JPA)
    participant Noti as NotificationService

    User->>+API: 1. '답글' 작성 후 제출 (POST /api/board/posts/{id}/comments)
    Note over API: Request Body: { content: "...", parentId: 123 }
    
    API->>+Controller: 2. createComment() 호출
    Controller->>+Service: 3. createComment(postId, request, authorId) 호출
    
    Service->>+Repo: 4. 게시글(BoardPost)과 작성자(User) 조회
    Repo-->>-Service: 5. 엔티티 반환

    Note over Service: parentId 유무로 대댓글 여부 판단
    Service->>+Repo: 6. boardCommentRepository.findById(request.getParentId())
    Repo-->>-Service: 7. 부모 댓글(parentComment) 엔티티 반환

    Service->>Service: 8. new BoardComment 생성 (parentComment 설정)
    Service->>+Repo: 9. boardCommentRepository.save(newComment)
    Repo-->>-Service: 10. 저장된 대댓글 엔티티 반환

    Service->>+Noti: 11. 부모 댓글 작성자에게 '답글' 알림 생성
    
    Service-->>-API: 12. 생성된 댓글 정보(DTO) 반환
    API-->>-User: 13. "답글 작성 완료"
```
<br>

### 커뮤니티 게시판 (핫 게시물 랭킹 시스템)
```mermaid
sequenceDiagram
    participant Scheduler as 스케줄러(@Scheduled)
    participant CacheService as BoardCacheService
    participant DB as MariaDB (Repository)
    participant Redis as Redis
    participant User as 사용자
    participant API as API
    participant BoardService as BoardService

    %% Caching Flow
    Scheduler->>+CacheService: 1. 10분마다 cacheHotPosts() 실행
    CacheService->>+DB: 2. findHotPosts() 쿼리 실행<br>(주간, 좋아요 N개 이상, 정렬)
    DB-->>-CacheService: 3. 핫 게시물 목록(List<BoardPost>) 반환
    CacheService->>+Redis: 4. 기존 캐시 삭제 (zSetOps.delete)
    loop 각 게시물에 대하여
        CacheService->>Redis: 5. zSetOps.add("hot_posts", postId, likeCount)
    end
    Redis-->>-CacheService: 6. 캐싱 완료
    CacheService-->>-Scheduler: 7. 작업 종료

    %% Reading Flow
    User->>+API: 8. 메인 페이지 접속 (GET /api/board/posts/hot)
    API->>+BoardService: 9. getHotPosts() 호출
    BoardService->>+Redis: 10. zSetOps.reverseRange("hot_posts", 0, 2)
    Redis-->>-BoardService: 11. 상위 3개 게시물 ID 목록 반환
    BoardService->>+DB: 12. findAllById(idList) 로 게시물 상세 정보 조회 (IN 쿼리)
    DB-->>-BoardService: 13. List<BoardPost> 반환
    BoardService->>BoardService: 14. DTO로 변환
    BoardService-->>-API: 15. 핫 게시물 목록(JSON) 응답
    API-->>-User: 16. UI 렌더링
```
<br>

### 사용자 활동과 비동기 보상 처리
```mermaid
sequenceDiagram
    participant User as 사용자
    participant API as API(Nginx+Spring)
    participant BoardService as BoardService
    participant EventPublisher as ApplicationEventPublisher
    participant ActivityListener as UserActivityService

    User->>+API: 1. 게시글 작성 요청 (POST /api/board/posts)
    API->>+BoardService: 2. createPost() 호출
    
    Note over BoardService: 메인 트랜잭션 시작
    BoardService->>BoardService: 3. BoardPost 엔티티 생성 및 저장
    Note over BoardService: 메인 트랜잭션 성공 및 커밋 직전

    BoardService->>+EventPublisher: 4. publishEvent(UserActivityEvent)
    Note over EventPublisher: 트랜잭션 커밋 후 이벤트 전파
    
    BoardService-->>-API: 5. 게시글 생성 완료 응답 (즉시)
    API-->>-User: 6. "작성 완료"
    
    EventPublisher-->>+ActivityListener: 7. @TransactionalEventListener가 이벤트 수신
    Note over ActivityListener: 별도의 스레드(@Async)에서 새로운 트랜잭션 시작
    
    ActivityListener->>ActivityListener: 8. user.addPoint() 호출 (포인트 부여)
    ActivityListener->>ActivityListener: 9. checkAndAwardBadges() 호출 (뱃지 조건 확인)
    alt '첫 게시글 작성' 조건 만족 시
        ActivityListener->>ActivityListener: 10a. awardBadge(user, "FIRST_POST")
    end
    Note over ActivityListener: 보상 트랜잭션 커밋
```
<br>

### 사용자 신고 및 관리자 처리
```mermaid
sequenceDiagram
    participant User as 사용자
    participant API as API(Nginx+Spring)
    participant ReportController as ReportController
    participant ReportService as ReportService
    participant Admin as 관리자
    participant AdminController as AdminController
    participant AdminService as AdminService
    
    %% Reporting Flow
    User->>+API: 1. '신고' 버튼 클릭 (POST /api/reports)
    API->>+ReportController: 2. createReport() 호출
    ReportController->>+ReportService: 3. createReport(dto, reporterId) 호출
    Note over ReportService: 신고 대상 작성자(reportedUser) 조회
    ReportService->>ReportService: 4. Report 엔티티 생성 (status: RECEIVED) 및 저장
    ReportService-->>-API: 5. 성공 응답 (200 OK)
    API-->>-User: 6. "신고가 접수되었습니다."

    %% Admin Processing Flow
    Admin->>+API: 7. 관리자 페이지에서 신고 목록 조회 (GET /api/admin/reports)
    API->>+AdminController: 8. getReports() 호출
    AdminController->>+AdminService: 9. getReports(pageable) 호출
    Note over AdminService: 각 신고 대상의 콘텐츠 미리보기 생성
    AdminService-->>-API: 10. ReportDetailDto 목록 반환
    API-->>-Admin: 11. 신고 목록 렌더링
    
    Admin->>+API: 12. 특정 게시글 '숨김' 처리 클릭 (POST /api/admin/posts/{id}/blind)
    API->>+AdminController: 13. blindPost() 호출
    AdminController->>+AdminService: 14. blindPost(postId) 호출
    Note over AdminService: Repository의 @Modifying 쿼리 실행
    AdminService-->>-API: 15. 성공 응답 (200 OK)
    
    Admin->>+API: 16. 신고 건 상태 변경 (PATCH /api/admin/reports/{id})
    API->>+AdminController: 17. processReport() 호출
    AdminController->>+AdminService: 18. processReport(reportId, dto) 호출
    Note over AdminService: Report 상태를 'COMPLETED'로 변경
    AdminService-->>-API: 19. 성공 응답 (200 OK)
    API-->>-Admin: 20. UI 업데이트 (신고 상태 변경)
```
<br>

### 실시간 채팅 및 DM 시스템 (WebSocket & STOMP)
```mermaid
sequenceDiagram
    participant UserA as 사용자 A
    participant UserB as 사용자 B
    participant Server as 백엔드 서버
    participant MsgController as ChatMessageController
    participant ChatService as ChatService
    participant MsgBroker as STOMP 브로커

    Note over UserA, UserB: 페이지 진입 시, WebSocket 연결 및 채팅방 구독
    UserA->>Server: 1. CONNECT /ws-stomp (with JWT)
    UserB->>Server: 2. CONNECT /ws-stomp (with JWT)
    Server->>UserA: 3. CONNECTED
    Server->>UserB: 4. CONNECTED
    UserA->>Server: 5. SUBSCRIBE /sub/chat/room/{id}
    UserB->>Server: 6. SUBSCRIBE /sub/chat/room/{id}

    Note over UserA: 메시지 입력 후 '전송'
    UserA->>+Server: 7. SEND /pub/chat/room/{id}/message (메시지 페이로드)
    
    Server->>+MsgController: 8. @MessageMapping 핸들러 호출
    MsgController->>+ChatService: 9. processAndSendMessage() 호출
    
    ChatService->>ChatService: 10. 메시지 DB에 저장 (ChatMessage)
    ChatService->>ChatService: 11. 채팅방 마지막 메시지 정보 업데이트 (ChatRoom)
    
    ChatService->>+MsgBroker: 12. convertAndSend("/sub/chat/room/{id}", messageDto)
    
    MsgBroker-->>UserA: 13. [PUSH] 메시지 브로드캐스트
    MsgBroker-->>UserB: 14. [PUSH] 메시지 브로드캐스트
    
    ChatService-->>-MsgController: 15. 처리 완료
    
    # 마지막 라인 MsgController-->>-Server: 를 삭제했습니다.
```
<br>

### 실시간 알림 시스템 (Server-Sent Events)
```mermaid
sequenceDiagram
    participant UserA as 댓글 작성자
    participant UserB as 게시글 작성자
    participant API as API(Nginx+Spring)
    participant BoardService as BoardService
    participant NotiService as NotificationService
    participant SseService as SseEmitterService

    Note over UserB: 페이지 접속 시, SSE 구독 요청
    UserB->>+API: 1. GET /api/notifications/subscribe
    API->>+SseService: 2. subscribe(userB_Id) 호출
    Note over SseService: UserB를 위한 SseEmitter 생성 및<br>Map에 저장, 하트비트 시작
    SseService-->>-API: 3. SseEmitter 객체 반환
    API-->>-UserB: 4. SSE 연결 수립 (HTTP Streaming)

    UserA->>+API: 5. 댓글 작성 요청 (POST /api/board/posts/{id}/comments)
    API->>+BoardService: 6. createComment() 호출
    
    BoardService->>BoardService: 7. 댓글 생성 및 DB 저장
    
    Note over BoardService: 알림 생성 로직 호출
    BoardService->>+NotiService: 8. createNotification(sender:UserA, receiver:UserB, ...) 호출
    
    NotiService->>NotiService: 9. Notification 엔티티 생성 및 DB 저장
    NotiService->>+SseService: 10. sendToClient(userB_Id, "new-notification", data) 호출
    
    Note over SseService: UserB의 Emitter를 Map에서 조회
    SseService-->>UserB: 11. [PUSH] "new-notification" 이벤트 전송
    Note over UserB: 프론트엔드, 스낵바 또는 알림 UI 렌더링
    
    NotiService-->>-BoardService: 12. 알림 생성 완료
    BoardService-->>-API: 13. 댓글 생성 완료 응답
    API-->>-UserA: 14. "댓글 작성 완료"
```

<br>

## 🚀 기술적 도전 및 최적화 경험

본 프로젝트는 단순히 기능을 구현하는 것을 넘어, 실제 서비스 환경에서 발생할 수 있는 문제들을 예측하고 해결하는 데 중점을 두었습니다.

### 1. Redis를 활용한 성능 최적화
RDBMS의 부하를 줄이고 사용자 응답 속도를 향상시키기 위해, 데이터의 특성에 따라 Redis를 다각도로 활용했습니다.
- **Refresh Token 저장소**: 빈번한 인증 I/O 작업을 DB에서 분리하고, Redis의 TTL을 이용해 만료된 토큰을 자동 관리함으로써 인증 성능과 운영 효율성을 높였습니다.
- **읽기 성능 최적화 (Look-Aside Caching)**: 반복 조회되는 스터디/게시글 상세 정보에 Spring Cache(`@Cacheable`, `@CacheEvict`)를 적용하여 DB 부하를 줄이고 응답 속도를 개선했습니다. 데이터 변경 시 캐시를 동기화하는 전략을 구현했습니다.
- **랭킹보드 캐싱**: 집계 연산이 많은 '핫 게시물' 목록을 `@Scheduled`를 통해 주기적으로 미리 계산하고, Redis의 **Sorted Set(ZSET)** 에 저장하여 DB 접근 없이 매우 빠른 랭킹 조회가 가능하도록 설계했습니다.

### 2. 이벤트 기반 비동기 아키텍처
사용자의 활동(글 작성, 스터디 생성 등)에 따른 부가적인 작업(포인트 부여, 뱃지 수여, 활동 피드 생성)을 비동기적으로 처리하기 위해 Spring의 **`ApplicationEventPublisher`** 를 도입했습니다.
- `@TransactionalEventListener`와 `@Async`를 조합하여, 메인 트랜잭션이 성공적으로 커밋된 후에만 별도의 스레드에서 부가 작업을 실행하도록 보장했습니다.
- 이를 통해 **메인 요청의 응답 시간을 단축** 하고, 부가 기능의 실패가 원래의 비즈니스 로직에 영향을 주지 않는 **안정적이고 확장 가능한 시스템**을 구축했습니다.

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
- **Database**: `MariaDB`, `Redis`
- **Data-Access**: `Spring Data JPA` (Hibernate)
- **Security**: `Spring Security`, `OAuth2`, `JWT (jjwt)`
- **Real-time**: `Spring WebSocket` (with `STOMP`), `Server-Sent Events (SSE)`
- **DevOps**: `Docker`, `Docker Compose`, `Github Actions`
- **Cloud**: `Oracle Cloud Infrastructure (OCI) - Compute, VCN`
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
- **Deployment**: `Oracle Cloud Infrastructure (OCI)`

<br>

## 🏛️ 아키텍처 & ERD

```mermaid
erDiagram
    %% --- Central Entity: User ---
    USER {
        Long id PK
        String email
        String name
        String profile
        Role role
        AuthProvider provider
        int point
        int level
    }

    %% --- User and Authentication ---
    REFRESH_TOKEN {
        Long id PK
        Long userId FK
        String token
    }
    USER ||--o{ REFRESH_TOKEN : "has one"

    %% --- User and Badge (M:N) ---
    BADGE {
        Long id PK
        String name
        String description
        String imageUrl
    }
    USER_BADGE {
        Long id PK
        Long user_id FK
        Long badge_id FK
    }
    USER ||--|{ USER_BADGE : "has many"
    BADGE ||--|{ USER_BADGE : "has many"

    %% --- User and Friendship (Self-referencing M:N) ---
    FRIENDSHIP {
        Long id PK
        Long user_id FK "requests"
        Long friend_id FK "receives"
        FriendshipStatus status
    }
    USER ||--o{ FRIENDSHIP : "sends"
    USER ||--o{ FRIENDSHIP : "receives"

    %% --- User and Feed/Notification ---
    FEED {
        Long id PK
        Long owner_id FK "is owned by"
        Long actor_id FK "is acted by"
        ActivityType activityType
        Long referenceId
    }
    NOTIFICATION {
        Long id PK
        Long receiver_id FK "receives"
        Long sender_id FK "is sent by"
        NotificationType type
        Long referenceId
    }
    USER ||--o{ FEED : "owns"
    USER ||--o{ FEED : "acts in"
    USER ||--o{ NOTIFICATION : "receives"
    USER ||--o{ NOTIFICATION : "sends"

    %% --- User and Report ---
    REPORT {
        Long id PK
        Long reporter_id FK "reports"
        Long reported_user_id FK "is reported"
        ReportType reportType
        Long targetId
    }
    USER ||--o{ REPORT : "reports"
    USER ||--o{ REPORT : "is reported in"

    %% --- StudyGroup and related entities ---
    STUDY_GROUP {
        Long id PK
        Long leader_id FK
        String title
        StudyCategory category
        int maxMembers
        StudyStatus status
        StudyType studyType
        Double latitude
        Double longitude
    }
    USER ||--o{ STUDY_GROUP : "leads"

    %% --- StudyGroup and User (M:N via StudyMember) ---
    STUDY_MEMBER {
        Long id PK
        Long user_id FK
        Long study_group_id FK
        StudyMemberRole role
        StudyMemberStatus status
    }
    USER ||--|{ STUDY_MEMBER : "participates in"
    STUDY_GROUP ||--|{ STUDY_MEMBER : "has"

    %% --- StudyGroup and Tag (M:N via StudyGroupTag) ---
    TAG {
        Long id PK
        String name
    }
    STUDY_GROUP_TAG {
        Long id PK
        Long study_group_id FK
        Long tag_id FK
    }
    STUDY_GROUP ||--|{ STUDY_GROUP_TAG : "has"
    TAG ||--|{ STUDY_GROUP_TAG : "is tagged on"
    
    %% --- User and Tag Preference (M:N) ---
    USER_TAG_PREFERENCE {
        Long id PK
        Long user_id FK
        Long tag_id FK
        int score
    }
    USER ||--|{ USER_TAG_PREFERENCE : "has preference for"
    TAG ||--|{ USER_TAG_PREFERENCE : "is preferred by"

    %% --- StudyGroup and other entities ---
    STUDY_LIKE {
        Long id PK
        Long user_id FK
        Long study_group_id FK
    }
    STUDY_SCHEDULE {
        Long id PK
        Long study_group_id FK
        String title
        LocalDateTime startTime
        LocalDateTime endTime
    }
    USER ||--o{ STUDY_LIKE : "likes"
    STUDY_GROUP ||--o{ STUDY_LIKE : "is liked by"
    STUDY_GROUP ||--o{ STUDY_SCHEDULE : "has"
    
    %% --- Board and related entities ---
    BOARD_POST {
        Long id PK
        Long author_id FK
        BoardCategory category
        String title
        int viewCount
        int likeCount
    }
    USER ||--o{ BOARD_POST : "authors"
    
    BOARD_COMMENT {
        Long id PK
        Long board_post_id FK
        Long author_id FK
        Long parent_comment_id FK "replies to"
        int likeCount
    }
    BOARD_POST ||--o{ BOARD_COMMENT : "has"
    USER ||--o{ BOARD_COMMENT : "authors"
    BOARD_COMMENT ||--o{ BOARD_COMMENT : "has reply"

    POST_LIKE {
        Long id PK
        Long user_id FK
        Long board_post_id FK
        VoteType voteType
    }
    USER ||--o{ POST_LIKE : "votes on"
    BOARD_POST ||--o{ POST_LIKE : "is voted on by"

    COMMENT_LIKE {
        Long id PK
        Long user_id FK
        Long board_comment_id FK
        VoteType voteType
    }
    USER ||--o{ COMMENT_LIKE : "votes on"
    BOARD_COMMENT ||--o{ COMMENT_LIKE : "is voted on by"
    
    %% --- Chat and DM entities ---
    CHAT_ROOM {
        Long id PK
        Long study_group_id FK
        String name
    }
    STUDY_GROUP ||--o{ CHAT_ROOM : "has"

    CHAT_ROOM_MEMBER {
        Long id PK
        Long chat_room_id FK
        Long user_id FK
        ChatRoomMemberStatus status
    }
    CHAT_ROOM ||--|{ CHAT_ROOM_MEMBER : "has"
    USER ||--|{ CHAT_ROOM_MEMBER : "is in"
    
    CHAT_MESSAGE {
        Long id PK
        Long chat_room_id FK
        Long sender_id FK
        MessageType messageType
    }
    CHAT_ROOM ||--o{ CHAT_MESSAGE : "has"
    USER ||--o{ CHAT_MESSAGE : "sends"
    
    DM_ROOM {
        Long id PK
        Long user1_id FK
        Long user2_id FK
    }
    USER ||--o{ DM_ROOM : "participates in (as user1)"
    USER ||--o{ DM_ROOM : "participates in (as user2)"

    DM_MESSAGE {
        Long id PK
        Long dm_room_id FK
        Long sender_id FK
    }
    DM_ROOM ||--o{ DM_MESSAGE : "has"
    USER ||--o{ DM_MESSAGE : "sends"
```

<br>

## 🚀 시작하기 (Getting Started)

"Having" 애플리케이션은 **Docker**를 사용하여 어떤 개발 환경에서든 명령어 하나로 쉽게 전체 서비스를 실행할 수 있도록 구성되었습니다. 로컬 컴퓨터에 Java, Node.js, MariaDB, Redis를 직접 설치할 필요가 없습니다.

### Prerequisites (필수 요구사항)

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (최신 버전 설치 권장)
- [Git](https://git-scm.com/)

### Installation & Run

#### 1단계: 프로젝트 소스 코드 복제 (Clone)

먼저, 터미널을 열고 원하는 디렉토리에서 아래 명령어를 실행하여 GitHub 레포지토리를 복제합니다.

```bash
git clone https://github.com/[YOUR_GITHUB_ID]/having.git](https://github.com/suho149/study_group_having.git
cd study_group_having
```

<br>

#### 2단계: 환경 변수 설정 (`.env` 파일 생성)

프로젝트를 실행하기 위해서는 데이터베이스 비밀번호, 구글 OAuth2 클라이언트 ID/Secret, JWT 시크릿 키 등 민감한 정보들이 필요합니다. 이러한 정보들은 보안을 위해 `.env` 파일에서 관리합니다.

1. 프로젝트의 루트 디렉토리(최상위 폴더)에 `.env` 라는 이름으로 새 파일을 생성합니다.
2. 아래 **코드 블록 전체**를 복사하여 새로 만든 `.env` 파일에 붙여넣습니다.
3. `#`으로 설명된 부분을 참고하여, `your_...` 로 표시된 곳을 **자신의 실제 값으로 모두 채워주세요.**

```dotenv
# .env

# --- Docker Compose에서 사용할 데이터베이스 비밀번호 ---
# MariaDB 컨테이너의 root 계정 비밀번호로 사용됩니다.
COMPOSE_DB_PASSWORD=your_strong_db_password

# --- JWT(JSON Web Token) 시크릿 키 ---
# 64바이트 이상의 매우 긴 무작위 문자열을 권장합니다.
COMPOSE_JWT_SECRET=your_super_long_and_random_jwt_secret_key

# --- Google OAuth2 클라이언트 정보 ---
# (아래 가이드 참고하여 발급)
COMPOSE_GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
COMPOSE_GOOGLE_CLIENT_SECRET=your_google_client_secret_code

# --- 프론트엔드에서 사용할 카카오맵 API 키 ---
# (아래 가이드 참고하여 발급)
COMPOSE_REACT_APP_KAKAO_MAP_API_KEY=your_kakao_maps_javascript_api_key

# --- 이메일 발송을 위한 Gmail 계정 정보 (선택 사항) ---
# 2단계 인증을 사용하는 경우 '앱 비밀번호'를 발급받아 사용해야 합니다.
COMPOSE_GMAIL_USERNAME=your_gmail_address@gmail.com
COMPOSE_GMAIL_APP_PASSWORD=your_gmail_app_password
```

<br>

#### 3단계: 애플리케이션 실행

모든 설정이 완료되었습니다. 터미널에서 아래 명령어 하나만 실행하면, Docker가 모든 서비스(백엔드, 프론트엔드, DB, Redis)를 자동으로 빌드하고 실행합니다.

```bash
docker-compose up --build
```
> **참고:** 최초 실행 시에는 `--build` 옵션으로 이미지를 생성해야 하며, 몇 분 정도 소요될 수 있습니다. 이후 다시 실행할 때는 `docker-compose up`만 입력하면 기존 이미지를 재사용하여 더 빠르게 시작할 수 있습니다.

여러 서비스의 로그가 터미널에 출력되다가, 에러 없이 안정화되면 모든 준비가 완료된 것입니다.

<br>

#### 4단계: 서비스 접속

웹 브라우저를 열고 아래 주소로 접속하여 "Having" 서비스를 확인해보세요.

- **`http://localhost:3000`**

<br>

### 애플리케이션 종료

프로젝트 실행을 종료하고 싶을 때는, `docker-compose up` 명령어를 실행했던 터미널에서 `Ctrl + C`를 누릅니다. 모든 컨테이너가 함께 안전하게 종료됩니다. 만약 백그라운드에서 실행했다면(`-d` 옵션), `docker-compose down` 명령어로 종료할 수 있습니다.

---

### ※ 참고: API 키 발급 가이드

#### Google OAuth 2.0 클라이언트 ID 및 시크릿 발급 방법

1. [Google Cloud Console](https://console.cloud.google.com/)에 접속하여 새 프로젝트를 생성합니다.
2. `API 및 서비스` > `사용자 인증 정보` 메뉴로 이동합니다.
3. `+ 사용자 인증 정보 만들기` > `OAuth 클라이언트 ID`를 선택합니다.
4. 애플리케이션 유형을 `웹 애플리케이션`으로 선택합니다.
5. `승인된 리디렉션 URI` 섹션에서 `+ URI 추가` 버튼을 누르고 아래 주소를 입력합니다.
    - `http://localhost:8080/login/oauth2/code/google`
6. `만들기` 버튼을 누르면 **클라이언트 ID**와 **클라이언트 보안 비밀**이 발급됩니다. 이 값들을 `.env` 파일에 각각 입력합니다.

<br>

#### Kakao Maps API JavaScript 키 발급 방법

1. [Kakao Developers](https://developers.kakao.com/)에 로그인하고 `내 애플리케이션`으로 이동합니다.
2. `+ 애플리케이션 추가하기`를 통해 새 앱을 생성합니다.
3. 생성된 앱을 선택하고, `앱 설정` > `플랫폼` 메뉴로 이동합니다.
4. `Web 플랫폼 등록` 버튼을 누르고, `사이트 도메인`에 `http://localhost:3000`을 등록합니다.
5. `앱 설정` > `요약 정보` 메뉴로 이동하여, **JavaScript 키**를 복사합니다.
6. 복사한 키를 `.env` 파일의 `COMPOSE_REACT_APP_KAKAO_MAP_API_KEY` 값으로 입력합니다.

---
