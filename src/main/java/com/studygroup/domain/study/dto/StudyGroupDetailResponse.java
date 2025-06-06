package com.studygroup.domain.study.dto;

import com.studygroup.domain.study.entity.StudyGroup;
import com.studygroup.domain.study.entity.StudyStatus;
import com.studygroup.domain.study.entity.StudyType;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Getter
@Builder
public class StudyGroupDetailResponse {
    private Long id;
    private String title;
    private String description;
    private int maxMembers;
    private int currentMembers;
    private StudyStatus status;
    private StudyType studyType;
    private String location;
    private LocalDate startDate;
    private LocalDate endDate;
    private Set<String> tags;
    private LeaderInfo leader;
    private List<MemberInfo> members;
    private LocalDateTime createdAt;
    private LocalDateTime modifiedAt;
    private int viewCount;

    @Getter
    @Builder
    public static class LeaderInfo {
        private Long id;
        private String name;
        private String profile;
        private String email;
    }

    @Getter
    @Builder
    public static class MemberInfo {
        private Long id;
        private String name;
        private String email;
        private String profile;
        private String role;
        private String status;
    }

    public static StudyGroupDetailResponse from(StudyGroup studyGroup) {
        return StudyGroupDetailResponse.builder()
                .id(studyGroup.getId())
                .title(studyGroup.getTitle())
                .description(studyGroup.getDescription())
                .maxMembers(studyGroup.getMaxMembers())
                .currentMembers(studyGroup.getCurrentMembers())
                .status(studyGroup.getStatus())
                .studyType(studyGroup.getStudyType())
                .location(studyGroup.getLocation())
                .startDate(studyGroup.getStartDate())
                .endDate(studyGroup.getEndDate())
                .tags(studyGroup.getTags().stream()
                        .map(tag -> tag.getTag().getName())
                        .collect(Collectors.toSet()))
                .leader(LeaderInfo.builder()
                        .id(studyGroup.getLeader().getId())
                        .name(studyGroup.getLeader().getName())
                        .profile(studyGroup.getLeader().getProfile())
                        .email(studyGroup.getLeader().getEmail())
                        .build())
                .members(studyGroup.getMembers().stream()
                        .map(member -> MemberInfo.builder()
                                .id(member.getUser().getId())
                                .name(member.getUser().getName())
                                .email(member.getUser().getEmail())
                                .profile(member.getUser().getProfile())
                                .role(member.getRole().name())
                                .status(member.getStatus().name())
                                .build())
                        .collect(Collectors.toList()))
                .createdAt(studyGroup.getCreatedAt())
                .modifiedAt(studyGroup.getModifiedAt())

                .viewCount(studyGroup.getViewCount())
                .build();
    }
} 