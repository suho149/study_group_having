package com.studygroup.domain.feed.dto;

import com.studygroup.domain.feed.entity.Feed;
import com.studygroup.domain.user.entity.ActivityType;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
public class FeedResponseDto {
    private Long id;
    private String actorName; // 활동을 한 사람의 이름
    private String actorProfileUrl; // 활동을 한 사람의 프로필 이미지
    private ActivityType activityType; // 활동 종류 (CREATE_STUDY, CREATE_POST 등)
    private Long referenceId; // 관련 콘텐츠 ID
    private String referenceContent; // 관련 콘텐츠 제목 등
    private boolean isRead;
    private LocalDateTime createdAt;

    // Feed 엔티티를 DTO로 변환하는 정적 팩토리 메소드
    public static FeedResponseDto from(Feed feed) {
        FeedResponseDto dto = new FeedResponseDto();
        dto.id = feed.getId();
        dto.actorName = feed.getActor().getName();
        dto.actorProfileUrl = feed.getActor().getProfile();
        dto.activityType = feed.getActivityType();
        dto.referenceId = feed.getReferenceId();
        dto.referenceContent = feed.getReferenceContent();
        dto.isRead = feed.isRead();
        dto.createdAt = feed.getCreatedAt();
        return dto;
    }

    // 기본 생성자를 private으로 막아 정적 팩토리 메소드 사용을 강제 (선택 사항)
    private FeedResponseDto() {}
}
