package com.studygroup.domain.user.repository;

import com.studygroup.domain.study.entity.Tag;
import com.studygroup.domain.user.entity.User;
import com.studygroup.domain.user.entity.UserTagPreference;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UserTagPreferenceRepository extends JpaRepository<UserTagPreference, Long> {

    Optional<UserTagPreference> findByUserAndTag(User user, Tag tag);

    // 사용자의 상위 선호 태그 목록을 가져오기 위한 메소드
    List<UserTagPreference> findTop5ByUserOrderByScoreDesc(User user);
}
