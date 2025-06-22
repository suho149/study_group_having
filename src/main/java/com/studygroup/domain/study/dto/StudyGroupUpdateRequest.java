package com.studygroup.domain.study.dto;

import com.studygroup.domain.study.entity.StudyCategory;
import com.studygroup.domain.study.entity.StudyStatus;
import com.studygroup.domain.study.entity.StudyType;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;

@Getter
@NoArgsConstructor
public class StudyGroupUpdateRequest {
    @NotBlank(message = "제목은 필수입니다.")
    private String title;

    @NotBlank(message = "설명은 필수입니다.")
    private String description;

    @NotNull(message = "최대 인원은 필수입니다.")
    @Min(value = 2, message = "최대 인원은 2명 이상이어야 합니다.")
    private Integer maxMembers;

    @NotNull(message = "스터디 상태는 필수입니다.")
    private StudyStatus status;

    @NotNull(message = "스터디 유형은 필수입니다.")
    private StudyType studyType;

    @NotNull(message = "모집 구분은 필수입니다.")
    private StudyCategory category;

    @NotBlank(message = "장소는 필수입니다.")
    private String location;

    // --- 위도, 경도 필드 추가 ---
    private Double latitude;

    private Double longitude;

    @NotNull(message = "시작일은 필수입니다.")
    private LocalDate startDate;

    @NotNull(message = "종료일은 필수입니다.")
    private LocalDate endDate;

    private List<String> tags;
} 