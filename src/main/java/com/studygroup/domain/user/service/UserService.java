package com.studygroup.domain.user.service;

import com.studygroup.domain.board.repository.BoardPostRepository;
import com.studygroup.domain.study.entity.StudyMemberStatus;
import com.studygroup.domain.study.repository.StudyGroupRepository;
import com.studygroup.domain.study.repository.StudyMemberRepository;
import com.studygroup.domain.user.dto.UserActivitySummaryResponse;
import com.studygroup.domain.user.dto.UserSearchResponse;
import com.studygroup.domain.user.entity.User;
import com.studygroup.domain.user.repository.UserRepository;
import com.studygroup.global.service.FileStorageService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

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
    private final FileStorageService fileStorageService;

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

    @Transactional
    public void updateUserProfile(Long userId, String name, MultipartFile profileImage) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found with id: " + userId));

        // 프로필 이미지가 새로 업로드된 경우
        if (profileImage != null && !profileImage.isEmpty()) {
            // 기존 이미지가 있다면 삭제
            if (StringUtils.hasText(user.getProfile())) {
                // user.getProfile()은 전체 URL이므로 파일 이름만 추출해야 합니다.
                String oldFileName = user.getProfile().substring(user.getProfile().lastIndexOf("/") + 1);
                fileStorageService.deleteFile(oldFileName);
            }

            // 새 이미지 저장 및 URL 생성
            String fileName = fileStorageService.storeFile(profileImage);
            String fileUrl = fileStorageService.getFileUrl(fileName); // 전체 URL을 얻음

            // User 엔티티에 이름과 새 프로필 이미지 URL 업데이트
            user.updateProfile(name, fileUrl);
        } else {
            // 이미지는 변경 없고 이름만 변경된 경우
            user.updateProfile(name, user.getProfile());
        }

        // userRepository.save(user); // @Transactional에 의해 변경 감지로 자동 저장됨
    }
} 