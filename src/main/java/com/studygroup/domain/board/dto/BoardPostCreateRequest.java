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
public class BoardPostCreateRequest {

    @NotNull(message = "카테고리는 필수입니다.")
    private BoardCategory category;

    @NotBlank(message = "제목은 필수입니다.")
    @Size(max = 255, message = "제목은 255자 이하로 입력해주세요.")
    private String title;

    @NotBlank(message = "내용은 필수입니다.")
    private String content;

    // 파일 업로드는 나중에 List<MultipartFile> 등으로 추가
}
