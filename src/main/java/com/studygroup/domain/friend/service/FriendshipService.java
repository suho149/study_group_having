package com.studygroup.domain.friend.service;

import com.studygroup.domain.friend.dto.FriendDto;
import com.studygroup.domain.friend.dto.FriendRequestDto;
import com.studygroup.domain.friend.entity.Friendship;
import com.studygroup.domain.friend.entity.FriendshipStatus;
import com.studygroup.domain.friend.repository.FriendshipRepository;
import com.studygroup.domain.notification.entity.NotificationType;
import com.studygroup.domain.notification.service.NotificationService;
import com.studygroup.domain.user.entity.User;
import com.studygroup.domain.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class FriendshipService {

    private final FriendshipRepository friendshipRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    public void sendFriendRequest(Long fromUserId, Long toUserId) {
        if (fromUserId.equals(toUserId)) {
            throw new IllegalArgumentException("Cannot send friend request to yourself.");
        }
        User fromUser = userRepository.findById(fromUserId).orElseThrow();
        User toUser = userRepository.findById(toUserId).orElseThrow();

        // 이미 관계가 있는지 확인
        friendshipRepository.findFriendshipBetween(fromUser, toUser).ifPresent(f -> {
            throw new IllegalStateException("Friend request already sent or already friends.");
        });

        Friendship friendship = Friendship.builder().user(fromUser).friend(toUser).build();
        // ★★★ 먼저 save를 해서 ID를 할당받습니다. ★★★
        Friendship savedFriendship = friendshipRepository.save(friendship);

        // 피신청자에게 알림 생성
        String message = String.format("'%s'님이 친구 신청을 보냈습니다.", fromUser.getName());
        notificationService.createNotification(
                fromUser,
                toUser,
                message,
                NotificationType.FRIEND_REQUEST,
                savedFriendship.getId() // friendshipId 전달
        );
    }

    public void acceptFriendRequest(Long friendshipId, Long toUserId) {
        Friendship friendship = friendshipRepository.findById(friendshipId).orElseThrow();

        // 요청을 받은 사람이 본인이 맞는지 확인
        if (!friendship.getFriend().getId().equals(toUserId)) {
            throw new IllegalStateException("You are not authorized to accept this request.");
        }

        friendship.accept();

        // 신청자에게 수락 알림 생성
        String message = String.format("'%s'님이 친구 신청을 수락했습니다.", friendship.getFriend().getName());
        notificationService.createNotification(friendship.getFriend(), friendship.getUser(), message, NotificationType.FRIEND_ACCEPTED, toUserId);
    }

    public void rejectOrCancelFriendRequest(Long friendshipId, Long currentUserId) {
        Friendship friendship = friendshipRepository.findById(friendshipId).orElseThrow();

        // 요청자 본인이거나, 요청받은 사람만 취소/거절 가능
        if (!friendship.getUser().getId().equals(currentUserId) && !friendship.getFriend().getId().equals(currentUserId)) {
            throw new IllegalStateException("Unauthorized action.");
        }

        friendshipRepository.delete(friendship);
    }

    @Transactional(readOnly = true)
    public List<FriendDto> getFriends(Long userId) {
        User user = userRepository.findById(userId).orElseThrow();
        return friendshipRepository.findAllFriends(user)
                .stream()
                .map(friendship -> new FriendDto(friendship, user))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<FriendRequestDto> getReceivedFriendRequests(Long userId) {
        User user = userRepository.findById(userId).orElseThrow();
        return friendshipRepository.findByFriendAndStatus(user, FriendshipStatus.PENDING)
                .stream()
                .map(friendship -> new FriendRequestDto(friendship, false)) // 내가 받은 신청
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<FriendRequestDto> getSentFriendRequests(Long userId) {
        User user = userRepository.findById(userId).orElseThrow();
        return friendshipRepository.findByUserAndStatus(user, FriendshipStatus.PENDING)
                .stream()
                .map(friendship -> new FriendRequestDto(friendship, true)) // 내가 보낸 신청
                .collect(Collectors.toList());
    }
}
