package com.studygroup.domain.board.repository;

import com.studygroup.domain.board.entity.BoardCategory;
import com.studygroup.domain.board.entity.BoardPost;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.List;

public class BoardPostSpecification {
    public static Specification<BoardPost> withFilter(String category, String keyword) {
        return (root, query, criteriaBuilder) -> {
            List<Predicate> predicates = new ArrayList<>();

            // --- ★★★ 블라인드되지 않은 게시물만 조회하는 조건 추가 ★★★ ---
            predicates.add(criteriaBuilder.isFalse(root.get("isBlinded")));

            // 카테고리 필터링
            if (StringUtils.hasText(category) && !"ALL".equalsIgnoreCase(category)) {
                try {
                    BoardCategory boardCategory = BoardCategory.valueOf(category.toUpperCase());
                    predicates.add(criteriaBuilder.equal(root.get("category"), boardCategory));
                } catch (IllegalArgumentException e) {
                    // 잘못된 카테고리 값일 경우, 아무것도 반환하지 않도록 처리
                    return criteriaBuilder.disjunction();
                }
            }

            // 키워드 검색
            if (StringUtils.hasText(keyword)) {
                // 제목 또는 내용에서 검색
                Predicate titleLike = criteriaBuilder.like(root.get("title"), "%" + keyword + "%");
                Predicate contentLike = criteriaBuilder.like(root.get("content"), "%" + keyword + "%");
                predicates.add(criteriaBuilder.or(titleLike, contentLike));
            }

            return criteriaBuilder.and(predicates.toArray(new Predicate[0]));
        };
    }
}
