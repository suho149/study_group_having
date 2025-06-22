package com.studygroup.domain.friend.entity;

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
@Table(
        name = "friendship",
        uniqueConstraints = {
                // 두 사용자 간에는 하나의 관계만 존재하도록 유니크 제약 설정
                @UniqueConstraint(columnNames = {"user_id", "friend_id"})
        }
)
public class Friendship extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // 요청을 보낸 사용자 (신청자)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    // 요청을 받은 사용자 (피신청자)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "friend_id", nullable = false)
    private User friend;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private FriendshipStatus status;

    @Builder
    public Friendship(User user, User friend) {
        this.user = user;
        this.friend = friend;
        this.status = FriendshipStatus.PENDING; // 생성 시 기본 상태는 PENDING
    }

    public void accept() {
        this.status = FriendshipStatus.ACCEPTED;
    }

    // 거절은 보통 해당 row를 삭제하거나, REJECTED 상태로 잠시 두었다가 지웁니다.
    // 여기서는 일단 상태 변경만 구현
    public void reject() {
        this.status = FriendshipStatus.REJECTED;
    }
}
