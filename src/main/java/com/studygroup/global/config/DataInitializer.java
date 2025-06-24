package com.studygroup.global.config;

import com.studygroup.domain.user.entity.AuthProvider;
import com.studygroup.domain.user.entity.Role;
import com.studygroup.domain.user.entity.User;
import com.studygroup.domain.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Component
@Profile("dev") // 'dev' 프로필에서만 이 컴포넌트가 활성화됩니다.
@RequiredArgsConstructor
public class DataInitializer implements ApplicationRunner {

    private final UserRepository userRepository;
    private final RedisTemplate<String, String> redisTemplate;

    @Value("${app.admin.email}")
    private String adminEmail;

    @Value("${app.admin.name}")
    private String adminName;

    @Override
    @Transactional
    public void run(ApplicationArguments args) throws Exception {
        log.info("Running Data Initializer for 'dev' profile...");

        // ddl-auto: create 환경에서는 Redis 데이터도 함께 초기화
        log.info("Flushing all data from Redis for 'dev' environment...");
        redisTemplate.getConnectionFactory().getConnection().flushAll();
        log.info("Redis data flushed successfully.");

        // 1. 설정된 이메일로 관리자 계정이 있는지 확인합니다.
        userRepository.findByEmail(adminEmail).ifPresentOrElse(
                // 2-1. 계정이 이미 존재하면, 역할이 ADMIN인지 확인하고 아니라면 ADMIN으로 업데이트합니다.
                user -> {
                    if (user.getRole() != Role.ADMIN) {
                        log.info("Admin user '{}' found, but role is not ADMIN. Updating role to ADMIN.", adminEmail);
                        // User 엔티티에 Role을 변경하는 메소드를 추가해야 합니다.
                        user.updateRole(Role.ADMIN);
                        userRepository.save(user);
                    } else {
                        log.info("Admin user '{}' already exists with ADMIN role.", adminEmail);
                    }
                },
                // 2-2. 계정이 없으면, 새로운 관리자 계정을 생성합니다.
                () -> {
                    log.info("Admin user '{}' not found. Creating a new admin user.", adminEmail);
                    User adminUser = User.builder()
                            .email(adminEmail)
                            .name(adminName)
                            .profile(null) // 기본 프로필 이미지
                            .role(Role.ADMIN) // 역할을 ADMIN으로 설정
                            .provider(AuthProvider.GOOGLE) // 기본 제공자를 GOOGLE로 설정
                            .providerId("dev-admin-user") // 개발용 임시 providerId
                            .point(9999) // 관리자 포인트
                            .level(99)   // 관리자 레벨
                            .build();
                    userRepository.save(adminUser);
                    log.info("New admin user '{}' created successfully.", adminEmail);
                }
        );
    }
}
