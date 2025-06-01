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
    
    public void updateProfile(String name, String profile) {
        this.name = name;
        this.profile = profile;
    }
} 