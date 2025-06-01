package com.studygroup.domain.user.service;

import com.studygroup.domain.user.dto.UserSearchResponse;
import com.studygroup.domain.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class UserService {

    private final UserRepository userRepository;

    public List<UserSearchResponse> searchUsers(String keyword) {
        return userRepository.searchUsers(keyword)
                .stream()
                .map(UserSearchResponse::from)
                .collect(Collectors.toList());
    }
} 