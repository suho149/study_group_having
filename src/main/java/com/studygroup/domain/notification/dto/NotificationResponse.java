package com.studygroup.domain.notification.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.studygroup.domain.notification.entity.Notification;
import com.studygroup.domain.notification.entity.NotificationType;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class NotificationResponse {
    private Long id;
    private String message;
    private NotificationType type;
    private String senderName;
    private String senderEmail;
    private Long referenceId;
    @JsonProperty("isRead") // JSON으로 변환될 때 필드 이름을 "isRead"로 강제
    private boolean isRead;
    private LocalDateTime createdAt;

    public static NotificationResponse from(Notification notification) {
        return NotificationResponse.builder()
                .id(notification.getId())
                .message(notification.getMessage())
                .type(notification.getType())
                .senderName(notification.getSender().getName())
                .senderEmail(notification.getSender().getEmail())
                .referenceId(notification.getReferenceId())
                .isRead(notification.isRead())
                .createdAt(notification.getCreatedAt())
                .build();
    }
} 