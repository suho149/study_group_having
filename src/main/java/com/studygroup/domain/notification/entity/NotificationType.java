package com.studygroup.domain.notification.entity;

public enum NotificationType {
    STUDY_INVITE("스터디 초대"),
    INVITE_ACCEPTED("초대 수락"),
    INVITE_REJECTED("초대 거절"),
    STUDY_JOIN_REQUEST("스터디 참여 신청"),
    JOIN_APPROVED("스터디 참여 승인"),
    JOIN_REJECTED("스터디 참여 거절"),
    MEMBER_LEFT_STUDY("스터디 멤버 탈퇴"),
    MEMBER_REMOVED_BY_LEADER("스터디 멤버 강제 탈퇴"), // 스터디장이 멤버를 내보냄 (멤버에게)
    LEADER_REMOVED_MEMBER("스터디장 멤버 내보내기 완료"), // 스터디장이 멤버를 내보냄 (스터디장에게 확인용)
    CHAT_INVITE("채팅방 초대"),
    CHAT_MEMBER_REMOVED("채팅방에서 내보내짐"), // 방장에 의해 내보내진 멤버에게
    CHAT_INVITE_AGAIN("채팅방 재초대"), // 이미 초대했거나 나갔던 멤버를 다시 초대할 경우 (선택적)
    NEW_DM("새로운 DM 도착"), // DM 관련 타입 추가
    NEW_LIKE_ON_POST("회원님의 게시글을 좋아합니다."),
    // NEW_LIKE_ON_COMMENT("회원님의 댓글을 좋아합니다."), // 댓글 좋아요 알림은 너무 많을 수 있어 일단 보류
    NEW_COMMENT_ON_POST("회원님의 게시글에 새로운 댓글이 달렸습니다."),
    NEW_REPLY_ON_COMMENT("회원님의 댓글에 새로운 답글이 달렸습니다."),
    // --- 친구 관련 알림 타입 추가 ---
    FRIEND_REQUEST("님이 회원님에게 친구 신청을 보냈습니다."),
    FRIEND_ACCEPTED("님이 친구 신청을 수락했습니다."),
    NEW_FEED("새로운 친구 활동 소식이 있습니다.");

    private final String description;

    NotificationType(String description) {
        this.description = description;
    }

    public String getDescription() {
        return description;
    }
} 