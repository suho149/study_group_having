package com.studygroup.domain.dm.service;

import com.studygroup.domain.dm.dto.DmDto;
import com.studygroup.domain.dm.entity.DmMessage;
import com.studygroup.domain.dm.entity.DmRoom;
import com.studygroup.domain.dm.repository.DmMessageRepository;
import com.studygroup.domain.dm.repository.DmRoomRepository;
import com.studygroup.domain.notification.entity.NotificationType;
import com.studygroup.domain.notification.service.NotificationService;
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

@Service
@Slf4j
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class DmService {

    private final DmRoomRepository dmRoomRepository;
    private final DmMessageRepository dmMessageRepository;
    private final UserRepository userRepository;
    private final SimpMessageSendingOperations messagingTemplate;
    private final NotificationService notificationService;


    // 채팅방 목록 조회
    public List<DmDto.RoomResponse> getDmRooms(Long userId) {
        User user = userRepository.findById(userId).orElseThrow();
        List<DmRoom> rooms = dmRoomRepository.findByUser1OrUser2OrderByLastMessageTimeDesc(user, user);
        return rooms.stream()
                .map(room -> new DmDto.RoomResponse(room, user))
                .collect(Collectors.toList());
    }

    // 특정 사용자와의 채팅방 찾기 또는 생성
    @Transactional
    public DmDto.RoomResponse findOrCreateRoom(Long user1Id, Long user2Id) {
        if (user1Id.equals(user2Id)) throw new IllegalArgumentException("Cannot create a DM room with yourself.");
        User user1 = userRepository.findById(user1Id).orElseThrow();
        User user2 = userRepository.findById(user2Id).orElseThrow();

        DmRoom room = dmRoomRepository.findRoomBetweenUsers(user1, user2)
                .orElseGet(() -> {
                    DmRoom newRoom = DmRoom.builder().user1(user1).user2(user2).build();
                    return dmRoomRepository.save(newRoom);
                });
        return new DmDto.RoomResponse(room, user1);
    }

    // 이전 메시지 목록 조회
    public Page<DmDto.MessageResponse> getMessages(Long roomId, Long userId, Pageable pageable) {
        DmRoom room = dmRoomRepository.findById(roomId).orElseThrow();
        // TODO: userId가 이 채팅방의 멤버인지 확인하는 로직 추가

        Page<DmMessage> messages = dmMessageRepository.findByDmRoomOrderByCreatedAtDesc(room, pageable);
        return messages.map(DmDto.MessageResponse::new);
    }

    // 메시지 전송 및 저장
    @Transactional
    public void sendMessage(Long roomId, Long senderId, String content) {
        User sender = userRepository.findById(senderId).orElseThrow();
        DmRoom room = dmRoomRepository.findById(roomId).orElseThrow();

        DmMessage message = DmMessage.builder()
                .dmRoom(room)
                .sender(sender)
                .content(content)
                .build();
        dmMessageRepository.save(message);

        // 채팅방의 마지막 메시지 업데이트
        room.updateLastMessage(content, message.getCreatedAt());

        DmDto.MessageResponse messageDto = new DmDto.MessageResponse(message);

        String destination = "/sub/dm/room/" + roomId;
        messagingTemplate.convertAndSend(destination, messageDto);
        log.info("Message sent to destination: {}", destination);

        // 1. 메시지 수신자를 찾습니다.
        User receiver = room.getUser1().getId().equals(senderId) ? room.getUser2() : room.getUser1();

        // 2. 알림 메시지를 생성합니다.
        String notificationMessage = "'" + sender.getName() + "'님으로부터 새로운 메시지가 도착했습니다.";

        // 3. NotificationService를 호출하여 알림을 생성합니다.
        //    (DB 저장 및 SSE 전송은 NotificationService가 알아서 처리)
        //    referenceId에는 채팅방 ID(roomId)를 넣어, 알림 클릭 시 해당 채팅방으로 이동할 수 있도록 합니다.
        notificationService.createNotification(
                sender,
                receiver,
                notificationMessage,
                NotificationType.NEW_DM,
                roomId
        );
    }
}
