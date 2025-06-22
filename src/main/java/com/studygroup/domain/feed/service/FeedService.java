package com.studygroup.domain.feed.service;

import com.studygroup.domain.board.entity.BoardPost;
import com.studygroup.domain.board.repository.BoardPostRepository;
import com.studygroup.domain.feed.entity.Feed;
import com.studygroup.domain.feed.repository.FeedRepository;
import com.studygroup.domain.friend.repository.FriendshipRepository;
import com.studygroup.domain.study.entity.StudyGroup;
import com.studygroup.domain.study.repository.StudyGroupRepository;
import com.studygroup.domain.user.dto.UserActivityEvent;
import com.studygroup.domain.user.entity.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.event.TransactionalEventListener;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class FeedService {

    private final FeedRepository feedRepository;
    private final FriendshipRepository friendshipRepository;
    private final StudyGroupRepository studyGroupRepository;
    private final BoardPostRepository boardPostRepository;

    @Async
    @TransactionalEventListener
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void createFeedsForFriends(UserActivityEvent event) {
        User actor = event.getUser();

        // 1. 활동을 일으킨 사용자의 친구 목록을 가져옵니다.
        List<User> friends = friendshipRepository.findAllFriends(actor)
                .stream()
                .map(friendship -> friendship.getUser().getId().equals(actor.getId()) ?
                        friendship.getFriend() : friendship.getUser())
                .collect(Collectors.toList());

        if (friends.isEmpty()) {
            return; // 친구가 없으면 피드를 생성할 필요 없음
        }

        // 2. 활동 타입에 따라 피드 내용을 결정합니다.
        Long referenceId = null;
        String referenceContent = null;

        switch (event.getActivityType()) {
            case CREATE_STUDY:
                StudyGroup createdStudy = studyGroupRepository.findById(event.getReferenceId()).orElse(null);
                if (createdStudy != null) {
                    referenceId = createdStudy.getId();
                    referenceContent = createdStudy.getTitle();
                }
                break;
            case CREATE_POST:
                BoardPost createdPost = boardPostRepository.findById(event.getReferenceId()).orElse(null);
                if (createdPost != null) {
                    referenceId = createdPost.getId();
                    referenceContent = createdPost.getTitle();
                }
                break;
            default:
                // 다른 활동 타입(댓글, 좋아요 등)은 피드를 생성하지 않으려면 여기서 종료
                return;
        }

        if (referenceId == null) return; // 관련 콘텐츠 정보가 없으면 피드 생성 중단

        // 3. 각 친구에 대해 피드 엔티티를 생성하고 저장합니다.
        for (User friend : friends) {
            Feed feed = Feed.builder()
                    .owner(friend) // 피드의 주인은 친구
                    .actor(actor)  // 활동의 주체는 '나'
                    .activityType(event.getActivityType())
                    .referenceId(referenceId)
                    .referenceContent(referenceContent)
                    .build();
            feedRepository.save(feed);
        }

        log.info("Created {} feeds for friends of user {}", friends.size(), actor.getId());
    }
}
