package com.studygroup.domain.notification.repository;

import com.studygroup.domain.notification.entity.Notification;
import com.studygroup.domain.user.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface NotificationRepository extends JpaRepository<Notification, Long> {
    List<Notification> findByReceiverOrderByCreatedAtDesc(User receiver);
    long countByReceiverAndIsReadFalse(User receiver);
} 