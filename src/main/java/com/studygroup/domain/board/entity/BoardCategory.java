package com.studygroup.domain.board.entity;

public enum BoardCategory {
    FREE("자유"),
    QUESTION("질문"),
    DISCUSSION("토론"),
    INFO("정보공유"), // 예시 카테고리 추가
    ETC("기타");

    private final String description;

    BoardCategory(String description) {
        this.description = description;
    }

    public String getDescription() {
        return description;
    }
}
