package com.studygroup.domain.feed.controller;

import com.studygroup.domain.feed.dto.FeedResponseDto;
import com.studygroup.domain.feed.repository.FeedRepository;
import com.studygroup.global.security.CurrentUser;
import com.studygroup.global.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/feeds")
@RequiredArgsConstructor
public class FeedController {

    private final FeedRepository feedRepository; // 간단한 조회의 경우 서비스 생략 가능

    @GetMapping
    public ResponseEntity<Page<FeedResponseDto>> getMyFeeds(
            @CurrentUser UserPrincipal principal, Pageable pageable) {

        Page<FeedResponseDto> feeds = feedRepository.findByOwnerOrderByCreatedAtDesc(principal.getUser(), pageable)
                .map(FeedResponseDto::from); // Feed -> DTO 변환

        return ResponseEntity.ok(feeds);
    }
}
