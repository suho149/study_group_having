package com.studygroup.domain.study.dto;

import com.studygroup.domain.study.entity.StudyGroup;
import lombok.Getter;

@Getter
public class StudyForMapDto {
    private Long id;
    private String title;
    private Double latitude;
    private Double longitude;

    public StudyForMapDto(StudyGroup studyGroup) {
        this.id = studyGroup.getId();
        this.title = studyGroup.getTitle();
        // StudyGroup 엔티티의 위도/경도 필드가 Double 타입이라고 가정
        this.latitude = studyGroup.getLatitude();
        this.longitude = studyGroup.getLongitude();
    }
}
