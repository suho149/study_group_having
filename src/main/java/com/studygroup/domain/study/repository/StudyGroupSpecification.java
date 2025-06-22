package com.studygroup.domain.study.repository;

import com.studygroup.domain.study.entity.StudyCategory;
import com.studygroup.domain.study.entity.StudyGroup;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.List;

public class StudyGroupSpecification {
    public static Specification<StudyGroup> withFilter(String keyword, StudyCategory category) {
        return (root, query, criteriaBuilder) -> {
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(criteriaBuilder.isFalse(root.get("isBlinded")));

            // 키워드 검색
            if (StringUtils.hasText(keyword)) {
                predicates.add(criteriaBuilder.or(
                        criteriaBuilder.like(root.get("title"), "%" + keyword + "%"),
                        criteriaBuilder.like(root.get("description"), "%" + keyword + "%")
                ));
            }

            // 카테고리 필터링
            if (category != null) {
                predicates.add(criteriaBuilder.equal(root.get("category"), category));
            }

            return criteriaBuilder.and(predicates.toArray(new Predicate[0]));
        };
    }
}
