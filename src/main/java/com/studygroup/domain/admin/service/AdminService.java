package com.studygroup.domain.admin.service;

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

    public Page<Report> getReports(Pageable pageable) {
        return reportRepository.findAll(pageable);
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
