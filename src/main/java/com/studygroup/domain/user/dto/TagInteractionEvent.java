package com.studygroup.domain.user.dto;

import com.studygroup.domain.study.entity.StudyGroup;
import com.studygroup.domain.user.entity.InteractionType;
import com.studygroup.domain.user.entity.User;
import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public class TagInteractionEvent {

    private final User user;
    private final StudyGroup studyGroup;
    private final InteractionType interactionType;
}
