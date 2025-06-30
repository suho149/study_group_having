package com.studygroup.domain.report.service;

import com.studygroup.domain.board.repository.BoardCommentRepository;
import com.studygroup.domain.board.repository.BoardPostRepository;
import com.studygroup.domain.report.dto.ReportRequestDto;
import com.studygroup.domain.report.entity.Report;
import com.studygroup.domain.report.repository.ReportRepository;
import com.studygroup.domain.user.entity.User;
import com.studygroup.domain.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional
public class ReportService {

    private final ReportRepository reportRepository;
    private final UserRepository userRepository;
    private final BoardPostRepository boardPostRepository;
    private final BoardCommentRepository boardCommentRepository;
    // ... StudyGroupRepository 등 필요에 따라 추가

    public void createReport(ReportRequestDto dto, Long reporterId) {
        User reporter = userRepository.findById(reporterId)
                .orElseThrow(() -> new IllegalArgumentException("Reporter not found"));

        User reportedUser = findReportedUser(dto);

        Report report = Report.builder()
                .reporter(reporter)
                .reportType(dto.getReportType())
                .targetId(dto.getTargetId())
                .reportedUser(reportedUser) // 피신고자 정보 추가
                .reason(dto.getReason())
                .build();

        reportRepository.save(report);
    }

    private User findReportedUser(ReportRequestDto dto) {
        switch (dto.getReportType()) {
            case POST:
                return boardPostRepository.findById(dto.getTargetId())
                        .orElseThrow(() -> new IllegalArgumentException("Post not found"))
                        .getAuthor();
            case COMMENT:
                return boardCommentRepository.findById(dto.getTargetId())
                        .orElseThrow(() -> new IllegalArgumentException("Comment not found"))
                        .getAuthor();
            // TODO: STUDY_GROUP case 추가
            default:
                return null;
        }
    }
}
