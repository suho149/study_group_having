package com.studygroup.domain.study.dto;

import com.studygroup.domain.study.entity.StudySchedule;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

public class StudyScheduleDto {

    @Getter
    @NoArgsConstructor
    public static class CreateRequest {
        @NotBlank
        private String title;
        private String content;
        @NotNull
        private LocalDateTime startTime;
        @NotNull
        private LocalDateTime endTime;
    }

    @Getter
    @NoArgsConstructor
    public static class UpdateRequest {
        @NotBlank
        private String title;
        private String content;
        @NotNull
        private LocalDateTime startTime;
        @NotNull
        private LocalDateTime endTime;
    }

    @Getter
    public static class Response {
        private Long id;
        private String title;
        private String content;
        private LocalDateTime startTime;
        private LocalDateTime endTime;

        public Response(StudySchedule schedule) {
            this.id = schedule.getId();
            this.title = schedule.getTitle();
            this.content = schedule.getContent();
            this.startTime = schedule.getStartTime();
            this.endTime = schedule.getEndTime();
        }
    }
}
