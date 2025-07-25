package com.studygroup.domain.board.repository;

import com.studygroup.domain.board.entity.BoardPost;
import com.studygroup.domain.board.entity.PostLike;
import com.studygroup.domain.board.entity.VoteType;
import com.studygroup.domain.user.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PostLikeRepository extends JpaRepository<PostLike, Long> {

    Optional<PostLike> findByUserAndBoardPost(User user, BoardPost boardPost);
    // boolean existsByUserAndBoardPostAndVoteType(User user, BoardPost boardPost, VoteType voteType); // 특정 타입으로 투표했는지 확인 (필요시)

    // 사용자와 투표 타입으로 'PostLike' 목록을 페이징하여 가져옴 (최신순)
    Page<PostLike> findByUserAndVoteTypeOrderByCreatedAtDesc(User user, VoteType voteType, Pageable pageable);
}
