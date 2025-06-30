package com.studygroup.domain.badge.repository;

import com.studygroup.domain.badge.entity.Badge;
import com.studygroup.domain.badge.entity.UserBadge;
import com.studygroup.domain.user.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface UserBadgeRepository extends JpaRepository<UserBadge, Long> {

    // 사용자가 특정 뱃지를 이미 가지고 있는지 확인
    boolean existsByUserAndBadge(User user, Badge badge);

    // 사용자가 획득한 모든 뱃지 목록 조회
    List<UserBadge> findByUser(User user);
}
