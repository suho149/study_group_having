package com.studygroup.global.security;

import com.studygroup.domain.user.entity.User;
import com.studygroup.domain.user.repository.UserRepository;
import com.studygroup.global.jwt.TokenProvider;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.IOException;
import java.util.concurrent.TimeUnit;

@Slf4j
@Component
@RequiredArgsConstructor
public class OAuth2AuthenticationSuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private final TokenProvider tokenProvider;
    private final RedisTemplate<String, String> redisTemplate;
    private final UserRepository userRepository;

    @Value("${app.oauth2.redirectUri}")
    private String redirectUri;

    @Value("${jwt.refresh-token-validity}")
    private long refreshTokenValidityInMilliseconds; // application.properties에서 유효기간 가져오기

    @Override
    @Transactional
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response,
                                        Authentication authentication) throws IOException {
        String targetUrl = determineTargetUrl(request, response, authentication);
        clearAuthenticationAttributes(request);
        getRedirectStrategy().sendRedirect(request, response, targetUrl);
    }

    protected String determineTargetUrl(HttpServletRequest request, HttpServletResponse response,
                                        Authentication authentication) {
        UserPrincipal userPrincipal = (UserPrincipal) authentication.getPrincipal();
        Long userId = userPrincipal.getId();

        if (userId == null) {
            log.error("사용자 ID가 null입니다: email={}", userPrincipal.getEmail());
            throw new IllegalStateException("User ID cannot be null");
        }

        // DB에서 사용자의 최신 정보를 다시 조회합니다.
        // DataInitializer에 의해 Role이 USER -> ADMIN으로 변경된 경우, 이 조회로 최신 Role을 가져올 수 있습니다.
        User latestUser = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalStateException("User not found in DB during token creation."));

        // 최신 정보를 담은 새로운 UserPrincipal과 Authentication 객체를 생성합니다.
        UserPrincipal finalPrincipal = UserPrincipal.create(latestUser, userPrincipal.getAttributes());
        Authentication finalAuthentication = new UsernamePasswordAuthenticationToken(
                finalPrincipal, null, finalPrincipal.getAuthorities());
        // -----------------------------

        // 1. 토큰 쌍 생성
        String accessToken = tokenProvider.createToken(finalAuthentication);
        String refreshTokenValue = tokenProvider.createRefreshToken(finalAuthentication);

        // 1. Redis에 저장할 Key를 생성합니다. (예: "RT:1")
        String redisKey = "RT:" + finalPrincipal.getId();

        // 2. Redis에 Refresh Token을 저장하고, 유효기간(TTL)을 설정합니다.
        redisTemplate.opsForValue().set(
                redisKey,
                refreshTokenValue,
                refreshTokenValidityInMilliseconds,
                TimeUnit.MILLISECONDS
        );
        log.info("Saved/Updated Refresh Token for user ID {} in Redis.", finalPrincipal.getId());

        // 3. 프론트엔드로 리다이렉트할 URL 생성
        return UriComponentsBuilder.fromUriString(redirectUri)
                .queryParam("token", accessToken)
                .queryParam("refreshToken", refreshTokenValue)
                .build().toUriString();
    }
}