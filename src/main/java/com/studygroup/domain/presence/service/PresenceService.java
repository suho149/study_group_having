package com.studygroup.domain.presence.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.messaging.simp.SimpMessageSendingOperations;
import org.springframework.stereotype.Service;

import java.util.Set;

@Slf4j
@Service
@RequiredArgsConstructor
public class PresenceService {

    private final StringRedisTemplate redisTemplate;
    private final SimpMessageSendingOperations messagingTemplate;

    private String getRedisKey(String channel) {
        return "presence:" + channel.replace('/', ':'); // "post/1" -> "presence:post:1"
    }

    // 사용자가 특정 채널에 입장했을 때
    public void userEntered(String channel, String userId) {
        String key = getRedisKey(channel); // 수정된 key 생성 방식 사용
        redisTemplate.opsForSet().add(key, userId);
        log.info("User {} entered channel {}. Redis key: {}", userId, channel, key);
        broadcastViewerCount(channel);
    }

    // 사용자가 특정 채널에서 퇴장했을 때
    public void userExited(String channel, String userId) {
        String key = getRedisKey(channel); // 수정된 key 생성 방식 사용
        redisTemplate.opsForSet().remove(key, userId);
        log.info("User {} exited channel {}. Redis key: {}", userId, channel, key);
        broadcastViewerCount(channel);
    }

    // 현재 접속자 수를 해당 채널 구독자들에게 브로드캐스팅
    private void broadcastViewerCount(String channel) {
        String key = getRedisKey(channel); // 수정된 key 생성 방식 사용
        Long viewerCount = redisTemplate.opsForSet().size(key);
        if (viewerCount == null) viewerCount = 0L;

        // --- ★★★ 여기도 수정합니다 ★★★ ---
        // 클라이언트가 구독하는 주소는 "/"를 사용하므로, 그대로 전달합니다.
        String destination = "/sub/presence/" + channel; // channel = "post/1"

        messagingTemplate.convertAndSend(destination, viewerCount);
        log.info("Broadcasting viewer count {} to {}", viewerCount, destination);
    }

    // 사용자의 모든 연결을 정리 (WebSocket 연결 종료 시)
    public void disconnectUser(String userId) {
        // "presence:*" 패턴으로 Redis key를 찾습니다.
        Set<String> keys = redisTemplate.keys("presence:*");
        if (keys != null) {
            for (String key : keys) {
                // 해당 채널에 사용자가 있는지 확인하고 제거합니다.
                Long removedCount = redisTemplate.opsForSet().remove(key, userId);

                // 실제로 사용자가 제거되었을 때만 브로드캐스팅합니다.
                if (removedCount != null && removedCount > 0) {
                    log.info("User {} removed from Redis key {}", userId, key);

                    // 1. "presence:" 접두사를 제거합니다. (결과: "post:1")
                    String rawChannelInfo = key.substring("presence:".length());

                    // 2. 마지막 콜론(:)을 슬래시(/)로 바꿉니다.
                    //    이렇게 하면 "post:group:1" 같은 복잡한 경우에도 안전합니다.
                    int lastColonIndex = rawChannelInfo.lastIndexOf(':');
                    if (lastColonIndex != -1) {
                        String type = rawChannelInfo.substring(0, lastColonIndex);
                        String id = rawChannelInfo.substring(lastColonIndex + 1);
                        String channel = type + "/" + id; // 최종 결과: "post/1"

                        broadcastViewerCount(channel);
                    }
                }
            }
        }
        log.info("User {} disconnected, cleaned up all presence.", userId);
    }
}
