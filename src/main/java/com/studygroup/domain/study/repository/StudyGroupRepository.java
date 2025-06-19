package com.studygroup.domain.study.repository;

import com.studygroup.domain.study.entity.StudyGroup;
import com.studygroup.domain.study.entity.StudyStatus;
import com.studygroup.domain.study.entity.StudyType;
import com.studygroup.domain.study.entity.Tag;
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

    // --- 추천 스터디 조회를 위한 JPQL 쿼리 추가 ---
    @Query("SELECT sg FROM StudyGroup sg " +
            "JOIN sg.tags sgt " +
            "WHERE sgt.tag IN :preferredTags " +            // 1. 사용자의 선호 태그 목록에 포함되고
            "AND sg.status = 'RECRUITING' " +               // 2. 모집 중이며
            "AND sg.id NOT IN (SELECT sm.studyGroup.id FROM StudyMember sm WHERE sm.user = :user) " + // 3. 사용자가 아직 참여하지 않은 스터디
            "GROUP BY sg.id " +
            "ORDER BY COUNT(sgt.tag) DESC, sg.likeCount DESC") // 4. 선호 태그 일치 개수, 좋아요 순으로 정렬
    List<StudyGroup> findRecommendedStudies(
            @Param("user") User user,
            @Param("preferredTags") List<Tag> preferredTags,
            Pageable pageable);

    // --- 관심사 없는 유저를 위한 폴백(Fallback) 추천 쿼리 ---
    List<StudyGroup> findByStatusOrderByLikeCountDesc(StudyStatus status, Pageable pageable);

    @Query("SELECT sg, COUNT(sgt.tag) as matchCount FROM StudyGroup sg " + // 스터디와 일치 태그 수를 함께 조회
            "JOIN sg.tags sgt " +
            "WHERE sgt.tag IN :preferredTags " +
            "AND sg.status = 'RECRUITING' " +
            "AND sg.id NOT IN (SELECT sm.studyGroup.id FROM StudyMember sm WHERE sm.user = :user) " +
            "GROUP BY sg.id " +
            "ORDER BY matchCount DESC, sg.likeCount DESC") // 일치 태그 수(matchCount)로 정렬
    List<Object[]> findRecommendedStudiesWithMatchCount( // 반환 타입을 Object 배열로 변경
                                                         @Param("user") User user,
                                                         @Param("preferredTags") List<Tag> preferredTags,
                                                         Pageable pageable);
} 