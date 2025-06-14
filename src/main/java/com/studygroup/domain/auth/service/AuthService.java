package com.studygroup.domain.auth.service;

import com.studygroup.domain.auth.dto.TokenResponse;
import com.studygroup.domain.auth.entity.RefreshToken;
import com.studygroup.domain.auth.repository.RefreshTokenRepository;
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
    private final RefreshTokenRepository refreshTokenRepository;

    @Transactional
    public TokenResponse refresh(String refreshTokenValue) {
        // 1. 토큰 유효성 검사 (서명, 만료일 등)
        if (!tokenProvider.validateToken(refreshTokenValue)) {
            throw new IllegalArgumentException("Invalid refresh token supplied!");
        }

        // 2. DB에서 해당 리프레시 토큰 정보를 가져옴
        RefreshToken refreshToken = refreshTokenRepository.findByToken(refreshTokenValue)
                .orElseThrow(() -> new IllegalArgumentException("Refresh token not found in DB. It may be expired or invalid."));

        // 3. 리프레시 토큰에 연결된 사용자 정보를 가져옴
        User user = userRepository.findById(refreshToken.getUserId())
                .orElseThrow(() -> new IllegalArgumentException("User not found from refresh token."));

        // 4. 새로운 Access Token 생성
        UserPrincipal principal = UserPrincipal.create(user);
        Authentication authentication = new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities());
        String newAccessToken = tokenProvider.createToken(authentication);

        // 5. 보안 강화를 위해 Refresh Token도 새로 발급 (Refresh Token Rotation)
        String newRefreshTokenValue = tokenProvider.createRefreshToken(authentication);

        // 6. DB에 저장된 리프레시 토큰을 새로운 값으로 업데이트
        refreshToken.updateToken(newRefreshTokenValue);
        log.info("Successfully refreshed token for user: {}", user.getEmail());

        // 7. 새로운 토큰 쌍을 반환
        return new TokenResponse(newAccessToken, newRefreshTokenValue);
    }
} 