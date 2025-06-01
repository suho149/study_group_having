package com.studygroup.domain.notification.controller;

import com.studygroup.domain.notification.dto.NotificationResponse;
import com.studygroup.domain.notification.service.NotificationService;
import com.studygroup.global.security.CurrentUser;
import com.studygroup.global.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<NotificationResponse>> getNotifications(@CurrentUser UserPrincipal userPrincipal) {
        List<NotificationResponse> notifications = notificationService.getNotifications(userPrincipal.getUser());
        return ResponseEntity.ok(notifications);
    }

    @GetMapping("/unread-count")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Long> getUnreadCount(@CurrentUser UserPrincipal userPrincipal) {
        long count = notificationService.getUnreadCount(userPrincipal.getUser());
        return ResponseEntity.ok(count);
    }

    @PatchMapping("/{id}/read")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Void> markAsRead(
            @PathVariable Long id,
            @CurrentUser UserPrincipal userPrincipal) {
        notificationService.markAsRead(id, userPrincipal.getId());
        return ResponseEntity.ok().build();
    }
} 