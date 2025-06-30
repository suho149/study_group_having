// src/components/study/StudyCalendar.tsx (새 파일)
import React, { useState, useEffect, useCallback } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin, {EventResizeDoneArg} from '@fullcalendar/interaction';
import { Box, CircularProgress, Typography,
    Dialog, DialogActions, DialogContent, DialogContentText,
    DialogTitle, Button} from '@mui/material';
import api from '../../services/api';
import { StudySchedule, CalendarEvent } from '../../types/study';
import ScheduleModal from './ScheduleModal'; // 나중에 만들 모달 컴포넌트
import { DateClickArg } from '@fullcalendar/interaction';
import {EventApi, EventClickArg, EventDropArg} from '@fullcalendar/core';
import {enqueueSnackbar} from "notistack";
import timeZonePlugin from '@fullcalendar/moment-timezone';

interface StudyCalendarProps {
    studyId: number;
    isLeader: boolean;
}

const StudyCalendar: React.FC<StudyCalendarProps> = ({ studyId, isLeader }) => {
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // TODO: 모달 관련 상태 추가
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedDateInfo, setSelectedDateInfo] = useState<any>(null);
    const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
    const [scheduleModalOpen, setScheduleModalOpen] = useState(false);

    // --- 1. 확인 모달(Dialog)을 위한 상태 추가 ---
    const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
    const [confirmDialogContent, setConfirmDialogContent] = useState({ title: '', message: '' });
    const [onConfirm, setOnConfirm] = useState<() => void>(() => {}); // 확인 시 실행할 함수
    const [onCancel, setOnCancel] = useState<() => void>(() => {}); // 취소 시 실행할 함수

    const fetchSchedules = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await api.get<StudySchedule[]>(`/api/studies/${studyId}/schedules`);
            const calendarEvents = response.data.map((schedule): CalendarEvent => ({
                id: String(schedule.id),
                title: schedule.title,
                start: schedule.startTime,
                end: schedule.endTime,
                extendedProps: {
                    content: schedule.content,
                }
            }));
            setEvents(calendarEvents);
        } catch (err: any) {
            setError(err.response?.data?.message || '일정을 불러오는데 실패했습니다.');
        } finally {
            setLoading(false);
        }
    }, [studyId]);

    useEffect(() => {
        fetchSchedules();
    }, [fetchSchedules]);

    // 날짜 클릭 핸들러 (새 일정 등록 모달 열기)
    const handleDateClick = (arg: DateClickArg) => {
        if (!isLeader) return; // 리더만 일정 추가 가능
        //alert(`리더라면 이 날짜(${arg.dateStr})에 새 일정을 등록하는 모달을 열 수 있습니다.`);
        setSelectedDateInfo(arg);
        setModalOpen(true);
    };

    const handleEventClick = (arg: EventClickArg) => {
        const eventId = arg.event.id;
        const event = events.find(e => e.id === eventId);
        if (event) {
            setSelectedEvent(event);
            setModalOpen(true);
        }
    };

    const handleCloseModal = () => {
        setModalOpen(false);
        // 모달이 닫힐 때 선택 정보를 초기화해야 다음 열릴 때 영향이 없음
        setTimeout(() => {
            setSelectedDateInfo(null);
            setSelectedEvent(null);
        }, 200); // 닫히는 애니메이션 시간 고려
    };

    // 리더가 이벤트를 드래그하거나 크기 조절했을 때 호출될 함수
    const updateScheduleOnServer = async (event: EventApi) => {
        // 이동된 이벤트의 전체 정보를 찾습니다.
        const originalEventData = events.find(e => e.id === event.id);
        if (!originalEventData) {
            // 이 경우는 거의 발생하지 않지만, 방어 코드로 추가
            alert("오류: 원본 일정 데이터를 찾을 수 없습니다.");
            return Promise.reject("Original event not found");
        }

        // API로 전송할 페이로드를 생성합니다.
        // **`event` 객체에서 변경된 start와 end 시간을 사용합니다.**
        const updatedSchedule = {
            title: event.title, // 제목은 그대로 유지
            content: originalEventData.extendedProps.content, // 내용도 그대로 유지
            startTime: event.start, // 변경된 시작 시간 (Date 객체)
            endTime: event.end,     // 변경된 종료 시간 (Date 객체)
        };

        try {
            await api.put(`/api/studies/${studyId}/schedules/${event.id}`, updatedSchedule);
            enqueueSnackbar('일정이 성공적으로 변경되었습니다.', { variant: 'success' });
            // 변경 성공 후, 서버로부터 최신 데이터를 다시 불러와 UI를 완전히 동기화합니다.
            fetchSchedules();
        } catch (err: any) {
            console.error("Failed to update schedule:", err);
            enqueueSnackbar(err.response?.data?.message || '일정 변경에 실패했습니다.', { variant: 'error' });
            // 에러를 전파하여 revert()가 호출되도록 합니다.
            return Promise.reject(err);
        }
    };

    // --- 2. 확인 모달을 열고, 실행할 함수들을 설정하는 헬퍼 함수 ---
    const openConfirmationDialog = (title: string, message: string, onConfirmAction: () => void, onCancelAction: () => void) => {
        setConfirmDialogContent({ title, message });
        setOnConfirm(() => onConfirmAction); // 함수 자체를 상태에 저장
        setOnCancel(() => onCancelAction);
        setConfirmDialogOpen(true);
    };


    // eventDrop 전용 핸들러 (이전과 동일)
    const handleEventDrop = async (dropInfo: EventDropArg) => {
        openConfirmationDialog(
            '일정 이동 확인',
            `'${dropInfo.event.title}' 일정을 이동하시겠습니까?`,
            // '확인'을 눌렀을 때 실행될 함수
            async () => {
                setConfirmDialogOpen(false); // 먼저 모달을 닫고
                try {
                    await updateScheduleOnServer(dropInfo.event);
                } catch (error) {
                    dropInfo.revert(); // API 실패 시 UI 되돌리기
                }
            },
            // '취소'를 눌렀을 때 실행될 함수
            () => {
                setConfirmDialogOpen(false);
                dropInfo.revert(); // UI 되돌리기
            }
        );
    };

    // eventResize 전용 핸들러 (이전과 동일, 또는 제거 가능)
    const handleEventResize = async (resizeInfo: EventResizeDoneArg) => {
        openConfirmationDialog(
            '일정 시간 변경 확인',
            `'${resizeInfo.event.title}' 일정의 시간을 변경하시겠습니까?`,
            async () => {
                setConfirmDialogOpen(false);
                try {
                    await updateScheduleOnServer(resizeInfo.event);
                } catch (error) {
                    resizeInfo.revert();
                }
            },
            () => {
                setConfirmDialogOpen(false);
                resizeInfo.revert();
            }
        );
    };

    if (loading) {
        return <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress /></Box>;
    }

    if (error) {
        return <Typography color="error">{error}</Typography>;
    }

    return (
        <Box sx={{ '.fc-button': { textTransform: 'none' } }}> {/* FullCalendar 버튼 텍스트 소문자화 */}
            <FullCalendar
                plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                // 1. 시간대를 명시적으로 'Asia/Seoul'로 설정
                timeZone='Asia/Seoul'

                // 2. 이벤트의 시간을 표시할 때도 해당 시간대를 기준으로 표시하도록 설정
                eventTimeFormat={{
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true // true: 오전/오후, false: 24시간
                }}
                initialView="dayGridMonth"
                headerToolbar={{
                    left: 'prev,next today',
                    center: 'title',
                    right: 'dayGridMonth,timeGridWeek,timeGridDay'
                }}
                events={events}
                locale="ko" // 한글 설정
                editable={isLeader} // 리더만 드래그로 일정 이동/수정 가능
                selectable={isLeader} // 리더만 날짜 범위 선택 가능
                selectMirror={true}
                dayMaxEvents={true}
                dateClick={handleDateClick}
                eventClick={handleEventClick}
                // TODO: 이벤트 드래그/리사이즈 핸들러 추가
                // --- 이벤트 핸들러 연결 ---
                eventDrop={handleEventDrop}
                eventResize={handleEventResize}
            />
            {/* --- 모달 컴포넌트 렌더링 --- */}
            <ScheduleModal
                open={modalOpen}
                onClose={handleCloseModal}
                studyId={studyId}
                isLeader={isLeader}
                selectedEvent={selectedEvent}
                selectedDateInfo={selectedDateInfo}
                onSave={fetchSchedules} // 저장 성공 시 캘린더 새로고침
            />
            {/* --- 5. 확인 모달(Dialog) JSX 추가 --- */}
            <Dialog
                open={confirmDialogOpen}
                onClose={() => {
                    // 사용자가 모달 바깥을 클릭하거나 ESC를 눌러 닫을 때
                    onCancel(); // 설정된 취소 액션 실행
                    setConfirmDialogOpen(false);
                }}
            >
                <DialogTitle>{confirmDialogContent.title}</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        {confirmDialogContent.message}
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => { onCancel(); setConfirmDialogOpen(false); }}>취소</Button>
                    <Button onClick={() => { onConfirm(); }} variant="contained" autoFocus>
                        확인
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default StudyCalendar;