package com.studygroup.domain.board.entity;

import com.studygroup.domain.user.entity.User;
import com.studygroup.global.common.BaseTimeEntity;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
@Table(
        name = "post_like",
        uniqueConstraints = { // 한 사용자는 한 게시물에 한 번만 투표 가능 (LIKE 또는 DISLIKE 중 하나)
                @UniqueConstraint(columnNames = {"user_id", "board_post_id"})
        }
)
public class PostLike extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "board_post_id", nullable = false)
    private BoardPost boardPost;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Setter // 투표 유형 변경을 위해 (예: 좋아요 눌렀다가 비추천으로 변경)
    private VoteType voteType;
}
