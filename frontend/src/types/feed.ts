// 백엔드의 ActivityType Enum과 일치해야 함
export type ActivityType =
    | 'CREATE_STUDY'
    | 'CREATE_POST'
// ... 기타 필요한 활동 타입

export interface FeedResponseDto {
    id: number;
    actorName: string;
    actorProfileUrl?: string; // 프로필은 없을 수도 있으므로 optional
    activityType: ActivityType;
    referenceId: number;
    referenceContent: string;
    isRead: boolean;
    createdAt: string; // ISO 8601 형식의 날짜 문자열
}
