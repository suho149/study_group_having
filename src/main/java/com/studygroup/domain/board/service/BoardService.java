package com.studygroup.domain.board.service;

import com.studygroup.domain.board.dto.BoardPostCreateRequest;
import com.studygroup.domain.board.dto.BoardPostResponse;
import com.studygroup.domain.board.entity.BoardPost;
import com.studygroup.domain.board.repository.BoardPostRepository;
import com.studygroup.domain.user.entity.User;
import com.studygroup.domain.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class BoardService {

    private final BoardPostRepository boardPostRepository;
    private final UserRepository userRepository;

    public BoardPostResponse createPost(BoardPostCreateRequest request, Long authorId) {
        User author = userRepository.findById(authorId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다. ID: " + authorId));

        BoardPost post = BoardPost.builder()
                .title(request.getTitle())
                .content(request.getContent())
                .category(request.getCategory())
                .author(author)
                .build();
        // viewCount, likeCount 등은 기본값 0으로 설정됨

        BoardPost savedPost = boardPostRepository.save(post);
        log.info("새 게시글 생성 완료: postId={}, authorId={}", savedPost.getId(), authorId);
        return BoardPostResponse.from(savedPost);
    }

    // TODO: 게시글 목록 조회, 상세 조회, 수정, 삭제, 추천/비추천, 댓글 관련 서비스 메소드 추가
}
