package com.studygroup.domain.admin.dto;

import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
public class StatisticsResponseDto {
    private long totalUsers;
    private long totalStudies;
    private long totalPosts;
    private long totalComments;
    private List<DailyStat> dailySignups; // 일별 가입자 수
    private List<TagStat> popularTags;    // 인기 태그

    @Getter
    @Builder
    public static class DailyStat {
        private String date;
        private long count;
    }

    @Getter
    @Builder
    public static class TagStat {
        private String tagName;
        private long count;
    }
}
