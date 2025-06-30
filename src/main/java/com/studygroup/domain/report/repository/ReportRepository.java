package com.studygroup.domain.report.repository;

import com.studygroup.domain.report.entity.Report;
import com.studygroup.domain.report.entity.ReportStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ReportRepository extends JpaRepository<Report, Long> {
    // 관리자 페이지에서 사용할 다양한 조회 메소드 추가 가능
    // Page<Report> findByStatus(ReportStatus status, Pageable pageable);

    @Modifying // 이 쿼리가 DB 상태를 변경함을 알립니다.
    @Query("UPDATE Report r SET r.status = :status, r.adminMemo = :adminMemo WHERE r.id = :id")
    void updateReportStatusAndMemo(
            @Param("id") Long id,
            @Param("status") ReportStatus status,
            @Param("adminMemo") String adminMemo
    );
}
