package com.studygroup.domain.report.entity;

import com.studygroup.domain.user.entity.User;
import com.studygroup.global.common.BaseTimeEntity;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Report extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // 신고한 사용자
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reporter_id", nullable = false)
    private User reporter;

    // 신고 대상의 타입 (게시글, 댓글 등)
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ReportType reportType;

    // 신고 대상의 ID
    @Column(nullable = false)
    private Long targetId;

    // (선택) 신고 대상 콘텐츠의 작성자
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reported_user_id")
    private User reportedUser;

    @Lob
    @Column(nullable = false)
    private String reason; // 신고 사유

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ReportStatus status;

    @Lob
    private String adminMemo; // 관리자 처리 메모

    @Builder
    public Report(User reporter, ReportType reportType, Long targetId, User reportedUser, String reason) {
        this.reporter = reporter;
        this.reportType = reportType;
        this.targetId = targetId;
        this.reportedUser = reportedUser;
        this.reason = reason;
        this.status = ReportStatus.RECEIVED; // 최초 상태는 '접수됨'
    }

    public void updateStatus(ReportStatus status, String adminMemo) {
        this.status = status;
        this.adminMemo = adminMemo;
    }
}
