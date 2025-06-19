package com.studygroup.domain.report.dto;

import com.studygroup.domain.report.entity.ReportType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;

@Getter
public class ReportRequestDto {
    @NotNull
    private ReportType reportType;

    @NotNull
    private Long targetId;

    @NotBlank
    private String reason;
}
