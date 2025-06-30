import React, { useState } from 'react';
import {
    Dialog, DialogTitle, DialogContent, TextField, DialogActions, Button,
    FormControl, RadioGroup, FormControlLabel, Radio, FormLabel, Alert
} from '@mui/material';
import api from '../../services/api';
import { ReportType } from '../../types/report'; // ReportType Enum 정의 필요

interface ReportModalProps {
    open: boolean;
    onClose: () => void;
    reportType: ReportType;
    targetId: number;
}

const ReportModal: React.FC<ReportModalProps> = ({ open, onClose, reportType, targetId }) => {
    const [reason, setReason] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleSubmit = async () => {
        if (!reason) {
            setError('신고 사유를 선택해주세요.');
            return;
        }
        setError('');
        try {
            await api.post('/api/reports', { reportType, targetId, reason });
            setSuccess('신고가 성공적으로 접수되었습니다.');
            setTimeout(() => {
                handleClose();
            }, 1500);
        } catch (err: any) {
            setError(err.response?.data?.message || '신고 접수 중 오류가 발생했습니다.');
        }
    };

    const handleClose = () => {
        setReason('');
        setError('');
        setSuccess('');
        onClose();
    };

    return (
        <Dialog open={open} onClose={handleClose}>
            <DialogTitle>신고하기</DialogTitle>
            <DialogContent>
                {error && <Alert severity="error">{error}</Alert>}
                {success && <Alert severity="success">{success}</Alert>}
                <FormControl component="fieldset" sx={{ mt: 2 }}>
                    <FormLabel component="legend">신고 사유</FormLabel>
                    <RadioGroup value={reason} onChange={(e) => setReason(e.target.value)}>
                        <FormControlLabel value="SPAM" control={<Radio />} label="스팸/홍보성 콘텐츠" />
                        <FormControlLabel value="ABUSE" control={<Radio />} label="욕설/비방" />
                        <FormControlLabel value="PORNOGRAPHY" control={<Radio />} label="음란물" />
                        <FormControlLabel value="ILLEGAL" control={<Radio />} label="불법 정보" />
                        <FormControlLabel value="OTHER" control={<Radio />} label="기타" />
                    </RadioGroup>
                </FormControl>
                {reason === 'OTHER' && (
                    <TextField
                        autoFocus
                        margin="dense"
                        label="기타 사유를 입력해주세요."
                        type="text"
                        fullWidth
                        variant="standard"
                        onChange={(e) => setReason(e.target.value)}
                    />
                )}
            </DialogContent>
            <DialogActions>
                <Button onClick={handleClose}>취소</Button>
                <Button onClick={handleSubmit}>신고</Button>
            </DialogActions>
        </Dialog>
    );
};

export default ReportModal;