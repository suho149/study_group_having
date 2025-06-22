package com.studygroup.domain.feed.entity;

import com.studygroup.domain.user.entity.ActivityType;
import com.studygroup.domain.user.entity.User;
import com.studygroup.global.common.BaseTimeEntity;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Feed extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // 이 피드를 보게 될 사용자 (피드의 주인)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_id", nullable = false)
    private User owner;

    // 활동을 일으킨 사용자 (피드의 주인공, owner의 친구)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "actor_id", nullable = false)
    private User actor;

    // 활동의 종류
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ActivityType activityType;

    // 관련 콘텐츠의 ID (예: 생성된 스터디 ID, 작성된 게시글 ID)
    private Long referenceId;

    // (선택) 관련 콘텐츠의 제목이나 미리보기 텍스트
    private String referenceContent;

    @Column(nullable = false)
    private boolean isRead = false;

    @Builder
    public Feed(User owner, User actor, ActivityType activityType, Long referenceId, String referenceContent) {
        this.owner = owner;
        this.actor = actor;
        this.activityType = activityType;
        this.referenceId = referenceId;
        this.referenceContent = referenceContent;
    }

    public void markAsRead() {
        this.isRead = true;
    }
}
