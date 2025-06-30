package com.studygroup.domain.board.repository;

import com.studygroup.domain.board.entity.BoardComment;
import com.studygroup.domain.board.entity.BoardPost;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface BoardCommentRepository extends JpaRepository<BoardComment, Long> {

    // 특정 게시글의 최상위 댓글 목록 페이징 조회 (isDeleted = false 인 것만, 오래된 순)
    Page<BoardComment> findByBoardPostAndParentCommentIsNullAndIsDeletedFalseOrderByCreatedAtAsc(BoardPost boardPost, Pageable pageable);

    // 특정 부모 댓글의 대댓글 목록 조회 (isDeleted = false 인 것만, 오래된 순)
    List<BoardComment> findByParentCommentAndIsDeletedFalseOrderByCreatedAtAsc(BoardComment parentComment);

    // 게시글의 댓글 수 카운트 (삭제되지 않은 것만)
    long countByBoardPostAndIsDeletedFalse(BoardPost boardPost);

    Page<BoardComment> findByBoardPostAndParentCommentIsNullOrderByCreatedAtAsc(BoardPost post, Pageable pageable);

    // Fetch Join을 적용한 새로운 메소드 추가 또는 기존 쿼리 수정
    @Query(value = "SELECT c FROM BoardComment c JOIN FETCH c.author " +
            "WHERE c.boardPost = :post AND c.parentComment IS NULL " +
            "ORDER BY c.createdAt ASC",
            countQuery = "SELECT count(c) FROM BoardComment c " +
                    "WHERE c.boardPost = :post AND c.parentComment IS NULL")
    Page<BoardComment> findByBoardPostWithAuthor(@Param("post") BoardPost post, Pageable pageable);

    @Modifying(clearAutomatically = true) // ★★★ clearAutomatically = true 추가 ★★★
    @Query("UPDATE BoardComment c SET c.isBlinded = true, c.content = '관리자에 의해 숨김 처리된 댓글입니다.' WHERE c.id = :id")
    void blindById(@Param("id") Long id);
}
