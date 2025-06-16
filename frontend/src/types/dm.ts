// DM 채팅방 목록 아이템
import {UserSummaryDto} from "./user";

export interface DmRoomInfo {
    roomId: number;
    partner: UserSummaryDto; // 채팅 상대방 정보
    lastMessage: string | null;
    lastMessageTime: string | null; // ISO 8601 형식
}

// DM 메시지 전송 요청
export interface DmMessageSendRequest {
    content: string;
}

// DM 메시지 응답
export interface DmMessageResponse {
    messageId: number;
    roomId: number;
    sender: UserSummaryDto;
    content: string;
    sentAt: string; // ISO 8601 형식
    isRead: boolean;
}