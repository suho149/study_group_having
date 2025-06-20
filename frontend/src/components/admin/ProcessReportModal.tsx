import React, { useState } from 'react';
import {
    Dialog, DialogTitle, DialogContent, TextField, DialogActions,
    Button, FormControl, InputLabel, Select, MenuItem, Alert, Typography
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

    const handleStatusChange = (event: SelectChangeEvent) => {
        // e.target.value를 ReportStatus 타입으로 단언하여 setStatus에 전달합니다.
        setStatus(event.target.value as ReportStatus);
    };

    const handleSubmit = async () => {
        if (!report) return;
        try {
            await api.patch(`/api/admin/reports/${report.id}`, { status, adminMemo });
            onSuccess();
            onClose();
        } catch (err: any) {
            setError(err.response?.data?.message || '처리 중 오류 발생');
        }
    };

    if (!report) return null;

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
            <DialogActions>
                <Button onClick={onClose}>취소</Button>
                <Button onClick={handleSubmit}>저장</Button>
            </DialogActions>
        </Dialog>
    );
};

export default ProcessReportModal;