package com.studygroup.domain.board.repository;

import com.studygroup.domain.board.entity.BoardPost;
import com.studygroup.domain.user.entity.User;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface BoardPostRepository extends JpaRepository<BoardPost, Long>, JpaSpecificationExecutor<BoardPost> {
    // 필요시 페이징, 검색, 카테고리별 조회 메소드 추가
    // Page<BoardPost> findByCategory(BoardCategory category, Pageable pageable);
    // Page<BoardPost> findByTitleContainingOrContentContaining(String titleKeyword, String contentKeyword, Pageable pageable);

    // --- 핫 게시물 조회를 위한 JPQL 쿼리 추가 ---
    @Query("SELECT p FROM BoardPost p " +
            "WHERE p.likeCount >= :minLikes " +
            "AND p.createdAt BETWEEN :startDate AND :endDate " +
            "ORDER BY p.likeCount DESC, p.viewCount DESC, p.createdAt DESC")
    List<BoardPost> findHotPosts(
            @Param("minLikes") int minLikes,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate,
            Pageable pageable); // Pageable을 사용하여 상위 N개만 가져옴

    long countByAuthor(User author); // 내가 작성한 게시글 수

    @Query("SELECT SUM(p.likeCount) FROM BoardPost p WHERE p.author = :author")
    Integer getTotalLikeCountByAuthor(@Param("author") User author);
}
