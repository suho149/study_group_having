package com.studygroup.domain.board.service;

import com.studygroup.domain.board.dto.*;
import com.studygroup.domain.board.entity.*;
import com.studygroup.domain.board.repository.BoardCommentRepository;
import com.studygroup.domain.board.repository.BoardPostRepository;
import com.studygroup.domain.board.repository.CommentLikeRepository;
import com.studygroup.domain.board.repository.PostLikeRepository;
import com.studygroup.domain.user.entity.User;
import com.studygroup.domain.user.repository.UserRepository;
import com.studygroup.global.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class BoardService {

    private final BoardPostRepository boardPostRepository;
    private final UserRepository userRepository;
    private final BoardCommentRepository boardCommentRepository;
    private final PostLikeRepository postLikeRepository;
    private final CommentLikeRepository commentLikeRepository;

    public BoardPostResponse createPost(BoardPostCreateRequest request, Long authorId) {
        User author = userRepository.findById(authorId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다. ID: " + authorId));

        BoardPost post = BoardPost.builder()
                .title(request.getTitle())
                .content(request.getContent())
                .category(request.getCategory())
                .author(author)
                .build();
        // viewCount, likeCount 등은 기본값 0으로 설정됨

        BoardPost savedPost = boardPostRepository.save(post);
        log.info("새 게시글 생성 완료: postId={}, authorId={}", savedPost.getId(), authorId);
        return BoardPostResponse.from(savedPost, false, false);
    }

    @Transactional(readOnly = true)
    public Page<BoardPostSummaryResponse> getBoardPosts(
            String categoryString, String keyword, Pageable pageable, UserPrincipal currentUserPrincipal) {

        // TODO: BoardPostRepository에 category, keyword를 사용하여 검색하고 페이징하는 메소드 구현
        // 예: boardPostRepository.findAllWithFilters(category, keyword, pageable);
        // 이 메소드는 Page<BoardPost>를 반환해야 함.
        // 여기서는 임시로 findAll 사용 (실제로는 필터링된 조회 필요)
        Page<BoardPost> postsPage = boardPostRepository.findAll(pageable); // <--- 실제로는 필터링된 조회로 변경해야 함

        // User currentUser = null;
        // if (currentUserPrincipal != null) {
        //     currentUser = userRepository.findById(currentUserPrincipal.getId()).orElse(null);
        // }
        // User finalCurrentUser = currentUser;

        // 각 BoardPost를 BoardPostSummaryResponse로 변환
        return postsPage.map(post -> {
            // boolean isLiked = false;
            // int commentCount = post.getComments() != null ? post.getComments().size() : 0; // 댓글 엔티티 추가 후
            // if (finalCurrentUser != null) {
            //    // isLiked = postLikeRepository.existsByUserAndBoardPost(finalCurrentUser, post); // PostLike 기능 추가 시
            // }
            // BoardPostSummaryResponse.from(post, isLiked, commentCount) 와 같이 변환
            return BoardPostSummaryResponse.from(post); // 임시: BoardPostSummaryResponse.from 수정 필요
        });
    }

    @Transactional // 조회수 증가로 인해 쓰기 트랜잭션 필요
    public BoardPostResponse getPostDetail(Long postId, UserPrincipal currentUserPrincipal) {
        BoardPost post = boardPostRepository.findById(postId)
                .orElseThrow(() -> new IllegalArgumentException("게시글을 찾을 수 없습니다. ID: " + postId));

        post.incrementViewCount(); // 조회수 증가
        // boardPostRepository.save(post); // 변경 감지로 저장됨

        // 현재 사용자가 이 게시글에 좋아요를 눌렀는지 여부 (추천 기능 구현 시)
        boolean likedByCurrentUser = false;
        boolean dislikedByCurrentUser = false;
        if (currentUserPrincipal != null) {
            User currentUser = userRepository.findById(currentUserPrincipal.getId()).orElse(null);
            if (currentUser != null) {
                Optional<PostLike> postLikeOpt = postLikeRepository.findByUserAndBoardPost(currentUser, post);
                if (postLikeOpt.isPresent()) {
                    VoteType userVote = postLikeOpt.get().getVoteType();
                    if (userVote == VoteType.LIKE) likedByCurrentUser = true;
                    else if (userVote == VoteType.DISLIKE) dislikedByCurrentUser = true;
                }
            }
        }

        // 댓글 수 (댓글 기능 구현 시)
//         int commentCount = boardCommentRepository.countByBoardPost(post);

        // BoardPostResponse.from() 메소드를 수정하여 필요한 모든 정보를 담도록 함
        // 여기서는 isLikedByCurrentUser와 commentCount는 아직 구현되지 않았다고 가정
        return BoardPostResponse.from(post, likedByCurrentUser, dislikedByCurrentUser);
    }

    @Transactional
    public void voteForPost(Long postId, Long userId, VoteType requestedVoteType) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + userId));
        BoardPost post = boardPostRepository.findById(postId)
                .orElseThrow(() -> new IllegalArgumentException("Post not found: " + postId));

        Optional<PostLike> existingVoteOpt = postLikeRepository.findByUserAndBoardPost(user, post);

        if (existingVoteOpt.isPresent()) { // 이미 투표한 기록이 있는 경우
            PostLike existingVote = existingVoteOpt.get();
            if (existingVote.getVoteType() == requestedVoteType) { // 같은 타입으로 다시 클릭 -> 투표 취소
                postLikeRepository.delete(existingVote);
                if (requestedVoteType == VoteType.LIKE) {
                    post.decrementLikeCount();
                } else {
                    post.decrementDislikeCount();
                }
                log.info("게시글 투표 취소: postId={}, userId={}, voteType={}", postId, userId, requestedVoteType);
            } else { // 다른 타입으로 변경 (예: 비추천 -> 추천, 또는 추천 -> 비추천)
                // 이전 투표 카운트 감소
                if (existingVote.getVoteType() == VoteType.LIKE) {
                    post.decrementLikeCount();
                } else {
                    post.decrementDislikeCount();
                }
                // 새 투표 타입으로 변경 및 카운트 증가
                existingVote.setVoteType(requestedVoteType);
                // postLikeRepository.save(existingVote); // 변경 감지로 저장됨
                if (requestedVoteType == VoteType.LIKE) {
                    post.incrementLikeCount();
                } else {
                    post.incrementDislikeCount();
                }
                log.info("게시글 투표 변경: postId={}, userId={}, oldVote={}, newVote={}", postId, userId, existingVote.getVoteType(), requestedVoteType);
            }
        } else { // 새로 투표하는 경우
            PostLike newVote = PostLike.builder()
                    .user(user)
                    .boardPost(post)
                    .voteType(requestedVoteType)
                    .build();
            postLikeRepository.save(newVote);
            if (requestedVoteType == VoteType.LIKE) {
                post.incrementLikeCount();
            } else {
                post.incrementDislikeCount();
            }
            log.info("게시글 투표 추가: postId={}, userId={}, voteType={}", postId, userId, requestedVoteType);
        }
        // boardPostRepository.save(post); // BoardPost의 likeCount, dislikeCount 변경사항 저장 (변경 감지)
    }

    // 댓글 생성
    @Transactional
    public CommentResponseDto createComment(Long postId, CommentCreateRequest request, Long authorId) {
        User author = userRepository.findById(authorId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다. ID: " + authorId));
        BoardPost post = boardPostRepository.findById(postId)
                .orElseThrow(() -> new IllegalArgumentException("게시글을 찾을 수 없습니다. ID: " + postId));

        BoardComment parentComment = null;
        if (request.getParentId() != null) { // 대댓글인 경우 부모 댓글 조회
            parentComment = boardCommentRepository.findById(request.getParentId())
                    .orElseThrow(() -> new IllegalArgumentException("부모 댓글을 찾을 수 없습니다. ID: " + request.getParentId()));
            // 부모 댓글이 같은 게시글에 속하는지 확인 (선택적)
            if (!parentComment.getBoardPost().getId().equals(postId)) {
                throw new IllegalArgumentException("부모 댓글이 현재 게시글에 속하지 않습니다.");
            }
        }

        BoardComment comment = BoardComment.builder()
                .content(request.getContent())
                .author(author)
                .boardPost(post)
                .parentComment(parentComment) // 대댓글이면 설정, 아니면 null
                .build();

        BoardComment savedComment = boardCommentRepository.save(comment);
        log.info("새 댓글 생성 완료: commentId={}, postId={}, authorId={}", savedComment.getId(), postId, authorId);

        // TODO: 게시글 작성자 또는 부모 댓글 작성자에게 알림 생성 (NotificationService 사용)

        return CommentResponseDto.from(savedComment, false, false);
    }

    // 특정 게시글의 댓글 목록 조회 (페이징, 최상위 댓글만 + 대댓글 포함)
    @Transactional(readOnly = true)
    public Page<CommentResponseDto> getCommentsByPost(Long postId, Pageable pageable, UserPrincipal currentUserPrincipal) {
        BoardPost post = boardPostRepository.findById(postId)
                .orElseThrow(() -> new IllegalArgumentException("게시글을 찾을 수 없습니다. ID: " + postId));

        // 최상위 댓글만 페이징으로 가져옴
        Page<BoardComment> topLevelCommentsPage = boardCommentRepository
                .findByBoardPostAndParentCommentIsNullAndIsDeletedFalseOrderByCreatedAtAsc(post, pageable);

        // 각 최상위 댓글에 대해 대댓글을 로드하여 DTO로 변환 (N+1 문제 발생 가능성 있음, @EntityGraph 등으로 최적화 가능)
        // User currentUser = currentUserPrincipal != null ? userRepository.findById(currentUserPrincipal.getId()).orElse(null) : null;

        User currentUser = null;
        if (currentUserPrincipal != null) {
            currentUser = userRepository.findById(currentUserPrincipal.getId()).orElse(null);
        }
        User finalCurrentUser = currentUser; // Effectively final for lambda

        return topLevelCommentsPage.map(comment -> {
            boolean liked = false;
            boolean disliked = false;
            if (finalCurrentUser != null) {
                Optional<CommentLike> commentLikeOpt = commentLikeRepository.findByUserAndBoardComment(finalCurrentUser, comment);
                if (commentLikeOpt.isPresent()) {
                    VoteType userVote = commentLikeOpt.get().getVoteType();
                    if (userVote == VoteType.LIKE) liked = true;
                    else if (userVote == VoteType.DISLIKE) disliked = true;
                }
            }
            // CommentResponseDto.from 메소드가 재귀적으로 children을 처리할 때도 이 로직이 필요할 수 있음
            // 또는 children에 대한 좋아요/싫어요는 별도 처리
            return CommentResponseDto.from(comment, liked, disliked);
        });
    }

    @Transactional
    public void voteForComment(Long commentId, Long userId, VoteType requestedVoteType) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + userId));
        BoardComment comment = boardCommentRepository.findById(commentId)
                .orElseThrow(() -> new IllegalArgumentException("Comment not found: " + commentId));

        if (comment.isDeleted()){
            throw new IllegalStateException("삭제된 댓글에는 투표할 수 없습니다.");
        }
        if (comment.getAuthor().getId().equals(userId)) {
            throw new IllegalStateException("자신의 댓글에는 투표할 수 없습니다.");
        }

        Optional<CommentLike> existingVoteOpt = commentLikeRepository.findByUserAndBoardComment(user, comment);

        if (existingVoteOpt.isPresent()) {
            CommentLike existingVote = existingVoteOpt.get();
            if (existingVote.getVoteType() == requestedVoteType) { // 같은 타입 다시 클릭 -> 취소
                commentLikeRepository.delete(existingVote);
                if (requestedVoteType == VoteType.LIKE) comment.decrementLikeCount();
                else comment.decrementDislikeCount();
                log.info("댓글 투표 취소: commentId={}, userId={}, voteType={}", commentId, userId, requestedVoteType);
            } else { // 다른 타입으로 변경
                if (existingVote.getVoteType() == VoteType.LIKE) comment.decrementLikeCount();
                else comment.decrementDislikeCount();

                existingVote.setVoteType(requestedVoteType); // CommentLike 엔티티에 setVoteType 추가 필요
                // commentLikeRepository.save(existingVote); // 변경 감지

                if (requestedVoteType == VoteType.LIKE) comment.incrementLikeCount();
                else comment.incrementDislikeCount();
                log.info("댓글 투표 변경: commentId={}, userId={}, newVote={}", commentId, userId, requestedVoteType);
            }
        } else { // 새로 투표
            CommentLike newVote = CommentLike.builder()
                    .user(user)
                    .boardComment(comment)
                    .voteType(requestedVoteType)
                    .build();
            commentLikeRepository.save(newVote);
            if (requestedVoteType == VoteType.LIKE) comment.incrementLikeCount();
            else comment.incrementDislikeCount();
            log.info("댓글 투표 추가: commentId={}, userId={}, voteType={}", commentId, userId, requestedVoteType);
        }
        // boardCommentRepository.save(comment); // BoardComment의 like/dislikeCount 변경사항 저장 (변경 감지)
    }

    // TODO: 게시글 목록 조회, 상세 조회, 수정, 삭제, 추천/비추천, 댓글 관련 서비스 메소드 추가
}
