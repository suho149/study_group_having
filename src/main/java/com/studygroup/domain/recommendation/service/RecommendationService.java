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

import java.util.Collections;
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

        if (preferredTags.isEmpty()) {
            // 선호 태그가 없으면 빈 목록 반환
            return Collections.emptyList();
        }

        // 수정된 쿼리 호출
        List<Object[]> results = studyGroupRepository.findRecommendedStudiesWithMatchCount(
                user,
                preferredTags,
                PageRequest.of(0, 3) // 추천 개수를 3~4개로 줄여서 '엄선된' 느낌을 줌
        );

        // 결과(Object 배열)를 StudyGroup 리스트로 변환
        List<StudyGroup> recommendedStudies = results.stream()
                .map(result -> (StudyGroup) result[0])
                .collect(Collectors.toList());

        return recommendedStudies.stream()
                .map(sg -> StudyGroupResponse.from(sg, false))
                .collect(Collectors.toList());
    }
}
