package com.studygroup.domain.board.service;

import com.studygroup.domain.board.dto.*;
import com.studygroup.domain.board.entity.BoardComment;
import com.studygroup.domain.board.entity.BoardPost;
import com.studygroup.domain.board.repository.BoardCommentRepository;
import com.studygroup.domain.board.repository.BoardPostRepository;
import com.studygroup.domain.user.entity.User;
import com.studygroup.domain.user.repository.UserRepository;
import com.studygroup.global.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class BoardService {

    private final BoardPostRepository boardPostRepository;
    private final UserRepository userRepository;
    private final BoardCommentRepository boardCommentRepository;

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
        return BoardPostResponse.from(savedPost);
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
        boolean isLikedByCurrentUser = false;
        // if (currentUserPrincipal != null) {
        //     User currentUser = userRepository.findById(currentUserPrincipal.getId()).orElse(null);
        //     if (currentUser != null) {
        //         // isLikedByCurrentUser = postLikeRepository.existsByUserAndBoardPost(currentUser, post);
        //     }
        // }

        // 댓글 수 (댓글 기능 구현 시)
        // int commentCount = boardCommentRepository.countByBoardPost(post);

        // BoardPostResponse.from() 메소드를 수정하여 필요한 모든 정보를 담도록 함
        // 여기서는 isLikedByCurrentUser와 commentCount는 아직 구현되지 않았다고 가정
        return BoardPostResponse.from(post /*, isLikedByCurrentUser, commentCount */);
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

        return CommentResponseDto.from(savedComment);
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

        return topLevelCommentsPage.map(comment -> {
            // boolean liked = false; // 추천/비추천 기능 추가 시 현재 사용자의 추천 여부 판단
            // boolean disliked = false;
            // if(currentUser != null) {
            //    // liked = commentLikeRepository.existsByCommentAndUserAndVoteType(comment, currentUser, VoteType.LIKE);
            //    // disliked = commentLikeRepository.existsByCommentAndUserAndVoteType(comment, currentUser, VoteType.DISLIKE);
            // }
            return CommentResponseDto.from(comment /*, liked, disliked */);
        });
    }

    // TODO: 게시글 목록 조회, 상세 조회, 수정, 삭제, 추천/비추천, 댓글 관련 서비스 메소드 추가
}
