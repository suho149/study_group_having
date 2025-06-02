package com.studygroup.domain.study.repository;

import com.studygroup.domain.study.entity.StudyMember;
import org.springframework.data.jpa.repository.JpaRepository;

public interface StudyMemberRepository extends JpaRepository<StudyMember, Long> {
}
