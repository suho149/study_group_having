package com.studygroup.domain.friend.dto;

import com.studygroup.domain.friend.entity.FriendshipStatusType;
import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class FriendshipStatusDto {
    private FriendshipStatusType status;
    private Long friendshipId; // 상태에 따라 필요한 ID (요청 취소/수락/거절용)
}
