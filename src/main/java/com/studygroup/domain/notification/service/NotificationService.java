package com.studygroup.domain.notification.service;

import com.studygroup.domain.notification.dto.NotificationResponse;
import com.studygroup.domain.notification.entity.Notification;
import com.studygroup.domain.notification.entity.NotificationType;
import com.studygroup.domain.notification.repository.NotificationRepository;
import com.studygroup.domain.user.entity.User;
import com.studygroup.global.service.SseEmitterService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final SseEmitterService sseEmitterService;

    @Transactional
    public void createNotification(User sender, User receiver, String message, NotificationType type, Long referenceId) {
        Notification notification = Notification.builder()
                .sender(sender)
                .receiver(receiver)
                .message(message)
                .type(type)
                .referenceId(referenceId)
                .isRead(false)
                .build();

        Notification savedNotification = notificationRepository.save(notification);

        // --- 실시간 알림 전송 로직 추가 ---
        // 수신자의 ID를 가져옴
        Long receiverId = receiver.getId();
        // NotificationResponse DTO로 변환하여 전송
        NotificationResponse notificationDto = NotificationResponse.from(savedNotification);

        // "new-notification" 이라는 이름의 이벤트로 알림 데이터 전송
        sseEmitterService.sendToClient(receiverId, "new-notification", notificationDto);
    }

    public List<NotificationResponse> getNotifications(User user) {
        return notificationRepository.findByReceiverOrderByCreatedAtDesc(user)
                .stream()
                .map(NotificationResponse::from)
                .collect(Collectors.toList());
    }

    @Transactional
    public void markAsRead(Long notificationId, Long userId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new IllegalArgumentException("Notification not found"));

        if (!notification.getReceiver().getId().equals(userId)) {
            throw new IllegalStateException("Unauthorized access to notification");
        }

        notification.markAsRead();
    }

    public long getUnreadCount(User user) {
        return notificationRepository.countByReceiverAndIsReadFalse(user);
    }
} 