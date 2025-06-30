package com.studygroup.domain.notification.service;

import com.studygroup.domain.notification.dto.NotificationResponse;
import com.studygroup.domain.notification.entity.Notification;
import com.studygroup.domain.notification.entity.NotificationType;
import com.studygroup.domain.notification.repository.NotificationRepository;
import com.studygroup.domain.user.entity.User;
import com.studygroup.domain.user.repository.UserRepository;
import com.studygroup.global.service.EmailService;
import com.studygroup.global.service.SseEmitterService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Slf4j
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final SseEmitterService sseEmitterService;
    private final EmailService emailService;
    private final UserRepository userRepository;

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

        // --- 이메일 발송 로직 추가 ---
        // 특정 타입의 알림에 대해서만 이메일을 발송합니다.
        sendEmailForNotification(savedNotification);
    }

    private void sendEmailForNotification(Notification notification) {
        User receiver = notification.getReceiver();
        User sender = notification.getSender();
        String subject = "";
        String emailContent = "";

        switch (notification.getType()) {
            case STUDY_INVITE:
                // StudyGroup의 title을 가져오려면 추가적인 조회가 필요합니다.
                // 여기서는 간단하게 알림 메시지를 활용하겠습니다.
                subject = "[Having] '" + sender.getName() + "'님으로부터 스터디 초대가 도착했습니다.";
                // TODO: EmailService에서 HTML 템플릿을 만드는 것이 더 좋습니다.
                emailContent = "<html><body><p>" + notification.getMessage() + "</p>" +
                        "<a href='http://localhost:3000/notifications'>알림 확인하기</a></body></html>";
                break;

            case CHAT_INVITE:
                subject = "[Having] '" + sender.getName() + "'님으로부터 채팅방 초대가 도착했습니다.";
                emailContent = "<html><body><p>" + notification.getMessage() + "</p>" +
                        "<a href='http://localhost:3000/notifications'>알림 확인하기</a></body></html>";
                break;

            // 다른 중요한 알림(예: 참여 승인)에 대해서도 case 추가 가능
            // case JOIN_APPROVED:
            //     ...
            //     break;

            default:
                // 다른 타입의 알림은 이메일을 보내지 않음
                return;
        }

        emailService.sendEmail(receiver.getEmail(), subject, emailContent);
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

    // --- DM 알림 그룹을 한번에 읽음 처리하는 서비스 메소드 추가 ---
    @Transactional
    public void markDmNotificationsAsRead(Long userId, Long roomId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        List<Notification> dmNotifications = notificationRepository.findByReceiverAndReferenceIdAndType(
                user,
                roomId,
                NotificationType.NEW_DM
        );

        // 조회된 모든 DM 알림을 순회하며 읽음 처리
        dmNotifications.forEach(Notification::markAsRead);

        // @Transactional에 의해 메소드 종료 시 변경사항이 한번에 DB에 반영됨
        log.info("Marked {} DM notifications as read for user ID {} and room ID {}", dmNotifications.size(), userId, roomId);
    }
} 