package com.studygroup.domain.board.service;

import com.studygroup.domain.board.dto.*;
import com.studygroup.domain.board.entity.*;
import com.studygroup.domain.board.repository.*;
import com.studygroup.domain.notification.entity.NotificationType;
import com.studygroup.domain.notification.service.NotificationService;
import com.studygroup.domain.user.dto.UserActivityEvent;
import com.studygroup.domain.user.entity.ActivityType;
import com.studygroup.domain.user.entity.User;
import com.studygroup.domain.user.repository.UserRepository;
import com.studygroup.global.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.TemporalAdjusters;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

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
    private static final int MIN_LIKES_FOR_HOT_POST = 4; // 핫 게시물 최소 추천 수
    private static final int HOT_POST_COUNT = 3;         // 가져올 핫 게시물 개수
    private final ApplicationEventPublisher eventPublisher; // 이벤트 발행기 주입
    private final NotificationService notificationService;

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

        // --- 게시글 작성 이벤트 발행 ---
        eventPublisher.publishEvent(new UserActivityEvent(author, ActivityType.CREATE_POST));

        return BoardPostResponse.from(savedPost, false, false);
    }

    @Transactional(readOnly = true)
    public Page<BoardPostSummaryResponse> getBoardPosts(
            String categoryString, String keyword, Pageable pageable, UserPrincipal currentUserPrincipal) {

        // Specification을 사용하여 동적 쿼리 생성
        Specification<BoardPost> spec = BoardPostSpecification.withFilter(categoryString, keyword);

        // 수정: findAll(pageable) 대신 findAll(spec, pageable) 사용
        Page<BoardPost> postsPage = boardPostRepository.findAll(spec, pageable);

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

    // 조회수 증가 로직을 별도 메소드로 분리
    @Transactional
    public void incrementPostViewCount(Long postId) {
        BoardPost post = boardPostRepository.findById(postId)
                .orElseThrow(() -> new IllegalArgumentException("게시글을 찾을 수 없습니다. ID: " + postId));
        post.incrementViewCount();
        // 변경 감지로 저장됨
        log.info("게시글 조회수 증가: postId={}", postId);
    }

    @Transactional // 조회수 증가로 인해 쓰기 트랜잭션 필요
    public BoardPostResponse getPostDetail(Long postId, UserPrincipal currentUserPrincipal) {
        BoardPost post = boardPostRepository.findById(postId)
                .orElseThrow(() -> new IllegalArgumentException("게시글을 찾을 수 없습니다. ID: " + postId));

        //post.incrementViewCount(); // 조회수 증가
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

        User postAuthor = post.getAuthor();

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
                if (!postAuthor.getId().equals(userId)) {
                    // 포인트 부여 이벤트 발행
                    eventPublisher.publishEvent(new UserActivityEvent(postAuthor, ActivityType.GET_POST_LIKE));

                    // 게시글 작성자에게 '좋아요' 알림 생성
                    String message = String.format("'%s'님이 회원님의 게시글을 좋아합니다.", user.getName());
                    notificationService.createNotification(
                            user,       // 알림 발신자: 좋아요를 누른 사람
                            postAuthor, // 알림 수신자: 게시글 작성자
                            message,
                            NotificationType.NEW_LIKE_ON_POST,
                            post.getId() // 관련 콘텐츠 ID: 게시글 ID
                    );
                    // ------------------------------------
                }
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

        // 자기 자신의 글이나 댓글에 남기는 경우는 알림을 보내지 않습니다.
        if (parentComment == null) {
            // 1. 일반 댓글인 경우 -> 게시글 작성자에게 알림
            User postAuthor = post.getAuthor();
            if (!postAuthor.getId().equals(authorId)) {
                String message = String.format("'%s'님이 회원님의 게시글에 댓글을 남겼습니다.", author.getName());
                notificationService.createNotification(
                        author,
                        postAuthor,
                        message,
                        NotificationType.NEW_COMMENT_ON_POST,
                        post.getId()
                );
            }
        } else {
            // 2. 대댓글인 경우 -> 부모 댓글 작성자에게 알림
            User parentCommentAuthor = parentComment.getAuthor();
            if (!parentCommentAuthor.getId().equals(authorId)) {
                String message = String.format("'%s'님이 회원님의 댓글에 답글을 남겼습니다.", author.getName());
                notificationService.createNotification(
                        author,
                        parentCommentAuthor,
                        message,
                        NotificationType.NEW_REPLY_ON_COMMENT,
                        post.getId() // 알림 클릭 시 이동할 곳은 게시글이므로 post.getId() 사용
                );
            }
        }

        // --- 댓글 작성 이벤트 발행 ---
        eventPublisher.publishEvent(new UserActivityEvent(author, ActivityType.CREATE_COMMENT));

        return CommentResponseDto.from(savedComment, false, false);
    }

    // 특정 게시글의 댓글 목록 조회 (페이징, 최상위 댓글만 + 대댓글 포함)
    @Transactional(readOnly = true)
    public Page<CommentResponseDto> getCommentsByPost(Long postId, Pageable pageable, UserPrincipal currentUserPrincipal) {
        BoardPost post = boardPostRepository.findById(postId)
                .orElseThrow(() -> new IllegalArgumentException("게시글을 찾을 수 없습니다. ID: " + postId));

        // 최상위 댓글만 페이징으로 가져옴
//        Page<BoardComment> topLevelCommentsPage = boardCommentRepository
//                .findByBoardPostAndParentCommentIsNullAndIsDeletedFalseOrderByCreatedAtAsc(post, pageable);

        Page<BoardComment> topLevelCommentsPage = boardCommentRepository
                .findByBoardPostAndParentCommentIsNullOrderByCreatedAtAsc(post, pageable);

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

    // 게시글 수정
    public BoardPostResponse updatePost(Long postId, BoardPostUpdateRequest request, Long userId) {
        BoardPost post = boardPostRepository.findById(postId)
                .orElseThrow(() -> new IllegalArgumentException("게시글을 찾을 수 없습니다. ID: " + postId));

        // 작성자 본인인지 확인
        if (!post.getAuthor().getId().equals(userId)) {
            throw new IllegalStateException("게시글 수정 권한이 없습니다.");
        }

        post.update(request.getTitle(), request.getContent(), request.getCategory());
        // boardPostRepository.save(post); // 변경 감지로 저장
        log.info("게시글 수정 완료: postId={}", postId);
        // 수정 후 상세 정보를 다시 반환
        return BoardPostResponse.from(post, false, false); // 좋아요/싫어요 정보는 별도 조회 필요
    }

    // 게시글 삭제 (소프트 삭제 또는 하드 삭제)
    public void deletePost(Long postId, Long userId) {
        BoardPost post = boardPostRepository.findById(postId)
                .orElseThrow(() -> new IllegalArgumentException("게시글을 찾을 수 없습니다. ID: " + postId));

        if (!post.getAuthor().getId().equals(userId)) {
            throw new IllegalStateException("게시글 삭제 권한이 없습니다.");
        }

        // 하드 삭제: 연관된 댓글, 좋아요 등도 함께 삭제됨 (Cascade 설정에 따라)
        boardPostRepository.delete(post);
        log.info("게시글 삭제 완료: postId={}", postId);
        // 소프트 삭제: post.markAsDeleted(); (BoardPost 엔티티에 관련 필드 및 메소드 추가 필요)
    }

    // 댓글 수정
    public CommentResponseDto updateComment(Long commentId, CommentUpdateRequest request, Long userId) {
        BoardComment comment = boardCommentRepository.findById(commentId)
                .orElseThrow(() -> new IllegalArgumentException("댓글을 찾을 수 없습니다. ID: " + commentId));

        if (!comment.getAuthor().getId().equals(userId)) {
            throw new IllegalStateException("댓글 수정 권한이 없습니다.");
        }
        if (comment.isDeleted()) {
            throw new IllegalStateException("삭제된 댓글은 수정할 수 없습니다.");
        }

        comment.updateContent(request.getContent());
        log.info("댓글 수정 완료: commentId={}", commentId);
        return CommentResponseDto.from(comment, false, false);
    }

    // 댓글 삭제 (소프트 삭제 권장)
    public void deleteComment(Long commentId, Long userId) {
        BoardComment comment = boardCommentRepository.findById(commentId)
                .orElseThrow(() -> new IllegalArgumentException("댓글을 찾을 수 없습니다. ID: " + commentId));

        if (!comment.getAuthor().getId().equals(userId)) {
            throw new IllegalStateException("댓글 삭제 권한이 없습니다.");
        }

        // 대댓글이 있는 경우, 실제 내용을 지우고 "삭제된 댓글입니다"로 표시 (소프트 삭제)
        if (!comment.getChildrenComments().isEmpty()) {
            comment.markAsDeleted();
            log.info("댓글 소프트 삭제 완료 (대댓글 존재): commentId={}", commentId);
        } else {
            // 대댓글이 없으면 DB에서 완전히 삭제 (하드 삭제)
            // 만약 이 댓글이 다른 댓글의 자식이라면, 부모의 childrenComments 컬렉션에서도 제거해야 함
            BoardComment parent = comment.getParentComment();
            if (parent != null) {
                parent.getChildrenComments().remove(comment);
            }
            boardCommentRepository.delete(comment);
            log.info("댓글 하드 삭제 완료: commentId={}", commentId);
        }
    }

    // --- 핫 게시물 목록 조회 서비스 메소드 추가 ---
    public List<BoardPostSummaryResponse> getHotPosts() {
        // 이번 주 월요일 00:00:00 계산
        LocalDateTime startOfWeek = LocalDate.now().with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY)).atStartOfDay();
        // 지금 이 순간까지 (일요일 23:59:59 대신 현재 시간까지로)
        LocalDateTime now = LocalDateTime.now();

        // 상위 N개만 가져오기 위한 Pageable 객체 생성
        Pageable pageable = PageRequest.of(0, HOT_POST_COUNT);

        List<BoardPost> hotPosts = boardPostRepository.findHotPosts(
                MIN_LIKES_FOR_HOT_POST,
                startOfWeek,
                now,
                pageable
        );

        // DTO로 변환하여 반환
        // BoardPostSummaryResponse.from() 메소드는 like, comment 수 등을 처리해야 함
        // (이전 답변에서 기본 구현은 되어 있음)
        return hotPosts.stream()
                .map(post -> BoardPostSummaryResponse.from(post /*, isLiked 등 추가 정보 */))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Page<BoardPostSummaryResponse> getLikedPosts(Long userId, Pageable pageable) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + userId));

        // 사용자가 'LIKE'한 PostLike 엔티티 목록을 페이징하여 조회
        Page<PostLike> likedPostLikes = postLikeRepository.findByUserAndVoteTypeOrderByCreatedAtDesc(user, VoteType.LIKE, pageable);

        // Page<PostLike>를 Page<BoardPostSummaryResponse>로 변환
        return likedPostLikes.map(postLike -> {
            BoardPost post = postLike.getBoardPost();
            // BoardPostSummaryResponse.from() 메소드를 활용하여 DTO 생성
            // 이 DTO는 좋아요 수, 댓글 수 등을 이미 포함하고 있음
            return BoardPostSummaryResponse.from(post);
        });
    }
}
