package com.studygroup.domain.notification.controller;

import com.studygroup.domain.notification.dto.NotificationResponse;
import com.studygroup.domain.notification.service.NotificationService;
import com.studygroup.global.security.CurrentUser;
import com.studygroup.global.security.UserPrincipal;
import com.studygroup.global.service.SseEmitterService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.List;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;
    private final SseEmitterService sseEmitterService;

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

    @PostMapping("/read-all") // 상태를 변경하므로 POST 또는 PATCH가 적합
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Void> markAllAsRead(@CurrentUser UserPrincipal userPrincipal) {
        notificationService.markAllAsRead(userPrincipal.getId());
        return ResponseEntity.ok().build();
    }

    // SSE 구독 엔드포인트
    @GetMapping(value = "/subscribe", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    @PreAuthorize("isAuthenticated()")
    public SseEmitter subscribe(@CurrentUser UserPrincipal userPrincipal) {
        return sseEmitterService.subscribe(userPrincipal.getId());
    }

    // --- DM 알림 그룹 읽음 처리 API 엔드포인트 추가 ---
    @PatchMapping("/read/dm/{roomId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Void> markDmNotificationsAsRead(
            @PathVariable Long roomId,
            @CurrentUser UserPrincipal userPrincipal) {
        notificationService.markDmNotificationsAsRead(userPrincipal.getId(), roomId);
        return ResponseEntity.ok().build();
    }
}