package com.studygroup.domain.study.entity;

public enum StudyMemberRole {
    LEADER("리더"),
    MEMBER("멤버");

    private final String displayName;

    StudyMemberRole(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
} 