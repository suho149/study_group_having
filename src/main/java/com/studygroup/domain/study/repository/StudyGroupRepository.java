package com.studygroup.domain.study.repository;

import com.studygroup.domain.study.entity.StudyGroup;
import com.studygroup.domain.user.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

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
} 