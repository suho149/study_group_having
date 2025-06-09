package com.studygroup.domain.board.dto;

import com.studygroup.domain.board.entity.BoardComment;
import com.studygroup.domain.chat.dto.UserSummaryDto;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Getter
@Builder
public class CommentResponseDto {
    private Long id;
    private String content;
    private UserSummaryDto author;
    private LocalDateTime createdAt;
    private LocalDateTime modifiedAt;
    private int likeCount;
    private int dislikeCount;
    private Long parentId;
    private List<CommentResponseDto> children; // 대댓글 목록 (재귀적으로)
    private boolean isDeleted;
    // private boolean likedByCurrentUser; // 추천 기능 추가 시
    // private boolean dislikedByCurrentUser; // 비추천 기능 추가 시

    public static CommentResponseDto from(BoardComment comment /*, boolean liked, boolean disliked */) {
        return CommentResponseDto.builder()
                .id(comment.getId())
                .content(comment.isDeleted() ? "삭제된 댓글입니다." : comment.getContent())
                .author(UserSummaryDto.from(comment.getAuthor()))
                .createdAt(comment.getCreatedAt())
                .modifiedAt(comment.getModifiedAt())
                .likeCount(comment.getLikeCount())
                .dislikeCount(comment.getDislikeCount())
                .parentId(comment.getParentComment() != null ? comment.getParentComment().getId() : null)
                .children(comment.getChildrenComments() != null ?
                        comment.getChildrenComments().stream()
                                .filter(child -> !child.isDeleted()) // 삭제되지 않은 대댓글만
                                .map(child -> CommentResponseDto.from(child /*, false, false */)) // 재귀 호출
                                .collect(Collectors.toList()) :
                        List.of()) // children이 null이면 빈 리스트
                .isDeleted(comment.isDeleted())
                // .likedByCurrentUser(liked)
                // .dislikedByCurrentUser(disliked)
                .build();
    }
}
