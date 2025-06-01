package com.studygroup.domain.user.controller;

import com.studygroup.domain.user.dto.UserSearchResponse;
import com.studygroup.domain.user.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping("/search")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<UserSearchResponse>> searchUsers(@RequestParam String keyword) {
        List<UserSearchResponse> users = userService.searchUsers(keyword);
        return ResponseEntity.ok(users);
    }
} 