package com.studygroup.domain.study.repository;

import com.studygroup.domain.study.entity.Tag;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface TagRepository extends JpaRepository<Tag, Long> {
    Optional<Tag> findByName(String name);

    // 가장 많이 사용된 태그 상위 5개를 조회하는 쿼리
    @Query("SELECT t.name, COUNT(sgt.id) as tagCount " +
            "FROM Tag t JOIN t.studyGroups sgt " +
            "GROUP BY t.id ORDER BY tagCount DESC")
    List<Object[]> findPopularTags(Pageable pageable);
} 