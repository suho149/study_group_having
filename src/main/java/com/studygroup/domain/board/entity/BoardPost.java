package com.studygroup.domain.board.entity;

import com.studygroup.domain.user.entity.User;
import com.studygroup.global.common.BaseTimeEntity;
import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class BoardPost extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "board_post_id")
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private BoardCategory category;

    @Column(nullable = false, length = 255)
    private String title;

    @Lob // HTML 또는 Markdown 등의 긴 텍스트
    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "author_id", nullable = false)
    private User author;

    @Column(nullable = false, columnDefinition = "INT DEFAULT 0")
    private int viewCount = 0;

    @Column(nullable = false, columnDefinition = "INT DEFAULT 0")
    private int likeCount = 0;

    @Column(nullable = false, columnDefinition = "INT DEFAULT 0")
    private int dislikeCount = 0;

     //댓글
     @OneToMany(mappedBy = "boardPost", cascade = CascadeType.ALL, orphanRemoval = true)
     @Builder.Default
     private List<BoardComment> comments = new ArrayList<>();

    // @OneToMany(mappedBy = "boardPost", cascade = CascadeType.ALL, orphanRemoval = true)
    // @Builder.Default
    // private List<BoardAttachment> attachments = new ArrayList<>();

    public void update(String title, String content, BoardCategory category) {
        this.title = title;
        this.content = content;
        this.category = category;
    }

    public void incrementViewCount() {
        this.viewCount++;
    }

    // --- 추천/비추천 카운트 관리 메소드 ---
    public void incrementLikeCount() {
        this.likeCount++;
    }
    public void decrementLikeCount() {
        if (this.likeCount > 0) {
            this.likeCount--;
        }
    }
    public void incrementDislikeCount() {
        this.dislikeCount++;
    }
    public void decrementDislikeCount() {
        if (this.dislikeCount > 0) {
            this.dislikeCount--;
        }
    }
}
