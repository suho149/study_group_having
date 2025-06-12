package com.studygroup.domain.study.repository;

import com.studygroup.domain.study.entity.StudyMember;
import com.studygroup.domain.study.entity.StudyMemberStatus;
import com.studygroup.domain.user.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

public interface StudyMemberRepository extends JpaRepository<StudyMember, Long> {

    long countByUserAndStatus(User user, StudyMemberStatus status); // 내가 참여중인 스터디 수
}
