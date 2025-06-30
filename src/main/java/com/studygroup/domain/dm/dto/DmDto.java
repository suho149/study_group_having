package com.studygroup.domain.dm.dto;

import com.studygroup.domain.chat.dto.UserSummaryDto;
import com.studygroup.domain.dm.entity.DmMessage;
import com.studygroup.domain.dm.entity.DmRoom;
import com.studygroup.domain.user.entity.User;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;

import java.time.LocalDateTime;

public class DmDto {

    // 채팅방 목록 응답
    @Getter
    public static class RoomResponse {
        private Long roomId;
        private UserSummaryDto partner; // 채팅 상대방 정보
        private String lastMessage;
        private LocalDateTime lastMessageTime;
        // private int unreadCount; // 안 읽은 메시지 수 (추가 구현)

        public RoomResponse(DmRoom dmRoom, User currentUser) {
            this.roomId = dmRoom.getId();
            // 현재 사용자를 제외한 다른 사용자가 채팅 상대방
            User partnerUser = dmRoom.getUser1().getId().equals(currentUser.getId()) ? dmRoom.getUser2() : dmRoom.getUser1();
            this.partner = UserSummaryDto.from(partnerUser);
            this.lastMessage = dmRoom.getLastMessage();
            this.lastMessageTime = dmRoom.getLastMessageTime();
        }
    }

    // 메시지 전송 요청
    @Getter
    public static class SendRequest {
        @NotNull // roomId는 필수
        private Long roomId;
        @NotBlank
        private String content;
    }

    // 메시지 응답 (STOMP 및 API)
    @Getter
    public static class MessageResponse {
        private Long messageId;
        private Long roomId;
        private UserSummaryDto sender;
        private String content;
        private LocalDateTime sentAt;
        private boolean isRead;

        public MessageResponse(DmMessage dmMessage) {
            this.messageId = dmMessage.getId();
            this.roomId = dmMessage.getDmRoom().getId();
            this.sender = UserSummaryDto.from(dmMessage.getSender());
            this.content = dmMessage.getContent();
            this.sentAt = dmMessage.getCreatedAt();
            this.isRead = dmMessage.isRead();
        }
    }
}
