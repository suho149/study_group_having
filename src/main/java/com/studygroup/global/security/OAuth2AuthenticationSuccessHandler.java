package com.studygroup.global.security;

import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;
import com.studygroup.global.jwt.TokenProvider;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;

@Component
@RequiredArgsConstructor
public class OAuth2AuthenticationSuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private final TokenProvider tokenProvider;
    private static final String REDIRECT_URI = "http://localhost:3000/oauth2/redirect";
    private static final Logger log = LoggerFactory.getLogger(OAuth2AuthenticationSuccessHandler.class);

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response, Authentication authentication)
            throws IOException, ServletException {
        String targetUrl = determineTargetUrl(request, response, authentication);
        getRedirectStrategy().sendRedirect(request, response, targetUrl);
    }

    protected String determineTargetUrl(HttpServletRequest request, HttpServletResponse response, Authentication authentication) {
        if (!(authentication.getPrincipal() instanceof UserPrincipal)) {
            log.error("잘못된 인증 객체: Principal이 UserPrincipal 타입이 아님 - {}", authentication.getPrincipal().getClass());
            throw new IllegalArgumentException("Invalid authentication principal type");
        }

        UserPrincipal userPrincipal = (UserPrincipal) authentication.getPrincipal();
        if (userPrincipal.getId() == null) {
            log.error("사용자 ID가 null입니다: email={}", userPrincipal.getEmail());
            throw new IllegalArgumentException("User ID is null");
        }

        log.debug("OAuth2 로그인 성공: userId={}, email={}, principal={}", 
            userPrincipal.getId(), 
            userPrincipal.getEmail(),
            userPrincipal);
        
        String token = tokenProvider.createAccessToken(authentication);
        String refreshToken = tokenProvider.createRefreshToken(authentication);

        return UriComponentsBuilder.fromUriString(REDIRECT_URI)
                .queryParam("token", token)
                .queryParam("refreshToken", refreshToken)
                .build().toUriString();
    }
}