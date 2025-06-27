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

//    @Value("${app.oauth2.redirectUri}")
//    private String redirectUri;

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
        // 로그인 후 최종 도착지 주소 (프론트엔드 홈페이지)
        String targetUrl = "http://having.duckdns.org"; // 포트 번호 없는 최종 서비스 주소
        // ------------------------------------

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

        String redisKey = "RT:" + finalPrincipal.getId();
        redisTemplate.opsForValue().set(
                redisKey,
                refreshTokenValue,
                refreshTokenValidityInMilliseconds,
                TimeUnit.MILLISECONDS
        );
        log.info("Saved/Updated Refresh Token for user ID {} in Redis.", finalPrincipal.getId());

        // --- ★★★ 2. 리디렉션 URL을 생성하는 부분을 수정합니다 ★★★ ---
        // 토큰을 쿼리 파라미터에 담아 위에서 정의한 targetUrl로 보냅니다.
        return UriComponentsBuilder.fromUriString(targetUrl)
                .queryParam("token", accessToken)
                .queryParam("refreshToken", refreshTokenValue)
                .build().toUriString();
    }
}