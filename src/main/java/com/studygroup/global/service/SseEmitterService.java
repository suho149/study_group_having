package com.studygroup.global.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
@Slf4j
public class SseEmitterService {

    // 각 사용자별 Emitter를 관리하기 위한 Map
    // Key: userId, Value: SseEmitter
    private final Map<Long, SseEmitter> emitters = new ConcurrentHashMap<>();
    private static final Long DEFAULT_TIMEOUT = 60L * 1000 * 60; // 1시간 타임아웃

    // SSE 구독을 시작하는 메소드
    public SseEmitter subscribe(Long userId) {
        SseEmitter emitter = new SseEmitter(DEFAULT_TIMEOUT);
        emitters.put(userId, emitter);

        // 연결이 완료되거나 타임아웃 시 emitters 맵에서 제거
        emitter.onCompletion(() -> {
            log.info("SSE onCompletion for userId: {}", userId);
            emitters.remove(userId);
        });
        emitter.onTimeout(() -> {
            log.info("SSE onTimeout for userId: {}", userId);
            emitter.complete();
        });
        emitter.onError(e -> {
            log.error("SSE onError for userId: {}", userId, e);
            emitters.remove(userId);
        });

        // 연결 직후, 더미 데이터를 보내 연결이 수립되었음을 클라이언트에게 알림
        // 503 Service Unavailable 방지
        sendToClient(userId, "sse-connection", "SSE connected successfully for user " + userId);

        log.info("New SSE subscriber: userId={}", userId);
        return emitter;
    }

    // 특정 사용자에게 이벤트를 전송하는 메소드
    public void sendToClient(Long userId, String eventName, Object data) {
        SseEmitter emitter = emitters.get(userId);
        if (emitter != null) {
            try {
                // SseEmitter.SseEventBuilder를 사용하여 이벤트 이름과 데이터를 전송
                emitter.send(SseEmitter.event()
                        .id(String.valueOf(userId)) // 이벤트 ID
                        .name(eventName)           // 이벤트 이름 (클라이언트에서 event listener 이름으로 사용)
                        .data(data));              // 전송할 데이터
                log.info("Sent SSE event '{}' to userId: {}", eventName, userId);
            } catch (IOException e) {
                // 전송 중 에러 발생 시 (클라이언트 연결 끊김 등), emitters 맵에서 제거
                log.error("Failed to send SSE event to userId: {}. Removing emitter.", userId, e);
                emitters.remove(userId);
            }
        } else {
            log.warn("No SSE emitter found for userId: {}", userId);
        }
    }
}
