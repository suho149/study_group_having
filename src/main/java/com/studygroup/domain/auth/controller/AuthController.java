package com.studygroup.domain.auth.controller;

import com.studygroup.domain.auth.dto.TokenRefreshRequest;
import com.studygroup.domain.auth.dto.TokenResponse;
import com.studygroup.domain.auth.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.GetMapping;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/refresh")
    public ResponseEntity<TokenResponse> refresh(@RequestBody TokenRefreshRequest request) {
        TokenResponse tokenResponse = authService.refresh(request.getRefreshToken());
        return ResponseEntity.ok(tokenResponse);
    }

    @GetMapping("/validate")
    public ResponseEntity<Void> validateToken() {
        // SecurityContext에 인증 정보가 있다면 유효한 토큰
        return ResponseEntity.ok().build();
    }
} 