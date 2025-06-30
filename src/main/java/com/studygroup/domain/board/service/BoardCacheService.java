package com.studygroup.domain.board.service;

import com.studygroup.domain.board.entity.BoardPost;
import com.studygroup.domain.board.repository.BoardPostRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ZSetOperations;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.TemporalAdjusters;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class BoardCacheService {

    private final BoardPostRepository boardPostRepository;
    private final StringRedisTemplate redisTemplate;
    private static final String HOT_POSTS_KEY = "hot_posts";

    // 10분마다 실행 (fixedRate의 단위는 밀리초)
    // 10 * 60 * 1000 = 600,000
    @Scheduled(fixedRate = 600000)
    public void cacheHotPosts() {
        log.info("Caching hot posts to Redis...");

        // 1. 기존 '핫 게시물' 조회 로직을 그대로 사용합니다.
        LocalDateTime startOfWeek = LocalDate.now().with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY)).atStartOfDay();
        LocalDateTime now = LocalDateTime.now();
        int minLikesForHotPost = 3; // 최소 좋아요 수
        int hotPostCount = 10;      // 캐싱할 게시물 수 (넉넉하게)

        List<BoardPost> hotPosts = boardPostRepository.findHotPosts(
                minLikesForHotPost,
                startOfWeek,
                now,
                PageRequest.of(0, hotPostCount)
        );

        // 2. Redis의 ZSET(Sorted Set)을 사용하기 위한 객체를 가져옵니다.
        ZSetOperations<String, String> zSetOps = redisTemplate.opsForZSet();

        // 3. 기존 캐시를 삭제합니다.
        redisTemplate.delete(HOT_POSTS_KEY);

        // 4. 새로운 '핫 게시물' 목록을 Redis에 저장합니다.
        //    - Key: "hot_posts"
        //    - Value: 게시물 ID (String)
        //    - Score: 좋아요 수 (double)
        hotPosts.forEach(post ->
                zSetOps.add(HOT_POSTS_KEY, post.getId().toString(), post.getLikeCount())
        );

        log.info("Successfully cached {} hot posts.", hotPosts.size());
    }
}
