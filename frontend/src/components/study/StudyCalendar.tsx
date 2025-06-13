// src/components/study/StudyCalendar.tsx (새 파일)
import React, { useState, useEffect, useCallback } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { Box, CircularProgress, Typography } from '@mui/material';
import api from '../../services/api';
import { StudySchedule, CalendarEvent } from '../../types/study';
import ScheduleModal from './ScheduleModal'; // 나중에 만들 모달 컴포넌트
import { DateClickArg } from '@fullcalendar/interaction';
import { EventClickArg } from '@fullcalendar/core';

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

    // 리더가 이벤트를 드래그하거나 크기 조절했을 때 호출될 함수 (선택적 구현)
    const handleEventUpdate = async (eventInfo: any) => {
        // eventInfo.event.id, .start, .end 등을 사용하여 API 호출
        // await api.put(`/api/studies/${studyId}/schedules/${eventInfo.event.id}`, ...);
        // 성공 후 fetchSchedules() 호출
        alert('일정 시간이 변경되었습니다! (실제 API 연동 필요)');
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
                eventDrop={(info) => handleEventUpdate(info.event)}
                eventResize={(info) => handleEventUpdate(info.event)}
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
        </Box>
    );
};

export default StudyCalendar;