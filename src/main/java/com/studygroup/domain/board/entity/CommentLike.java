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
        name = "comment_like",
        uniqueConstraints = {
                @UniqueConstraint(columnNames = {"user_id", "board_comment_id"})
        }
)
public class CommentLike extends BaseTimeEntity {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "board_comment_id", nullable = false)
    private BoardComment boardComment;

    @Setter
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private VoteType voteType; // LIKE, DISLIKE

}
