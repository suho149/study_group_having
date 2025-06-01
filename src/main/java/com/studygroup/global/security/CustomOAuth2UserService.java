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

@Slf4j
@Service
@RequiredArgsConstructor
public class CustomOAuth2UserService extends DefaultOAuth2UserService {

    private final UserRepository userRepository;

    @Override
    public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
        OAuth2User oAuth2User = super.loadUser(userRequest);
        
        String email = oAuth2User.getAttribute("email");
        String name = oAuth2User.getAttribute("name");
        String profile = oAuth2User.getAttribute("picture");

        log.debug("OAuth2 사용자 정보 로드: email={}, name={}, attributes={}", 
            email, name, oAuth2User.getAttributes());
        
        if (email == null || email.isEmpty()) {
            log.error("OAuth2 사용자 이메일이 없습니다: attributes={}", oAuth2User.getAttributes());
            throw new OAuth2AuthenticationException("Email not found from OAuth2 provider");
        }
        
        User user = userRepository.findByEmail(email)
                .map(entity -> entity.update(name, profile))
                .orElseGet(() -> createUser(email, name, profile));
                
        user = userRepository.save(user);
        
        if (user.getId() == null) {
            log.error("사용자 ID가 null입니다: email={}", email);
            throw new OAuth2AuthenticationException("User ID is null after save");
        }

        log.debug("사용자 정보 저장/업데이트 완료: id={}, email={}", user.getId(), user.getEmail());
        
        return new UserPrincipal(user, oAuth2User.getAttributes());
    }
    
    private User createUser(String email, String name, String profile) {
        return User.builder()
                .email(email)
                .name(name)
                .profile(profile)
                .role(Role.USER)
                .provider(AuthProvider.GOOGLE)
                .build();
    }
} 