package com.studygroup.domain.user.controller;

import com.studygroup.domain.board.dto.BoardPostSummaryResponse;
import com.studygroup.domain.board.service.BoardService;
import com.studygroup.domain.user.dto.UserActivitySummaryResponse;
import com.studygroup.domain.user.dto.UserProfileResponse;
import com.studygroup.domain.user.dto.UserSearchResponse;
import com.studygroup.domain.user.entity.User;
import com.studygroup.domain.user.service.UserService;
import com.studygroup.global.security.CurrentUser;
import com.studygroup.global.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;
    private final BoardService boardService; // BoardService 주입 (좋아요 한 글 목록 때문에 필요)

    @GetMapping("/search")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<UserSearchResponse>> searchUsers(@RequestParam String keyword) {
        List<UserSearchResponse> users = userService.searchUsers(keyword);
        return ResponseEntity.ok(users);
    }

    @GetMapping("/me")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<UserProfileResponse> getCurrentUserProfile(@CurrentUser UserPrincipal userPrincipal) {
        User user = userService.getUserById(userPrincipal.getId()); // ID로 User 엔티티 조회
        return ResponseEntity.ok(UserProfileResponse.from(user));
    }

    @GetMapping("/me/activity-summary")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<UserActivitySummaryResponse> getCurrentUserActivitySummary(@CurrentUser UserPrincipal userPrincipal) {
        UserActivitySummaryResponse summary = userService.getUserActivitySummary(userPrincipal.getId());
        return ResponseEntity.ok(summary);
    }

    @GetMapping("/me/liked-posts")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Page<BoardPostSummaryResponse>> getMyLikedPosts(
            @CurrentUser UserPrincipal userPrincipal,
            @PageableDefault(size = 10, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<BoardPostSummaryResponse> likedPosts = boardService.getLikedPosts(userPrincipal.getId(), pageable);
        return ResponseEntity.ok(likedPosts);
    }
} 