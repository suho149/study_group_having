package com.studygroup.domain.dm.repository;

import com.studygroup.domain.dm.entity.DmMessage;
import com.studygroup.domain.dm.entity.DmRoom;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DmMessageRepository extends JpaRepository<DmMessage, Long> {

    // 특정 채팅방의 메시지를 페이징하여 조회 (최신순)
    Page<DmMessage> findByDmRoomOrderByCreatedAtDesc(DmRoom dmRoom, Pageable pageable);
}
