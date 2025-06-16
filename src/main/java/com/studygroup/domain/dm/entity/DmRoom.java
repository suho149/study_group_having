package com.studygroup.domain.dm.entity;

import com.studygroup.domain.user.entity.User;
import com.studygroup.global.common.BaseTimeEntity;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Table(name = "dm_room",
        uniqueConstraints = {
                // 두 사용자 조합에 대해 유니크 제약조건 설정
                @UniqueConstraint(columnNames = {"user1_id", "user2_id"})
        }
)
public class DmRoom extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user1_id", nullable = false)
    private User user1; // ID 값이 더 작은 사용자

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user2_id", nullable = false)
    private User user2; // ID 값이 더 큰 사용자

    // 마지막 메시지 정보 (목록 화면 표시용)
    private String lastMessage;
    private LocalDateTime lastMessageTime;

    @Builder
    public DmRoom(User user1, User user2) {
        // 항상 user1의 ID가 user2의 ID보다 작도록 정렬하여 저장
        if (user1.getId() > user2.getId()) {
            this.user1 = user2;
            this.user2 = user1;
        } else {
            this.user1 = user1;
            this.user2 = user2;
        }
    }

    public void updateLastMessage(String message, LocalDateTime time) {
        this.lastMessage = message;
        this.lastMessageTime = time;
    }
}
