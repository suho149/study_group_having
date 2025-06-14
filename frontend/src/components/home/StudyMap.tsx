// src/components/home/StudyMap.tsx (새 파일)
import React, { useEffect, useState, useRef } from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';
import api from '../../services/api';
import { StudyForMap } from '../../types/study';
import { useNavigate } from 'react-router-dom';

// Kakao Maps API 타입을 위한 전역 선언
declare global {
    interface Window {
        kakao: any;
    }
}

const StudyMap: React.FC = () => {
    const mapContainer = useRef<HTMLDivElement>(null);
    const [studies, setStudies] = useState<StudyForMap[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchStudiesForMap = async () => {
            try {
                const response = await api.get<StudyForMap[]>('/api/studies/map');
                setStudies(response.data);
            } catch (error) {
                console.error("Failed to fetch studies for map", error);
            } finally {
                setLoading(false);
            }
        };

        fetchStudiesForMap();
    }, []);

    useEffect(() => {
        if (loading || !mapContainer.current || !window.kakao || studies.length === 0) {
            return;
        }

        const mapOption = {
            center: new window.kakao.maps.LatLng(37.566826, 126.9786567), // 기본 중심: 서울 시청
            level: 7,
        };
        const map = new window.kakao.maps.Map(mapContainer.current, mapOption);

        // 마커 클러스터러 생성
        const clusterer = new window.kakao.maps.MarkerClusterer({
            map: map,
            averageCenter: true,
            minLevel: 10,
        });

        // 마커들을 생성
        const markers = studies.map(study => {
            const position = new window.kakao.maps.LatLng(study.latitude, study.longitude);
            const marker = new window.kakao.maps.Marker({ position });

            // 커스텀 오버레이 (말풍선) 생성
            const content = `
        <div style="padding:5px; background:white; border:1px solid #ccc; border-radius:5px; font-size:12px; text-align:center;">
          <strong style="display:block; margin-bottom:3px;">${study.title}</strong>
          <a href="/studies/${study.id}" style="color:blue; text-decoration:none;">상세보기</a>
        </div>
      `;
            const overlay = new window.kakao.maps.CustomOverlay({
                content: content,
                position: marker.getPosition(),
                yAnchor: 1.5
            });
            overlay.setMap(null); // 처음에는 숨김

            // 마커에 마우스오버/아웃 이벤트 등록
            window.kakao.maps.event.addListener(marker, 'mouseover', () => overlay.setMap(map));
            window.kakao.maps.event.addListener(marker, 'mouseout', () => overlay.setMap(null));

            // 마커 클릭 시 상세 페이지로 이동 (a 태그가 있으므로 필수 아님)
            window.kakao.maps.event.addListener(marker, 'click', () => navigate(`/studies/${study.id}`));

            return marker;
        });

        // 클러스터러에 마커들을 추가
        clusterer.addMarkers(markers);

    }, [loading, studies, navigate]);

    if (loading) {
        return <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress /></Box>;
    }

    return (
        <Box sx={{ width: '100%', height: '500px', my: 4, borderRadius: 2, overflow: 'hidden' }}>
            <div ref={mapContainer} style={{ width: '100%', height: '100%' }} />
        </Box>
    );
};

export default StudyMap;