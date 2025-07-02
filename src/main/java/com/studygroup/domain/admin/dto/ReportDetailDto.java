package com.studygroup.domain.admin.dto;

import com.studygroup.domain.report.entity.Report;
import com.studygroup.domain.report.entity.ReportStatus;
import com.studygroup.domain.report.entity.ReportType;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
public class ReportDetailDto {
    private Long id;
    private ReportType reportType;
    private Long targetId;
    private Long parentPostId; // 관련 게시글 ID를 담을 필드
    private String targetContentPreview; // 신고 대상 콘텐츠 미리보기
    private String reason;
    private ReportStatus status;
    private String reporterName;
    private String reportedUserName;
    private LocalDateTime createdAt;
    private String adminMemo;

    // Report 엔티티와 미리보기 텍스트를 받아 DTO 생성
    public ReportDetailDto(Report report, String targetContentPreview, Long parentPostId) {
        this.id = report.getId();
        this.reportType = report.getReportType();
        this.targetId = report.getTargetId();
        this.parentPostId = parentPostId;
        this.targetContentPreview = targetContentPreview;
        this.reason = report.getReason();
        this.status = report.getStatus();
        this.reporterName = report.getReporter().getName();
        if (report.getReportedUser() != null) {
            this.reportedUserName = report.getReportedUser().getName();
        }
        this.createdAt = report.getCreatedAt();
        this.adminMemo = report.getAdminMemo();
    }
}
