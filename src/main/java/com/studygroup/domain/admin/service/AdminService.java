package com.studygroup.domain.admin.service;

import com.studygroup.domain.admin.dto.ReportDetailDto;
import com.studygroup.domain.board.entity.BoardComment;
import com.studygroup.domain.board.entity.BoardPost;
import com.studygroup.domain.board.repository.BoardCommentRepository;
import com.studygroup.domain.board.repository.BoardPostRepository;
import com.studygroup.domain.report.dto.ReportProcessDto;
import com.studygroup.domain.report.entity.Report;
import com.studygroup.domain.report.repository.ReportRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional
public class AdminService {

    private final ReportRepository reportRepository;
    private final BoardPostRepository boardPostRepository;
    private final BoardCommentRepository boardCommentRepository;

    @Transactional(readOnly = true)
    public Page<ReportDetailDto> getReports(Pageable pageable) {
        Page<Report> reportPage = reportRepository.findAll(pageable);

        return reportPage.map(report -> {
            String preview = getTargetContentPreview(report);
            return new ReportDetailDto(report, preview);
        });
    }

    private String getTargetContentPreview(Report report) {
        try {
            switch (report.getReportType()) {
                case POST:
                    return boardPostRepository.findById(report.getTargetId())
                            .map(BoardPost::getTitle)
                            .orElse("삭제된 게시글");
                case COMMENT:
                    return boardCommentRepository.findById(report.getTargetId())
                            .map(BoardComment::getContent)
                            .orElse("삭제된 댓글");
                // TODO: STUDY_GROUP case
                default:
                    return "알 수 없는 콘텐츠";
            }
        } catch (Exception e) {
            return "콘텐츠 조회 오류";
        }
    }

    public void processReport(Long reportId, ReportProcessDto dto) {
        Report report = reportRepository.findById(reportId)
                .orElseThrow(() -> new IllegalArgumentException("Report not found"));
        report.updateStatus(dto.getStatus(), dto.getAdminMemo());
    }

    public void deletePost(Long postId) {
        boardPostRepository.deleteById(postId);
    }
    // TODO: 통계 서비스 로직, 사용자 관리 로직 추가
}
