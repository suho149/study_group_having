package com.studygroup.global.security;

import com.studygroup.domain.user.entity.User;
import lombok.Getter;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.oauth2.core.user.OAuth2User;

import java.util.Collection;
import java.util.Collections;
import java.util.Map;

@Getter
public class UserPrincipal implements OAuth2User, UserDetails {
    private final Long id;
    private final String email;
    private final String name;
    private final String profile;
    private final Collection<? extends GrantedAuthority> authorities;
    private Map<String, Object> attributes;

    public UserPrincipal(User user, Map<String, Object> attributes) {
        this.id = user.getId();
        this.email = user.getEmail();
        this.name = user.getName();
        this.profile = user.getProfile();
        this.authorities = Collections.singletonList(new SimpleGrantedAuthority(user.getRole().getKey()));
        this.attributes = attributes;
    }

    public UserPrincipal(Long id, String email, String name, String profile, Collection<? extends GrantedAuthority> authorities) {
        this.id = id;
        this.email = email;
        this.name = name;
        this.profile = profile;
        this.authorities = authorities;
    }

    public static UserPrincipal create(User user, Collection<? extends GrantedAuthority> authorities) {
        return new UserPrincipal(
            user.getId(),
            user.getEmail(),
            user.getName(),
            user.getProfile(),
            authorities
        );
    }

    @Override
    public String getPassword() {
        return null;
    }

    @Override
    public String getUsername() {
        return email;
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return true;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return true;
    }

    @Override
    public Map<String, Object> getAttributes() {
        return attributes;
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return authorities;
    }

    @Override
    public String getName() {
        return String.valueOf(id);
    }
} 