package com.studygroup.global.security;

import com.studygroup.domain.user.entity.User;
import com.studygroup.domain.user.repository.UserRepository;
import com.studygroup.global.jwt.TokenProvider;
import jakarta.servlet.http.Cookie;
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

//    @Value("${app.oauth2.redirectUri}")
//    private String redirectUri;

    @Value("${jwt.refresh-token-validity}")
    private long refreshTokenValidityInMilliseconds; // application.properties에서 유효기간 가져오기

    @Override
    @Transactional
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response,
                                        Authentication authentication) throws IOException {
        try {
            String targetUrl = determineTargetUrl(request, response, authentication);
            clearAuthenticationAttributes(request);

            log.info("OAuth2 인증 성공, 리다이렉트 URL: {}", targetUrl);
            getRedirectStrategy().sendRedirect(request, response, targetUrl);
        } catch (Exception e) {
            log.error("OAuth2 인증 성공 처리 중 오류 발생", e);
            // 오류 발생 시 에러 페이지로 리다이렉트
            response.sendRedirect("http://having.duckdns.org/login?error=auth_failed");
        }
    }

    protected String determineTargetUrl(HttpServletRequest request, HttpServletResponse response,
                                        Authentication authentication) {
        UserPrincipal userPrincipal = (UserPrincipal) authentication.getPrincipal();
        Long userId = userPrincipal.getId();

        if (userId == null) {
            log.error("사용자 ID가 null입니다: email={}", userPrincipal.getEmail());
            throw new IllegalStateException("User ID cannot be null");
        }

        User latestUser = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalStateException("User not found in DB during token creation."));

        UserPrincipal finalPrincipal = UserPrincipal.create(latestUser, userPrincipal.getAttributes());
        Authentication finalAuthentication = new UsernamePasswordAuthenticationToken(
                finalPrincipal, null, finalPrincipal.getAuthorities());

        String accessToken = tokenProvider.createToken(finalAuthentication);
        String refreshTokenValue = tokenProvider.createRefreshToken(finalAuthentication);

        // Redis에 리프레시 토큰 저장
        String redisKey = "RT:" + finalPrincipal.getId();
        redisTemplate.opsForValue().set(
                redisKey,
                refreshTokenValue,
                refreshTokenValidityInMilliseconds,
                TimeUnit.MILLISECONDS
        );
        log.info("Saved/Updated Refresh Token for user ID {} in Redis.", finalPrincipal.getId());

        // ★★★ 방법 1: 쿠키를 사용한 토큰 전달 (권장) ★★★
        setTokenCookies(response, accessToken, refreshTokenValue);
        return "http://having.duckdns.org/login/success";
    }

    private void setTokenCookies(HttpServletResponse response, String accessToken, String refreshToken) {
        // Access Token 쿠키 설정 (1시간)
        Cookie accessTokenCookie = new Cookie("accessToken", accessToken);
        accessTokenCookie.setHttpOnly(true);
        accessTokenCookie.setSecure(false); // HTTPS 환경에서는 true로 설정
        accessTokenCookie.setPath("/");
        accessTokenCookie.setMaxAge(3600); // 1시간
        accessTokenCookie.setDomain("having.duckdns.org");
        response.addCookie(accessTokenCookie);

        // Refresh Token 쿠키 설정 (7일)
        Cookie refreshTokenCookie = new Cookie("refreshToken", refreshToken);
        refreshTokenCookie.setHttpOnly(true);
        refreshTokenCookie.setSecure(false); // HTTPS 환경에서는 true로 설정
        refreshTokenCookie.setPath("/");
        refreshTokenCookie.setMaxAge(604800); // 7일
        refreshTokenCookie.setDomain("having.duckdns.org");
        response.addCookie(refreshTokenCookie);

        log.info("토큰 쿠키가 설정되었습니다.");
    }
}