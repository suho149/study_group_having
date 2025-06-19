package com.studygroup.domain.recommendation.service;

import com.studygroup.domain.study.dto.StudyGroupResponse;
import com.studygroup.domain.study.entity.StudyGroup;
import com.studygroup.domain.study.entity.StudyStatus;
import com.studygroup.domain.study.entity.Tag;
import com.studygroup.domain.study.repository.StudyGroupRepository;
import com.studygroup.domain.user.entity.User;
import com.studygroup.domain.user.repository.UserRepository;
import com.studygroup.domain.user.repository.UserTagPreferenceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class RecommendationService {

    private final UserRepository userRepository;
    private final UserTagPreferenceRepository userTagPreferenceRepository;
    private final StudyGroupRepository studyGroupRepository;

    public List<StudyGroupResponse> getRecommendedStudies(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        // 1. 사용자의 상위 5개 선호 태그를 가져옴
        List<Tag> preferredTags = userTagPreferenceRepository.findTop5ByUserOrderByScoreDesc(user)
                .stream()
                .map(p -> p.getTag())
                .collect(Collectors.toList());

        List<StudyGroup> recommendedStudies;

        // 2. 선호 태그가 있으면, 그것을 기반으로 추천
        if (!preferredTags.isEmpty()) {
            recommendedStudies = studyGroupRepository.findRecommendedStudies(user, preferredTags, PageRequest.of(0, 6)); // 최대 6개 추천
        } else {
            // 3. 선호 태그가 없으면, 단순히 인기 스터디를 추천 (Fallback)
            recommendedStudies = studyGroupRepository.findByStatusOrderByLikeCountDesc(StudyStatus.RECRUITING, PageRequest.of(0, 6));
        }

        // DTO로 변환하여 반환
        return recommendedStudies.stream()
                .map(sg -> StudyGroupResponse.from(sg, false)) // 좋아요 여부는 여기서 중요하지 않으므로 false
                .collect(Collectors.toList());
    }
}
