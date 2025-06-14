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

    // 1. 지도에 표시할 스터디 데이터 불러오기
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

    // 2. 카카오맵 API 로드 및 지도 생성
    useEffect(() => {
        // 데이터 로딩이 끝나고, 컨테이너 div가 준비되었을 때 지도 생성
        if (!loading && mapContainer.current) {
            window.kakao.maps.load(() => {
                const mapOption = {
                    center: new window.kakao.maps.LatLng(37.566826, 126.9786567), // 기본 중심: 서울 시청
                    level: 7, // 초기 줌 레벨
                };
                const map = new window.kakao.maps.Map(mapContainer.current!, mapOption);

                // 3. 마커 클러스터러 생성
                const clusterer = new window.kakao.maps.MarkerClusterer({
                    map: map,
                    averageCenter: true,
                    minLevel: 10,
                    disableClickZoom: true, // 클러스터 클릭 시 줌 대신 커스텀 이벤트 처리
                });

                // 4. 스터디 데이터로 마커 생성
                const markers = studies.map(study => {
                    const position = new window.kakao.maps.LatLng(study.latitude, study.longitude);
                    const marker = new window.kakao.maps.Marker({ position });

                    // 5. 마커에 인포윈도우(말풍선) 추가
                    const infowindow = new window.kakao.maps.InfoWindow({
                        content: `<div style="padding:5px;font-size:12px;text-align:center;">${study.title}</div>`
                    });

                    window.kakao.maps.event.addListener(marker, 'mouseover', () => infowindow.open(map, marker));
                    window.kakao.maps.event.addListener(marker, 'mouseout', () => infowindow.close());
                    window.kakao.maps.event.addListener(marker, 'click', () => navigate(`/studies/${study.id}`));

                    return marker;
                });

                // 6. 클러스터에 마커들 추가
                clusterer.addMarkers(markers);

                // 7. 클러스터 클릭 시, 해당 클러스터에 포함된 스터디 목록을 보여주는 커스텀 오버레이 생성
                window.kakao.maps.event.addListener(clusterer, 'clusterclick', (cluster: any) => {
                    const content = document.createElement('div');
                    content.style.cssText = 'background:white; border:1px solid #ccc; border-radius:5px; padding:10px;';

                    const title = document.createElement('div');
                    title.innerHTML = `<strong>${cluster.getSize()}개 스터디 모여있음</strong>`;
                    title.style.cssText = 'font-size:14px; border-bottom:1px solid #ddd; margin-bottom:5px; padding-bottom:5px;';
                    content.appendChild(title);

                    const list = document.createElement('ul');
                    list.style.cssText = 'list-style:none; margin:0; padding:0;';

                    cluster.getMarkers().slice(0, 5).forEach((marker: any) => { // 최대 5개만 표시
                        const studyInfo = studies.find(s => s.latitude === marker.getPosition().getLat() && s.longitude === marker.getPosition().getLng());
                        if(studyInfo) {
                            const listItem = document.createElement('li');
                            listItem.style.cssText = 'padding: 2px 0;';
                            const link = document.createElement('a');
                            link.href = `/studies/${studyInfo.id}`;
                            link.innerHTML = studyInfo.title;
                            link.onclick = (e) => { e.preventDefault(); navigate(`/studies/${studyInfo.id}`); };
                            listItem.appendChild(link);
                            list.appendChild(listItem);
                        }
                    });
                    content.appendChild(list);

                    const overlay = new window.kakao.maps.CustomOverlay({
                        content: content,
                        position: cluster.getCenter(),
                        map: map
                    });

                    // 오버레이 외부 클릭 시 닫기
                    const closeOverlay = () => overlay.setMap(null);
                    map.addListener('click', closeOverlay);
                    // 클러스터 클릭 시 기존 오버레이가 있으면 닫고 새로 열기 (필요시 구현)
                });

            });
        }
    }, [loading, studies, navigate]);

    if (loading) {
        return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '500px' }}><CircularProgress /></Box>;
    }

    return (
        <Box sx={{ width: '100%', height: { xs: '400px', md: '500px' }, my: 4, borderRadius: 2, overflow: 'hidden', border: '1px solid #ddd' }}>
            {studies.length === 0 ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                    <Typography color="text.secondary">지도에 표시할 스터디가 없습니다.</Typography>
                </Box>
            ) : (
                <div ref={mapContainer} style={{ width: '100%', height: '100%' }} />
            )}
        </Box>
    );
};

export default StudyMap;