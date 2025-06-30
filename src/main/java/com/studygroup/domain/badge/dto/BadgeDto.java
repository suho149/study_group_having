package com.studygroup.domain.badge.dto;

import com.studygroup.domain.badge.entity.Badge;
import lombok.Getter;

@Getter
public class BadgeDto {
    private String name;
    private String description;
    private String imageUrl;

    public BadgeDto(Badge badge) {
        this.name = badge.getName();
        this.description = badge.getDescription();
        this.imageUrl = badge.getImageUrl();
    }
}
