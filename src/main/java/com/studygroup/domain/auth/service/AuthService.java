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
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.ObjectUtils;

import java.util.concurrent.TimeUnit;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final TokenProvider tokenProvider;
    private final UserRepository userRepository;
    private final RedisTemplate<String, String> redisTemplate;
    @Value("${jwt.refresh-token-validity}")
    private long refreshTokenValidityInMilliseconds;

    @Transactional
    public TokenResponse refresh(String refreshTokenValue) {
        // 1. 토큰 유효성 검사 (서명, 만료일 등)
        if (!tokenProvider.validateToken(refreshTokenValue)) {
            throw new IllegalArgumentException("Invalid refresh token supplied!");
        }

        // 2. 토큰에서 사용자 ID 추출
        UserPrincipal principalFromToken = tokenProvider.getPrincipalFromToken(refreshTokenValue);
        Long userId = principalFromToken.getId();

        // 3. Redis에서 해당 사용자 ID의 Refresh Token을 가져옴
        String redisKey = "RT:" + userId;
        String storedRefreshToken = redisTemplate.opsForValue().get(redisKey);

        // 4. Redis에 토큰이 없거나(만료), 전달된 토큰과 일치하지 않으면 예외 발생
        if (ObjectUtils.isEmpty(storedRefreshToken) || !storedRefreshToken.equals(refreshTokenValue)) {
            throw new IllegalArgumentException("Refresh token not found in Redis or mismatched.");
        }

        // 5. 사용자 정보 조회 및 새로운 토큰 쌍 생성
        User user = userRepository.findById(userId).orElseThrow(/*...*/);
        UserPrincipal principal = UserPrincipal.create(user);
        Authentication authentication = new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities());

        String newAccessToken = tokenProvider.createToken(authentication);
        String newRefreshTokenValue = tokenProvider.createRefreshToken(authentication);

        // 6. Redis에 새로운 Refresh Token을 저장 (Rotation)
        redisTemplate.opsForValue().set(
                redisKey,
                newRefreshTokenValue,
                refreshTokenValidityInMilliseconds,
                TimeUnit.MILLISECONDS
        );
        log.info("Successfully refreshed and rotated token for user: {}", user.getEmail());

        return new TokenResponse(newAccessToken, newRefreshTokenValue);
    }
} 