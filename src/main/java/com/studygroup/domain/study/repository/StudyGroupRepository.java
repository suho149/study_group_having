package com.studygroup.domain.study.repository;

import com.studygroup.domain.study.entity.StudyGroup;
import com.studygroup.domain.study.entity.StudyStatus;
import com.studygroup.domain.study.entity.StudyType;
import com.studygroup.domain.user.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface StudyGroupRepository extends JpaRepository<StudyGroup, Long> {
    @Query("SELECT DISTINCT sg FROM StudyGroup sg " +
           "LEFT JOIN FETCH sg.tags sgt " +
           "LEFT JOIN FETCH sgt.tag " +
           "WHERE sg.title LIKE %:keyword% OR sg.description LIKE %:keyword%")
    Page<StudyGroup> findByTitleContainingOrDescriptionContaining(
            @Param("keyword") String keyword, 
            @Param("keyword") String keywordForDescription, 
            Pageable pageable);

    long countByLeader(User leader); // 내가 생성한 스터디 수

    // 지도에 표시할 스터디를 조회하는 메소드
    // 조건: 모집중(RECRUITING)이고, 오프라인 또는 하이브리드(OFFLINE, HYBRID)이며, 위도(latitude) 값이 있는 스터디
    List<StudyGroup> findByStatusAndStudyTypeInAndLatitudeIsNotNull(StudyStatus status, List<StudyType> studyTypes);
} 