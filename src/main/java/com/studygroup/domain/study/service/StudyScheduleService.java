package com.studygroup.domain.study.service;

import com.studygroup.domain.study.dto.StudyScheduleDto;
import com.studygroup.domain.study.entity.StudyGroup;
import com.studygroup.domain.study.entity.StudySchedule;
import com.studygroup.domain.study.repository.StudyGroupRepository;
import com.studygroup.domain.study.repository.StudyScheduleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class StudyScheduleService {

    private final StudyScheduleRepository studyScheduleRepository;
    private final StudyGroupRepository studyGroupRepository;

    private StudyGroup findStudyGroup(Long studyGroupId) {
        return studyGroupRepository.findById(studyGroupId)
                .orElseThrow(() -> new IllegalArgumentException("Study group not found"));
    }

    private void checkMemberPermission(StudyGroup studyGroup, Long memberId) {
        boolean isMember = studyGroup.getMembers().stream()
                .anyMatch(member -> member.getUser().getId().equals(memberId));
        if (!isMember) {
            throw new IllegalStateException("You are not a member of this study group");
        }
    }

    private void checkLeaderPermission(StudyGroup studyGroup, Long memberId) {
        if (!studyGroup.getLeader().getId().equals(memberId)) {
            throw new IllegalStateException("Only the leader can manage schedules");
        }
    }

    // 스터디의 모든 일정 조회
    public List<StudyScheduleDto.Response> getSchedules(Long studyGroupId, Long memberId) {
        StudyGroup studyGroup = findStudyGroup(studyGroupId);
        checkMemberPermission(studyGroup, memberId); // 멤버만 조회 가능

        return studyScheduleRepository.findByStudyGroup(studyGroup).stream()
                .map(StudyScheduleDto.Response::new)
                .collect(Collectors.toList());
    }

    @Transactional
    public StudyScheduleDto.Response createSchedule(Long studyGroupId, StudyScheduleDto.CreateRequest request, Long leaderId) {
        StudyGroup studyGroup = findStudyGroup(studyGroupId);
        checkLeaderPermission(studyGroup, leaderId); // 리더만 생성 가능

        StudySchedule schedule = StudySchedule.builder()
                .studyGroup(studyGroup)
                .title(request.getTitle())
                .content(request.getContent())
                .startTime(request.getStartTime())
                .endTime(request.getEndTime())
                .build();

        StudySchedule savedSchedule = studyScheduleRepository.save(schedule);
        return new StudyScheduleDto.Response(savedSchedule);
    }

    @Transactional
    public void updateSchedule(Long scheduleId, StudyScheduleDto.UpdateRequest request, Long leaderId) {
        StudySchedule schedule = studyScheduleRepository.findById(scheduleId)
                .orElseThrow(() -> new IllegalArgumentException("Schedule not found"));
        checkLeaderPermission(schedule.getStudyGroup(), leaderId); // 리더만 수정 가능

        schedule.update(request);
    }

    @Transactional
    public void deleteSchedule(Long scheduleId, Long leaderId) {
        StudySchedule schedule = studyScheduleRepository.findById(scheduleId)
                .orElseThrow(() -> new IllegalArgumentException("Schedule not found"));
        checkLeaderPermission(schedule.getStudyGroup(), leaderId); // 리더만 삭제 가능

        studyScheduleRepository.delete(schedule);
    }
}
