import { MessageType } from './apiSpecificEnums';
import {UserSummaryDto} from "./user"; // 백엔드 Enum과 맞춤

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
    memberCount: number;
}

export interface ChatRoomDetailResponse {
    id: number;
    name: string;
    studyGroupId: number;
    studyGroupName: string;
    createdAt: string;
    members: UserSummaryDto[];
}