package com.studygroup.domain.study.repository;

import com.studygroup.domain.study.entity.StudyMember;
import com.studygroup.domain.study.entity.StudyMemberStatus;
import com.studygroup.domain.user.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface StudyMemberRepository extends JpaRepository<StudyMember, Long> {

    long countByUserAndStatus(User user, StudyMemberStatus status); // 내가 참여중인 스터디 수

    // 사용자가 참여중(승인된)인 스터디 멤버 정보를 페이징하여 조회하는 메소드 (최신순)
    Page<StudyMember> findByUserAndStatusOrderByCreatedAtDesc(User user, StudyMemberStatus status, Pageable pageable);
}
