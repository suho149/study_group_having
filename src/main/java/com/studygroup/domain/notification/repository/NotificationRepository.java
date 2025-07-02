package com.studygroup.domain.notification.repository;

import com.studygroup.domain.notification.entity.Notification;
import com.studygroup.domain.notification.entity.NotificationType;
import com.studygroup.domain.user.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface NotificationRepository extends JpaRepository<Notification, Long> {

    List<Notification> findByReceiverOrderByCreatedAtDesc(User receiver);

    long countByReceiverAndIsReadFalse(User receiver);

    // 특정 수신자, 참조 ID, 알림 타입, 읽지 않은 상태의 알림을 찾는 메소드 추가
    List<Notification> findByReceiverAndReferenceIdAndTypeAndIsReadFalse(
            User receiver, Long referenceId, NotificationType type);

    // --- 특정 사용자의 특정 채팅방 관련 모든 알림을 찾는 메소드 추가 ---
    List<Notification> findByReceiverAndReferenceIdAndType(User receiver, Long referenceId, NotificationType type);

    @Modifying
    @Query("UPDATE Notification n SET n.isRead = true WHERE n.receiver = :receiver AND n.isRead = false")
    void markAllAsReadForReceiver(@Param("receiver") User receiver);
} 