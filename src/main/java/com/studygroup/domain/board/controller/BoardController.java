package com.studygroup.domain.board.controller;

import com.studygroup.domain.board.dto.BoardPostCreateRequest;
import com.studygroup.domain.board.dto.BoardPostResponse;
import com.studygroup.domain.board.service.BoardService;
import com.studygroup.global.security.CurrentUser;
import com.studygroup.global.security.UserPrincipal;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Slf4j
@RestController
@RequestMapping("/api/board/posts") // 게시판 관련 API 기본 경로
@RequiredArgsConstructor
public class BoardController {

    private final BoardService boardService;

    @PostMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<BoardPostResponse> createPost(
            @Valid @RequestBody BoardPostCreateRequest request,
            @CurrentUser UserPrincipal userPrincipal) {
        log.info("게시글 생성 요청: authorId={}, category={}, title={}",
                userPrincipal.getId(), request.getCategory(), request.getTitle());
        BoardPostResponse createdPost = boardService.createPost(request, userPrincipal.getId());
        return ResponseEntity.status(HttpStatus.CREATED).body(createdPost);
    }

    // TODO: 게시글 목록, 상세, 수정, 삭제 등 API 엔드포인트 추가
}
