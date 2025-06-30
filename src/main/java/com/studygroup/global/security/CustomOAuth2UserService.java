package com.studygroup.global.security;

import com.studygroup.domain.user.dto.UserActivityEvent;
import com.studygroup.domain.user.entity.ActivityType;
import com.studygroup.domain.user.entity.AuthProvider;
import com.studygroup.domain.user.entity.Role;
import com.studygroup.domain.user.entity.User;
import com.studygroup.domain.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
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
    private final ApplicationEventPublisher eventPublisher; // 이벤트 발행기 주입

    @Override
    @Transactional
    public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
        OAuth2User oAuth2User = super.loadUser(userRequest);
        
        String email = oAuth2User.getAttribute("email");
        String name = oAuth2User.getAttribute("name");
        String picture = oAuth2User.getAttribute("picture");
        String providerId = oAuth2User.getAttribute("sub"); // Google의 경우 'sub'가 providerId입니다.

        User user = userRepository.findByEmail(email)
                .orElseGet(() -> {
                    // --- 이 orElseGet 블록은 신규 사용자일 때만 실행됩니다. ---
                    log.info("New user detected. Creating user with email: {}", email);

                    // 1. 새로운 User 객체를 생성합니다.
                    User newUser = User.builder()
                            .email(email)
                            .name(name)
                            .profile(picture)
                            .provider(AuthProvider.GOOGLE)
                            .providerId(providerId)
                            .role(Role.USER)
                            .build();

                    // 2. DB에 저장합니다.
                    userRepository.save(newUser);

                    // 3. 저장된 newUser 객체로 회원가입 이벤트를 발행합니다.
                    eventPublisher.publishEvent(new UserActivityEvent(newUser, ActivityType.SIGN_UP));

                    // 4. 생성된 newUser 객체를 반환하여 바깥의 user 변수에 할당합니다.
                    return newUser;
                });

        return UserPrincipal.create(user, oAuth2User.getAttributes());
    }
} 