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
    members: StudyMember[];
}