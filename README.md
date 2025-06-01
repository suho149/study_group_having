# Having - IT 스터디 그룹 플랫폼

Having은 IT 분야의 스터디와 프로젝트를 찾고 참여할 수 있는 플랫폼입니다.

## 기술 스택

### 백엔드
- Java 17
- Spring Boot 3.x
- Spring Security
- Spring Data JPA
- MySQL
- Gradle

### 프론트엔드
- React
- TypeScript
- Material-UI (MUI)
- Axios

## 주요 기능

- OAuth2.0을 이용한 소셜 로그인 (Google)
- 스터디/프로젝트 그룹 생성 및 관리
- 키워드 기반 스터디/프로젝트 검색
- 태그 기반 분류 시스템
- 실시간 알림 시스템 (개발 예정)

## 시작하기

### 백엔드 실행
```bash
cd backend
./gradlew bootRun
```

### 프론트엔드 실행
```bash
cd frontend
npm install
npm start
```

## 환경 설정

### 백엔드 설정
`application.yml` 파일에서 다음 설정이 필요합니다:
- 데이터베이스 연결 정보
- OAuth2.0 클라이언트 정보
- JWT 시크릿 키

### 프론트엔드 설정
`.env` 파일에서 다음 설정이 필요합니다:
- API 엔드포인트 URL
- OAuth2.0 리다이렉트 URL

## 기여하기

프로젝트에 기여하고 싶으시다면 다음 절차를 따라주세요:
1. 이 저장소를 포크합니다
2. 새로운 브랜치를 생성합니다
3. 변경사항을 커밋합니다
4. 브랜치에 푸시합니다
5. Pull Request를 생성합니다

## 라이선스

이 프로젝트는 MIT 라이선스를 따릅니다. 