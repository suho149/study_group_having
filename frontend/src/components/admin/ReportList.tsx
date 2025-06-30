import React, { useState, useEffect } from 'react';
import {
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
    TablePagination, CircularProgress, Alert, Chip, Button, Box, Link
} from '@mui/material';
import api from '../../services/api';
import { ReportDetailDto } from '../../types/report'; // 타입 정의 필요
import ProcessReportModal from './ProcessReportModal'; // 방금 만든 모달 import
import { Link as RouterLink } from 'react-router-dom';

const ReportList: React.FC = () => {
    const [reports, setReports] = useState<ReportDetailDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [totalElements, setTotalElements] = useState(0);

    // 모달 관련 state
    const [selectedReport, setSelectedReport] = useState<ReportDetailDto | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const fetchReports = () => {
        setLoading(true);
        api.get('/api/admin/reports', {
            params: { page, size: rowsPerPage, sort: 'createdAt,desc' }
        }).then(response => {
            setReports(response.data.content);
            setTotalElements(response.data.totalElements);
        }).catch(error => {
            console.error("Failed to fetch reports:", error);
        }).finally(() => {
            setLoading(false);
        });
    };

    useEffect(() => {
        fetchReports();
    }, [page, rowsPerPage]);

    const handleChangePage = (event: unknown, newPage: number) => setPage(newPage);
    const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const handleOpenModal = (report: ReportDetailDto) => {
        setSelectedReport(report);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setSelectedReport(null);
        setIsModalOpen(false);
    };

    // 신고 대상 콘텐츠로 이동하는 링크 생성 함수
    const getTargetLink = (report: ReportDetailDto) => {
        switch (report.reportType) {
            case 'POST':
                return `/board/post/${report.targetId}`;
            case 'COMMENT':
                // 댓글은 해당 게시글로 이동
                // 이 기능을 완벽하게 하려면 백엔드에서 게시글 ID도 함께 내려줘야 함
                return `/board/post/${report.targetId}`; // 임시로 targetId가 게시글 ID라고 가정
            case 'STUDY_GROUP':
                return `/studies/${report.targetId}`;
            default:
                return '#';
        }
    };

    return (
        <Paper sx={{ width: '100%', mb: 2 }}>
            {loading && <Box sx={{display: 'flex', justifyContent: 'center', p:2}}><CircularProgress /></Box>}
            <TableContainer>
                <Table size="small">
                    <TableHead>
                        <TableRow>
                            <TableCell>ID</TableCell>
                            <TableCell>유형</TableCell>
                            <TableCell>콘텐츠 미리보기</TableCell>
                            <TableCell>신고자</TableCell>
                            <TableCell>피신고자</TableCell>
                            <TableCell>사유</TableCell>
                            <TableCell>상태</TableCell>
                            <TableCell>신고일</TableCell>
                            <TableCell>처리</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {reports.map((report) => (
                            <TableRow key={report.id}>
                                <TableCell>{report.id}</TableCell>
                                <TableCell>{report.reportType}</TableCell>
                                <TableCell>
                                    <Link component={RouterLink} to={getTargetLink(report)} target="_blank">
                                        "{report.targetContentPreview}"
                                    </Link>
                                </TableCell>
                                <TableCell>{report.reporterName}</TableCell>
                                <TableCell>{report.reportedUserName || '-'}</TableCell>
                                <TableCell>{report.reason}</TableCell>
                                <TableCell>
                                    <Chip label={report.status} size="small"
                                          color={report.status === 'COMPLETED' ? 'success' : report.status === 'IN_PROGRESS' ? 'warning' : 'default'}/>
                                </TableCell>
                                <TableCell>{new Date(report.createdAt).toLocaleDateString()}</TableCell>
                                <TableCell>
                                    <Button size="small" variant="outlined" onClick={() => handleOpenModal(report)}>
                                        처리
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
            <TablePagination
                rowsPerPageOptions={[5, 10, 25]}
                component="div"
                count={totalElements}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
            />

            {/* 처리 모달 */}
            <ProcessReportModal
                open={isModalOpen}
                onClose={handleCloseModal}
                report={selectedReport}
                onSuccess={fetchReports} // 성공 시 목록 새로고침
            />
        </Paper>
    );
};

export default ReportList;