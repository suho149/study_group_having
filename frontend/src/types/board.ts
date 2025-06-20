import { BoardCategory, VoteType } from './apiSpecificEnums'; // 백엔드 BoardCategory Enum과 동일하게

// 사용자 요약 정보 (댓글 작성자 등 간략한 정보 표시에 사용)
export interface UserSummaryDto {
    id: number;
    name: string;
    profileImageUrl?: string;
}

// 첨부 파일 정보 DTO (게시글 상세에 포함될 수 있음)
export interface AttachmentDto {
    id: number;
    originalFileName: string;
    fileUrl: string; // 실제 파일 접근 URL
    fileType?: string; // 예: "image/jpeg", "application/pdf"
    fileSize?: number; // 바이트 단위
}

// 댓글 정보 DTO
export interface CommentDto {
    id: number;
    content: string;
    author: UserSummaryDto; // 댓글 작성자 정보
    createdAt: string; // ISO 8601 날짜/시간 문자열
    modifiedAt: string; // ISO 8601 날짜/시간 문자열
    likeCount: number;
    dislikeCount: number;
    likedByCurrentUser?: boolean; // 현재 사용자가 이 댓글을 추천했는지
    dislikedByCurrentUser?: boolean; // 현재 사용자가 이 댓글을 비추천했는지
    parentId?: number | null; // 대댓글인 경우 부모 댓글 ID
    children?: CommentDto[]; // 대댓글 목록 (계층 구조로 받을 경우)
    isDeleted?: boolean; // 삭제된 댓글인지 여부
    isBlinded: boolean;
}

// 댓글 생성 요청 DTO 타입
export interface CommentCreateRequestDto {
    content: string;
    parentId?: number | null; // 대댓글 작성 시 부모 댓글의 ID (선택적)
}

// 게시글 상세 정보 응답 DTO
export interface BoardPostResponseDto {
    id: number;
    category: BoardCategory | string; // 백엔드에서 Enum 문자열로 내려옴
    title: string;
    content: string; // HTML 또는 Markdown 형식일 수 있음
    author: UserSummaryDto; // 게시글 작성자 정보 (UserSummaryDto 재활용)
    createdAt: string; // ISO 8601 날짜/시간 문자열
    modifiedAt: string; // ISO 8601 날짜/시간 문자열
    viewCount: number;
    likeCount: number;
    dislikeCount: number; // 비추천 기능 구현 시
    commentCount: number; // 댓글 수 (백엔드에서 계산된 값)
    likedByCurrentUser: boolean; // 현재 로그인한 사용자가 이 게시글을 추천했는지
    dislikedByCurrentUser: boolean; // 현재 로그인한 사용자가 이 게시글을 비추천했는지
    attachments?: AttachmentDto[]; // 첨부파일 목록 (선택적)
    isBlinded: boolean;
    // comments?: CommentDto[]; // 초기 댓글 목록을 함께 내려줄 경우 (페이징 별도 권장)
}

export interface BoardPostSummary {
    id: number;
    category: BoardCategory | string; // 백엔드에서 Enum 문자열로 내려옴
    title: string;
    authorName: string;
    authorProfileImageUrl?: string; // 작성자 프로필 이미지 (선택적)
    createdAt: string; // ISO 8601 날짜 문자열
    viewCount: number;
    likeCount: number;
    commentCount: number;
    thumbnailUrl?: string; // 게시글 대표 이미지 URL (첫 번째 첨부 이미지 등)
    likedByCurrentUser?: boolean; // 목록에서도 좋아요 여부 표시 가능
    // isHot?: boolean; // 핫 게시물 여부 (백엔드에서 내려줄 수도 있음)
}