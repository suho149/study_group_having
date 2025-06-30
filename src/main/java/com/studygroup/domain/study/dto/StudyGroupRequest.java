package com.studygroup.domain.study.dto;

import com.studygroup.domain.study.entity.StudyCategory;
import com.studygroup.domain.study.entity.StudyStatus;
import com.studygroup.domain.study.entity.StudyType;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.Set;

@Getter
@NoArgsConstructor
public class StudyGroupRequest {

    @NotBlank(message = "스터디 제목은 필수입니다.")
    private String title;

    @NotBlank(message = "스터디 설명은 필수입니다.")
    private String description;

    @NotNull(message = "최대 인원은 필수입니다.")
    @Min(value = 2, message = "최소 2명 이상이어야 합니다.")
    private Integer maxMembers;

    @NotNull(message = "스터디 유형은 필수입니다.")
    private StudyType studyType;

    @NotNull(message = "모집 구분은 필수입니다.")
    private StudyCategory category;

    private String location;

    @NotNull(message = "시작 날짜는 필수입니다.")
    private LocalDate startDate;

    private LocalDate endDate;

    private Set<String> tags;

    private Double latitude;  // 위도 (소수점 포함 가능)

    private Double longitude; // 경도 (소수점 포함 가능)

    @Builder // 만약 생성자 대신 빌더를 사용한다면
    public StudyGroupRequest(String title, String description, Integer maxMembers,
                             StudyType studyType, String location, Double latitude, Double longitude,
                             LocalDate startDate, LocalDate endDate, Set<String> tags) {
        this.title = title;
        this.description = description;
        this.maxMembers = maxMembers;
        this.studyType = studyType;
        this.location = location;
        this.latitude = latitude;   // 추가
        this.longitude = longitude; // 추가
        this.startDate = startDate;
        this.endDate = endDate;
        this.tags = tags;
    }
} 