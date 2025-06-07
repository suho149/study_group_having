package com.studygroup.domain.notification.repository;

import com.studygroup.domain.notification.entity.Notification;
import com.studygroup.domain.notification.entity.NotificationType;
import com.studygroup.domain.user.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface NotificationRepository extends JpaRepository<Notification, Long> {

    List<Notification> findByReceiverOrderByCreatedAtDesc(User receiver);

    long countByReceiverAndIsReadFalse(User receiver);

    // 특정 수신자, 참조 ID, 알림 타입, 읽지 않은 상태의 알림을 찾는 메소드 추가
    List<Notification> findByReceiverAndReferenceIdAndTypeAndIsReadFalse(
            User receiver, Long referenceId, NotificationType type);
} 