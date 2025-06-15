package com.studygroup;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

@EnableAsync // --- 비동기 기능 활성화 어노테이션 추가 ---
@SpringBootApplication
public class StudyGroupApplication {
    public static void main(String[] args) {
        SpringApplication.run(StudyGroupApplication.class, args);
    }
} 