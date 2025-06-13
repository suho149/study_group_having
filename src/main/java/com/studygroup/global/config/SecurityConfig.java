package com.studygroup.global.config;

import com.studygroup.global.security.TokenAuthenticationFilter;
import com.studygroup.global.security.CustomOAuth2UserService;
//import com.studygroup.global.security.OAuth2AuthenticationFailureHandler; // 추가 (필요 시)
import com.studygroup.global.security.OAuth2AuthenticationSuccessHandler;
import jakarta.servlet.http.HttpServletResponse; // 추가
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod; // 추가
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration; // 추가
import org.springframework.web.cors.CorsConfigurationSource; // 추가
import org.springframework.web.cors.UrlBasedCorsConfigurationSource; // 추가

import java.util.Arrays; // 추가

@Configuration
@EnableWebSecurity
@EnableMethodSecurity(prePostEnabled = true)
@RequiredArgsConstructor
public class SecurityConfig {

    private final TokenAuthenticationFilter tokenAuthenticationFilter;
    private final CustomOAuth2UserService customOAuth2UserService;
    private final OAuth2AuthenticationSuccessHandler oAuth2AuthenticationSuccessHandler;
    // private final OAuth2AuthenticationFailureHandler oAuth2AuthenticationFailureHandler;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .csrf(csrf -> csrf.disable())
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/", "/error", "/favicon.ico",
                                "/auth/**",
                                // "/oauth2/**", // <--- 이 부분을 더 세밀하게 제어하거나, oauth2Login()이 처리하도록 함
                                "/login/**",
                                "/oauth2/authorization/**", // 명시적으로 허용 (기본 경로)
                                "/api/notifications/subscribe" // SSE 구독 경로를 인증 예외에 추가
                        ).permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/studies", "/api/studies/*").permitAll()
                        .requestMatchers("/api/**").authenticated()
                        .anyRequest().permitAll()
                )
                .oauth2Login(oauth2 -> oauth2
                                // .authorizationEndpoint(...) // <--- 이 라인을 주석 처리 또는 삭제합니다. (가장 중요)
                                // 기본 경로: /oauth2/authorization/{registrationId}
                                // 기본 리다이렉션 URI: /login/oauth2/code/{registrationId} (application.properties에서 설정한 값 우선)

                                .redirectionEndpoint(redirectionEndpointConfig ->
                                        // 이 부분은 application.properties의 redirect-uri 설정과 연관됩니다.
                                        // Spring Boot가 application.properties의 redirect-uri를 우선적으로 사용하므로
                                        // 여기서는 생략하거나, 일치시켜야 합니다.
                                        // 일반적으로는 application.properties에서 관리하는 것이 더 좋습니다.
                                        // 만약 application.properties에 명시적인 redirect-uri가 없다면,
                                        // 여기서 설정한 baseUri + "/{registrationId}" (예: /login/oauth2/code/google)로 사용됩니다.
                                        // 현재 application.properties에 `app.oauth2.redirectUri`가 있지만,
                                        // Spring Security OAuth2 클라이언트의 표준 redirect-uri 패턴은
                                        // `spring.security.oauth2.client.registration.{id}.redirect-uri` 입니다.
                                        // 혼동을 피하기 위해 표준 프로퍼티를 사용하거나, 여기서 명시적으로 설정할 수 있습니다.
                                        // 여기서는 우선 application.properties의 값을 신뢰하고 기본 동작에 맡기거나,
                                        // 명시적으로 설정한다면 일치시켜야 합니다.
                                        // 기본 동작에 맡기려면 이 .redirectionEndpoint() 설정도 제거하는 것을 고려해볼 수 있습니다.
                                        // 하지만 현재는 /login/oauth2/code/* 로 되어 있으니 일단 유지합니다.
                                        redirectionEndpointConfig.baseUri("/login/oauth2/code/*")
                                )
                                .userInfoEndpoint(userInfo -> userInfo
                                        .userService(customOAuth2UserService)
                                )
                                .successHandler(oAuth2AuthenticationSuccessHandler)
                        // .failureHandler(oAuth2AuthenticationFailureHandler)
                )
                .exceptionHandling(exceptions -> exceptions
                        // ... (기존 exceptionHandling 설정은 그대로 유지)
                        .authenticationEntryPoint((request, response, authException) -> {
                            String acceptHeader = request.getHeader("Accept");
                            boolean isApiRequest = request.getRequestURI().startsWith("/api/") ||
                                    (acceptHeader != null && acceptHeader.contains("application/json"));

                            if (isApiRequest) {
                                response.setContentType("application/json;charset=UTF-8"); // UTF-8로 수정
                                response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                                response.getWriter().write("{\"error\": \"Unauthorized\", \"message\": \"" + authException.getMessage() + "\"}");
                            } else {
                                // SPA 환경에서는 API와 동일하게 401을 반환하거나, 프론트엔드 로그인 페이지로 리다이렉트
                                response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                                // response.sendRedirect("/frontend-login-path"); // 프론트엔드 로그인 경로
                            }
                        })
                        .accessDeniedHandler((request, response, accessDeniedException) -> {
                            String acceptHeader = request.getHeader("Accept");
                            boolean isApiRequest = request.getRequestURI().startsWith("/api/") ||
                                    (acceptHeader != null && acceptHeader.contains("application/json"));

                            if (isApiRequest) {
                                response.setContentType("application/json;charset=UTF-8");
                                response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                                response.getWriter().write("{\"error\": \"Forbidden\", \"message\": \"" + accessDeniedException.getMessage() + "\"}");
                            } else {
                                response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                                // response.sendRedirect("/error/access-denied");
                            }
                        })
                )
                .addFilterBefore(tokenAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    // CORS 설정 빈 추가
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(Arrays.asList("http://localhost:3000")); // 프론트엔드 출처
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(Arrays.asList("Authorization", "Cache-Control", "Content-Type", "Accept", "Origin", "X-Requested-With")); // 필요한 헤더 추가
        configuration.setExposedHeaders(Arrays.asList("Authorization")); // 클라이언트가 접근할 수 있도록 노출할 헤더
        configuration.setAllowCredentials(true);
        configuration.setMaxAge(3600L); // 1시간

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/api/**", configuration); // /api/** 경로에 적용
        // 필요시 다른 경로에도 적용 가능
        // source.registerCorsConfiguration("/**", configuration); // 모든 경로에 적용 (주의)
        return source;
    }
}