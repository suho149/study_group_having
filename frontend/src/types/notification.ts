// 백엔드 NotificationType Enum과 일치해야 함
export type NotificationTypeStrings =
    | 'STUDY_INVITE'
    | 'INVITE_ACCEPTED'
    | 'INVITE_REJECTED'
    | 'STUDY_JOIN_REQUEST'
    | 'JOIN_APPROVED'
    | 'JOIN_REJECTED'
    | 'MEMBER_LEFT_STUDY'
    | 'MEMBER_REMOVED_BY_LEADER'
    | 'LEADER_REMOVED_MEMBER'
    | 'CHAT_INVITE'
    | 'CHAT_MEMBER_REMOVED';
// ... 기타 필요한 알림 타입

export interface Notification {
    id: number;
    message: string;
    type: NotificationType;
    senderName: string; // 백엔드 NotificationResponse DTO 확인 (sender.name을 의미)
    referenceId: number | null; // null일 수도 있음을 고려
    isRead: boolean;
    createdAt: string; // ISO 8601 날짜/시간 문자열
}

// 백엔드 Enum과 1:1로 매칭되는 프론트엔드용 TypeScript Enum
export enum NotificationType {
    STUDY_INVITE = 'STUDY_INVITE',
    INVITE_ACCEPTED = 'INVITE_ACCEPTED',
    INVITE_REJECTED = 'INVITE_REJECTED',
    STUDY_JOIN_REQUEST = 'STUDY_JOIN_REQUEST',
    JOIN_APPROVED = 'JOIN_APPROVED',
    JOIN_REJECTED = 'JOIN_REJECTED',
    MEMBER_LEFT_STUDY = 'MEMBER_LEFT_STUDY',
    MEMBER_REMOVED_BY_LEADER = 'MEMBER_REMOVED_BY_LEADER',
    LEADER_REMOVED_MEMBER = 'LEADER_REMOVED_MEMBER',
    CHAT_INVITE = 'CHAT_INVITE',
    CHAT_MEMBER_REMOVED = 'CHAT_MEMBER_REMOVED',
    CHAT_INVITE_AGAIN = 'CHAT_INVITE_AGAIN',
}