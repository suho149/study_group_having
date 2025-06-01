package com.studygroup.domain.study.entity;

import com.studygroup.domain.user.entity.User;
import com.studygroup.global.common.BaseTimeEntity;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class StudyMember extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "study_group_id", nullable = false)
    private StudyGroup studyGroup;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private StudyMemberRole role;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private StudyMemberStatus status;

    public void updateRole(StudyMemberRole role) {
        this.role = role;
    }

    public void updateStatus(StudyMemberStatus status) {
        this.status = status;
    }
} 