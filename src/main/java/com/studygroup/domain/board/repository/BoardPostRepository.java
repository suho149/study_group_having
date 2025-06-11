package com.studygroup.domain.board.repository;

import com.studygroup.domain.board.entity.BoardPost;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface BoardPostRepository extends JpaRepository<BoardPost, Long>, JpaSpecificationExecutor<BoardPost> {
    // 필요시 페이징, 검색, 카테고리별 조회 메소드 추가
    // Page<BoardPost> findByCategory(BoardCategory category, Pageable pageable);
    // Page<BoardPost> findByTitleContainingOrContentContaining(String titleKeyword, String contentKeyword, Pageable pageable);
}
