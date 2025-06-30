package com.studygroup.domain.chat.repository;

import com.studygroup.domain.chat.entity.ChatMessage;
import com.studygroup.domain.chat.entity.ChatRoom;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {

    // 특정 채팅방의 메시지 목록 페이징 조회 (최신순)
    Page<ChatMessage> findByChatRoomOrderByCreatedAtDesc(ChatRoom chatRoom, Pageable pageable);

    List<ChatMessage> findByChatRoomIdOrderByCreatedAtAsc(Long chatRoomId); // 테스트용 또는 특정 상황
}
