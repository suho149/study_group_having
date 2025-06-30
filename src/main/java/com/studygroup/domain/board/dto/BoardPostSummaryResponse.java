package com.studygroup.domain.board.dto;

import com.studygroup.domain.board.entity.BoardCategory;
import com.studygroup.domain.board.entity.BoardPost;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class BoardPostSummaryResponse {
    private Long id;
    private BoardCategory category;
    private String title;
    private String authorName;
    private String authorProfileImageUrl; // 추가
    private LocalDateTime createdAt;
    private int viewCount;
    private int likeCount;
    private int commentCount;
    // private boolean likedByCurrentUser; // 현재 사용자의 좋아요 여부 (추가 구현 시)

    public static BoardPostSummaryResponse from(BoardPost post /*, boolean liked, int commentCount */) {
        return BoardPostSummaryResponse.builder()
                .id(post.getId())
                .category(post.getCategory())
                .title(post.getTitle())
                .authorName(post.getAuthor().getName())
                .authorProfileImageUrl(post.getAuthor().getProfile()) // 추가
                .createdAt(post.getCreatedAt())
                .viewCount(post.getViewCount())
                .likeCount(post.getLikeCount())
                .commentCount(0) // 임시: post.getComments().size() // 댓글 기능 구현 후
                // .likedByCurrentUser(liked)
                .build();
    }
}
