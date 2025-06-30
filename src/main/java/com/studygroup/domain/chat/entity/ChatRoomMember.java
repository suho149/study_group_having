package com.studygroup.domain.chat.entity;

import com.studygroup.domain.user.entity.User;
import com.studygroup.global.common.BaseTimeEntity;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class ChatRoomMember extends BaseTimeEntity { // joinedAt 대신 createdAt 사용

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "chat_room_member_id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "chat_room_id", nullable = false)
    private ChatRoom chatRoom;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Setter // 마지막 읽은 메시지 ID 업데이트용
    private Long lastReadMessageId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Setter // 멤버 상태 변경용
    @Builder.Default
    private ChatRoomMemberStatus status = ChatRoomMemberStatus.INVITED; // 기본 상태는 초대됨

    // 연관관계 편의 메소드 (ChatRoom에서 호출)
    protected void setChatRoomInternal(ChatRoom chatRoom) {
        this.chatRoom = chatRoom;
    }
}
