package com.studygroup.domain.recommendation.controller;

import com.studygroup.domain.recommendation.service.RecommendationService;
import com.studygroup.domain.study.dto.StudyGroupResponse;
import com.studygroup.global.security.CurrentUser;
import com.studygroup.global.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/recommendations")
@RequiredArgsConstructor
public class RecommendationController {

    private final RecommendationService recommendationService;

    @GetMapping("/studies")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<StudyGroupResponse>> getRecommendedStudies(@CurrentUser UserPrincipal userPrincipal) {
        List<StudyGroupResponse> studies = recommendationService.getRecommendedStudies(userPrincipal.getId());
        return ResponseEntity.ok(studies);
    }
}
