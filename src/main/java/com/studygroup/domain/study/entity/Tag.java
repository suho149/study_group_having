package com.studygroup.domain.study.entity;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.HashSet;
import java.util.Set;

@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Tag {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String name;

    @OneToMany(mappedBy = "tag", cascade = CascadeType.ALL, orphanRemoval = true)
    private Set<StudyGroupTag> studyGroups = new HashSet<>();

    @Builder
    public Tag(String name) {
        this.name = name;
    }

    public void addStudyGroup(StudyGroupTag studyGroupTag) {
        this.studyGroups.add(studyGroupTag);
        studyGroupTag.setTag(this);
    }

    public void removeStudyGroup(StudyGroupTag studyGroupTag) {
        this.studyGroups.remove(studyGroupTag);
        studyGroupTag.setTag(null);
    }
} 