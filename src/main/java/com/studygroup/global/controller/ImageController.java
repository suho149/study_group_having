package com.studygroup.global.controller;

import com.studygroup.global.service.FileStorageService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@RestController
@RequestMapping("/api/images")
@RequiredArgsConstructor
public class ImageController {

    private final FileStorageService fileStorageService;

    @PostMapping("/upload")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Map<String, String>> uploadImage(@RequestParam("image") MultipartFile image) {
        // TOAST UI Editor는 'image'라는 이름으로 파일을 보냅니다.
        String fileName = fileStorageService.storeFile(image);
        String fileUrl = fileStorageService.getFileUrl(fileName);

        // TOAST UI Editor는 응답으로 { "url": "http://.../image.jpg" } 형태의 JSON을 기대합니다.
        // 하지만 더 범용적으로 사용하기 위해 url과 fileName을 모두 반환해줄 수 있습니다.
        // 여기서는 url만 반환하는 간단한 맵을 사용합니다.
        Map<String, String> response = Map.of("url", fileUrl);

        return ResponseEntity.ok(response);
    }
}
