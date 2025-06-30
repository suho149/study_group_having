package com.studygroup.domain.dm.entity;

import com.studygroup.domain.user.entity.User;
import com.studygroup.global.common.BaseTimeEntity;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Table(name = "dm_message")
public class DmMessage extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "dm_room_id", nullable = false)
    private DmRoom dmRoom;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sender_id", nullable = false)
    private User sender;

    @Lob
    @Column(nullable = false)
    private String content;

    @Column(nullable = false)
    private boolean isRead = false; // 상대방이 읽었는지 여부

    @Builder
    public DmMessage(DmRoom dmRoom, User sender, String content) {
        this.dmRoom = dmRoom;
        this.sender = sender;
        this.content = content;
    }

    public void markAsRead() {
        this.isRead = true;
    }
}
