package com.studygroup.domain.board.repository;

import com.studygroup.domain.board.entity.BoardComment;
import com.studygroup.domain.board.entity.BoardPost;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface BoardCommentRepository extends JpaRepository<BoardComment, Long> {

    // 특정 게시글의 최상위 댓글 목록 페이징 조회 (isDeleted = false 인 것만, 오래된 순)
    Page<BoardComment> findByBoardPostAndParentCommentIsNullAndIsDeletedFalseOrderByCreatedAtAsc(BoardPost boardPost, Pageable pageable);

    // 특정 부모 댓글의 대댓글 목록 조회 (isDeleted = false 인 것만, 오래된 순)
    List<BoardComment> findByParentCommentAndIsDeletedFalseOrderByCreatedAtAsc(BoardComment parentComment);

    // 게시글의 댓글 수 카운트 (삭제되지 않은 것만)
    long countByBoardPostAndIsDeletedFalse(BoardPost boardPost);

    Page<BoardComment> findByBoardPostAndParentCommentIsNullOrderByCreatedAtAsc(BoardPost post, Pageable pageable);
}
