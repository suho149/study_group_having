package com.studygroup.domain.friend.dto;

import com.studygroup.domain.friend.entity.Friendship;
import com.studygroup.domain.user.entity.User;
import lombok.Getter;

@Getter
public class FriendRequestDto {
    private Long friendshipId;
    private Long userId;
    private String name;
    private String profileImageUrl;

    // 내가 보낸 신청(user) 또는 받은 신청(friend)에 따라 DTO 생성
    public FriendRequestDto(Friendship friendship, boolean isSentByMe) {
        this.friendshipId = friendship.getId();
        User targetUser = isSentByMe ? friendship.getFriend() : friendship.getUser();
        this.userId = targetUser.getId();
        this.name = targetUser.getName();
        this.profileImageUrl = targetUser.getProfile();
    }
}
