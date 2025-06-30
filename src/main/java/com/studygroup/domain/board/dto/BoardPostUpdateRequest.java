package com.studygroup.domain.board.dto;

import com.studygroup.domain.board.entity.BoardCategory;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class BoardPostUpdateRequest {

    @NotBlank(message = "제목은 비워둘 수 없습니다.")
    @Size(max = 255, message = "제목은 255자 이하로 입력해주세요.")
    private String title;

    @NotBlank(message = "내용은 비워둘 수 없습니다.")
    private String content;

    @NotNull(message = "카테고리는 필수입니다.")
    private BoardCategory category;

    // TODO: 첨부파일 수정 관련 필드 추가 가능
    // private List<Long> existingAttachmentIds; // 유지할 기존 첨부파일 ID 목록
    // private List<MultipartFile> newAttachments; // 새로 추가할 파일 목록
}
