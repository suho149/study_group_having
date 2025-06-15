// src/components/home/StudyMap.tsx (새 파일)

import React, { useEffect, useState, useRef } from 'react';
import {Box, CircularProgress, IconButton, Tooltip, Typography} from '@mui/material';
import MyLocationIcon from '@mui/icons-material/MyLocation'; // '내 위치' 아이콘
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
    const [mapInstance, setMapInstance] = useState<any>(null); // 지도 인스턴스 상태로 관리
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
        if (!mapContainer.current || !window.kakao || !window.kakao.maps) return;

        const initMap = (lat: number, lon: number) => {
            if (!mapContainer.current) return;

            const mapOption = {
                center: new window.kakao.maps.LatLng(lat, lon),
                level: 7,
            };
            const map = new window.kakao.maps.Map(mapContainer.current, mapOption);
            setMapInstance(map);

            if (studies && studies.length > 0) {
                // --- 클러스터러 생성 (주석 해제 및 완성) ---
                const clusterer = new window.kakao.maps.MarkerClusterer({
                    map: map,
                    averageCenter: true,
                    minLevel: 10,
                    disableClickZoom: true,
                });

                // --- 마커 생성 로직 (주석 해제 및 완성) ---
                const markers = studies.map(study => {
                    const position = new window.kakao.maps.LatLng(study.latitude, study.longitude);
                    const marker = new window.kakao.maps.Marker({ position });

                    // 커스텀 오버레이(말풍선) 콘텐츠 생성
                    const overlayContent = `
              <div style="padding: 8px; border-radius: 6px; background-color: white; border: 1px solid #ccc; box-shadow: 0 2px 4px rgba(0,0,0,0.1); text-align: center; min-width: 150px;">
                  <strong style="display: block; font-size: 14px; margin-bottom: 5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                    ${study.title}
                  </strong>
                  <a href="/studies/${study.id}" id="overlay-link-${study.id}" style="color: #1976d2; font-size: 12px; text-decoration: none; font-weight: 500;">
                    상세보기
                  </a>
              </div>`;

                    const overlay = new window.kakao.maps.CustomOverlay({
                        content: overlayContent,
                        position: marker.getPosition(),
                        yAnchor: 1.6
                    });
                    overlay.setMap(null); // 처음에는 숨김

                    // 마커 이벤트 리스너 등록
                    window.kakao.maps.event.addListener(marker, 'mouseover', () => overlay.setMap(map));
                    window.kakao.maps.event.addListener(marker, 'mouseout', () => overlay.setMap(null));
                    window.kakao.maps.event.addListener(marker, 'click', () => navigate(`/studies/${study.id}`));

                    // 링크 클릭 이벤트가 지도 클릭으로 전파되는 것을 막기 위해 추가적인 DOM 이벤트 리스너 설정
                    document.addEventListener('click', (e) => {
                        if (e.target && (e.target as HTMLElement).id === `overlay-link-${study.id}`) {
                            e.preventDefault();
                            navigate(`/studies/${study.id}`);
                        }
                    });

                    return marker;
                });

                clusterer.addMarkers(markers);

                // --- 클러스터 클릭 이벤트 (주석 해제 및 완성) ---
                window.kakao.maps.event.addListener(clusterer, 'clusterclick', (cluster: any) => {
                    const latlng = cluster.getCenter();
                    map.setLevel(map.getLevel() - 1, { anchor: latlng }); // 지도를 한 단계 확대
                });
            }
        };

        const getUserLocationAndInitMap = () => {
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    (position) => initMap(position.coords.latitude, position.coords.longitude),
                    () => initMap(37.566826, 126.9786567) // 실패 시 기본 위치
                );
            } else {
                initMap(37.566826, 126.9786567); // 지원 안할 시 기본 위치
            }
        };

        window.kakao.maps.load(() => {
            if (!loading) {
                getUserLocationAndInitMap();
            }
        });

    }, [loading, studies, navigate]); // 의존성 배열 유지

    // --- 5. '내 위치로' 이동하는 함수 ---
    const panToCurrentUserLocation = () => {
        if (mapInstance && navigator.geolocation) {
            navigator.geolocation.getCurrentPosition((position) => {
                const lat = position.coords.latitude;
                const lon = position.coords.longitude;
                const moveLatLon = new window.kakao.maps.LatLng(lat, lon);
                mapInstance.panTo(moveLatLon); // 부드럽게 지도를 이동시킴
            }, (error) => {
                alert("현재 위치를 다시 가져오는데 실패했습니다.");
            });
        }
    };

    if (loading) {
        return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '500px' }}><CircularProgress /></Box>;
    }

    return (
        <Box sx={{ position: 'relative', width: '100%', height: { xs: '400px', md: '500px' }, my: 4, borderRadius: 2, overflow: 'hidden', border: '1px solid #ddd' }}>
            {/* --- 6. '내 위치로' 버튼 추가 --- */}
            <Tooltip title="내 위치로 이동">
                <IconButton
                    onClick={panToCurrentUserLocation}
                    sx={{
                        position: 'absolute',
                        bottom: 16, // <-- 수정: 아래쪽에서 16px
                        right: 16,  // <-- 수정: 오른쪽에서 16px
                        zIndex: 2, // 지도가 버튼 아래에 있도록
                        backgroundColor: 'white',
                        boxShadow: 3,
                        '&:hover': {
                            backgroundColor: 'grey.100',
                        },
                    }}
                >
                    <MyLocationIcon />
                </IconButton>
            </Tooltip>
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