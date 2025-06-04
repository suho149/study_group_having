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

    @Transactional
    public ChatRoomDetailResponse createChatRoom(Long studyGroupId, ChatRoomCreateRequest request, Long creatorUserId) {
        User creator = userRepository.findById(creatorUserId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다. ID: " + creatorUserId));
        StudyGroup studyGroup = studyGroupRepository.findById(studyGroupId)
                .orElseThrow(() -> new IllegalArgumentException("스터디 그룹을 찾을 수 없습니다. ID: " + studyGroupId));

        boolean isMemberOfStudyGroup = studyGroup.getMembers().stream()
                .anyMatch(sm -> sm.getUser().getId().equals(creatorUserId) && sm.getStatus() == com.studygroup.domain.study.entity.StudyMemberStatus.APPROVED);
        if (!isMemberOfStudyGroup) {
            throw new IllegalStateException("스터디 그룹의 멤버만 채팅방을 생성할 수 있습니다.");
        }

        // 1. ChatRoom 엔티티 기본 정보 빌드 (아직 members는 비어있음)
        ChatRoom chatRoom = ChatRoom.builder()
                .name(request.getName())
                .studyGroup(studyGroup)
                .build();

        // 2. ChatRoom을 먼저 저장하여 ID를 할당받음
        //    CascadeType.ALL 때문에 ChatRoomMember가 있다면 함께 저장되려 할 수 있으므로,
        //    ChatRoomMember 추가 전에 ChatRoom만 먼저 저장하거나,
        //    ChatRoomMember를 추가한 후 마지막에 한 번만 저장하는 방식을 선택.
        //    여기서는 멤버 추가 후 마지막에 저장하는 방식으로 변경.

        // 생성자를 첫 멤버로 자동 추가 (JOINED 상태)
        ChatRoomMember creatorChatMember = ChatRoomMember.builder()
                .user(creator)
                // .chatRoom(chatRoom) // chatRoom 객체는 아래에서 한 번에 저장될 때 연결됨
                .status(ChatRoomMemberStatus.JOINED)
                .build();
        chatRoom.addMember(creatorChatMember); // ChatRoom 엔티티의 members 컬렉션에 추가하고, member의 chatRoom 필드 설정

        // 임시로 생성된 ChatRoom 객체를 저장하여 ID를 먼저 얻고, 그 ID를 알림에 사용합니다.
        // 또는, 모든 멤버 설정 후 최종 저장하고, 저장된 객체의 ID를 사용합니다.
        // 여기서는 모든 멤버 설정 후 최종 저장하는 방식을 따르겠습니다.

        // 초대된 멤버 처리 및 알림 생성을 위한 임시 List (알림은 ChatRoom ID가 필요하므로 나중에 처리)
        // List<User> usersToNotify = new ArrayList<>();

        for (Long invitedUserId : request.getInvitedMemberIds()) {
            if (invitedUserId.equals(creatorUserId)) continue;

            User invitedUser = userRepository.findById(invitedUserId)
                    .orElseThrow(() -> new IllegalArgumentException("초대할 사용자를 찾을 수 없습니다. ID: " + invitedUserId));

            boolean isInvitedUserMemberOfStudyGroup = studyGroup.getMembers().stream()
                    .anyMatch(sm -> sm.getUser().getId().equals(invitedUserId) && sm.getStatus() == com.studygroup.domain.study.entity.StudyMemberStatus.APPROVED);
            if (!isInvitedUserMemberOfStudyGroup) {
                log.warn("스터디 그룹 멤버가 아닌 사용자 초대 시도: studyGroupId={}, invitedUserId={}", studyGroupId, invitedUserId);
                continue;
            }

            ChatRoomMember invitedChatMember = ChatRoomMember.builder()
                    .user(invitedUser)
                    // .chatRoom(chatRoom) // chatRoom 객체는 아래에서 한 번에 저장될 때 연결됨
                    .status(ChatRoomMemberStatus.INVITED)
                    .build();
            chatRoom.addMember(invitedChatMember);
            // usersToNotify.add(invitedUser); // 알림 보낼 사용자 목록에 추가 (아래에서 사용)
        }

        // 3. 모든 멤버가 설정된 ChatRoom 엔티티를 저장 (이때 ID가 생성됨)
        //    ChatRoom의 members 필드에 CascadeType.ALL, orphanRemoval=true가 설정되어 있으므로
        //    chatRoom을 저장하면 ChatRoomMember도 함께 저장됩니다.
        ChatRoom savedChatRoom = chatRoomRepository.save(chatRoom);
        log.info("채팅방 생성 완료: ID={}, 이름={}", savedChatRoom.getId(), savedChatRoom.getName());


        // 4. 저장된 ChatRoom의 ID를 사용하여 초대 알림 생성
        for (Long invitedUserId : request.getInvitedMemberIds()) {
            if (invitedUserId.equals(creatorUserId)) continue;

            // 초대 대상이 스터디 그룹 멤버인지 다시 확인 (위에서 이미 했지만, 안전하게)
            User invitedUser = userRepository.findById(invitedUserId).orElse(null);
            if (invitedUser == null) continue;

            boolean isInvitedUserMemberOfStudyGroup = studyGroup.getMembers().stream()
                    .anyMatch(sm -> sm.getUser().getId().equals(invitedUserId) && sm.getStatus() == com.studygroup.domain.study.entity.StudyMemberStatus.APPROVED);
            if (!isInvitedUserMemberOfStudyGroup) continue;


            String message = String.format("'%s'님이 '%s' 스터디의 '%s' 채팅방으로 초대했습니다.",
                    creator.getName(), studyGroup.getTitle(), savedChatRoom.getName()); // savedChatRoom.getName() 사용
            notificationService.createNotification(
                    creator,
                    invitedUser,
                    message,
                    NotificationType.CHAT_INVITE,
                    savedChatRoom.getId() // <--- 저장 후 생성된 ID 사용
            );
            log.info("채팅방 초대 알림 생성: receiverId={}, chatRoomId={}", invitedUser.getId(), savedChatRoom.getId());
        }

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
                .orElseThrow(() -> new IllegalArgumentException("채팅방을 찾을 수 없습니다. ID: " + chatRoomId));
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다. ID: " + userId));

        // 사용자가 해당 채팅방의 멤버(INVITED 또는 JOINED)인지 확인
        ChatRoomMember currentUserMembership = chatRoomMemberRepository.findByChatRoomAndUser(chatRoom, user)
                .orElseThrow(() -> new IllegalStateException("해당 채팅방에 대한 멤버 정보가 없습니다."));

        if (currentUserMembership.getStatus() != ChatRoomMemberStatus.JOINED &&
                currentUserMembership.getStatus() != ChatRoomMemberStatus.INVITED) {
            throw new IllegalStateException("해당 채팅방에 접근 권한이 없습니다. 현재 상태: " + currentUserMembership.getStatus());
        }

        // ChatRoomDetailResponse.from() 메소드가 모든 멤버의 정보를 포함하도록 하거나,
        // 현재 사용자의 멤버십 정보(status 포함)를 DTO에 추가로 담아서 반환하는 것을 고려.
        // 여기서는 ChatRoomDetailResponse.from()이 JOINED 멤버만 반환한다고 가정하고,
        // 프론트에서 INVITED 상태 처리를 위해 별도 로직이 필요함을 인지.
        // 더 좋은 방법은 ChatRoomDetailResponse가 현재 요청 사용자의 멤버십 상태를 포함하는 것.
        // 예: ChatRoomDetailResponse.from(chatRoom, currentUserMembership.getStatus())
        return ChatRoomDetailResponse.from(chatRoom); // 이 DTO가 현재 유저의 상태도 알 수 있게끔 개선 필요
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
        log.info("채팅방 초대 응답 처리 시작: chatRoomId={}, userId={}, accept={}", chatRoomId, userId, accept); // <--- 로그 추가

        User user = userRepository.findById(userId)
                .orElseThrow(() -> { // <--- 1. 사용자 조회 실패 시 예외
                    log.error("respondToChatInvite: 사용자를 찾을 수 없습니다. ID: {}", userId);
                    return new IllegalArgumentException("사용자를 찾을 수 없습니다. ID: " + userId);
                });
        ChatRoom chatRoom = chatRoomRepository.findById(chatRoomId)
                .orElseThrow(() -> { // <--- 2. 채팅방 조회 실패 시 예외
                    log.error("respondToChatInvite: 채팅방을 찾을 수 없습니다. ID: {}", chatRoomId);
                    return new IllegalArgumentException("채팅방을 찾을 수 없습니다. ID: " + chatRoomId);
                });

        ChatRoomMember member = chatRoomMemberRepository.findByChatRoomAndUser(chatRoom, user)
                .filter(m -> m.getStatus() == ChatRoomMemberStatus.INVITED)
                .orElseThrow(() -> { // <--- 3. 유효한 초대 정보 조회 실패 시 예외
                    log.warn("respondToChatInvite: 해당 채팅방에 대한 유효한 초대가 없습니다. chatRoomId={}, userId={}", chatRoomId, userId);
                    // 현재 사용자의 실제 멤버십 상태 확인 로그 추가
                    chatRoomMemberRepository.findByChatRoomAndUser(chatRoom, user).ifPresent(actualMember ->
                            log.warn("respondToChatInvite: 실제 멤버십 상태: {}", actualMember.getStatus())
                    );
                    return new IllegalStateException("해당 채팅방에 대한 유효한 초대가 없습니다. (이미 처리되었거나, 초대받지 않았습니다)");
                });

        log.info("초대 응답 대상 멤버: {}, 현재 상태: {}", member.getUser().getName(), member.getStatus()); // <--- 로그 추가

        if (accept) {
            log.info("초대 수락 처리: chatRoomId={}, userId={}", chatRoomId, userId);
            member.setStatus(ChatRoomMemberStatus.JOINED);
            // chatRoomMemberRepository.save(member); // @Transactional로 인해 변경 감지로 저장될 수 있으나, 명시적 save도 고려 가능

            log.info("멤버 상태 JOINED로 변경 완료: memberId={}", member.getId());

            // 시스템 메시지: OO님이 입장했습니다.
            ChatMessage systemMessage = ChatMessage.builder()
                    .chatRoom(chatRoom) // <--- 4. chatRoom 객체가 null이 아닌지 확인 (위에서 orElseThrow로 처리됨)
                    .sender(user)       // <--- 5. user 객체가 null이 아닌지 확인 (위에서 orElseThrow로 처리됨)
                    .content(user.getName() + "님이 채팅방에 참여했습니다.")
                    .messageType(MessageType.ENTER)
                    .build();
            chatMessageRepository.save(systemMessage); // <--- 6. 메시지 저장 시 예외 발생 가능성
            log.info("입장 시스템 메시지 저장 완료: chatRoomId={}, senderId={}", chatRoomId, user.getId());

            // messagingTemplate이 null이 아닌지 확인 (주입 문제)
            if (messagingTemplate == null) {
                log.error("respondToChatInvite: SimpMessageSendingOperations (messagingTemplate) is null!");
            } else {
                messagingTemplate.convertAndSend("/sub/chat/room/" + chatRoomId, ChatMessageResponse.from(systemMessage));
                log.info("입장 시스템 메시지 브로드캐스트 완료: /sub/chat/room/{}", chatRoomId);
            }

        } else {
            log.info("초대 거절 처리: chatRoomId={}, userId={}", chatRoomId, userId);
            chatRoomMemberRepository.delete(member); // <--- 7. 멤버 삭제 시 예외 발생 가능성 (거의 없음)
            // 또는 member.setStatus(ChatRoomMemberStatus.REJECTED_INVITE); // 상태 변경으로 처리할 수도 있음
            log.info("멤버 정보 삭제 (초대 거절): memberId={}", member.getId());
        }
        log.info("채팅방 초대 응답 처리 완료: chatRoomId={}, userId={}", chatRoomId, userId);
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