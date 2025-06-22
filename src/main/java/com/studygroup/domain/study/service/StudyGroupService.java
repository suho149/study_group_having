package com.studygroup.domain.study.service;

import com.studygroup.domain.notification.entity.Notification;
import com.studygroup.domain.notification.entity.NotificationType;
import com.studygroup.domain.notification.repository.NotificationRepository;
import com.studygroup.domain.notification.service.NotificationService;
import com.studygroup.domain.study.dto.*;
import com.studygroup.domain.study.entity.*;
import com.studygroup.domain.study.repository.*;
import com.studygroup.domain.user.dto.TagInteractionEvent;
import com.studygroup.domain.user.dto.UserActivityEvent;
import com.studygroup.domain.user.entity.ActivityType;
import com.studygroup.domain.user.entity.InteractionType;
import com.studygroup.domain.user.entity.User;
import com.studygroup.domain.user.repository.UserRepository;
import com.studygroup.global.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.annotation.Isolation;
import jakarta.servlet.http.HttpSession;

import java.util.Arrays;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

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
    private final StudyMemberRepository studyMemberRepository;
    private final NotificationRepository notificationRepository;
    private final StudyLikeRepository studyLikeRepository;
    private final ApplicationEventPublisher eventPublisher;

    @Transactional
    public StudyGroupDetailResponse getStudyGroupDetail(Long id, UserPrincipal currentUserPrincipal) {
        StudyGroup studyGroup = studyGroupRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Study group not found with id: " + id));
        
        incrementViewCountIfNeeded(studyGroup);

        // --- '조회' 이벤트 발행 ---
        if (currentUserPrincipal != null) {
            User user = userRepository.findById(currentUserPrincipal.getId()).orElse(null);
            if (user != null) {
                eventPublisher.publishEvent(new TagInteractionEvent(user, studyGroup, InteractionType.VIEW_STUDY));
            }
        }

        boolean isLiked = false;
        if (currentUserPrincipal != null) {
            User user = userRepository.findById(currentUserPrincipal.getId())
                    .orElse(null); // 실제 User 객체 필요
            if (user != null) {
                isLiked = studyLikeRepository.existsByUserAndStudyGroup(user, studyGroup);
            }
        }
        // StudyGroupDetailResponse.from() 메소드를 수정하여 isLiked 값을 받도록 하거나,
        // 여기서 DTO를 직접 채우는 것이 더 나을 수 있음.
        // 아래는 from 메소드가 isLiked를 받는다고 가정한 예시 (또는 from 메소드 내에서 처리)
        return StudyGroupDetailResponse.from(studyGroup, isLiked); // StudyGroupDetailResponse.from 수정 필요
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
                .category(request.getCategory())
                .location(request.getLocation())
                .latitude(request.getLatitude())
                .longitude(request.getLongitude())
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

        // --- 스터디 생성 이벤트 발행 로직 추가 ---
        eventPublisher.publishEvent(new UserActivityEvent(user, ActivityType.CREATE_STUDY, savedStudyGroup.getId()));

        return StudyGroupResponse.from(savedStudyGroup, false);
    }

    @Transactional(readOnly = true)
    public Page<StudyGroupResponse> getStudyGroups(String keyword, StudyCategory category, Pageable pageable, UserPrincipal currentUserPrincipal) {

        // 로그에 category도 포함하여 디버깅 용이성 확보
        log.debug("스터디 그룹 목록 조회: keyword={}, category={}, pageable={}", keyword, category, pageable);

        Page<StudyGroup> studyGroups;
        boolean hasKeyword = keyword != null && !keyword.trim().isEmpty();

        // --- ★★★ 이 부분이 핵심 수정 사항입니다 ★★★ ---
        // 1. Specification 관련 코드를 모두 제거합니다.
        // 2. if-else 문으로 4가지 경우의 수를 모두 처리합니다.

        if (hasKeyword && category != null) {
            // 경우 1: 키워드와 카테고리 둘 다 있을 때
            studyGroups = studyGroupRepository.findByCategoryAndIsBlindedFalseAndTitleContaining(category, keyword, pageable);
        } else if (hasKeyword) {
            // 경우 2: 키워드만 있을 때
            studyGroups = studyGroupRepository.findByIsBlindedFalseAndTitleContaining(keyword, pageable);
        } else if (category != null) {
            // 경우 3: 카테고리만 있을 때
            studyGroups = studyGroupRepository.findByCategoryAndIsBlindedFalse(category, pageable);
        } else {
            // 경우 4: 아무 조건도 없을 때 (전체 조회)
            studyGroups = studyGroupRepository.findAllByIsBlindedFalse(pageable);
        }
        // ---------------------------------------------

        User currentUser = null;
        if (currentUserPrincipal != null) {
            currentUser = userRepository.findById(currentUserPrincipal.getId()).orElse(null);
        }

        User finalCurrentUser = currentUser;
        return studyGroups.map(studyGroup -> {
            boolean isLiked = false;
            if (finalCurrentUser != null) {
                isLiked = studyLikeRepository.existsByUserAndStudyGroup(finalCurrentUser, studyGroup);
            }
            return StudyGroupResponse.from(studyGroup, isLiked);
        });
    }

    @Transactional
    public void likeStudy(Long studyId, Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + userId));
        StudyGroup studyGroup = studyGroupRepository.findById(studyId)
                .orElseThrow(() -> new IllegalArgumentException("Study group not found: " + studyId));

        if (studyLikeRepository.existsByUserAndStudyGroup(user, studyGroup)) {
            throw new IllegalStateException("이미 좋아요를 누른 스터디입니다.");
        }

        StudyLike studyLike = StudyLike.builder()
                .user(user)
                .studyGroup(studyGroup)
                .build();
        studyLikeRepository.save(studyLike);
        studyGroup.incrementLikeCount();

        // --- '좋아요' 이벤트 발행 ---
        eventPublisher.publishEvent(new TagInteractionEvent(user, studyGroup, InteractionType.LIKE_STUDY));

        // studyGroupRepository.save(studyGroup); // 변경 감지로 저장됨 (likeCount 필드)
        log.info("스터디 좋아요 추가: userId={}, studyId={}", userId, studyId);
    }

    @Transactional
    public void unlikeStudy(Long studyId, Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + userId));
        StudyGroup studyGroup = studyGroupRepository.findById(studyId)
                .orElseThrow(() -> new IllegalArgumentException("Study group not found: " + studyId));

        StudyLike studyLike = studyLikeRepository.findByUserAndStudyGroup(user, studyGroup)
                .orElseThrow(() -> new IllegalStateException("좋아요를 누르지 않은 스터디입니다."));

        studyLikeRepository.delete(studyLike);
        studyGroup.decrementLikeCount();
        // studyGroupRepository.save(studyGroup); // 변경 감지로 저장됨
        log.info("스터디 좋아요 취소: userId={}, studyId={}", userId, studyId);
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

        log.info("스터디 초대 응답 처리 시작: groupId={}, userId={}, accept={}", groupId, userId, accept);
        StudyGroup studyGroup = studyGroupRepository.findById(groupId)
                .orElseThrow(() -> new IllegalArgumentException("Study group not found with id: " + groupId));
                
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found with id: " + userId));

        StudyMember member = studyGroup.getMembers().stream()
                .filter(m -> m.getUser().getId().equals(userId) && m.getStatus() == StudyMemberStatus.PENDING)
                .findFirst()
                .orElseThrow(() -> {
                    // 이미 처리되었을 가능성을 확인하기 위해 현재 상태 로그 추가
                    studyGroup.getMembers().stream()
                            .filter(m -> m.getUser().getId().equals(userId))
                            .findFirst()
                            .ifPresent(actualMember -> log.warn("handleInviteResponse: 유효한 PENDING 초대가 없음. 실제 멤버 상태: {}", actualMember.getStatus()));
                    return new IllegalStateException("해당 스터디에 대한 유효한 초대(또는 참여 신청)가 없습니다. 이미 처리되었을 수 있습니다.");
                });

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
            log.info("스터디 멤버 상태 REJECTED로 변경: userId={}, studyId={}", userId, groupId);

            String message = String.format("%s님이 '%s' 스터디 초대를 거절했습니다.", user.getName(), studyGroup.getTitle());
            notificationService.createNotification(
                user,
                studyGroup.getLeader(),
                message,
                NotificationType.INVITE_REJECTED,
                studyGroup.getId()
            );
            studyGroup.removeMember(member);
        }

        // --- 중요: 관련된 STUDY_INVITE 알림을 찾아 isRead = true로 변경 ---
        // 이 로직은 사용자가 받은 스터디 초대에 응답하는 경우를 가정합니다.
        // 알림의 receiver는 user, referenceId는 groupId, type은 STUDY_INVITE 입니다.
        List<Notification> inviteNotifications = notificationRepository
                .findByReceiverAndReferenceIdAndTypeAndIsReadFalse(
                        user, // 알림을 받은 사람 (초대받은 사람)
                        groupId, // 관련 스터디 ID
                        NotificationType.STUDY_INVITE // 스터디 초대 알림 타입
                );

        if (!inviteNotifications.isEmpty()) {
            for (Notification notificationToUpdate : inviteNotifications) {
                notificationToUpdate.markAsRead(); // Notification 엔티티의 isRead를 true로 변경
                // @Transactional로 인해 메소드 종료 시 변경 사항이 DB에 반영됨
                log.info("STUDY_INVITE 알림 읽음 처리: notificationId={} for userId={}", notificationToUpdate.getId(), userId);
            }
        } else {
            log.warn("읽음 처리할 STUDY_INVITE 알림을 찾지 못했습니다 (이미 읽었거나 없음): receiverId={}, studyId={}", userId, groupId);
        }
        // -----------------------------------------------------------------
        log.info("스터디 초대 응답 전체 처리 완료: groupId={}, userId={}, accept={}", groupId, userId, accept);
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
            request.getCategory(),
            request.getLocation(),
                request.getLatitude(),
                request.getLongitude(),
            request.getStartDate(),
            request.getEndDate()
        );

        return StudyGroupResponse.from(studyGroup, false);
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

    @Transactional
    public void updateStudyMemberStatus(Long studyId, Long memberUserId, StudyMemberStatus newStatus, Long currentUserId) {
        log.debug("멤버 상태 업데이트 서비스 시작: studyId={}, memberUserId={}, newStatus={}, currentUserId={}",
                studyId, memberUserId, newStatus, currentUserId);

        StudyGroup studyGroup = studyGroupRepository.findById(studyId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 스터디 그룹입니다. ID: " + studyId));

        // 1. 요청자가 스터디장인지 확인
        if (!studyGroup.getLeader().getId().equals(currentUserId)) {
            log.warn("멤버 상태 변경 권한 없음: studyId={}, 요청자Id={}, 스터디장Id={}",
                    studyId, currentUserId, studyGroup.getLeader().getId());
            throw new IllegalStateException("스터디장만 멤버 상태를 변경할 수 있습니다.");
        }

        // 2. 대상 멤버 찾기 (studyId와 memberUserId로 정확히 찾아야 함)
        StudyMember memberToUpdate = studyGroup.getMembers().stream()
                .filter(member -> member.getUser().getId().equals(memberUserId) && member.getStudyGroup().getId().equals(studyId))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException(
                        "해당 스터디에 존재하지 않거나 잘못된 멤버입니다. 스터디 ID: " + studyId + ", 멤버 사용자 ID: " + memberUserId));

        // 3. PENDING 상태의 멤버만 승인/거절 가능 (또는 정책에 따라 다를 수 있음)
        if (memberToUpdate.getStatus() != StudyMemberStatus.PENDING) {
            log.warn("이미 처리된 멤버 상태 변경 시도: studyId={}, memberUserId={}, currentStatus={}",
                    studyId, memberUserId, memberToUpdate.getStatus());
            throw new IllegalStateException("이미 처리된 멤버의 상태는 변경할 수 없습니다. 현재 상태: " + memberToUpdate.getStatus());
        }

        // 4. 정원 초과 확인 (승인 시에만)
        if (newStatus == StudyMemberStatus.APPROVED) {
            if (studyGroup.getCurrentMembers() >= studyGroup.getMaxMembers()) {
                log.warn("정원 초과로 멤버 승인 불가: studyId={}, currentMembers={}, maxMembers={}",
                        studyId, studyGroup.getCurrentMembers(), studyGroup.getMaxMembers());
                throw new IllegalStateException("스터디 정원이 이미 가득 찼습니다.");
            }
        }


        // 5. 상태 업데이트
        StudyMemberStatus oldStatus = memberToUpdate.getStatus();
        memberToUpdate.updateStatus(newStatus);

        // 6. currentMembers 업데이트 (StudyGroup 엔티티 내 로직 재확인 필요)
        // StudyGroup 엔티티의 addMember/removeMember 또는 getCurrentMembers()가
        // APPROVED 상태 기준으로 currentMembers를 올바르게 계산하는지 확인.
        // 직접 studyGroup.setCurrentMembers(studyGroup.getCurrentMembers())를 호출하거나,
        // StudyGroup 엔티티 내에 currentMembers를 갱신하는 메소드를 만들 수 있음.
        // 가장 간단한 방법은 StudyGroup 엔티티의 getCurrentMembers()가 항상 실시간으로 계산하도록 하는 것.
        // 또는 상태 변경 후 명시적으로 업데이트.
        // studyGroup.updateCurrentMembersCount(); // 예시: StudyGroup 엔티티에 이런 메소드 구현

        // StudyMember 엔티티 저장 (StudyGroup의 members 컬렉션에 cascade 설정이 있다면 studyGroup 저장으로도 가능)
        // studyMemberRepository.save(memberToUpdate); // 명시적 저장이 더 안전할 수 있음

        log.info("멤버 상태 업데이트 완료: studyId={}, memberUserId={}, oldStatus={}, newStatus={}",
                studyId, memberUserId, oldStatus, newStatus);

        // 7. 알림 생성 (승인/거절 알림)
        User applicant = memberToUpdate.getUser();
        User leader = studyGroup.getLeader();
        String message;
        NotificationType notificationType;

        if (newStatus == StudyMemberStatus.APPROVED) {
            message = String.format("'%s' 스터디 참여가 승인되었습니다.", studyGroup.getTitle());
            notificationType = NotificationType.JOIN_APPROVED; // 새로운 알림 타입 필요
            // 승인 시 스터디장에게도 알림 (선택)
            // notificationService.createNotification(applicant, leader, String.format("'%s'님의 '%s' 스터디 참여를 승인했습니다.", applicant.getName(), studyGroup.getTitle()), NotificationType.MEMBER_APPROVED_BY_LEADER, studyId);

        } else if (newStatus == StudyMemberStatus.REJECTED) {
            message = String.format("'%s' 스터디 참여가 거절되었습니다.", studyGroup.getTitle());
            notificationType = NotificationType.JOIN_REJECTED; // 새로운 알림 타입 필요
            // 거절 시 스터디장에게도 알림 (선택)
            // notificationService.createNotification(applicant, leader, String.format("'%s'님의 '%s' 스터디 참여를 거절했습니다.", applicant.getName(), studyGroup.getTitle()), NotificationType.MEMBER_REJECTED_BY_LEADER, studyId);

            // 거절된 멤버는 StudyGroup의 members 컬렉션에서 제거하는 것을 고려
            // studyGroup.removeMember(memberToUpdate);
        } else {
            return; // 다른 상태 변경은 현재 로직에서 처리 안 함
        }

        notificationService.createNotification(
                leader, // 알림 발신자 (스터디장)
                applicant, // 알림 수신자 (신청자)
                message,
                notificationType,
                studyId
        );
        log.info("{} 알림 생성: senderId={}, receiverId={}, studyGroupId={}",
                notificationType, leader.getId(), applicant.getId(), studyId);

    }

    @Transactional
    public void leaveStudyGroup(Long studyId, Long memberUserId) {
        log.info("스터디 탈퇴 처리 시작: studyId={}, memberUserId={}", studyId, memberUserId);

        StudyGroup studyGroup = studyGroupRepository.findById(studyId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 스터디 그룹입니다. ID: " + studyId));

        User memberUser = userRepository.findById(memberUserId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 사용자입니다. ID: " + memberUserId));

        // 1. 스터디장인지 확인 (스터디장은 탈퇴 불가 - 정책에 따라 다를 수 있음)
        if (studyGroup.getLeader().getId().equals(memberUserId)) {
            log.warn("스터디장 탈퇴 시도: studyId={}, memberUserId={}", studyId, memberUserId);
            throw new IllegalStateException("스터디장은 스터디에서 탈퇴할 수 없습니다. 스터디를 삭제하거나 리더를 변경해주세요.");
        }

        // 2. 해당 스터디의 멤버인지, 그리고 승인된(APPROVED) 멤버인지 확인
        StudyMember studyMember = studyGroup.getMembers().stream()
                .filter(m -> m.getUser().getId().equals(memberUserId) && m.getStudyGroup().getId().equals(studyId))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("해당 스터디의 멤버가 아닙니다."));

        if (studyMember.getStatus() != StudyMemberStatus.APPROVED) {
            log.warn("승인되지 않은 멤버의 탈퇴 시도: studyId={}, memberUserId={}, status={}",
                    studyId, memberUserId, studyMember.getStatus());
            throw new IllegalStateException("승인된 멤버만 탈퇴할 수 있습니다. 현재 상태: " + studyMember.getStatus());
        }

        // 3. 멤버 제거
        // StudyGroup 엔티티의 removeMember 메소드가 currentMembers 수를 업데이트하고,
        // orphanRemoval=true 또는 cascade를 통해 StudyMember 엔티티도 DB에서 삭제하는지 확인합니다.
        // 여기서는 StudyGroup의 members 컬렉션에서 제거하고, StudyMember 엔티티도 직접 삭제합니다.
        studyGroup.removeMember(studyMember); // StudyGroup의 members 컬렉션에서 제거 및 currentMembers 업데이트
        studyMemberRepository.delete(studyMember); // StudyMember 엔티티 DB에서 삭제
        // studyGroupRepository.save(studyGroup); // removeMember 내부에서 currentMembers 변경 시 필요할 수 있음 (또는 StudyGroup의 @Version 등으로 감지)

        log.info("스터디 멤버 탈퇴 완료: studyId={}, memberUserId={}", studyId, memberUserId);

        // 4. 스터디장에게 알림 생성
        String message = String.format("'%s'님이 '%s' 스터디에서 탈퇴했습니다.", memberUser.getName(), studyGroup.getTitle());
        notificationService.createNotification(
                memberUser,             // 알림 발신자 (탈퇴한 멤버)
                studyGroup.getLeader(), // 알림 수신자 (스터디장)
                message,
                NotificationType.MEMBER_LEFT_STUDY,
                studyGroup.getId()      // 관련 ID (스터디 그룹 ID)
        );
        log.info("스터디 멤버 탈퇴 알림 생성: senderId={}, receiverId={}, studyGroupId={}",
                memberUser.getId(), studyGroup.getLeader().getId(), studyGroup.getId());
    }

    @Transactional
    public void removeMemberByLeader(Long studyId, Long memberUserIdToRemove, Long leaderUserId) {
        log.info("스터디장에 의한 멤버 강제 탈퇴 처리 시작: studyId={}, memberUserIdToRemove={}, leaderUserId={}",
                studyId, memberUserIdToRemove, leaderUserId);

        StudyGroup studyGroup = studyGroupRepository.findById(studyId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 스터디 그룹입니다. ID: " + studyId));

        User leader = userRepository.findById(leaderUserId)
                .orElseThrow(() -> new IllegalArgumentException("스터디장 정보를 찾을 수 없습니다. ID: " + leaderUserId));

        // 1. 요청자가 실제 스터디장인지 확인
        if (!studyGroup.getLeader().getId().equals(leaderUserId)) {
            log.warn("스터디장이 아닌 사용자의 멤버 강제 탈퇴 시도: studyId={}, 요청자Id={}, 실제스터디장Id={}",
                    studyId, leaderUserId, studyGroup.getLeader().getId());
            throw new IllegalStateException("스터디장만 멤버를 강제 탈퇴시킬 수 있습니다.");
        }

        // 2. 자기 자신(스터디장)을 강제 탈퇴시키려는지 확인
        if (memberUserIdToRemove.equals(leaderUserId)) {
            log.warn("스터디장이 자신을 강제 탈퇴시키려는 시도: studyId={}, memberUserIdToRemove={}", studyId, memberUserIdToRemove);
            throw new IllegalStateException("스터디장은 자기 자신을 강제 탈퇴시킬 수 없습니다.");
        }

        // 3. 대상 멤버 찾기
        StudyMember memberToRemove = studyGroup.getMembers().stream()
                .filter(member -> member.getUser().getId().equals(memberUserIdToRemove) && member.getStudyGroup().getId().equals(studyId))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException(
                        "해당 스터디에 존재하지 않거나 잘못된 멤버입니다. 스터디 ID: " + studyId + ", 강제 탈퇴 대상 멤버 ID: " + memberUserIdToRemove));

        User removedUser = memberToRemove.getUser(); // 알림을 위해 미리 사용자 정보 가져오기

        // 4. 멤버 제거 로직 (이전에 구현한 leaveStudyGroup과 유사하게 처리)
        // StudyGroup의 members 컬렉션에서 제거하고, StudyMember 엔티티도 DB에서 삭제.
        // StudyGroup 엔티티의 removeMember 메소드가 currentMembers 수를 올바르게 업데이트해야 함.
        studyGroup.removeMember(memberToRemove);
        studyMemberRepository.delete(memberToRemove);
        // studyGroupRepository.save(studyGroup); // currentMembers 변경 시 영속성 컨텍스트와 동기화 (필요 시)

        log.info("스터디 멤버 강제 탈퇴 완료: studyId={}, removedMemberId={}, byLeaderId={}",
                studyId, removedUser.getId(), leaderUserId);

        // 5. 강제 탈퇴된 멤버에게 알림 생성 (선택 사항)
        String messageToRemovedMember = String.format("'%s' 스터디에서 스터디장에 의해 탈퇴 처리되었습니다.", studyGroup.getTitle());
        notificationService.createNotification(
                leader,                   // 알림 발신자 (조치를 취한 스터디장)
                removedUser,              // 알림 수신자 (강제 탈퇴된 멤버)
                messageToRemovedMember,
                NotificationType.MEMBER_REMOVED_BY_LEADER,
                studyGroup.getId()
        );
        log.info("강제 탈퇴된 멤버에게 알림 생성: senderId={}, receiverId={}, studyGroupId={}",
                leader.getId(), removedUser.getId(), studyGroup.getId());

        // 6. 스터디장에게 확인 알림 생성 (선택 사항)
        String messageToLeader = String.format("'%s'님을 '%s' 스터디에서 내보냈습니다.", removedUser.getName(), studyGroup.getTitle());
        notificationService.createNotification(
                removedUser, // 시스템 또는 조치 대상이 된 유저가 sender가 될 수도 있음 (정책에 따라)
                leader,      // 알림 수신자 (스터디장)
                messageToLeader,
                NotificationType.LEADER_REMOVED_MEMBER,
                studyGroup.getId()
        );
        log.info("스터디장에게 멤버 내보내기 완료 알림 생성: senderId={}, receiverId={}, studyGroupId={}",
                removedUser.getId(), leader.getId(), studyGroup.getId());
    }

    @Transactional(readOnly = true)
    public Page<StudyGroupResponse> getLikedStudies(Long userId, Pageable pageable) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + userId));

        Page<StudyLike> likedStudiesPage = studyLikeRepository.findByUserOrderByCreatedAtDesc(user, pageable);

        return likedStudiesPage.map(studyLike -> {
            StudyGroup studyGroup = studyLike.getStudyGroup();
            // 좋아요 한 스터디 목록이므로 isLiked는 항상 true
            return StudyGroupResponse.from(studyGroup, true);
        });
    }

    @Transactional(readOnly = true)
    public Page<StudyGroupResponse> getParticipatingStudies(Long userId, Pageable pageable) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + userId));

        Page<StudyMember> participatingStudiesPage = studyMemberRepository.findByUserAndStatusOrderByCreatedAtDesc(user, StudyMemberStatus.APPROVED, pageable);

        return participatingStudiesPage.map(studyMember -> {
            StudyGroup studyGroup = studyMember.getStudyGroup();
            // 해당 스터디에 대해 현재 사용자가 좋아요를 눌렀는지 확인
            boolean isLiked = studyLikeRepository.existsByUserAndStudyGroup(user, studyGroup);
            return StudyGroupResponse.from(studyGroup, isLiked);
        });
    }

    public List<StudyForMapDto> getStudiesForMap() {
        // 모집중인 오프라인, 하이브리드 스터디를 조회
        List<StudyType> types = Arrays.asList(StudyType.OFFLINE, StudyType.HYBRID);
        List<StudyGroup> studies = studyGroupRepository.findByStatusAndStudyTypeInAndLatitudeIsNotNull(StudyStatus.RECRUITING, types);

        return studies.stream()
                .map(StudyForMapDto::new)
                .collect(Collectors.toList());
    }
}
