package com.studygroup.domain.dm.repository;

import com.studygroup.domain.dm.entity.DmRoom;
import com.studygroup.domain.user.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface DmRoomRepository extends JpaRepository<DmRoom, Long> {

    // 두 사용자 간의 채팅방을 조회 (사용자 ID 순서는 무관)
    @Query("SELECT dr FROM DmRoom dr WHERE (dr.user1 = :userA AND dr.user2 = :userB) OR (dr.user1 = :userB AND dr.user2 = :userA)")
    Optional<DmRoom> findRoomBetweenUsers(@Param("userA") User userA, @Param("userB") User userB);

    // 특정 사용자가 참여하고 있는 모든 채팅방을 조회 (최신 메시지 순)
    List<DmRoom> findByUser1OrUser2OrderByLastMessageTimeDesc(User user1, User user2);
}
