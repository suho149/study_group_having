package com.studygroup.domain.user.entity;

import com.studygroup.global.entity.BaseTimeEntity;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
@Table(name = "users")
public class User extends BaseTimeEntity {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false)
    private String email;
    
    @Column(nullable = false)
    private String name;
    
    private String profile;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AuthProvider provider;
    
    private String providerId;

    // --- 포인트 및 레벨 필드 추가 ---
    @Column(nullable = false, columnDefinition = "INT DEFAULT 0")
    private int point = 0;

    @Column(nullable = false, columnDefinition = "INT DEFAULT 1")
    private int level = 1;
    
    public void updateProfile(String name, String profile) {
        this.name = name;
        this.profile = profile;
    }

    // --- 포인트를 추가하고 레벨업을 확인하는 메소드 추가 ---
    public void addPoint(int point) {
        this.point += point;
        // TODO: 레벨업 정책에 따라 level 필드 업데이트 로직 추가
        // 예: 1000 포인트마다 1레벨업
        // this.level = (this.point / 1000) + 1;
    }
} 