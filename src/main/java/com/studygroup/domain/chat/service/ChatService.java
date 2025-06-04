package com.studygroup.domain.chat.service;

import com.studygroup.domain.chat.dto.*;
import com.studygroup.domain.chat.entity.*;
import com.studygroup.domain.chat.repository.ChatMessageRepository;
import com.studygroup.domain.chat.repository.ChatRoomMemberRepository;
import com.studygroup.domain.chat.repository.ChatRoomRepository;
import com.studygroup.domain.notification.entity.NotificationType;
import com.studygroup.domain.notification.service.NotificationService;
import com.studygroup.domain.study.entity.StudyGroup;
import com.studygroup.domain.study.repository.StudyGroupRepository;
import com.studygroup.domain.user.entity.User;
import com.studygroup.domain.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.messaging.simp.SimpMessageSendingOperations;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class ChatService {

    private final ChatRoomRepository chatRoomRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final ChatRoomMemberRepository chatRoomMemberRepository;
    private final UserRepository userRepository;
    private final StudyGroupRepository studyGroupRepository;
    private final NotificationService notificationService;
    private final SimpMessageSendingOperations messagingTemplate; // STOMP 메시지 발송

    // 채팅방 생성
    public ChatRoomDetailResponse createChatRoom(Long studyGroupId, ChatRoomCreateRequest request, Long creatorUserId) {
        User creator = userRepository.findById(creatorUserId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다. ID: " + creatorUserId));
        StudyGroup studyGroup = studyGroupRepository.findById(studyGroupId)
                .orElseThrow(() -> new IllegalArgumentException("스터디 그룹을 찾을 수 없습니다. ID: " + studyGroupId));

        // 요청자가 스터디 그룹의 멤버인지 확인 (또는 스터디장만 생성 가능하게 할 수도 있음)
        boolean isMemberOfStudyGroup = studyGroup.getMembers().stream()
                .anyMatch(sm -> sm.getUser().getId().equals(creatorUserId) && sm.getStatus() == com.studygroup.domain.study.entity.StudyMemberStatus.APPROVED);
        if (!isMemberOfStudyGroup) {
            throw new IllegalStateException("스터디 그룹의 멤버만 채팅방을 생성할 수 있습니다.");
        }

        ChatRoom chatRoom = ChatRoom.builder()
                .name(request.getName())
                .studyGroup(studyGroup)
                .build();
        // 생성자를 첫 멤버로 자동 추가 (JOINED 상태)
        ChatRoomMember creatorChatMember = ChatRoomMember.builder()
                .user(creator)
                .chatRoom(chatRoom)
                .status(ChatRoomMemberStatus.JOINED)
                .build();
        chatRoom.addMember(creatorChatMember);

        // 초대된 멤버 추가 (INVITED 상태)
        for (Long invitedUserId : request.getInvitedMemberIds()) {
            if (invitedUserId.equals(creatorUserId)) continue; // 자기 자신 초대는 스킵

            User invitedUser = userRepository.findById(invitedUserId)
                    .orElseThrow(() -> new IllegalArgumentException("초대할 사용자를 찾을 수 없습니다. ID: " + invitedUserId));

            // 초대 대상이 스터디 그룹의 멤버인지 확인
            boolean isInvitedUserMemberOfStudyGroup = studyGroup.getMembers().stream()
                    .anyMatch(sm -> sm.getUser().getId().equals(invitedUserId) && sm.getStatus() == com.studygroup.domain.study.entity.StudyMemberStatus.APPROVED);
            if (!isInvitedUserMemberOfStudyGroup) {
                log.warn("스터디 그룹 멤버가 아닌 사용자 초대 시도: studyGroupId={}, invitedUserId={}", studyGroupId, invitedUserId);
                // 여기서 예외를 던지거나, 알림만 보내고 초대는 스킵할 수 있음 (정책에 따라)
                // 여기서는 일단 스킵하는 것으로 가정
                continue;
            }

            ChatRoomMember invitedChatMember = ChatRoomMember.builder()
                    .user(invitedUser)
                    .chatRoom(chatRoom)
                    .status(ChatRoomMemberStatus.INVITED) // 초기 상태는 INVITED
                    .build();
            chatRoom.addMember(invitedChatMember);

            // 초대 알림 생성
            String message = String.format("'%s'님이 '%s' 스터디의 '%s' 채팅방으로 초대했습니다.",
                    creator.getName(), studyGroup.getTitle(), chatRoom.getName());
            notificationService.createNotification(
                    creator,
                    invitedUser,
                    message,
                    NotificationType.CHAT_INVITE, // 새로운 알림 타입 필요
                    chatRoom.getId() // ChatRoom의 ID를 referenceId로
            );
        }
        ChatRoom savedChatRoom = chatRoomRepository.save(chatRoom);
        return ChatRoomDetailResponse.from(savedChatRoom);
    }

    // 사용자가 참여하고 있는 채팅방 목록 조회
    @Transactional(readOnly = true)
    public List<ChatRoomResponse> getMyChatRooms(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));
        // 사용자가 JOINED 상태인 ChatRoomMember 정보를 조회
        List<ChatRoomMember> joinedMemberships = chatRoomMemberRepository.findByUserAndStatus(user, ChatRoomMemberStatus.JOINED);
        return joinedMemberships.stream()
                .map(ChatRoomMember::getChatRoom)
                .map(ChatRoomResponse::from) // ChatRoom을 ChatRoomResponse로 변환
                .collect(Collectors.toList());
    }

    // 특정 스터디 그룹의 채팅방 목록 조회
    @Transactional(readOnly = true)
    public List<ChatRoomResponse> getChatRoomsByStudyGroup(Long studyGroupId, Long userId) {
        StudyGroup studyGroup = studyGroupRepository.findById(studyGroupId)
                .orElseThrow(() -> new IllegalArgumentException("스터디 그룹을 찾을 수 없습니다."));
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));

        // 해당 스터디 그룹의 모든 채팅방을 가져옴
        List<ChatRoom> allChatRoomsInStudy = chatRoomRepository.findByStudyGroup(studyGroup);

        // 사용자가 참여(JOINED)하거나 초대(INVITED)된 채팅방만 필터링
        return allChatRoomsInStudy.stream()
                .filter(chatRoom -> chatRoom.getMembers().stream()
                        .anyMatch(member -> member.getUser().getId().equals(userId) &&
                                (member.getStatus() == ChatRoomMemberStatus.JOINED || member.getStatus() == ChatRoomMemberStatus.INVITED)))
                .map(ChatRoomResponse::from)
                .collect(Collectors.toList());
    }

    // 채팅방 상세 정보 조회 (멤버 목록 포함, 메시지는 별도 API로 페이징)
    @Transactional(readOnly = true)
    public ChatRoomDetailResponse getChatRoomDetail(Long chatRoomId, Long userId) {
        ChatRoom chatRoom = chatRoomRepository.findById(chatRoomId)
                .orElseThrow(() -> new IllegalArgumentException("채팅방을 찾을 수 없습니다."));
        // 사용자가 해당 채팅방의 멤버인지 확인 (JOINED 또는 INVITED 상태)
        boolean isMember = chatRoom.getMembers().stream()
                .anyMatch(member -> member.getUser().getId().equals(userId) &&
                        (member.getStatus() == ChatRoomMemberStatus.JOINED || member.getStatus() == ChatRoomMemberStatus.INVITED));
        if (!isMember) {
            throw new IllegalStateException("해당 채팅방에 접근 권한이 없습니다.");
        }
        return ChatRoomDetailResponse.from(chatRoom);
    }

    // 채팅 메시지 전송 및 저장 (STOMP 핸들러에서 호출)
    @Transactional
    public ChatMessageResponse processAndSendMessage(Long chatRoomId, ChatMessageSendRequest messageDto, Long senderId) {
        User sender = userRepository.findById(senderId)
                .orElseThrow(() -> new IllegalArgumentException("메시지 발신자를 찾을 수 없습니다."));
        ChatRoom chatRoom = chatRoomRepository.findById(chatRoomId)
                .orElseThrow(() -> new IllegalArgumentException("채팅방을 찾을 수 없습니다."));

        // 발신자가 해당 채팅방의 멤버(JOINED)인지 확인
        ChatRoomMember senderMembership = chatRoomMemberRepository.findByChatRoomAndUser(chatRoom, sender)
                .orElseThrow(() -> new IllegalStateException("해당 채팅방의 멤버가 아닙니다."));
        if (senderMembership.getStatus() != ChatRoomMemberStatus.JOINED) {
            throw new IllegalStateException("채팅방에 참여한 멤버만 메시지를 보낼 수 있습니다.");
        }

        ChatMessage chatMessage = ChatMessage.builder()
                .chatRoom(chatRoom)
                .sender(sender)
                .content(messageDto.getContent())
                .messageType(messageDto.getMessageType()) // DTO에서 받은 타입 사용
                .build();
        ChatMessage savedMessage = chatMessageRepository.save(chatMessage);

        // 채팅방의 마지막 메시지 정보 업데이트
        chatRoom.setLastMessageContent(savedMessage.getContent());
        chatRoom.setLastMessageAt(savedMessage.getCreatedAt());
        chatRoomRepository.save(chatRoom); // 변경 감지로 자동 업데이트될 수도 있지만 명시적 저장

        ChatMessageResponse responseDto = ChatMessageResponse.from(savedMessage);

        // 해당 채팅방을 구독 중인 클라이언트에게 메시지 브로드캐스트
        // /sub/chat/room/{chatRoomId} 경로로 메시지 발송
        messagingTemplate.convertAndSend("/sub/chat/room/" + chatRoomId, responseDto);
        log.info("Message sent to /sub/chat/room/{}: {}", chatRoomId, responseDto.getContent());

        return responseDto;
    }

    // 특정 채팅방의 이전 메시지 목록 페이징 조회
    @Transactional(readOnly = true)
    public Page<ChatMessageResponse> getChatMessages(Long chatRoomId, Long userId, Pageable pageable) {
        ChatRoom chatRoom = chatRoomRepository.findById(chatRoomId)
                .orElseThrow(() -> new IllegalArgumentException("채팅방을 찾을 수 없습니다."));
        // 사용자가 해당 채팅방의 멤버인지 확인
        boolean isMember = chatRoomMemberRepository.findByChatRoomAndUser(chatRoom, userRepository.findById(userId).orElseThrow())
                .map(member -> member.getStatus() == ChatRoomMemberStatus.JOINED || member.getStatus() == ChatRoomMemberStatus.INVITED)
                .orElse(false);
        if (!isMember) {
            throw new IllegalStateException("해당 채팅방의 메시지를 조회할 권한이 없습니다.");
        }

        Page<ChatMessage> messagesPage = chatMessageRepository.findByChatRoomOrderByCreatedAtDesc(chatRoom, pageable);
        // 사용자가 마지막으로 읽은 메시지 ID 업데이트 (선택 사항, 메시지 조회 시점으로)
        chatRoomMemberRepository.findByChatRoomAndUser(chatRoom, userRepository.findById(userId).orElseThrow())
                .ifPresent(member -> {
                    if (!messagesPage.getContent().isEmpty()) {
                        member.setLastReadMessageId(messagesPage.getContent().get(0).getId()); // 가장 최근 메시지를 읽음으로 처리
                        // chatRoomMemberRepository.save(member); // 변경 감지 또는 명시적 저장
                    }
                });

        return messagesPage.map(ChatMessageResponse::from);
    }


    // 채팅방 초대 수락/거절
    @Transactional
    public void respondToChatInvite(Long chatRoomId, Long userId, boolean accept) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));
        ChatRoom chatRoom = chatRoomRepository.findById(chatRoomId)
                .orElseThrow(() -> new IllegalArgumentException("채팅방을 찾을 수 없습니다."));

        ChatRoomMember member = chatRoomMemberRepository.findByChatRoomAndUser(chatRoom, user)
                .filter(m -> m.getStatus() == ChatRoomMemberStatus.INVITED) // INVITED 상태인 초대만 처리
                .orElseThrow(() -> new IllegalStateException("해당 채팅방에 대한 유효한 초대가 없습니다."));

        if (accept) {
            // 정원 확인 (선택 사항, 채팅방에도 정원 개념을 둔다면)
            // if (chatRoom.getMembers().stream().filter(m -> m.getStatus() == ChatRoomMemberStatus.JOINED).count() >= MAX_CHAT_ROOM_MEMBERS) {
            //     throw new IllegalStateException("채팅방 정원이 가득 찼습니다.");
            // }
            member.setStatus(ChatRoomMemberStatus.JOINED);
            // chatRoomMemberRepository.save(member); // 상태 변경 저장

            // 시스템 메시지: OO님이 입장했습니다.
            ChatMessage systemMessage = ChatMessage.builder()
                    .chatRoom(chatRoom)
                    .sender(user) // 시스템 메시지의 sender는 입장한 유저 또는 null(시스템)
                    .content(user.getName() + "님이 채팅방에 참여했습니다.")
                    .messageType(MessageType.ENTER)
                    .build();
            chatMessageRepository.save(systemMessage);
            messagingTemplate.convertAndSend("/sub/chat/room/" + chatRoomId, ChatMessageResponse.from(systemMessage));

        } else {
            // 거절 시 ChatRoomMember 엔티티를 삭제하거나, 상태를 REJECTED_INVITE 등으로 변경
            chatRoomMemberRepository.delete(member); // 초대를 거절하면 멤버 정보에서 제거
            // 또는 member.setStatus(ChatRoomMemberStatus.REJECTED_INVITE); // 별도 상태 관리
        }
    }

    // 채팅방 나가기
    @Transactional
    public void leaveChatRoom(Long chatRoomId, Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));
        ChatRoom chatRoom = chatRoomRepository.findById(chatRoomId)
                .orElseThrow(() -> new IllegalArgumentException("채팅방을 찾을 수 없습니다."));

        ChatRoomMember member = chatRoomMemberRepository.findByChatRoomAndUser(chatRoom, user)
                .filter(m -> m.getStatus() == ChatRoomMemberStatus.JOINED) // 참여 중인 멤버만 나갈 수 있음
                .orElseThrow(() -> new IllegalStateException("참여 중인 채팅방이 아닙니다."));

        // ChatRoomMember 엔티티 삭제 또는 상태 변경 (LEFT)
        chatRoomMemberRepository.delete(member);
        // 또는 member.setStatus(ChatRoomMemberStatus.LEFT);

        // 시스템 메시지: OO님이 나갔습니다.
        ChatMessage systemMessage = ChatMessage.builder()
                .chatRoom(chatRoom)
                .sender(user)
                .content(user.getName() + "님이 채팅방을 나갔습니다.")
                .messageType(MessageType.LEAVE)
                .build();
        chatMessageRepository.save(systemMessage);
        messagingTemplate.convertAndSend("/sub/chat/room/" + chatRoomId, ChatMessageResponse.from(systemMessage));

        // 만약 채팅방에 아무도 없으면 채팅방을 삭제하는 로직 추가 가능 (선택)
        // if (chatRoomMemberRepository.findByChatRoom(chatRoom).isEmpty()) {
        //     chatRoomRepository.delete(chatRoom);
        // }
    }

}