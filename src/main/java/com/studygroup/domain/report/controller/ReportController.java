package com.studygroup.domain.report.controller;

import com.studygroup.domain.report.dto.ReportRequestDto;
import com.studygroup.domain.report.service.ReportService;
import com.studygroup.global.security.CurrentUser;
import com.studygroup.global.security.UserPrincipal;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
public class ReportController {

    private final ReportService reportService;

    @PostMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Void> createReport(@Valid @RequestBody ReportRequestDto dto, @CurrentUser UserPrincipal userPrincipal) {
        reportService.createReport(dto, userPrincipal.getId());
        return ResponseEntity.ok().build();
    }
}
