package com.studygroup.domain.study.dto;

import com.studygroup.domain.study.entity.StudyGroup;
import com.studygroup.domain.study.entity.StudyStatus;
import com.studygroup.domain.study.entity.StudyType;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Set;
import java.util.stream.Collectors;

@Getter
@Builder
public class StudyGroupResponse {
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
    private String leaderName;
    private String leaderProfile;
    private LocalDateTime createdAt;
    private LocalDateTime modifiedAt;

    public static StudyGroupResponse from(StudyGroup studyGroup) {
        return StudyGroupResponse.builder()
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
                .leaderName(studyGroup.getLeader().getName())
                .leaderProfile(studyGroup.getLeader().getProfile())
                .createdAt(studyGroup.getCreatedAt())
                .modifiedAt(studyGroup.getModifiedAt())
                .build();
    }
} 