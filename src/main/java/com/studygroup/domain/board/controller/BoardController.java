package com.studygroup.domain.board.controller;

import com.studygroup.domain.board.dto.*;
import com.studygroup.domain.board.service.BoardService;
import com.studygroup.global.security.CurrentUser;
import com.studygroup.global.security.UserPrincipal;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/api/board") // 게시판 관련 API 기본 경로
@RequiredArgsConstructor
public class BoardController {

    private final BoardService boardService;

    @PostMapping("/posts")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<BoardPostResponse> createPost(
            @Valid @RequestBody BoardPostCreateRequest request,
            @CurrentUser UserPrincipal userPrincipal) {
        log.info("게시글 생성 요청: authorId={}, category={}, title={}",
                userPrincipal.getId(), request.getCategory(), request.getTitle());
        BoardPostResponse createdPost = boardService.createPost(request, userPrincipal.getId());
        return ResponseEntity.status(HttpStatus.CREATED).body(createdPost);
    }

    // --- 게시글 목록 조회 API 추가 ---
    @GetMapping("/posts")
    public ResponseEntity<Page<BoardPostSummaryResponse>> getBoardPosts(
            @RequestParam(required = false) String category, // BoardCategory Enum으로 받을 수도 있음
            @RequestParam(required = false) String keyword,
            @PageableDefault(size = 10, sort = "createdAt,desc") Pageable pageable,
            @CurrentUser UserPrincipal userPrincipal // 현재 사용자 정보 (좋아요 여부 등 판단용)
    ) {
        log.info("게시글 목록 조회 요청: category={}, keyword={}, pageable={}", category, keyword, pageable);
        // BoardService에 getBoardPosts 메소드 구현 필요
        Page<BoardPostSummaryResponse> posts = boardService.getBoardPosts(category, keyword, pageable, userPrincipal);
        return ResponseEntity.ok(posts);
    }

    @GetMapping("/posts/{postId}")
    public ResponseEntity<BoardPostResponse> getPostDetail(
            @PathVariable Long postId,
            @CurrentUser UserPrincipal userPrincipal) { // 좋아요 여부 판단 등에 사용 가능
        log.info("게시글 상세 조회 요청: postId={}, userId={}", postId, userPrincipal != null ? userPrincipal.getId() : "Anonymous");
        BoardPostResponse postDetail = boardService.getPostDetail(postId, userPrincipal);
        return ResponseEntity.ok(postDetail);
    }

    // --- 댓글 API ---
    @PostMapping("/posts/{postId}/comments")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<CommentResponseDto> createComment(
            @PathVariable Long postId,
            @Valid @RequestBody CommentCreateRequest request,
            @CurrentUser UserPrincipal userPrincipal) {
        log.info("댓글 생성 요청: postId={}, authorId={}, parentId={}",
                postId, userPrincipal.getId(), request.getParentId());
        CommentResponseDto createdComment = boardService.createComment(postId, request, userPrincipal.getId());
        return ResponseEntity.status(HttpStatus.CREATED).body(createdComment);
    }

    @GetMapping("/posts/{postId}/comments")
    public ResponseEntity<Page<CommentResponseDto>> getCommentsByPost(
            @PathVariable Long postId,
            @PageableDefault(size = 10, sort = "createdAt,asc") Pageable pageable, // 오래된 순으로
            @CurrentUser UserPrincipal userPrincipal) { // 추천/비추천 상태 표시용
        log.info("댓글 목록 조회 요청: postId={}, pageable={}", postId, pageable);
        Page<CommentResponseDto> comments = boardService.getCommentsByPost(postId, pageable, userPrincipal);
        return ResponseEntity.ok(comments);
    }

    // 게시글 추천/비추천/취소 통합 (POST 요청 한번으로 처리)
    @PostMapping("/posts/{postId}/vote")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Void> voteForPost(
            @PathVariable Long postId,
            @RequestBody VoteRequest voteRequest, // 요청 바디로 LIKE 또는 DISLIKE 받음
            @CurrentUser UserPrincipal userPrincipal) {
        log.info("게시글 투표 요청: postId={}, userId={}, voteType={}",
                postId, userPrincipal.getId(), voteRequest.getVoteType());
        boardService.voteForPost(postId, userPrincipal.getId(), voteRequest.getVoteType());
        return ResponseEntity.ok().build();
    }

    // --- 댓글 추천/비추천 API 추가 ---
    @PostMapping("/comments/{commentId}/vote")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Void> voteForComment(
            @PathVariable Long commentId,
            @Valid @RequestBody VoteRequest voteRequest, // @Valid 추가
            @CurrentUser UserPrincipal userPrincipal) {
        log.info("댓글 투표 요청: commentId={}, userId={}, voteType={}",
                commentId, userPrincipal.getId(), voteRequest.getVoteType());
        boardService.voteForComment(commentId, userPrincipal.getId(), voteRequest.getVoteType());
        return ResponseEntity.ok().build();
    }

    // TODO: 게시글 목록, 상세, 수정, 삭제 등 API 엔드포인트 추가
}
