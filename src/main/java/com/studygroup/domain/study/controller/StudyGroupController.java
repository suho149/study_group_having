package com.studygroup.domain.study.controller;

import com.studygroup.domain.study.dto.StudyGroupRequest;
import com.studygroup.domain.study.dto.StudyGroupResponse;
import com.studygroup.domain.study.service.StudyGroupService;
import com.studygroup.global.security.CurrentUser;
import com.studygroup.global.security.UserPrincipal;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/api/studies")
@RequiredArgsConstructor
public class StudyGroupController {

    private final StudyGroupService studyGroupService;

    @GetMapping
    public ResponseEntity<Page<StudyGroupResponse>> getStudyGroups(
            @PageableDefault(size = 10) Pageable pageable,
            @RequestParam(required = false) String keyword) {
        log.debug("스터디 그룹 목록 조회 요청: keyword={}, pageable={}", keyword, pageable);
        Page<StudyGroupResponse> response = studyGroupService.getStudyGroups(keyword, pageable);
        return ResponseEntity.ok(response);
    }

    @PostMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<StudyGroupResponse> createStudyGroup(
            @Valid @RequestBody StudyGroupRequest request,
            @CurrentUser UserPrincipal userPrincipal) {
        log.debug("스터디 그룹 생성 요청: userId={}, request={}", userPrincipal.getId(), request);
        StudyGroupResponse response = studyGroupService.createStudyGroup(request, userPrincipal.getId());
        return ResponseEntity.ok(response);
    }
} 