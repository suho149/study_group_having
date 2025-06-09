package com.studygroup.domain.board.service;

import com.studygroup.domain.board.dto.BoardPostCreateRequest;
import com.studygroup.domain.board.dto.BoardPostResponse;
import com.studygroup.domain.board.dto.BoardPostSummaryResponse;
import com.studygroup.domain.board.entity.BoardPost;
import com.studygroup.domain.board.repository.BoardPostRepository;
import com.studygroup.domain.user.entity.User;
import com.studygroup.domain.user.repository.UserRepository;
import com.studygroup.global.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
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

    @Transactional(readOnly = true)
    public Page<BoardPostSummaryResponse> getBoardPosts(
            String categoryString, String keyword, Pageable pageable, UserPrincipal currentUserPrincipal) {

        // TODO: BoardPostRepository에 category, keyword를 사용하여 검색하고 페이징하는 메소드 구현
        // 예: boardPostRepository.findAllWithFilters(category, keyword, pageable);
        // 이 메소드는 Page<BoardPost>를 반환해야 함.
        // 여기서는 임시로 findAll 사용 (실제로는 필터링된 조회 필요)
        Page<BoardPost> postsPage = boardPostRepository.findAll(pageable); // <--- 실제로는 필터링된 조회로 변경해야 함

        // User currentUser = null;
        // if (currentUserPrincipal != null) {
        //     currentUser = userRepository.findById(currentUserPrincipal.getId()).orElse(null);
        // }
        // User finalCurrentUser = currentUser;

        // 각 BoardPost를 BoardPostSummaryResponse로 변환
        return postsPage.map(post -> {
            // boolean isLiked = false;
            // int commentCount = post.getComments() != null ? post.getComments().size() : 0; // 댓글 엔티티 추가 후
            // if (finalCurrentUser != null) {
            //    // isLiked = postLikeRepository.existsByUserAndBoardPost(finalCurrentUser, post); // PostLike 기능 추가 시
            // }
            // BoardPostSummaryResponse.from(post, isLiked, commentCount) 와 같이 변환
            return BoardPostSummaryResponse.from(post); // 임시: BoardPostSummaryResponse.from 수정 필요
        });
    }

    // TODO: 게시글 목록 조회, 상세 조회, 수정, 삭제, 추천/비추천, 댓글 관련 서비스 메소드 추가
}
