package com.studygroup.global.jwt;

import com.studygroup.domain.user.entity.User;
import com.studygroup.global.security.UserPrincipal;
import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.stereotype.Component;

import java.security.Key;
import java.util.Base64;
import java.util.Collection;
import java.util.Collections;
import java.util.Date;
import java.util.stream.Collectors;

@Slf4j
@Component
public class TokenProvider {

    private final Key key;
    private final long tokenValidityInMilliseconds;
    private final long refreshTokenValidityInMilliseconds;

    public TokenProvider(
            @Value("${jwt.secret}") String secret,
            @Value("${jwt.access-token-validity}") long tokenValidityInMilliseconds,
            @Value("${jwt.refresh-token-validity}") long refreshTokenValidityInMilliseconds) {
        byte[] keyBytes = Base64.getDecoder().decode(secret);
        this.key = Keys.hmacShaKeyFor(keyBytes);
        this.tokenValidityInMilliseconds = tokenValidityInMilliseconds;
        this.refreshTokenValidityInMilliseconds = refreshTokenValidityInMilliseconds;
    }

    public String createToken(Authentication authentication) {
        UserPrincipal userPrincipal = (UserPrincipal) authentication.getPrincipal();
        Date now = new Date();
        Date validity = new Date(now.getTime() + this.tokenValidityInMilliseconds);

        log.debug("토큰 생성: userId={}, email={}", userPrincipal.getId(), userPrincipal.getEmail());

        // 1. Authentication 객체로부터 권한 목록을 가져옵니다.
        String authorities = authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .collect(Collectors.joining(",")); // "ROLE_ADMIN,ROLE_USER" 와 같이 콤마로 구분된 문자열로 변환

        return Jwts.builder()
                .setSubject(userPrincipal.getId().toString())
                .claim("email", userPrincipal.getEmail())
                // 2. 하드코딩된 문자열 대신, 위에서 동적으로 생성한 authorities 문자열을 클레임에 추가합니다.
                .claim("authorities", authorities)
                .setIssuedAt(now)
                .setExpiration(validity)
                .signWith(key, SignatureAlgorithm.HS512)
                .compact();
    }

    public String createRefreshToken(Authentication authentication) {
        Date now = new Date();
        Date validity = new Date(now.getTime() + this.refreshTokenValidityInMilliseconds);

        UserPrincipal userPrincipal = (UserPrincipal) authentication.getPrincipal();

        return Jwts.builder()
                .setSubject(userPrincipal.getId().toString())
                .setIssuedAt(now)
                .setExpiration(validity)
                .signWith(key, SignatureAlgorithm.HS512)
                .compact();
    }

    public UserPrincipal getPrincipalFromToken(String token) {
        Claims claims = Jwts.parserBuilder()
                .setSigningKey(key)
                .build()
                .parseClaimsJws(token)
                .getBody();

        Long userId = Long.parseLong(claims.getSubject());
        String email = claims.get("email", String.class);

        // 콤마로 구분된 권한 문자열을 다시 GrantedAuthority 컬렉션으로 변환
        String[] authoritiesStrings = claims.get("authorities", String.class).split(",");
        Collection<? extends GrantedAuthority> authorities =
                java.util.Arrays.stream(authoritiesStrings)
                        .map(SimpleGrantedAuthority::new)
                        .collect(Collectors.toList());

        User user = User.builder()
                .id(userId)
                .email(email)
                // User 엔티티에는 대표 권한 하나만 설정하거나, authorities 필드를 추가할 수 있음
                // 여기서는 UserPrincipal 생성에만 사용하므로 User 엔티티 수정은 불필요
                .build();

        // 수정된 UserPrincipal 생성자 또는 메소드가 필요할 수 있습니다.
        // 현재 UserPrincipal은 authorities를 외부에서 받지 않으므로, 생성 로직 수정이 필요합니다.
        // 가장 간단한 방법은 UserPrincipal 내부에서 authorities를 설정하는 것입니다.
        return UserPrincipal.create(user, authorities); // 이와 같이 authorities를 전달하는 create 메소드 필요
    }

    public boolean validateToken(String token) {
        try {
            Jwts.parserBuilder().setSigningKey(key).build().parseClaimsJws(token);
            return true;
        } catch (io.jsonwebtoken.security.SecurityException | MalformedJwtException e) {
            log.error("잘못된 JWT 서명입니다.");
        } catch (ExpiredJwtException e) {
            log.error("만료된 JWT 토큰입니다.");
        } catch (UnsupportedJwtException e) {
            log.error("지원되지 않는 JWT 토큰입니다.");
        } catch (IllegalArgumentException e) {
            log.error("JWT 토큰이 잘못되었습니다.");
        }
        return false;
    }
}