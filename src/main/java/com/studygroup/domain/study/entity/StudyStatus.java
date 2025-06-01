package com.studygroup.domain.study.entity;

public enum StudyStatus {
    RECRUITING("모집 중"),
    IN_PROGRESS("진행 중"),
    COMPLETED("완료"),
    CANCELLED("취소");

    private final String displayName;

    StudyStatus(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
} 