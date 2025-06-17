package com.studygroup.domain.badge.entity;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Badge {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String name; // 뱃지 이름 (예: FIRST_POST, STUDY_LEADER)

    @Column(nullable = false)
    private String description; // 뱃지 설명

    private String imageUrl; // 뱃지 이미지 URL

    @Builder
    public Badge(String name, String description, String imageUrl) {
        this.name = name;
        this.description = description;
        this.imageUrl = imageUrl;
    }
}
