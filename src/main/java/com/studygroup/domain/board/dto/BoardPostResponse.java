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
    private UserSummaryDto author;
    private LocalDateTime createdAt;
    private LocalDateTime modifiedAt;
    private int viewCount;
    private int likeCount;
    private int dislikeCount;
    private int commentCount; // 댓글 기능 추가 시
    private boolean likedByCurrentUser;
    private boolean dislikedByCurrentUser;

    public static BoardPostResponse from(BoardPost post, boolean likedByCurrentUser, boolean dislikedByCurrentUser) {
        return BoardPostResponse.builder()
                .id(post.getId())
                .category(post.getCategory())
                .title(post.getTitle())
                .content(post.getContent()) // 상세 조회 시
                .author(UserSummaryDto.from(post.getAuthor())) // User 객체를 UserSummaryDto로 변환하여 할당
                .createdAt(post.getCreatedAt())
                .modifiedAt(post.getModifiedAt())
                .viewCount(post.getViewCount())
                .likeCount(post.getLikeCount())
                .dislikeCount(post.getDislikeCount()) // 추가
                .commentCount(post.getComments() != null ? // comments 필드가 BoardPost 엔티티에 있다면
                        (int) post.getComments().stream().filter(c -> !c.isDeleted()).count() : 0)
                .likedByCurrentUser(likedByCurrentUser) // 추가
                .dislikedByCurrentUser(dislikedByCurrentUser) // 추가
                .build();
    }
}
