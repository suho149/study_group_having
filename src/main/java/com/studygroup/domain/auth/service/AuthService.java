package com.studygroup.domain.auth.service;

import com.studygroup.domain.auth.dto.TokenResponse;
import com.studygroup.domain.user.entity.User;
import com.studygroup.domain.user.repository.UserRepository;
import com.studygroup.global.jwt.TokenProvider;
import com.studygroup.global.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final TokenProvider tokenProvider;
    private final UserRepository userRepository;

    @Transactional
    public TokenResponse refresh(String refreshTokenValue) {
        if (!tokenProvider.validateToken(refreshTokenValue)) {
            throw new IllegalArgumentException("Invalid refresh token");
        }

        UserPrincipal userPrincipal = tokenProvider.getPrincipalFromToken(refreshTokenValue);
        User user = userRepository.findById(userPrincipal.getId())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        UserPrincipal principal = UserPrincipal.create(user);
        Authentication authentication = new UsernamePasswordAuthenticationToken(
                principal, null, principal.getAuthorities());

        String newToken = tokenProvider.createToken(authentication);
        String newRefreshToken = tokenProvider.createRefreshToken(authentication);

        return new TokenResponse(newToken, newRefreshToken);
    }
} 