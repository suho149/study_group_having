package com.studygroup.domain.user.dto;

import com.studygroup.domain.user.entity.ActivityType;
import com.studygroup.domain.user.entity.User;
import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public class UserActivityEvent {
    private final User user;
    private final ActivityType activityType;
}
