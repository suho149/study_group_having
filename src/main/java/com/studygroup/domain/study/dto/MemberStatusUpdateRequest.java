package com.studygroup.domain.study.dto;

import com.studygroup.domain.study.entity.StudyMemberStatus;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter // RequestBody 매핑을 위해 Setter 또는 모든 필드 생성자 필요
@NoArgsConstructor
public class MemberStatusUpdateRequest {
    @NotNull
    private StudyMemberStatus status; // 프론트에서 "APPROVED" 또는 "REJECTED" 문자열로 올 것임
}
