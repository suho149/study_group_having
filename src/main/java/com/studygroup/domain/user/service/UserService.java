package com.studygroup.domain.user.service;

import com.studygroup.domain.board.repository.BoardPostRepository;
import com.studygroup.domain.study.entity.StudyMemberStatus;
import com.studygroup.domain.study.repository.StudyGroupRepository;
import com.studygroup.domain.study.repository.StudyMemberRepository;
import com.studygroup.domain.user.dto.UserActivitySummaryResponse;
import com.studygroup.domain.user.dto.UserSearchResponse;
import com.studygroup.domain.user.entity.User;
import com.studygroup.domain.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class UserService {

    private final UserRepository userRepository;
    private final BoardPostRepository boardPostRepository;
    private final StudyGroupRepository studyGroupRepository;
    private final StudyMemberRepository studyMemberRepository;

    public List<UserSearchResponse> searchUsers(String keyword) {
        return userRepository.searchUsers(keyword)
                .stream()
                .map(UserSearchResponse::from)
                .collect(Collectors.toList());
    }

    public User getUserById(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found with id: " + userId));
    }

    public UserActivitySummaryResponse getUserActivitySummary(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found with id: " + userId));

        long createdPosts = boardPostRepository.countByAuthor(user);
        long createdStudies = studyGroupRepository.countByLeader(user);
        // 참여중인 스터디는 '리더' 역할도 포함되므로, 순수 멤버만 셀지 리더도 포함할지 정책에 따라 결정
        // 여기서는 APPROVED 상태인 모든 스터디를 카운트 (리더 + 멤버)
        long participatingStudies = studyMemberRepository.countByUserAndStatus(user, StudyMemberStatus.APPROVED);

        return UserActivitySummaryResponse.builder()
                .createdPostsCount(createdPosts)
                .createdStudiesCount(createdStudies)
                .participatingStudiesCount(participatingStudies)
                .build();
    }
} 