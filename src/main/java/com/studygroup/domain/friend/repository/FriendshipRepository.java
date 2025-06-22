package com.studygroup.domain.friend.repository;

import com.studygroup.domain.friend.entity.Friendship;
import com.studygroup.domain.friend.entity.FriendshipStatus;
import com.studygroup.domain.user.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface FriendshipRepository extends JpaRepository<Friendship, Long> {

    // 두 사용자 간의 관계가 이미 존재하는지 확인 (방향에 상관없이)
    @Query("SELECT f FROM Friendship f WHERE (f.user = :user1 AND f.friend = :user2) OR (f.user = :user2 AND f.friend = :user1)")
    Optional<Friendship> findFriendshipBetween(User user1, User user2);

    // 내가 보낸 친구 신청 목록
    List<Friendship> findByUserAndStatus(User user, FriendshipStatus status);

    // 내가 받은 친구 신청 목록
    List<Friendship> findByFriendAndStatus(User friend, FriendshipStatus status);

    // 나의 모든 친구 목록 (내가 신청했거나, 상대방이 신청해서 수락된 모든 관계)
    @Query("SELECT f FROM Friendship f WHERE (f.user = :user OR f.friend = :user) AND f.status = 'ACCEPTED'")
    List<Friendship> findAllFriends(@Param("user") User user);
}
