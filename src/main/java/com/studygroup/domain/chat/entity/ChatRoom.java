package com.studygroup.domain.chat.entity;

import com.studygroup.domain.study.entity.StudyGroup;
import com.studygroup.global.common.BaseTimeEntity;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class ChatRoom extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "chat_room_id") // DB 컬럼명은 유지 가능
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "study_group_id", nullable = false)
    private StudyGroup studyGroup;

    @Setter // 채팅방 이름 변경 기능 고려 시
    @Column(nullable = false, length = 100)
    private String name;

    // ChatRoom이 주인이 되도록 mappedBy 설정
    @Builder.Default // Builder 사용 시 기본값 설정
    @OneToMany(mappedBy = "chatRoom", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<ChatRoomMember> members = new ArrayList<>(); // Set -> List 변경 (순서가 중요하진 않지만, 일반적)

    // 메시지는 보통 매우 많으므로, ChatRoom 엔티티에서 직접 컬렉션으로 관리하는 것보다
    // 필요할 때 ChatMessageRepository를 통해 조회하는 것이 더 효율적일 수 있습니다.
    // 여기서는 일단 유지하되, 성능 고려 시 제거 후 ChatMessageRepository에서 chatRoomId로 조회.
    @Builder.Default
    @OneToMany(mappedBy = "chatRoom", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<ChatMessage> messages = new ArrayList<>();

    @Setter
    private String lastMessageContent; // 마지막 메시지 내용

    @Setter
    private LocalDateTime lastMessageAt; // 마지막 메시지 전송 시간

    // Helper method to add members
    public void addMember(ChatRoomMember member) {
        this.members.add(member);
        member.setChatRoomInternal(this); // 연관관계 편의 메소드
    }

    public void removeMember(ChatRoomMember member) {
        this.members.remove(member);
        member.setChatRoomInternal(null);
    }
}
