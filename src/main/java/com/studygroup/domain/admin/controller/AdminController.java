package com.studygroup.domain.admin.controller;

import com.studygroup.domain.admin.dto.ReportDetailDto;
import com.studygroup.domain.admin.dto.StatisticsResponseDto;
import com.studygroup.domain.admin.service.AdminService;
import com.studygroup.domain.report.dto.ReportProcessDto;
import com.studygroup.domain.report.entity.Report;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')") // 이 컨트롤러의 모든 메소드는 ADMIN 권한 필요
public class AdminController {

    private final AdminService adminService;

    // 신고 목록 조회
    @GetMapping("/reports")
    public ResponseEntity<Page<ReportDetailDto>> getReports(Pageable pageable) {
        return ResponseEntity.ok(adminService.getReports(pageable));
    }

    // 신고 처리
    @PatchMapping("/reports/{reportId}")
    public ResponseEntity<Void> processReport(@PathVariable Long reportId, @RequestBody ReportProcessDto dto) {
        adminService.processReport(reportId, dto);
        return ResponseEntity.ok().build();
    }

    // TODO: 콘텐츠(게시글/댓글 등) 숨김/삭제 API
    @DeleteMapping("/posts/{postId}")
    public ResponseEntity<Void> deletePostByAdmin(@PathVariable Long postId) {
        adminService.deletePost(postId);
        return ResponseEntity.noContent().build();
    }

    // TODO: 사용자 관리 API (제재, 권한 변경 등)

    // TODO: 통계 데이터 조회 API

    // 통계 데이터 조회 API
    @GetMapping("/statistics")
    public ResponseEntity<StatisticsResponseDto> getDashboardStatistics() {
        return ResponseEntity.ok(adminService.getDashboardStatistics());
    }
}
