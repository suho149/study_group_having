package com.studygroup.domain.study.controller;

import com.studygroup.domain.study.dto.*;
import com.studygroup.domain.study.service.StudyGroupService;
import com.studygroup.global.security.CurrentUser;
import com.studygroup.global.security.UserPrincipal;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/studies")
@RequiredArgsConstructor
public class StudyGroupController {

    private final StudyGroupService studyGroupService;

    @GetMapping
    public ResponseEntity<Page<StudyGroupResponse>> getStudyGroups(
            @PageableDefault(size = 10) Pageable pageable,
            @RequestParam(required = false) String keyword,
            @CurrentUser UserPrincipal userPrincipal) {
        log.debug("스터디 그룹 목록 조회 요청: keyword={}, pageable={}", keyword, pageable);
        Page<StudyGroupResponse> response = studyGroupService.getStudyGroups(keyword, pageable, userPrincipal);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<StudyGroupDetailResponse> getStudyGroupDetail(
            @PathVariable Long id,
            HttpServletRequest request,
            @CurrentUser UserPrincipal userPrincipal) {
        log.info("스터디 그룹 상세 조회 요청: id={}, URI={}, Method={}, ContentType={}", 
            id, 
            request.getRequestURI(),
            request.getMethod(),
            request.getContentType());
        StudyGroupDetailResponse response = studyGroupService.getStudyGroupDetail(id, userPrincipal);
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

    @DeleteMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Void> deleteStudyGroup(
            @PathVariable Long id,
            @CurrentUser UserPrincipal userPrincipal) {
        log.debug("스터디 그룹 삭제 요청: id={}, userId={}", id, userPrincipal.getId());
        studyGroupService.deleteStudyGroup(id, userPrincipal.getId());
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/invite")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Void> inviteMembers(
            @PathVariable Long id,
            @RequestBody List<Long> userIds,
            @CurrentUser UserPrincipal userPrincipal) {
        log.debug("스터디 그룹 초대 요청: groupId={}, userIds={}, leaderId={}", 
                id, userIds, userPrincipal.getId());
        studyGroupService.inviteMembers(id, userIds, userPrincipal.getId());
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{id}/invite/response")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Void> handleInviteResponse(
            @PathVariable Long id,
            @RequestBody InviteResponseRequest request,
            @CurrentUser UserPrincipal userPrincipal) {
        log.debug("스터디 초대 응답: groupId={}, userId={}, accept={}", 
                id, userPrincipal.getId(), request.isAccept());
        studyGroupService.handleInviteResponse(id, userPrincipal.getId(), request.isAccept());
        return ResponseEntity.ok().build();
    }

    @PutMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<StudyGroupResponse> updateStudyGroup(
            @PathVariable Long id,
            @Valid @RequestBody StudyGroupUpdateRequest request,
            @CurrentUser UserPrincipal userPrincipal) {
        log.debug("스터디 그룹 수정 요청: id={}, userId={}", id, userPrincipal.getId());
        StudyGroupResponse response = studyGroupService.updateStudyGroup(id, request, userPrincipal.getId());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{id}/apply")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Void> applyToStudyGroup(
            @PathVariable Long id,
            @CurrentUser UserPrincipal userPrincipal) {
        log.info("스터디 참여 신청 API 요청: studyGroupId={}, userId={}", id, userPrincipal.getId());
        studyGroupService.applyToStudyGroup(id, userPrincipal.getId());
        return ResponseEntity.ok().build();
    }

    @PutMapping("/{studyId}/members/{memberUserId}/status")
    @PreAuthorize("isAuthenticated()") // 스터디장인지 여부는 서비스 레이어에서 검증
    public ResponseEntity<Void> updateStudyMemberStatus(
            @PathVariable Long studyId,
            @PathVariable Long memberUserId,
            @RequestBody MemberStatusUpdateRequest request,
            @CurrentUser UserPrincipal userPrincipal) {
        log.info("스터디 멤버 상태 변경 요청: studyId={}, memberUserId={}, newStatus={}, 요청자Id={}",
                studyId, memberUserId, request.getStatus(), userPrincipal.getId());
        studyGroupService.updateStudyMemberStatus(
                studyId,
                memberUserId,
                request.getStatus(),
                userPrincipal.getId());
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{studyId}/members/leave") // 또는 /{studyId}/leave
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Void> leaveStudyGroup(
            @PathVariable Long studyId,
            @CurrentUser UserPrincipal userPrincipal) {
        log.info("스터디 탈퇴 API 요청: studyId={}, userId={}", studyId, userPrincipal.getId());
        studyGroupService.leaveStudyGroup(studyId, userPrincipal.getId());
        return ResponseEntity.noContent().build(); // 성공 시 204 No Content
    }

    @DeleteMapping("/{studyId}/members/{memberUserId}") // DELETE 메소드 사용
    @PreAuthorize("isAuthenticated()") // 요청자 인증 확인
    public ResponseEntity<Void> removeMemberByLeader(
            @PathVariable Long studyId,
            @PathVariable Long memberUserId, // 강제 탈퇴시킬 멤버의 User ID
            @CurrentUser UserPrincipal leaderUserPrincipal) {
        log.info("스터디장에 의한 멤버 강제 탈퇴 API 요청: studyId={}, memberUserIdToRemove={}, leaderUserId={}",
                studyId, memberUserId, leaderUserPrincipal.getId());
        studyGroupService.removeMemberByLeader(studyId, memberUserId, leaderUserPrincipal.getId());
        return ResponseEntity.noContent().build(); // 성공 시 204 No Content
    }

    // 스터디 좋아요 추가
    @PostMapping("/{studyId}/like")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Void> likeStudy(
            @PathVariable Long studyId,
            @CurrentUser UserPrincipal userPrincipal) {
        studyGroupService.likeStudy(studyId, userPrincipal.getId());
        return ResponseEntity.ok().build();
    }

    // 스터디 좋아요 취소
    @DeleteMapping("/{studyId}/unlike") // 또는 /like 로 하고 DELETE 메소드 사용
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Void> unlikeStudy(
            @PathVariable Long studyId,
            @CurrentUser UserPrincipal userPrincipal) {
        studyGroupService.unlikeStudy(studyId, userPrincipal.getId());
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/map")
    public ResponseEntity<List<StudyForMapDto>> getStudiesForMap() {
        List<StudyForMapDto> response = studyGroupService.getStudiesForMap();
        return ResponseEntity.ok(response);
    }
} 