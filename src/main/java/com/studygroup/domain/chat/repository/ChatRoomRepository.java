package com.studygroup.domain.chat.repository;

import com.studygroup.domain.chat.entity.ChatRoom;
import com.studygroup.domain.study.entity.StudyGroup;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ChatRoomRepository extends JpaRepository<ChatRoom, Long> {

    List<ChatRoom> findByStudyGroup(StudyGroup studyGroup);
    // 사용자가 참여하고 있는 채팅방 목록 조회 (ChatRoomMember를 통해 JOIN)
    // @Query("SELECT cr FROM ChatRoom cr JOIN cr.members crm WHERE crm.user.id = :userId AND crm.status = 'JOINED'")
    // List<ChatRoom> findJoinedChatRoomsByUserId(@Param("userId") Long userId);
}
