/**
 * 다른 DTO에서 사용자를 요약하여 보여줄 때 사용되는 타입
 * (예: 게시글 작성자, 채팅방 멤버 등)
 */
export interface UserSummaryDto {
    id: number;
    name: string;
    profileImageUrl?: string;
}


/**
 * 사용자 검색 API(GET /api/users/search)의 응답 항목 타입
 */
export interface UserSearchResponse {
    id: number;
    name: string;
    email: string;
    profile: string; // 백엔드 DTO 필드명에 맞춤 (profileImageUrl이 아님)
}

/**
 * 내 프로필 정보 API(GET /api/users/me)의 응답 타입
 */
export interface UserProfile {
    id: number;
    name: string;
    email: string;
    profileImageUrl?: string;
    createdAt: string;
    point: number;
    level: number;
}