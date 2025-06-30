package com.studygroup.domain.report.dto;

import com.studygroup.domain.report.entity.ReportStatus;
import lombok.Getter;

@Getter
public class ReportProcessDto {
    private ReportStatus status;
    private String adminMemo;
}