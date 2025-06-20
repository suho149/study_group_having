/**
 * 스터디 목록 조회 시 사용되는 요약 정보 타입.
 * (GET /api/studies, /api/users/me/liked-studies 등)
 */
export interface StudyGroupResponse {
    id: number;
    title: string;
    studyType: 'STUDY' | 'PROJECT'; // 백엔드 Enum에 따라 추가 가능
    status: 'RECRUITING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
    currentMembers: number;
    maxMembers: number;
    tags: string[];
    createdAt: string; // ISO 8601 형식의 날짜 문자열
    viewCount: number;
    likeCount: number;
    liked: boolean; // 현재 로그인한 사용자의 좋아요 여부
}

export interface StudyMember {
    id: number; // 사용자(User)의 ID
    name: string;
    profile: string; // 프로필 이미지 URL (백엔드 응답 필드명과 일치해야 함, 예: user.profile)
    email: string;
    role: 'LEADER' | 'MEMBER';
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
}

export interface StudyLeaderInfo { // 리더 정보 타입 분리 (선택 사항)
    id: number;
    name: string;
    imageUrl: string; // 백엔드 응답 필드명과 일치해야 함 (예: leader.profileImageUrl 또는 leader.profile)
}

export interface StudyGroupDataType { // 이름을 StudyGroupDetail에서 변경하여 컴포넌트와 구분
    id: number;
    title: string;
    description: string;
    maxMembers: number;
    currentMembers: number;
    status: string;
    studyType: string;
    location: string;
    startDate: string; // ISO 날짜 문자열 형식
    endDate: string;   // ISO 날짜 문자열 형식
    tags: string[];
    viewCount: number;
    leader: StudyLeaderInfo;
    likeCount: number;
    liked: boolean; // 현재 사용자가 이 스터디를 좋아했는지 여부
    members: StudyMember[];
    isBlinded: boolean;
}

export enum StudyMemberRole {
    LEADER = 'LEADER',
    MEMBER = 'MEMBER',
}

// 목록 조회 시 사용될 간략한 스터디 정보 타입 (Home.tsx의 StudyGroup 인터페이스 대체 가능)
export interface StudyGroupSummary {
    id: number;
    title: string;
    studyType: 'PROJECT' | 'STUDY';
    tags: string[];
    createdAt: string;
    currentMembers: number;
    maxMembers: number;
    status: string;
    viewCount: number;
    likeCount: number;
    liked: boolean;
}

/**
 * 스터디 일정 정보 타입.
 * (GET /api/studies/{id}/schedules 응답)
 */
export interface StudySchedule {
    id: number;
    title: string;
    content: string | null;
    startTime: string; // ISO 8601 형식
    endTime: string;   // ISO 8601 형식
}

/**
 * FullCalendar 라이브러리가 사용하는 이벤트 객체 형식.
 * API 응답을 이 형식으로 변환하여 캘린더에 전달합니다.
 */
export interface CalendarEvent {
    id: string; // FullCalendar는 id를 문자열로 다루는 것이 편리
    title: string;
    start: string;
    end: string;
    extendedProps: {
        content: string | null;
    };
}

/**
 * 지도 위에 표시될 스터디의 최소 정보 타입.
 * (GET /api/studies/map 응답)
 */
export interface StudyForMap {
    id: number;
    title: string;
    latitude: number;
    longitude: number;
}