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