package com.studygroup.domain.study.repository;

import com.studygroup.domain.study.entity.StudyGroup;
import com.studygroup.domain.study.entity.StudySchedule;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;

public interface StudyScheduleRepository extends JpaRepository<StudySchedule, Long> {

    // 특정 스터디 그룹의 특정 기간 내 일정을 조회
    List<StudySchedule> findByStudyGroupAndStartTimeBetween(StudyGroup studyGroup, LocalDateTime start, LocalDateTime end);

    // 특정 스터디 그룹의 모든 일정을 조회
    List<StudySchedule> findByStudyGroup(StudyGroup studyGroup);
}
