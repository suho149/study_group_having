package com.studygroup.domain.chat.controller;

import com.studygroup.domain.chat.dto.ChatMessageResponse;
import com.studygroup.domain.chat.dto.ChatRoomCreateRequest;
import com.studygroup.domain.chat.dto.ChatRoomDetailResponse;
import com.studygroup.domain.chat.dto.ChatRoomResponse;
import com.studygroup.domain.chat.service.ChatService;
import com.studygroup.global.security.CurrentUser;
import com.studygroup.global.security.UserPrincipal;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/chat")
@RequiredArgsConstructor
public class ChatController {

    private final ChatService chatService;

    // 스터디 그룹 내 채팅방 생성
    @PostMapping("/study-group/{studyGroupId}/rooms")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ChatRoomDetailResponse> createChatRoom(
            @PathVariable Long studyGroupId,
            @Valid @RequestBody ChatRoomCreateRequest request,
            @CurrentUser UserPrincipal userPrincipal) {
        ChatRoomDetailResponse createdRoom = chatService.createChatRoom(studyGroupId, request, userPrincipal.getId());
        return ResponseEntity.status(HttpStatus.CREATED).body(createdRoom);
    }

    // 내가 참여하고 있는 채팅방 목록 조회
    @GetMapping("/my-rooms")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<ChatRoomResponse>> getMyChatRooms(@CurrentUser UserPrincipal userPrincipal) {
        List<ChatRoomResponse> myRooms = chatService.getMyChatRooms(userPrincipal.getId());
        return ResponseEntity.ok(myRooms);
    }

    // 특정 스터디 그룹의 채팅방 목록 조회 (내가 참여/초대된 방만)
    @GetMapping("/study-group/{studyGroupId}/rooms")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<ChatRoomResponse>> getChatRoomsByStudyGroup(
            @PathVariable Long studyGroupId,
            @CurrentUser UserPrincipal userPrincipal) {
        List<ChatRoomResponse> rooms = chatService.getChatRoomsByStudyGroup(studyGroupId, userPrincipal.getId());
        return ResponseEntity.ok(rooms);
    }

    // 특정 채팅방 상세 정보 조회
    @GetMapping("/rooms/{chatRoomId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ChatRoomDetailResponse> getChatRoomDetail(
            @PathVariable Long chatRoomId,
            @CurrentUser UserPrincipal userPrincipal) {
        ChatRoomDetailResponse roomDetail = chatService.getChatRoomDetail(chatRoomId, userPrincipal.getId());
        return ResponseEntity.ok(roomDetail);
    }

    // 특정 채팅방의 이전 메시지 목록 조회 (페이징)
    @GetMapping("/rooms/{chatRoomId}/messages")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Page<ChatMessageResponse>> getChatMessages(
            @PathVariable Long chatRoomId,
            @CurrentUser UserPrincipal userPrincipal,
            @PageableDefault(size = 20, sort = "createdAt,desc") Pageable pageable) {
        Page<ChatMessageResponse> messages = chatService.getChatMessages(chatRoomId, userPrincipal.getId(), pageable);
        return ResponseEntity.ok(messages);
    }

    // 채팅방 초대 응답 (수락/거절)
    @PostMapping("/rooms/{chatRoomId}/invites/respond")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Void> respondToChatInvite(
            @PathVariable Long chatRoomId,
            @RequestParam boolean accept,
            @CurrentUser UserPrincipal userPrincipal) {
        chatService.respondToChatInvite(chatRoomId, userPrincipal.getId(), accept);
        return ResponseEntity.ok().build();
    }

    // 채팅방 나가기
    @DeleteMapping("/rooms/{chatRoomId}/leave")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Void> leaveChatRoom(
            @PathVariable Long chatRoomId,
            @CurrentUser UserPrincipal userPrincipal) {
        chatService.leaveChatRoom(chatRoomId, userPrincipal.getId());
        return ResponseEntity.noContent().build();
    }

    // 방장에 의한 멤버 강제 퇴장
    @DeleteMapping("/rooms/{chatRoomId}/members/{memberUserIdToRemove}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Void> removeMemberFromChatRoom(
            @PathVariable Long chatRoomId,
            @PathVariable Long memberUserIdToRemove,
            @CurrentUser UserPrincipal userPrincipal) {
        chatService.removeMemberFromChatRoomByCreator(chatRoomId, memberUserIdToRemove, userPrincipal.getId());
        return ResponseEntity.noContent().build();
    }

    // 채팅방 멤버 초대
    @PostMapping("/rooms/{chatRoomId}/invite-members")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Void> inviteUsersToChatRoom(
            @PathVariable Long chatRoomId,
            @RequestBody List<Long> userIdsToInvite, // 초대할 사용자 ID 목록
            @CurrentUser UserPrincipal userPrincipal) {
        chatService.inviteUsersToChatRoom(chatRoomId, userIdsToInvite, userPrincipal.getId());
        return ResponseEntity.ok().build();
    }
}
