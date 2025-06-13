// src/components/study/StudyCalendar.tsx (새 파일)
import React, { useState, useEffect, useCallback } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { Box, CircularProgress, Typography } from '@mui/material';
import api from '../../services/api';
import { StudySchedule, CalendarEvent } from '../../types/study';
// import ScheduleModal from './ScheduleModal'; // 나중에 만들 모달 컴포넌트

interface StudyCalendarProps {
    studyId: number;
    isLeader: boolean;
}

const StudyCalendar: React.FC<StudyCalendarProps> = ({ studyId, isLeader }) => {
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // TODO: 모달 관련 상태 추가
    // const [modalOpen, setModalOpen] = useState(false);
    // const [selectedDateInfo, setSelectedDateInfo] = useState<any>(null);
    // const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

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
    const handleDateClick = (arg: any) => {
        if (!isLeader) return; // 리더만 일정 추가 가능
        alert(`리더라면 이 날짜(${arg.dateStr})에 새 일정을 등록하는 모달을 열 수 있습니다.`);
        // setSelectedDateInfo(arg);
        // setModalOpen(true);
    };

    // 기존 일정 클릭 핸들러 (상세/수정/삭제 모달 열기)
    const handleEventClick = (arg: any) => {
        alert(`'${arg.event.title}' 일정을 클릭했습니다. 상세/수정/삭제 모달을 엽니다.`);
        // const event = events.find(e => e.id === arg.event.id);
        // if (event) {
        //   setSelectedEvent(event);
        //   setModalOpen(true);
        // }
    };

    // 모달 닫기 핸들러
    const handleCloseModal = () => {
        // setModalOpen(false);
        // setSelectedDateInfo(null);
        // setSelectedEvent(null);
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
                // eventDrop={(info) => handleEventUpdate(info.event)}
                // eventResize={(info) => handleEventUpdate(info.event)}
            />
            {/*
        <ScheduleModal
          open={modalOpen}
          onClose={handleCloseModal}
          studyId={studyId}
          isLeader={isLeader}
          selectedEvent={selectedEvent}
          selectedDateInfo={selectedDateInfo}
          onSave={fetchSchedules} // 저장 성공 시 캘린더 새로고침
        />
      */}
        </Box>
    );
};

export default StudyCalendar;