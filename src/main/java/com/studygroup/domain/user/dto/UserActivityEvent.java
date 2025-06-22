package com.studygroup.domain.user.dto;

import com.studygroup.domain.user.entity.ActivityType;
import com.studygroup.domain.user.entity.User;
import lombok.Getter;

@Getter
public class UserActivityEvent {
    private final User user;
    private final ActivityType activityType;
    private final Long referenceId;

    public UserActivityEvent(User user, ActivityType activityType) {
        this.user = user;
        this.activityType = activityType;
        this.referenceId = null; // 기본 생성자
    }

    public UserActivityEvent(User user, ActivityType activityType, Long referenceId) {
        this.user = user;
        this.activityType = activityType;
        this.referenceId = referenceId;
    }
}
