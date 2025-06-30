package com.studygroup.domain.user.service;

import com.studygroup.domain.study.entity.Tag;
import com.studygroup.domain.user.dto.TagInteractionEvent;
import com.studygroup.domain.user.entity.UserTagPreference;
import com.studygroup.domain.user.repository.UserTagPreferenceRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.event.TransactionalEventListener;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserPreferenceService {

    private final UserTagPreferenceRepository userTagPreferenceRepository;

    @Async
    @TransactionalEventListener
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void handleTagInteraction(TagInteractionEvent event) {
        log.info("Handling tag interaction for user: {}, type: {}", event.getUser().getId(), event.getInteractionType());

        if (event.getStudyGroup().getTags().isEmpty()) {
            return; // 태그가 없는 콘텐츠는 처리하지 않음
        }

        for (var studyGroupTag : event.getStudyGroup().getTags()) {
            Tag tag = studyGroupTag.getTag();

            UserTagPreference preference = userTagPreferenceRepository.findByUserAndTag(event.getUser(), tag)
                    .orElseGet(() -> UserTagPreference.builder()
                            .user(event.getUser())
                            .tag(tag)
                            .score(0)
                            .build());

            preference.addScore(event.getInteractionType().getScore());
            userTagPreferenceRepository.save(preference);

            log.info("Updated preference for user: {}, tag: '{}', new score: {}", event.getUser().getId(), tag.getName(), preference.getScore());
        }
    }
}
