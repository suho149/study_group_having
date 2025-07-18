package com.studygroup.domain.user.controller;

import com.studygroup.domain.badge.dto.BadgeDto;
import com.studygroup.domain.badge.entity.UserBadge;
import com.studygroup.domain.badge.repository.UserBadgeRepository;
import com.studygroup.domain.board.dto.BoardPostSummaryResponse;
import com.studygroup.domain.board.service.BoardService;
import com.studygroup.domain.study.dto.StudyGroupResponse;
import com.studygroup.domain.study.service.StudyGroupService;
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
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;
    private final BoardService boardService; // BoardService 주입 (좋아요 한 글 목록 때문에 필요)
    private final StudyGroupService studyGroupService;
    private final UserBadgeRepository userBadgeRepository;

    @GetMapping("/search")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<UserSearchResponse>> searchUsers(@RequestParam String keyword) {
        List<UserSearchResponse> users = userService.searchUsers(keyword);
        return ResponseEntity.ok(users);
    }

    @GetMapping("/{userId}/profile")
    // 이 API는 다른 사람의 프로필도 조회할 수 있어야 하므로, 인증된 사용자라면 누구나 호출 가능하도록 합니다.
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<UserProfileResponse> getUserProfileById(@PathVariable Long userId) {
        UserProfileResponse userProfile = userService.getUserProfile(userId);
        return ResponseEntity.ok(userProfile);
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

    // 좋아요 한 스터디 목록 API
    @GetMapping("/me/liked-studies")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Page<StudyGroupResponse>> getMyLikedStudies(
            @CurrentUser UserPrincipal userPrincipal,
            @PageableDefault(size = 9, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<StudyGroupResponse> likedStudies = studyGroupService.getLikedStudies(userPrincipal.getId(), pageable);
        return ResponseEntity.ok(likedStudies);
    }

    // 참여중인 스터디 목록 API
    @GetMapping("/me/participating-studies")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Page<StudyGroupResponse>> getMyParticipatingStudies(
            @CurrentUser UserPrincipal userPrincipal,
            @PageableDefault(size = 9, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<StudyGroupResponse> participatingStudies = studyGroupService.getParticipatingStudies(userPrincipal.getId(), pageable);
        return ResponseEntity.ok(participatingStudies);
    }

    @PutMapping("/me")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Void> updateUserProfile(
            @CurrentUser UserPrincipal userPrincipal,
            @RequestParam("name") String name,
            @RequestParam(value = "profileImage", required = false) MultipartFile profileImage) {

        userService.updateUserProfile(userPrincipal.getId(), name, profileImage);
        return ResponseEntity.ok().build();
    }

    // --- 사용자의 뱃지 목록 조회 API 추가 ---
    @GetMapping("/{userId}/badges")
    public ResponseEntity<List<BadgeDto>> getUserBadges(@PathVariable Long userId) {
        User user = userService.getUserById(userId); // 기존 UserService 메소드 재활용
        List<UserBadge> userBadges = userBadgeRepository.findByUser(user);

        List<BadgeDto> badgeDtos = userBadges.stream()
                .map(userBadge -> new BadgeDto(userBadge.getBadge()))
                .collect(Collectors.toList());

        return ResponseEntity.ok(badgeDtos);
    }
} 