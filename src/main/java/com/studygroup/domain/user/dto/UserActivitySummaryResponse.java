package com.studygroup.domain.user.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@AllArgsConstructor
public class UserActivitySummaryResponse {
    private long createdPostsCount;
    private long participatingStudiesCount;
    private long participatingProjectsCount;
    private long createdStudiesCount;
}
