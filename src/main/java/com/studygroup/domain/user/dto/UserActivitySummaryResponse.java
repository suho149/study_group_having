package com.studygroup.domain.user.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class UserActivitySummaryResponse {
    private long createdPostsCount;
    private long participatingStudiesCount;
    private long participatingProjectsCount;
}
