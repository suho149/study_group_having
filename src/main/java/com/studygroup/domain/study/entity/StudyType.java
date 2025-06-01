package com.studygroup.domain.study.entity;

public enum StudyType {
    ONLINE("온라인"),
    OFFLINE("오프라인"),
    HYBRID("온/오프라인 병행");

    private final String displayName;

    StudyType(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
} 