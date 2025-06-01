package com.studygroup.domain.study.entity;

import com.studygroup.domain.user.entity.User;
import com.studygroup.global.common.BaseTimeEntity;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.HashSet;
import java.util.Set;

@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class StudyGroup extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "study_group_id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "leader_id", nullable = false)
    private User leader;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false)
    private String description;

    @Column(nullable = false)
    private int maxMembers;

    private int currentMembers;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private StudyStatus status;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private StudyType studyType;

    private String location;

    @Column(nullable = false)
    private LocalDate startDate;

    private LocalDate endDate;

    @OneToMany(mappedBy = "studyGroup", cascade = CascadeType.ALL, orphanRemoval = true)
    private Set<StudyGroupTag> tags = new HashSet<>();

    @OneToMany(mappedBy = "studyGroup", cascade = CascadeType.ALL, orphanRemoval = true)
    private Set<StudyMember> members = new HashSet<>();

    private int viewCount = 0;

    @Builder
    public StudyGroup(User leader, String title, String description, int maxMembers,
                     StudyStatus status, StudyType studyType, String location,
                     LocalDate startDate, LocalDate endDate) {
        this.leader = leader;
        this.title = title;
        this.description = description;
        this.maxMembers = maxMembers;
        this.currentMembers = 1; // 리더를 포함하여 시작
        this.status = status;
        this.studyType = studyType;
        this.location = location;
        this.startDate = startDate;
        this.endDate = endDate;
        this.viewCount = 0;
    }

    // 태그 추가 메서드
    public void addTag(StudyGroupTag tag) {
        this.tags.add(tag);
        tag.setStudyGroup(this);
    }

    // 멤버 추가 메서드
    public void addMember(StudyMember member) {
        this.members.add(member);
        this.currentMembers++;
    }

    // 멤버 제거 메서드
    public void removeMember(StudyMember member) {
        this.members.remove(member);
        this.currentMembers--;
    }

    // 스터디 상태 변경 메서드
    public void updateStatus(StudyStatus status) {
        this.status = status;
    }

    public int getCurrentMembers() {
        return (int) members.stream()
                .filter(member -> member.getStatus() == StudyMemberStatus.APPROVED)
                .count();
    }

    public void incrementViewCount() {
        this.viewCount++;
    }
} 