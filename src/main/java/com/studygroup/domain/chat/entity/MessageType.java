package com.studygroup.domain.chat.entity;

public enum MessageType {
    TALK,    // 일반 대화 메시지
    ENTER,   // 입장 알림 메시지
    LEAVE,   // 퇴장 알림 메시지
    INVITE,  // 초대 알림 메시지 (시스템)
    IMAGE,   // 이미지 메시지 (추후 확장)
    FILE     // 파일 메시지 (추후 확장)
}
