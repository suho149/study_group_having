package com.studygroup.domain.feed.repository;

import com.studygroup.domain.feed.entity.Feed;
import com.studygroup.domain.user.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FeedRepository extends JpaRepository<Feed, Long> {
    // 특정 사용자의 피드 목록을 최신순으로 페이징하여 조회
    Page<Feed> findByOwnerOrderByCreatedAtDesc(User owner, Pageable pageable);
}
