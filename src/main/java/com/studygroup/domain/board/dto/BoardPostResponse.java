package com.studygroup.domain.board.dto;

import com.studygroup.domain.board.entity.BoardCategory;
import com.studygroup.domain.board.entity.BoardPost;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class BoardPostResponse {
    private Long id;
    private BoardCategory category;
    private String title;
    private String content; // 상세 조회 시에는 content 포함, 목록 조회 시에는 생략 가능
    private String authorName;
    private Long authorId;
    private LocalDateTime createdAt;
    private LocalDateTime modifiedAt;
    private int viewCount;
    private int likeCount;
    private int commentCount; // 댓글 기능 추가 시

    public static BoardPostResponse from(BoardPost post) {
        return BoardPostResponse.builder()
                .id(post.getId())
                .category(post.getCategory())
                .title(post.getTitle())
                .content(post.getContent()) // 상세 조회 시
                .authorName(post.getAuthor().getName())
                .authorId(post.getAuthor().getId())
                .createdAt(post.getCreatedAt())
                .modifiedAt(post.getModifiedAt())
                .viewCount(post.getViewCount())
                .likeCount(post.getLikeCount())
                .commentCount(post.getComments() != null ? // comments 필드가 BoardPost 엔티티에 있다면
                        (int) post.getComments().stream().filter(c -> !c.isDeleted()).count() : 0)
                .build();
    }
}
