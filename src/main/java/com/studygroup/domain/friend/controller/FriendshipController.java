package com.studygroup.domain.friend.controller;

import com.studygroup.domain.friend.dto.FriendDto;
import com.studygroup.domain.friend.dto.FriendRequestDto;
import com.studygroup.domain.friend.service.FriendshipService;
import com.studygroup.global.security.CurrentUser;
import com.studygroup.global.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/friends")
@RequiredArgsConstructor
@PreAuthorize("isAuthenticated()")
public class FriendshipController {

    private final FriendshipService friendshipService;

    // 친구 신청 보내기
    @PostMapping("/request/{toUserId}")
    public ResponseEntity<Void> sendRequest(@PathVariable Long toUserId, @CurrentUser UserPrincipal principal) {
        friendshipService.sendFriendRequest(principal.getId(), toUserId);
        return ResponseEntity.ok().build();
    }

    // 친구 신청 수락
    @PostMapping("/accept/{friendshipId}")
    public ResponseEntity<Void> acceptRequest(@PathVariable Long friendshipId, @CurrentUser UserPrincipal principal) {
        friendshipService.acceptFriendRequest(friendshipId, principal.getId());
        return ResponseEntity.ok().build();
    }

    // 친구 신청 거절 또는 보낸 신청 취소
    @DeleteMapping("/request/{friendshipId}")
    public ResponseEntity<Void> rejectOrCancelRequest(@PathVariable Long friendshipId, @CurrentUser UserPrincipal principal) {
        friendshipService.rejectOrCancelFriendRequest(friendshipId, principal.getId());
        return ResponseEntity.noContent().build();
    }

    // TODO: 내 친구 목록 조회, 내가 보낸/받은 신청 목록 조회 API

    // 내 친구 목록 조회
    @GetMapping("/my")
    public ResponseEntity<List<FriendDto>> getMyFriends(@CurrentUser UserPrincipal principal) {
        return ResponseEntity.ok(friendshipService.getFriends(principal.getId()));
    }

    // 내가 받은 친구 신청 목록
    @GetMapping("/requests/received")
    public ResponseEntity<List<FriendRequestDto>> getReceivedRequests(@CurrentUser UserPrincipal principal) {
        return ResponseEntity.ok(friendshipService.getReceivedFriendRequests(principal.getId()));
    }

    // 내가 보낸 친구 신청 목록
    @GetMapping("/requests/sent")
    public ResponseEntity<List<FriendRequestDto>> getSentRequests(@CurrentUser UserPrincipal principal) {
        return ResponseEntity.ok(friendshipService.getSentFriendRequests(principal.getId()));
    }
}
