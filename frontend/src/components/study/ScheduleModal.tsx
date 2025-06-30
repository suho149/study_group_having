// src/components/study/ScheduleModal.tsx (새 파일)
import React, { useState, useEffect } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Box, CircularProgress, Alert
} from '@mui/material';
import { LocalizationProvider, DateTimePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import api from '../../services/api';
import { CalendarEvent } from '../../types/study';
import { ko } from 'date-fns/locale';

interface ScheduleModalProps {
    open: boolean;
    onClose: () => void;
    studyId: number;
    isLeader: boolean;
    selectedEvent: CalendarEvent | null; // 기존 일정을 클릭했을 때
    selectedDateInfo: any | null; // 새 날짜를 클릭했을 때
    onSave: () => void; // 저장 성공 시 부모 컴포넌트에 알림
}

const ScheduleModal: React.FC<ScheduleModalProps> = ({
                                                         open, onClose, studyId, isLeader, selectedEvent, selectedDateInfo, onSave
                                                     }) => {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [startTime, setStartTime] = useState<Date | null>(null);
    const [endTime, setEndTime] = useState<Date | null>(null);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // 모달이 열리거나 선택된 정보가 바뀔 때, 폼 데이터 초기화
    useEffect(() => {
        if (open) {
            if (selectedEvent) { // 기존 일정 수정
                setTitle(selectedEvent.title);
                setContent(selectedEvent.extendedProps.content || '');
                setStartTime(new Date(selectedEvent.start));
                setEndTime(new Date(selectedEvent.end));
            } else if (selectedDateInfo) { // 새 일정 생성
                setTitle('');
                setContent('');
                // allDay: true이면 시간 정보가 없음. 기본 시간(예: 09:00) 설정
                const startDate = new Date(selectedDateInfo.dateStr || selectedDateInfo.startStr);
                if (selectedDateInfo.allDay) {
                    startDate.setHours(9, 0, 0, 0);
                }
                const endDate = new Date(startDate);
                endDate.setHours(startDate.getHours() + 1); // 기본 1시간짜리 일정

                setStartTime(startDate);
                setEndTime(endDate);
            }
        }
    }, [open, selectedEvent, selectedDateInfo]);

    const handleClose = () => {
        setError(null);
        onClose();
    };

    const validateForm = (): boolean => {
        if (!title.trim()) {
            setError('일정 제목을 입력해주세요.');
            return false;
        }
        if (!startTime || !endTime) {
            setError('시작 시간과 종료 시간을 모두 설정해주세요.');
            return false;
        }
        if (startTime >= endTime) {
            setError('종료 시간은 시작 시간보다 이후여야 합니다.');
            return false;
        }
        return true;
    };

    const handleSubmit = async () => {
        if (!validateForm()) return;

        setIsSubmitting(true);
        setError(null);

        const payload = { title, content, startTime, endTime };

        try {
            if (selectedEvent) { // 수정
                await api.put(`/api/studies/${studyId}/schedules/${selectedEvent.id}`, payload);
            } else { // 생성
                await api.post(`/api/studies/${studyId}/schedules`, payload);
            }
            onSave(); // 부모 컴포넌트(캘린더)에 알려서 이벤트 목록 새로고침
            handleClose();
        } catch (err: any) {
            setError(err.response?.data?.message || '일정 저장에 실패했습니다.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!selectedEvent || !window.confirm("정말로 이 일정을 삭제하시겠습니까?")) return;

        setIsSubmitting(true);
        setError(null);

        try {
            await api.delete(`/api/studies/${studyId}/schedules/${selectedEvent.id}`);
            onSave();
            handleClose();
        } catch (err: any) {
            setError(err.response?.data?.message || '일정 삭제에 실패했습니다.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
            <DialogTitle>{selectedEvent ? '일정 수정/상세' : '새 일정 추가'}</DialogTitle>
            <DialogContent>
                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

                <TextField
                    autoFocus
                    margin="dense"
                    label="일정 제목"
                    fullWidth
                    variant="outlined"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    disabled={!isLeader}
                />
                <TextField
                    margin="dense"
                    label="상세 내용 (선택)"
                    fullWidth
                    multiline
                    rows={4}
                    variant="outlined"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    disabled={!isLeader}
                />

                <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ko}>
                    <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                        <DateTimePicker
                            label="시작 시간"
                            value={startTime}
                            onChange={setStartTime}
                            ampm={false}
                            disabled={!isLeader}
                            slotProps={{
                                textField: {
                                    fullWidth: true,
                                    variant: 'outlined', // 필요시 스타일 지정
                                },
                            }}
                        />
                        <DateTimePicker
                            label="종료 시간"
                            value={endTime}
                            onChange={setEndTime}
                            ampm={false}
                            disabled={!isLeader}
                            slotProps={{
                                textField: {
                                    fullWidth: true,
                                    variant: 'outlined',
                                },
                            }}
                        />
                    </Box>
                </LocalizationProvider>
            </DialogContent>
            <DialogActions sx={{ p: '16px 24px' }}>
                <Button onClick={handleClose}>닫기</Button>
                {isLeader && (
                    <Box>
                        {selectedEvent && (
                            <Button onClick={handleDelete} color="error" disabled={isSubmitting}>
                                삭제
                            </Button>
                        )}
                        <Button onClick={handleSubmit} variant="contained" disabled={isSubmitting}>
                            {isSubmitting ? <CircularProgress size={24} color="inherit" /> : '저장'}
                        </Button>
                    </Box>
                )}
            </DialogActions>
        </Dialog>
    );
};

export default ScheduleModal;