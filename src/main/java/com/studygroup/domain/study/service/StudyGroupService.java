package com.studygroup.domain.study.service;

import com.studygroup.domain.study.dto.StudyGroupRequest;
import com.studygroup.domain.study.dto.StudyGroupResponse;
import com.studygroup.domain.study.dto.StudyGroupDetailResponse;
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

    @Transactional
    public StudyGroupDetailResponse getStudyGroupDetail(Long id) {
        StudyGroup studyGroup = studyGroupRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Study group not found with id: " + id));
        
        studyGroup.incrementViewCount();
        return StudyGroupDetailResponse.from(studyGroup);
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
                        .studyGroup(studyGroup)
                        .tag(tag)
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

        List<User> usersToInvite = userRepository.findAllById(userIds);
        
        for (User user : usersToInvite) {
            // 이미 멤버인 경우 스킵
            if (studyGroup.getMembers().stream()
                    .anyMatch(member -> member.getUser().getId().equals(user.getId()))) {
                continue;
            }

            StudyMember newMember = StudyMember.builder()
                    .user(user)
                    .studyGroup(studyGroup)
                    .role(StudyMemberRole.MEMBER)
                    .status(StudyMemberStatus.PENDING)
                    .build();
            
            studyGroup.addMember(newMember);
        }
    }
} 