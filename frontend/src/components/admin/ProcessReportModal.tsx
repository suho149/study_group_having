import React, {useEffect, useState} from 'react';
import {
    Dialog, DialogTitle, DialogContent, TextField, DialogActions,
    Button, FormControl, InputLabel, Select, MenuItem, Alert, Typography,
    CircularProgress, Box
} from '@mui/material';
import api from '../../services/api';
import { ReportStatus, ReportDetailDto } from '../../types/report'; // ReportStatus Enum import 확인
import { SelectChangeEvent } from '@mui/material';

interface ProcessReportModalProps {
    open: boolean;
    onClose: () => void;
    report: ReportDetailDto | null;
    onSuccess: () => void; // 처리 성공 후 목록 새로고침을 위한 콜백
}

const ProcessReportModal: React.FC<ProcessReportModalProps> = ({ open, onClose, report, onSuccess }) => {
    const [status, setStatus] = useState<ReportStatus>(report?.status || ReportStatus.RECEIVED);
    const [adminMemo, setAdminMemo] = useState(report?.adminMemo || '');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false); // 처리 중 로딩 상태
    const [isBlinding, setIsBlinding] = useState(false);

    // 모달이 열리거나 대상 report가 변경될 때 상태를 초기화합니다.
    useEffect(() => {
        if (report) {
            setStatus(report.status);
            setAdminMemo(report.adminMemo || '');
        }
    }, [report]);

    const handleStatusChange = (event: SelectChangeEvent) => {
        // e.target.value를 ReportStatus 타입으로 단언하여 setStatus에 전달합니다.
        setStatus(event.target.value as ReportStatus);
    };

    const handleSubmit = async () => {
        if (!report) return;
        setIsSubmitting(true);
        setError('');

        try {
            await api.patch(`/api/admin/reports/${report.id}`, {
                status: status,
                adminMemo: adminMemo
            });

            // 성공 시, 부모 컴포넌트(ReportList)에 알려서 목록을 새로고침합니다.
            onSuccess();
            onClose(); // 모달 닫기
        } catch (err: any) {
            setError(err.response?.data?.message || '신고 처리 중 오류가 발생했습니다.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!report) return null;

    const handleBlindContent = async () => {
        if (!report) return;

        const confirmBlind = window.confirm("정말로 이 콘텐츠를 숨김 처리하시겠습니까? 이 작업은 되돌릴 수 없습니다.");
        if (!confirmBlind) return;

        setIsBlinding(true);
        setError('');
        try {
            const endpoint = `/api/admin/${report.reportType.toLowerCase()}s/${report.targetId}/blind`;
            await api.post(endpoint);
            // 숨김 처리 후, 신고 상태도 '처리완료'로 함께 업데이트
            await api.patch(`/api/admin/reports/${report.id}`, {
                status: 'COMPLETED',
                adminMemo: `${adminMemo}\n(콘텐츠 숨김 처리됨)`
            });
            onSuccess();
            onClose();
        } catch (err: any) {
            setError(err.response?.data?.message || '숨김 처리 중 오류 발생');
        } finally {
            setIsBlinding(false);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
            <DialogTitle>신고 처리 (ID: {report.id})</DialogTitle>
            <DialogContent>
                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                <Typography variant="subtitle1">신고 대상: [{report.reportType}]</Typography>
                <TextField multiline fullWidth margin="dense" label="콘텐츠 미리보기" value={report.targetContentPreview} disabled />
                <TextField multiline fullWidth margin="dense" label="신고 사유" value={report.reason} disabled />

                <FormControl fullWidth margin="normal">
                    <InputLabel>처리 상태</InputLabel>
                    <Select
                        value={status}
                        label="처리 상태"
                        onChange={handleStatusChange} // 분리된 핸들러를 연결
                    >
                        {/* MenuItem의 value를 ReportStatus Enum으로 변경하는 것이 더 좋습니다. */}
                        <MenuItem value={ReportStatus.RECEIVED}>접수됨</MenuItem>
                        <MenuItem value={ReportStatus.IN_PROGRESS}>처리중</MenuItem>
                        <MenuItem value={ReportStatus.COMPLETED}>처리완료</MenuItem>
                    </Select>
                </FormControl>
                <TextField
                    margin="dense" label="관리자 메모" type="text" fullWidth multiline rows={3}
                    value={adminMemo} onChange={(e) => setAdminMemo(e.target.value)}
                />
            </DialogContent>
            <DialogActions sx={{ p: '16px 24px', justifyContent: 'space-between' }}>
                <Button
                    onClick={handleBlindContent}
                    color="error"
                    variant="outlined"
                    disabled={isSubmitting || isBlinding}
                >
                    {isBlinding ? <CircularProgress size={24} /> : '콘텐츠 숨김'}
                </Button>
                <Box>
                    <Button onClick={onClose} disabled={isSubmitting}>취소</Button>
                    <Button onClick={handleSubmit} variant="contained" disabled={isSubmitting}>
                        {isSubmitting ? <CircularProgress size={24} /> : '상태 저장'}
                    </Button>
                </Box>
            </DialogActions>
        </Dialog>
    );
};

export default ProcessReportModal;