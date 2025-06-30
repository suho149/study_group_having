package com.studygroup.domain.study.controller;

import com.studygroup.domain.study.dto.StudyScheduleDto;
import com.studygroup.domain.study.service.StudyScheduleService;
import com.studygroup.global.security.CurrentUser;
import com.studygroup.global.security.UserPrincipal;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/studies/{studyId}/schedules")
@RequiredArgsConstructor
public class StudyScheduleController {

    private final StudyScheduleService studyScheduleService;

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<StudyScheduleDto.Response>> getSchedules(
            @PathVariable Long studyId,
            @CurrentUser UserPrincipal userPrincipal) {
        List<StudyScheduleDto.Response> schedules = studyScheduleService.getSchedules(studyId, userPrincipal.getId());
        return ResponseEntity.ok(schedules);
    }

    @PostMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<StudyScheduleDto.Response> createSchedule(
            @PathVariable Long studyId,
            @Valid @RequestBody StudyScheduleDto.CreateRequest request,
            @CurrentUser UserPrincipal userPrincipal) {
        StudyScheduleDto.Response createdSchedule = studyScheduleService.createSchedule(studyId, request, userPrincipal.getId());
        return ResponseEntity.status(HttpStatus.CREATED).body(createdSchedule);
    }

    @PutMapping("/{scheduleId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Void> updateSchedule(
            @PathVariable Long studyId, // 경로 일관성을 위해 유지하지만, 실제로는 scheduleId만 사용
            @PathVariable Long scheduleId,
            @Valid @RequestBody StudyScheduleDto.UpdateRequest request,
            @CurrentUser UserPrincipal userPrincipal) {
        studyScheduleService.updateSchedule(scheduleId, request, userPrincipal.getId());
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{scheduleId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Void> deleteSchedule(
            @PathVariable Long studyId,
            @PathVariable Long scheduleId,
            @CurrentUser UserPrincipal userPrincipal) {
        studyScheduleService.deleteSchedule(scheduleId, userPrincipal.getId());
        return ResponseEntity.noContent().build();
    }
}
