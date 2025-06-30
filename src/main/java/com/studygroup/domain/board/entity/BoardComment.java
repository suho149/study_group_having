package com.studygroup.domain.board.entity;

import com.studygroup.domain.user.entity.User;
import com.studygroup.global.common.BaseTimeEntity;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.ColumnDefault;

import java.util.ArrayList;
import java.util.List;

@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
@Table(name = "board_comment") // 테이블명 명시
public class BoardComment extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "board_comment_id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "board_post_id", nullable = false)
    private BoardPost boardPost;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "author_id", nullable = false)
    private User author;

    // 대댓글 기능을 위한 self-reference
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_comment_id") // 부모 댓글 ID, 최상위 댓글은 null
    @Setter // 대댓글 설정용 (선택적)
    private BoardComment parentComment;

    // 자식 댓글 목록 (양방향 설정 시)
    @OneToMany(mappedBy = "parentComment", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<BoardComment> childrenComments = new ArrayList<>();

    @Lob
    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    @Column(nullable = false, columnDefinition = "INT DEFAULT 0")
    private int likeCount = 0;

    @Column(nullable = false, columnDefinition = "INT DEFAULT 0")
    private int dislikeCount = 0;

    @Column(nullable = false)
    @Builder.Default
    private boolean isDeleted = false; // 삭제 여부 (소프트 삭제용)

    @Column(nullable = false)
    @ColumnDefault("false")
    private boolean isBlinded = false;

    public void blind() {
        this.isBlinded = true;
        this.content = "관리자에 의해 숨김 처리된 댓글입니다."; // 내용도 변경
    }

    // 댓글 내용 수정 메소드
    public void updateContent(String content) {
        this.content = content;
    }

    // 소프트 삭제 메소드
    public void markAsDeleted() {
        this.isDeleted = true;
        this.content = "삭제된 댓글입니다."; // 또는 다른 표시
        // 자식 댓글이 있다면 어떻게 처리할지 정책 필요 (함께 숨김 등)
    }

    // 연관관계 편의 메소드 (대댓글 추가 시)
    public void addChildComment(BoardComment child) {
        this.childrenComments.add(child);
        child.setParentComment(this);
    }

    public void incrementLikeCount() { this.likeCount++; }
    public void decrementLikeCount() { if (this.likeCount > 0) this.likeCount--; }
    public void incrementDislikeCount() { this.dislikeCount++; }
    public void decrementDislikeCount() { if (this.dislikeCount > 0) this.dislikeCount--; }
}
