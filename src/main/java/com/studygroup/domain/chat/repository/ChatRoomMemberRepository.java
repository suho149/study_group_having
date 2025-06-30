package com.studygroup.domain.chat.repository;

import com.studygroup.domain.chat.entity.ChatRoom;
import com.studygroup.domain.chat.entity.ChatRoomMember;
import com.studygroup.domain.chat.entity.ChatRoomMemberStatus;
import com.studygroup.domain.user.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ChatRoomMemberRepository extends JpaRepository<ChatRoomMember, Long> {

    Optional<ChatRoomMember> findByChatRoomAndUser(ChatRoom chatRoom, User user);

    List<ChatRoomMember> findByChatRoom(ChatRoom chatRoom);

    List<ChatRoomMember> findByUserAndStatus(User user, ChatRoomMemberStatus status); // 특정 유저의 특정 상태 채팅방 멤버 정보
}
