package com.studygroup.domain.user.repository;

import com.studygroup.domain.user.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    
    @Query("SELECT u FROM User u WHERE " +
           "LOWER(u.name) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(u.email) LIKE LOWER(CONCAT('%', :keyword, '%'))")
    List<User> searchUsers(@Param("keyword") String keyword);

    // 일별 가입자 수를 조회하는 쿼리 (지난 7일간)
    @Query(value = "SELECT DATE_FORMAT(u.created_at, '%Y-%m-%d') as date, COUNT(u.id) as count " +
            "FROM users u WHERE u.created_at >= :startDate " +
            "GROUP BY date ORDER BY date ASC", nativeQuery = true)
    List<Object[]> findDailySignups(@Param("startDate") LocalDateTime startDate);

} 