package com.studygroup.domain.study.service;

import com.studygroup.domain.notification.entity.NotificationType;
import com.studygroup.domain.notification.service.NotificationService;
import com.studygroup.domain.study.dto.StudyGroupRequest;
import com.studygroup.domain.study.dto.StudyGroupResponse;
import com.studygroup.domain.study.dto.StudyGroupDetailResponse;
import com.studygroup.domain.study.dto.StudyGroupUpdateRequest;
import com.studygroup.domain.study.entity.*;
import com.studygroup.domain.study.repository.StudyGroupRepository;
import com.studygroup.domain.study.repository.TagRepository;
import com.studygroup.domain.user.entity.User;
import com.studygroup.domain.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.annotation.Isolation;
import jakarta.servlet.http.HttpSession;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class StudyGroupService {

    private final StudyGroupRepository studyGroupRepository;
    private final TagRepository tagRepository;
    private final UserRepository userRepository;
    private final HttpSession httpSession;
    private static final String VIEW_COUNT_KEY = "VIEW_COUNT_";
    private static final long VIEW_COUNT_INTERVAL = 1000; // 1초
    private final NotificationService notificationService;

    @Transactional
    public StudyGroupDetailResponse getStudyGroupDetail(Long id) {
        StudyGroup studyGroup = studyGroupRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Study group not found with id: " + id));
        
        incrementViewCountIfNeeded(studyGroup);
        return StudyGroupDetailResponse.from(studyGroup);
    }

    private void incrementViewCountIfNeeded(StudyGroup studyGroup) {
        String viewKey = VIEW_COUNT_KEY + studyGroup.getId();
        Long lastViewTime = (Long) httpSession.getAttribute(viewKey);
        long currentTime = System.currentTimeMillis();

        if (lastViewTime == null || currentTime - lastViewTime > VIEW_COUNT_INTERVAL) {
            studyGroup.incrementViewCount();
            httpSession.setAttribute(viewKey, currentTime);
            log.info("조회수 증가: studyId={}, 현재 조회수={}", 
                studyGroup.getId(), studyGroup.getViewCount());
        } else {
            log.info("조회수 증가 제외 (중복 요청): studyId={}, 마지막 조회 시간과의 차이={}ms", 
                studyGroup.getId(), currentTime - lastViewTime);
        }
    }

    @Transactional
    public StudyGroupResponse createStudyGroup(StudyGroupRequest request, Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + userId));

        log.debug("스터디 그룹 생성 시작: userId={}, title={}", userId, request.getTitle());

        // 스터디 그룹 생성
        StudyGroup studyGroup = StudyGroup.builder()
                .leader(user)
                .title(request.getTitle())
                .description(request.getDescription())
                .maxMembers(request.getMaxMembers())
                .status(StudyStatus.RECRUITING)
                .studyType(request.getStudyType())
                .location(request.getLocation())
                .startDate(request.getStartDate())
                .endDate(request.getEndDate())
                .build();

        // 태그 처리
        if (request.getTags() != null && !request.getTags().isEmpty()) {
            Set<StudyGroupTag> studyGroupTags = new HashSet<>();
            for (String tagName : request.getTags()) {
                Tag tag = tagRepository.findByName(tagName)
                        .orElseGet(() -> tagRepository.save(Tag.builder().name(tagName).build()));
                
                StudyGroupTag studyGroupTag = StudyGroupTag.builder()
                        .tag(tag)
                        .studyGroup(studyGroup)
                        .build();
                studyGroupTags.add(studyGroupTag);
                studyGroup.addTag(studyGroupTag);
            }
        }

        // 리더를 스터디 멤버로 추가
        StudyMember leaderMember = StudyMember.builder()
                .user(user)
                .studyGroup(studyGroup)
                .role(StudyMemberRole.LEADER)
                .status(StudyMemberStatus.APPROVED)
                .build();
        studyGroup.addMember(leaderMember);

        // 저장 및 응답 반환
        StudyGroup savedStudyGroup = studyGroupRepository.save(studyGroup);
        log.debug("스터디 그룹 생성 완료: groupId={}, userId={}", savedStudyGroup.getId(), userId);
        return StudyGroupResponse.from(savedStudyGroup);
    }

    @Transactional(readOnly = true)
    public Page<StudyGroupResponse> getStudyGroups(String keyword, Pageable pageable) {
        log.debug("스터디 그룹 목록 조회: keyword={}, pageable={}", keyword, pageable);
        
        Page<StudyGroup> studyGroups;
        if (keyword != null && !keyword.trim().isEmpty()) {
            studyGroups = studyGroupRepository.findByTitleContainingOrDescriptionContaining(
                keyword, keyword, pageable);
        } else {
            studyGroups = studyGroupRepository.findAll(pageable);
        }
        
        return studyGroups.map(StudyGroupResponse::from);
    }

    @Transactional
    public void deleteStudyGroup(Long groupId, Long userId) {
        StudyGroup studyGroup = studyGroupRepository.findById(groupId)
                .orElseThrow(() -> new IllegalArgumentException("Study group not found with id: " + groupId));

        if (!studyGroup.getLeader().getId().equals(userId)) {
            throw new IllegalStateException("Only the leader can delete the study group");
        }

        studyGroupRepository.delete(studyGroup);
    }

    @Transactional
    public void inviteMembers(Long groupId, List<Long> userIds, Long leaderId) {
        StudyGroup studyGroup = studyGroupRepository.findById(groupId)
                .orElseThrow(() -> new IllegalArgumentException("Study group not found with id: " + groupId));

        if (!studyGroup.getLeader().getId().equals(leaderId)) {
            throw new IllegalStateException("Only the leader can invite members");
        }

        if (studyGroup.getStatus() != StudyStatus.RECRUITING) {
            throw new IllegalStateException("Cannot invite members when the group is not recruiting");
        }

        User leader = userRepository.findById(leaderId)
                .orElseThrow(() -> new IllegalArgumentException("Leader not found"));

        List<User> usersToInvite = userRepository.findAllById(userIds);
        
        for (User user : usersToInvite) {
            // 이미 멤버인 경우 스킵
            if (studyGroup.getMembers().stream()
                    .anyMatch(member -> member.getUser().getId().equals(user.getId()))) {
                continue;
            }

            // 초대 알림 생성
            String message = String.format("%s 스터디에서 초대가 왔습니다. 수락하시겠습니까?", studyGroup.getTitle());
            notificationService.createNotification(
                leader,
                user,
                message,
                NotificationType.STUDY_INVITE,
                studyGroup.getId()
            );

            // 대기 상태로 멤버 추가
            StudyMember newMember = StudyMember.builder()
                    .user(user)
                    .studyGroup(studyGroup)
                    .role(StudyMemberRole.MEMBER)
                    .status(StudyMemberStatus.PENDING)
                    .build();
            
            studyGroup.addMember(newMember);
        }
    }

    @Transactional
    public void handleInviteResponse(Long groupId, Long userId, boolean accept) {
        StudyGroup studyGroup = studyGroupRepository.findById(groupId)
                .orElseThrow(() -> new IllegalArgumentException("Study group not found"));
                
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        StudyMember member = studyGroup.getMembers().stream()
                .filter(m -> m.getUser().getId().equals(userId) && m.getStatus() == StudyMemberStatus.PENDING)
                .findFirst()
                .orElseThrow(() -> new IllegalStateException("No pending invitation found"));

        if (accept) {
            member.updateStatus(StudyMemberStatus.APPROVED);
            String message = String.format("%s님이 스터디 초대를 수락했습니다.", user.getName());
            notificationService.createNotification(
                user,
                studyGroup.getLeader(),
                message,
                NotificationType.INVITE_ACCEPTED,
                studyGroup.getId()
            );
        } else {
            member.updateStatus(StudyMemberStatus.REJECTED);
            String message = String.format("%s님이 스터디 초대를 거절했습니다.", user.getName());
            notificationService.createNotification(
                user,
                studyGroup.getLeader(),
                message,
                NotificationType.INVITE_REJECTED,
                studyGroup.getId()
            );
            studyGroup.removeMember(member);
        }
    }

    @Transactional
    public StudyGroupResponse updateStudyGroup(Long groupId, StudyGroupUpdateRequest request, Long userId) {
        StudyGroup studyGroup = studyGroupRepository.findById(groupId)
                .orElseThrow(() -> new IllegalArgumentException("Study group not found with id: " + groupId));

        if (!studyGroup.getLeader().getId().equals(userId)) {
            throw new IllegalStateException("Only the leader can update the study group");
        }

        // 기존 태그 삭제
        studyGroup.getTags().clear();

        // 새로운 태그 추가
        if (request.getTags() != null) {
            request.getTags().forEach(tagName -> {
                Tag tag = tagRepository.findByName(tagName)
                        .orElseGet(() -> tagRepository.save(Tag.builder().name(tagName).build()));
                
                StudyGroupTag studyGroupTag = StudyGroupTag.builder()
                        .tag(tag)
                        .studyGroup(studyGroup)
                        .build();
                studyGroup.addTag(studyGroupTag);
            });
        }

        // 기본 정보 업데이트
        studyGroup.update(
            request.getTitle(),
            request.getDescription(),
            request.getMaxMembers(),
            request.getStatus(),
            request.getStudyType(),
            request.getLocation(),
            request.getStartDate(),
            request.getEndDate()
        );

        return StudyGroupResponse.from(studyGroup);
    }

    @Transactional
    public void applyToStudyGroup(Long groupId, Long applicantUserId) {
        log.info("스터디 참여 신청 처리 시작: groupId={}, applicantUserId={}", groupId, applicantUserId);

        StudyGroup studyGroup = studyGroupRepository.findById(groupId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 스터디 그룹입니다. ID: " + groupId));

        User applicant = userRepository.findById(applicantUserId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 사용자입니다. ID: " + applicantUserId));

        // 1. 스터디 상태 확인 (모집중이어야 함)
        if (studyGroup.getStatus() != StudyStatus.RECRUITING) {
            log.warn("스터디 참여 신청 실패 (모집중 아님): groupId={}, currentStatus={}", groupId, studyGroup.getStatus());
            throw new IllegalStateException("현재 모집중인 스터디가 아닙니다.");
        }

        // 2. 스터디장 본인 신청 방지
        if (studyGroup.getLeader().getId().equals(applicantUserId)) {
            log.warn("스터디 참여 신청 실패 (스터디장 본인): groupId={}, applicantUserId={}", groupId, applicantUserId);
            throw new IllegalStateException("스터디장은 자신의 스터디에 참여 신청할 수 없습니다.");
        }

        // 3. 이미 멤버이거나 신청 대기 중인지 확인
        boolean alreadyMemberOrPending = studyGroup.getMembers().stream()
                .anyMatch(member -> member.getUser().getId().equals(applicantUserId));
        if (alreadyMemberOrPending) {
            StudyMember existingMember = studyGroup.getMembers().stream()
                    .filter(member -> member.getUser().getId().equals(applicantUserId)).findFirst().get(); // status 확인용
            log.warn("스터디 참여 신청 실패 (이미 멤버 또는 신청 대기): groupId={}, applicantUserId={}, status={}", groupId, applicantUserId, existingMember.getStatus());
            throw new IllegalStateException("이미 해당 스터디의 멤버이거나 참여 신청 처리 중입니다.");
        }

        // 4. 정원 확인 (APPROVED 된 멤버 기준)
        if (studyGroup.getCurrentMembers() >= studyGroup.getMaxMembers()) {
            log.warn("스터디 참여 신청 실패 (정원 초과): groupId={}, currentMembers={}, maxMembers={}",
                    groupId, studyGroup.getCurrentMembers(), studyGroup.getMaxMembers());
            throw new IllegalStateException("스터디 정원이 이미 가득 찼습니다.");
        }

        // 5. 참여 신청 멤버 추가 (PENDING 상태)
        StudyMember newMember = StudyMember.builder()
                .user(applicant)
                .studyGroup(studyGroup)
                .role(StudyMemberRole.MEMBER)
                .status(StudyMemberStatus.PENDING) // 참여 신청은 PENDING 상태
                .build();

        studyGroup.addMember(newMember); // StudyGroup 엔티티의 members 컬렉션에 추가
        // StudyGroup 엔티티의 members 필드에 cascade=CascadeType.ALL이 설정되어 있으므로
        // studyGroup을 저장하면 StudyMember도 함께 저장됩니다.
        studyGroupRepository.save(studyGroup);
        log.info("스터디 멤버 추가 (신청): groupId={}, applicantUserId={}, memberStatus=PENDING", groupId, applicantUserId);


        // 6. 스터디장에게 알림 생성
        String message = String.format("'%s'님이 '%s' 스터디에 참여를 신청했습니다.", applicant.getName(), studyGroup.getTitle());
        notificationService.createNotification(
                applicant,              // 알림 발신자 (신청자)
                studyGroup.getLeader(), // 알림 수신자 (스터디장)
                message,
                NotificationType.STUDY_JOIN_REQUEST,
                studyGroup.getId()      // 관련 ID (스터디 그룹 ID)
        );
        log.info("스터디 참여 신청 알림 생성: senderId={}, receiverId={}, studyGroupId={}",
                applicant.getId(), studyGroup.getLeader().getId(), studyGroup.getId());
    }
} 