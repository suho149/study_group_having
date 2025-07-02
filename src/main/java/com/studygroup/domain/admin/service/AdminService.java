package com.studygroup.domain.admin.service;

import com.studygroup.domain.admin.dto.ReportDetailDto;
import com.studygroup.domain.admin.dto.StatisticsResponseDto;
import com.studygroup.domain.board.entity.BoardComment;
import com.studygroup.domain.board.entity.BoardPost;
import com.studygroup.domain.board.repository.BoardCommentRepository;
import com.studygroup.domain.board.repository.BoardPostRepository;
import com.studygroup.domain.report.dto.ReportProcessDto;
import com.studygroup.domain.report.entity.Report;
import com.studygroup.domain.report.entity.ReportType;
import com.studygroup.domain.report.repository.ReportRepository;
import com.studygroup.domain.study.entity.StudyGroup;
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
            Long parentPostId = null;
            if (report.getReportType() == ReportType.COMMENT) {
                // 댓글 ID로 댓글을 찾고, 그 댓글이 속한 게시글의 ID를 가져옵니다.
                parentPostId = boardCommentRepository.findById(report.getTargetId())
                        .map(comment -> comment.getBoardPost().getId())
                        .orElse(null); // 댓글이 삭제된 경우 null일 수 있음
            }

            return new ReportDetailDto(report, preview, parentPostId);
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
                case STUDY_GROUP:
                    return studyGroupRepository.findById(report.getTargetId())
                            .map(StudyGroup::getTitle)
                            .orElse("삭제된 스터디");
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

    // --- 게시글 블라인드 처리 메소드 추가 ---
    public void blindPost(Long postId) {
        boardPostRepository.blindById(postId);
    }

    // --- 댓글 블라인드 처리 메소드 추가 ---
    public void blindComment(Long commentId) {
        boardCommentRepository.blindById(commentId);
    }

    // --- 스터디 블라인드 처리 메소드 추가 ---
    public void blindStudyGroup(Long studyGroupId) {
        studyGroupRepository.blindById(studyGroupId);
    }
}
