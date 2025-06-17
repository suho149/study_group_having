package com.studygroup.domain.user.service;

import com.studygroup.domain.badge.entity.Badge;
import com.studygroup.domain.badge.entity.UserBadge;
import com.studygroup.domain.badge.repository.BadgeRepository;
import com.studygroup.domain.badge.repository.UserBadgeRepository;
import com.studygroup.domain.board.repository.BoardPostRepository;
import com.studygroup.domain.study.repository.StudyGroupRepository;
import com.studygroup.domain.user.dto.UserActivityEvent;
import com.studygroup.domain.user.entity.ActivityType;
import com.studygroup.domain.user.entity.User;
import com.studygroup.domain.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserActivityService {

    private final UserRepository userRepository;
    private final BadgeRepository badgeRepository;
    private final UserBadgeRepository userBadgeRepository;
    private final BoardPostRepository boardPostRepository; // 게시글 수 확인용
    private final StudyGroupRepository studyGroupRepository;

    @Async
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void handleUserActivity(UserActivityEvent event) {
        User user = userRepository.findById(event.getUser().getId()).orElse(null);
        if (user == null) return;

        // 1. 포인트 부여
        user.addPoint(event.getActivityType().getPoint());
        log.info("Point added: User ID={}, New Point={}", user.getId(), user.getPoint());

        // 2. 뱃지 부여 조건 확인
        checkAndAwardBadges(user, event.getActivityType());
    }

    private void checkAndAwardBadges(User user, ActivityType activityType) {
        // 스터디 생성 시 '개척자' 뱃지 부여
        if (activityType == ActivityType.CREATE_STUDY) {
            long studyCount = studyGroupRepository.countByLeader(user);
            if (studyCount == 1) {
                awardBadge(user, "PIONEER"); // 뱃지 이름 예시
            }
        }

        // 첫 게시글 작성 시 '첫 걸음' 뱃지 부여
        if (activityType == ActivityType.CREATE_POST) {
            long postCount = boardPostRepository.countByAuthor(user);
            if (postCount == 1) {
                awardBadge(user, "FIRST_POST");
            }
        }

        // 회원가입 시 '새싹' 뱃지는 여기서 처리하지 않아도 됩니다.
        // CustomOAuth2UserService에서 orElseGet은 별도의 트랜잭션으로 동작하기 때문입니다.
        // 하지만 일관성을 위해 여기서 함께 처리해도 좋습니다.
        if (activityType == ActivityType.SIGN_UP) {
            awardBadge(user, "NEWBIE");
        }

        // TODO: 다른 조건들 추가 (예: 스터디 5회 완료, 좋아요 100개 받기 등)
    }

    private void awardBadge(User user, String badgeName) {
        // 뱃지 정보를 DB에서 가져옴 (없으면 생성하거나, 미리 DB에 넣어두어야 함)
        Badge badge = badgeRepository.findByName(badgeName)
                .orElseGet(() -> {
                    // 실제 운영 시에는 뱃지를 미리 DB에 INSERT 해두는 것이 좋음
                    log.warn("Badge '{}' not found. Creating it now.", badgeName);
                    return badgeRepository.save(Badge.builder().name(badgeName).description(badgeName + " Badge").build());
                });

        // 사용자가 이미 해당 뱃지를 가지고 있는지 확인
        if (!userBadgeRepository.existsByUserAndBadge(user, badge)) {
            UserBadge userBadge = UserBadge.builder().user(user).badge(badge).build();
            userBadgeRepository.save(userBadge);
            log.info("Badge awarded: User ID={}, Badge={}", user.getId(), badgeName);
            // TODO: 뱃지 획득에 대한 실시간 알림 또는 이메일 발송 로직 추가 가능
        }
    }
}
