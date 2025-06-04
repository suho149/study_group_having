import { MessageType } from './apiSpecificEnums';
import {UserSummaryDto} from "./user"; // 백엔드 Enum과 맞춤

// 채팅방 멤버 정보를 위한 타입 (백엔드 ChatRoomMemberInfoDto와 일치)
export interface ChatRoomMemberInfo {
    id: number; // User ID (백엔드 DTO의 id 필드와 일치)
    name: string;
    profileImageUrl?: string;
    status: 'INVITED' | 'JOINED' | 'LEFT' | 'BLOCKED'; // 백엔드 ChatRoomMemberStatus Enum과 일치
}

export interface ChatRoomCreateRequest {
    name: string;
    invitedMemberIds: number[];
}

export interface ChatMessageSendRequest {
    content: string;
    messageType?: MessageType; // 백엔드와 동일한 Enum 타입
}

export interface ChatMessageResponse {
    messageId: number;
    chatRoomId: number;
    sender: UserSummaryDto;
    content: string;
    messageType: MessageType;
    sentAt: string; // ISO 문자열
}

export interface ChatRoomResponse {
    id: number;
    name: string;
    studyGroupId: number;
    studyGroupName: string;
    createdAt: string;
    lastMessageContent?: string;
    lastMessageAt?: string;
    memberCount: number; // 이 memberCount가 JOINED 멤버 기준인지 확인 필요
}

export interface ChatRoomDetailResponse {
    id: number;
    name: string;
    studyGroupId: number;
    studyGroupName: string;
    createdAt: string; // ISO 문자열
    members: ChatRoomMemberInfo[]; // UserSummaryDto[] 대신 ChatRoomMemberInfo[] 사용
}