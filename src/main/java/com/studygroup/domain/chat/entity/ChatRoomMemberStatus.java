package com.studygroup.domain.chat.entity;

public enum ChatRoomMemberStatus {
    INVITED,  // 초대됨 (아직 수락 안 함)
    JOINED,   // 참여 중
    LEFT,     // 나감
    BLOCKED   // 차단됨 (추후 확장)
}
