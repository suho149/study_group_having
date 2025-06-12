package com.studygroup.global.security;

import com.studygroup.domain.user.entity.AuthProvider;
import com.studygroup.domain.user.entity.Role;
import com.studygroup.domain.user.entity.User;
import com.studygroup.domain.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class CustomOAuth2UserService extends DefaultOAuth2UserService {

    private final UserRepository userRepository;

    @Override
    @Transactional
    public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
        OAuth2User oAuth2User = super.loadUser(userRequest);
        
        String email = oAuth2User.getAttribute("email");
        String name = oAuth2User.getAttribute("name");
        String picture = oAuth2User.getAttribute("picture");
        String providerId = oAuth2User.getAttribute("sub"); // Google의 경우 'sub'가 providerId입니다.

        User user = userRepository.findByEmail(email)
                // 프로필을 수정할 때 정보가 덮어씌워 지지 않게 하기 위해서
//                .map(existingUser -> {
//                    existingUser.updateProfile(name, picture);
//                    return existingUser;
//                })
                .orElseGet(() -> userRepository.save(User.builder()
                        .email(email)
                        .name(name)
                        .profile(picture)
                        .provider(AuthProvider.GOOGLE)
                        .providerId(providerId)
                        .role(Role.USER)
                        .build()));

        return UserPrincipal.create(user, oAuth2User.getAttributes());
    }
} 