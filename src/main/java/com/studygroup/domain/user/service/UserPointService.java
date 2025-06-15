package com.studygroup.domain.user.service;

import com.studygroup.domain.user.dto.UserActivityEvent;
import com.studygroup.domain.user.entity.User;
import com.studygroup.domain.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserPointService {

    private final UserRepository userRepository;

    @Async // 비동기 실행
    @EventListener // UserActivityEvent 타입의 이벤트가 발생하면 이 메소드가 실행됨
    @Transactional // DB 작업을 하므로 트랜잭션 필요
    public void handleUserActivity(UserActivityEvent event) {
        log.info("Handling user activity event: User ID={}, Activity={}",
                event.getUser().getId(), event.getActivityType().name());

        // 유저 정보를 다시 조회하여 최신 상태로 작업 (영속성 컨텍스트 문제 방지)
        User user = userRepository.findById(event.getUser().getId())
                .orElse(null);

        if (user != null) {
            user.addPoint(event.getActivityType().getPoint());
            log.info("Point added: User ID={}, New Point={}", user.getId(), user.getPoint());
        }
    }
}
