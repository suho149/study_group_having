package com.studygroup.domain.board.dto;

import com.studygroup.domain.board.entity.VoteType;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class VoteRequest {
    @NotNull(message = "투표 유형은 필수입니다.")
    private VoteType voteType; // "LIKE" 또는 "DISLIKE" 문자열로 받음
}
