package com.studygroup.domain.user.entity;

import com.studygroup.domain.study.entity.Tag;
import com.studygroup.global.common.BaseTimeEntity;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Table(
        name = "user_tag_preference",
        uniqueConstraints = {
                // 한 사용자는 한 태그에 대해 하나의 선호도 레코드만 가짐
                @UniqueConstraint(columnNames = {"user_id", "tag_id"})
        }
)
public class UserTagPreference extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tag_id", nullable = false)
    private Tag tag;

    @Column(nullable = false)
    private int score; // 선호도 점수

    @Builder
    public UserTagPreference(User user, Tag tag, int score) {
        this.user = user;
        this.tag = tag;
        this.score = score;
    }

    public void addScore(int score) {
        this.score += score;
    }
}
