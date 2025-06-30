package com.studygroup.domain.board.repository;

import com.studygroup.domain.board.entity.BoardComment;
import com.studygroup.domain.board.entity.CommentLike;
import com.studygroup.domain.board.entity.VoteType;
import com.studygroup.domain.user.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface CommentLikeRepository extends JpaRepository<CommentLike, Long> {

    Optional<CommentLike> findByUserAndBoardComment(User user, BoardComment boardComment);

    boolean existsByUserAndBoardCommentAndVoteType(User user, BoardComment boardComment, VoteType voteType);
    // long countByBoardCommentAndVoteType(BoardComment boardComment, VoteType voteType); // 필요시
}
