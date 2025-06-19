package com.studygroup.domain.report.repository;

import com.studygroup.domain.report.entity.Report;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ReportRepository extends JpaRepository<Report, Long> {
    // 관리자 페이지에서 사용할 다양한 조회 메소드 추가 가능
    // Page<Report> findByStatus(ReportStatus status, Pageable pageable);
}
