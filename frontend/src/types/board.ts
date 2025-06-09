import { BoardCategory } from './apiSpecificEnums'; // 백엔드 BoardCategory Enum과 동일하게

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
    // isHot?: boolean; // 핫 게시물 여부 (백엔드에서 내려줄 수도 있음)
}