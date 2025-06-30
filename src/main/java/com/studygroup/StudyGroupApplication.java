package com.studygroup;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;

@EnableAsync // --- 비동기 기능 활성화 어노테이션 추가 ---
@EnableScheduling
@SpringBootApplication
public class StudyGroupApplication {
    public static void main(String[] args) {
        SpringApplication.run(StudyGroupApplication.class, args);
    }
} 