package com.studygroup.domain.study.repository;

import com.studygroup.domain.study.entity.StudyGroup;
import com.studygroup.domain.study.entity.StudyLike;
import com.studygroup.domain.user.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface StudyLikeRepository extends JpaRepository<StudyLike, Long> {

    Optional<StudyLike> findByUserAndStudyGroup(User user, StudyGroup studyGroup);

    boolean existsByUserAndStudyGroup(User user, StudyGroup studyGroup);

    long countByStudyGroup(StudyGroup studyGroup); // StudyGroup의 likeCount와 일치하는지 확인용 (또는 StudyGroup.likeCount 직접 사용)
}
