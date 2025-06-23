package com.studygroup.domain.study.dto;

import com.studygroup.domain.study.entity.StudyCategory;
import com.studygroup.domain.study.entity.StudyGroup;
import com.studygroup.domain.study.entity.StudyStatus;
import com.studygroup.domain.study.entity.StudyType;
import lombok.Builder;
import lombok.Getter;

import java.io.Serializable;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Set;
import java.util.stream.Collectors;

@Getter
@Builder
public class StudyGroupResponse implements Serializable {
    private Long id;
    private String title;
    private String description;
    private int maxMembers;
    private int currentMembers;
    private StudyStatus status;
    private StudyType studyType;
    private StudyCategory category;
    private String location;
    private LocalDate startDate;
    private LocalDate endDate;
    private Set<String> tags;
    private String leaderName;
    private String leaderProfile;
    private LocalDateTime createdAt;
    private LocalDateTime modifiedAt;
    private int viewCount;
    private int likeCount;
    private boolean liked; // 현재 사용자가 좋아요를 눌렀는지 여부

    public static StudyGroupResponse from(StudyGroup studyGroup, boolean isLiked) {
        return StudyGroupResponse.builder()
                .id(studyGroup.getId())
                .title(studyGroup.getTitle())
                .description(studyGroup.getDescription())
                .maxMembers(studyGroup.getMaxMembers())
                .currentMembers(studyGroup.getCurrentMembers())
                .status(studyGroup.getStatus())
                .studyType(studyGroup.getStudyType())
                .category(studyGroup.getCategory())
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
                .viewCount(studyGroup.getViewCount())
                .likeCount(studyGroup.getLikeCount())
                .liked(isLiked)
                .build();
    }
} 