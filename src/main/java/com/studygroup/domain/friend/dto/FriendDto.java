package com.studygroup.domain.friend.dto;

import com.studygroup.domain.friend.entity.Friendship;
import com.studygroup.domain.user.entity.User;
import lombok.Getter;

@Getter
public class FriendDto {
    private Long friendshipId;
    private Long userId;
    private String name;
    private String profileImageUrl;

    // Friendship 엔티티와 '나'를 기준으로 상대방 정보를 DTO로 변환
    public FriendDto(Friendship friendship, User currentUser) {
        this.friendshipId = friendship.getId();
        User friend = friendship.getUser().getId().equals(currentUser.getId()) ?
                friendship.getFriend() : friendship.getUser();
        this.userId = friend.getId();
        this.name = friend.getName();
        this.profileImageUrl = friend.getProfile();
    }
}
