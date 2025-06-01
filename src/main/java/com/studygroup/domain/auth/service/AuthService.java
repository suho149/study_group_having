package com.studygroup.domain.auth.service;

import com.studygroup.domain.auth.dto.TokenResponse;
import com.studygroup.domain.auth.entity.RefreshToken;
import com.studygroup.domain.auth.repository.RefreshTokenRepository;
import com.studygroup.domain.user.entity.User;
import com.studygroup.domain.user.repository.UserRepository;
import com.studygroup.global.jwt.TokenProvider;
import com.studygroup.global.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final TokenProvider tokenProvider;
    private final RefreshTokenRepository refreshTokenRepository;
    private final UserRepository userRepository;

    @Transactional
    public TokenResponse refresh(String refreshTokenValue) {
        // 리프레시 토큰 유효성 검사
        if (!tokenProvider.validateToken(refreshTokenValue)) {
            throw new IllegalArgumentException("Invalid refresh token");
        }

        // 리프레시 토큰으로부터 사용자 ID 추출
        Long userId = tokenProvider.getUserIdFromToken(refreshTokenValue);

        // 사용자 조회
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        // UserPrincipal 생성 및 Authentication 객체 생성
        UserPrincipal userPrincipal = new UserPrincipal(user, null);
        Authentication authentication = new UsernamePasswordAuthenticationToken(
                userPrincipal, null, userPrincipal.getAuthorities());

        // 새로운 액세스 토큰과 리프레시 토큰 생성
        String newAccessToken = tokenProvider.createAccessToken(authentication);
        String newRefreshToken = tokenProvider.createRefreshToken(authentication);

        // 리프레시 토큰 저장 또는 업데이트
        RefreshToken refreshToken = refreshTokenRepository.findByUserId(userId)
                .map(token -> {
                    token.updateToken(newRefreshToken);
                    return token;
                })
                .orElseGet(() -> refreshTokenRepository.save(
                        RefreshToken.builder()
                                .userId(userId)
                                .token(newRefreshToken)
                                .build()
                ));

        return new TokenResponse(newAccessToken, newRefreshToken);
    }
} 