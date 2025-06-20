package com.studygroup.domain.admin.service;

import com.studygroup.domain.admin.dto.ReportDetailDto;
import com.studygroup.domain.admin.dto.StatisticsResponseDto;
import com.studygroup.domain.board.entity.BoardComment;
import com.studygroup.domain.board.entity.BoardPost;
import com.studygroup.domain.board.repository.BoardCommentRepository;
import com.studygroup.domain.board.repository.BoardPostRepository;
import com.studygroup.domain.report.dto.ReportProcessDto;
import com.studygroup.domain.report.entity.Report;
import com.studygroup.domain.report.repository.ReportRepository;
import com.studygroup.domain.study.repository.StudyGroupRepository;
import com.studygroup.domain.study.repository.TagRepository;
import com.studygroup.domain.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AdminService {

    private final ReportRepository reportRepository;
    private final BoardPostRepository boardPostRepository;
    private final BoardCommentRepository boardCommentRepository;
    private final UserRepository userRepository;
    private final StudyGroupRepository studyGroupRepository;
    private final TagRepository tagRepository;

    @Transactional(readOnly = true)
    public Page<ReportDetailDto> getReports(Pageable pageable) {
        Page<Report> reportPage = reportRepository.findAll(pageable);

        return reportPage.map(report -> {
            String preview = getTargetContentPreview(report);
            return new ReportDetailDto(report, preview);
        });
    }

    private String getTargetContentPreview(Report report) {
        try {
            switch (report.getReportType()) {
                case POST:
                    return boardPostRepository.findById(report.getTargetId())
                            .map(BoardPost::getTitle)
                            .orElse("삭제된 게시글");
                case COMMENT:
                    return boardCommentRepository.findById(report.getTargetId())
                            .map(BoardComment::getContent)
                            .orElse("삭제된 댓글");
                // TODO: STUDY_GROUP case
                default:
                    return "알 수 없는 콘텐츠";
            }
        } catch (Exception e) {
            return "콘텐츠 조회 오류";
        }
    }

    public void processReport(Long reportId, ReportProcessDto dto) {
        reportRepository.updateReportStatusAndMemo(
                reportId,
                dto.getStatus(),
                dto.getAdminMemo()
        );
    }

    public void deletePost(Long postId) {
        boardPostRepository.deleteById(postId);
    }

    // TODO: 통계 서비스 로직, 사용자 관리 로직 추가
    public StatisticsResponseDto getDashboardStatistics() {
        long totalUsers = userRepository.count();
        long totalStudies = studyGroupRepository.count();
        long totalPosts = boardPostRepository.count();
        long totalComments = boardCommentRepository.count();

        // 지난 7일간의 가입자 수
        LocalDateTime sevenDaysAgo = LocalDateTime.now().minusDays(7);
        List<StatisticsResponseDto.DailyStat> dailySignups = userRepository.findDailySignups(sevenDaysAgo)
                .stream()
                .map(row -> StatisticsResponseDto.DailyStat.builder()
                        .date((String) row[0])
                        .count((Long) row[1])
                        .build())
                .collect(Collectors.toList());

        // 인기 태그 Top 5
        List<StatisticsResponseDto.TagStat> popularTags = tagRepository.findPopularTags(PageRequest.of(0, 5))
                .stream()
                .map(row -> StatisticsResponseDto.TagStat.builder()
                        .tagName((String) row[0])
                        .count((Long) row[1])
                        .build())
                .collect(Collectors.toList());

        return StatisticsResponseDto.builder()
                .totalUsers(totalUsers)
                .totalStudies(totalStudies)
                .totalPosts(totalPosts)
                .totalComments(totalComments)
                .dailySignups(dailySignups)
                .popularTags(popularTags)
                .build();
    }
}
