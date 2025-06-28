import React, {useCallback, useEffect, useRef, useState} from 'react';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Chip,
  Stack,
  SelectChangeEvent,
  Grid, ListItem, List, ListItemText, RadioGroup, FormControlLabel, Radio,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { useNavigate } from 'react-router-dom';
import axios, { AxiosResponse } from 'axios';
import api from '../services/api'; // axios 대신 api 인스턴스 사용한다고 가정
import { format } from 'date-fns';

// 카카오맵 API 타입을 위한 전역 선언 (또는 별도 d.ts 파일)
declare global {
  interface Window {
    kakao: any;
  }
}

interface FormData {
  title: string;
  description: string;
  maxMembers: string;
  studyType: string; // 'ONLINE', 'OFFLINE', 'HYBRID'
  category: 'STUDY' | 'PROJECT' | '';
  location: string;  // 오프라인 시 주소, 온라인 시 플랫폼
  latitude?: number | null;  // 위도 (오프라인 시)
  longitude?: number | null; // 경도 (오프라인 시)
  startDate: Date | null;
  endDate: Date | null;
  tags: string[];
}

const studyTypes = [
  { value: 'ONLINE', label: '온라인' },
  { value: 'OFFLINE', label: '오프라인' },
  { value: 'HYBRID', label: '온/오프라인 병행' },
];

const CreateStudyPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    maxMembers: '',
    studyType: '',
    category: '',
    location: '',
    latitude: null,
    longitude: null,
    startDate: null,
    endDate: null,
    tags: [],
  });
  const [tagInput, setTagInput] = useState('');
  const mapContainer = useRef<HTMLDivElement>(null); // 지도를 담을 영역의 DOM 레퍼런스
  const [map, setMap] = useState<any>(null); // 카카오맵 인스턴스
  const [marker, setMarker] = useState<any>(null); // 마커 인스턴스
  const [searchKeyword, setSearchKeyword] = useState(''); // 장소 검색어
  const [searchResults, setSearchResults] = useState<any[]>([]); // 장소 검색 결과
  const [selectedPlace, setSelectedPlace] = useState<any>(null); // 선택된 장소 정보
  const [mapApiLoaded, setMapApiLoaded] = useState(false); // 카카오맵 API 로드 완료 상태

  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  const kakaoMapApiKey = process.env.REACT_APP_KAKAO_MAP_API_KEY; // .env.development 파일에서 키 가져오기

  // 지도 생성 및 관리 로직
  useEffect(() => {
    if (formData.studyType !== 'OFFLINE') {
      return;
    }
    if (!mapContainer.current) {
      return;
    }
    if (!window.kakao || !window.kakao.maps) {
      console.log("Kakao script not loaded yet.");
      return;
    }

    window.kakao.maps.load(() => {
      // 지도가 이미 생성되었다면 다시 생성하지 않습니다.
      if (mapRef.current) {
        return;
      }

      const container = mapContainer.current!;
      const mapOption = {
        center: new window.kakao.maps.LatLng(37.566826, 126.9786567),
        level: 3,
      };

      const map = new window.kakao.maps.Map(container, mapOption);
      const marker = new window.kakao.maps.Marker({ position: map.getCenter() });
      marker.setMap(map);

      // 생성된 인스턴스를 ref에 저장합니다.
      mapRef.current = map;
      markerRef.current = marker;

      // 지도 클릭 이벤트
      window.kakao.maps.event.addListener(map, 'click', (mouseEvent: any) => {
        const latlng = mouseEvent.latLng;
        marker.setPosition(latlng);

        const newLat = latlng.getLat();
        const newLng = latlng.getLng();
        setFormData(prev => ({ ...prev, latitude: newLat, longitude: newLng }));

        const geocoder = new window.kakao.maps.services.Geocoder();
        geocoder.coord2Address(newLng, newLat, (result: any, status: any) => {
          if (status === window.kakao.maps.services.Status.OK && result[0]) {
            const roadAddress = result[0].road_address?.address_name || result[0].address.address_name;
            setFormData(prev => ({ ...prev, location: roadAddress }));
            setSelectedPlace({ place_name: roadAddress, x: newLng, y: newLat });
          }
        });
      });
    });

  }, [formData.studyType]);

  const handleChange = (
      e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | SelectChangeEvent<string> // SelectChangeEvent 타입 명시
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name as string]: value, // name을 string으로 단언
    }));
    // 스터디 유형 변경 시, 오프라인이 아니면 위도/경도/선택장소 초기화
    if (name === 'studyType' && value !== 'OFFLINE') {
      setFormData(prev => ({
        ...prev,
        latitude: null,
        longitude: null,
        location: value === 'ONLINE' ? prev.location : '' // 온라인이면 기존 location 유지, 아니면 비움
      }));
      setSelectedPlace(null);
      setSearchResults([]);
      setSearchKeyword('');
    }
  };

  // 장소 검색 함수
  // 장소 검색 함수
  const handlePlaceSearch = useCallback(() => {
    if (!searchKeyword.trim()) return;
    if (!window.kakao || !window.kakao.maps?.services?.Places) {
      alert('지도 서비스가 아직 로드되지 않았습니다. 잠시 후 다시 시도해주세요.');
      return;
    }
    const ps = new window.kakao.maps.services.Places();
    ps.keywordSearch(searchKeyword, (data: React.SetStateAction<any[]>, status: any) => {
      if (status === window.kakao.maps.services.Status.OK) setSearchResults(data);
      else if (status === window.kakao.maps.services.Status.ZERO_RESULT) alert('검색 결과가 없습니다.');
      else alert('검색 중 오류가 발생했습니다.');
    });
  }, [searchKeyword]);

  // ★★★ 검색 결과 클릭 함수를 ref를 사용하도록 수정합니다. ★★★
  const handleSelectPlace = useCallback((place: any) => {
    setSelectedPlace(place);
    setFormData(prev => ({
      ...prev,
      location: place.place_name,
      latitude: parseFloat(place.y),
      longitude: parseFloat(place.x),
    }));
    setSearchResults([]);
    setSearchKeyword(place.place_name);

    if (mapRef.current && markerRef.current) {
      const moveLatLon = new window.kakao.maps.LatLng(place.y, place.x);
      mapRef.current.setCenter(moveLatLon);
      markerRef.current.setPosition(moveLatLon);
    }
  }, []);

  const handleTagInputKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      if (!formData.tags.includes(tagInput.trim())) {
        setFormData(prev => ({
          ...prev,
          tags: [...prev.tags, tagInput.trim()],
        }));
      }
      setTagInput('');
    }
  };

  const handleDeleteTag = (tagToDelete: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToDelete),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // 오프라인 스터디 선택 시 위도/경도 값 확인 (선택 사항)
    if (formData.studyType === 'OFFLINE' && (!formData.latitude || !formData.longitude)) {
      alert('오프라인 스터디의 경우 지도에서 장소를 선택해주세요.');
      return;
    }
    // --- ★★★ 유효성 검사 추가 ★★★ ---
    if (!formData.category) {
      alert('모집 구분을 선택해주세요.');
      return;
    }
    try {
      const requestPayload = { // 변수명 변경 (formData와 구분)
        title: formData.title,
        description: formData.description,
        maxMembers: parseInt(formData.maxMembers, 10), // 숫자로 변환
        studyType: formData.studyType, // 'ONLINE', 'OFFLINE', 'HYBRID' 문자열
        category: formData.category,
        location: formData.location,
        latitude: formData.latitude,   // null 또는 숫자
        longitude: formData.longitude, // null 또는 숫자
        startDate: formData.startDate ? format(formData.startDate, 'yyyy-MM-dd') : null,
        endDate: formData.endDate ? format(formData.endDate, 'yyyy-MM-dd') : null,
        tags: formData.tags,
      };

      console.log('Request Payload to Backend:', requestPayload); // <--- 이 로그 확인!

      await api.post('/api/studies', requestPayload);
      navigate('/');
    } catch (error: any) { // AxiosError 등으로 타입 구체화 가능
      console.error('스터디 생성 실패:', error);
      if (error.response) {
        // 백엔드에서 내려준 유효성 검사 오류 메시지 등을 표시할 수 있음
        console.error('Backend Error Data:', error.response.data);
        const errorData = error.response.data;
        let errorMessage = "스터디 생성에 실패했습니다. 입력값을 확인해주세요.";
        if (errorData && typeof errorData.message === 'string') {
          errorMessage = errorData.message;
        } else if (errorData && Array.isArray(errorData.errors)) { // Spring @Valid 에러 형식
          errorMessage = errorData.errors.map((err: any) => `${err.field}: ${err.defaultMessage}`).join('\n');
        }
        alert(errorMessage);
      } else {
        alert("스터디 생성 중 오류가 발생했습니다. 네트워크 연결을 확인해주세요.");
      }
    }
  };

  return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Paper elevation={2} sx={{ p: { xs: 2, sm: 3, md: 4 }, borderRadius: 2 }}>
          <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold', mb: 3 }}>
            스터디 만들기
          </Typography>
          <form onSubmit={handleSubmit}>
            <Stack spacing={3}>

              <FormControl component="fieldset" required>
                <Typography variant="subtitle1" gutterBottom sx={{fontWeight:'medium'}}>모집 구분</Typography>
                <RadioGroup row name="category" value={formData.category} onChange={handleChange}>
                  <FormControlLabel value="STUDY" control={<Radio />} label="스터디" />
                  <FormControlLabel value="PROJECT" control={<Radio />} label="프로젝트" />
                </RadioGroup>
              </FormControl>

            <TextField
              name="title"
              label="스터디 제목"
              fullWidth
              required
              value={formData.title}
              onChange={handleChange}
            />

            <TextField
              name="description"
              label="스터디 설명"
              fullWidth
              required
              multiline
              rows={4}
              value={formData.description}
              onChange={handleChange}
            />

            <TextField
              name="maxMembers"
              label="최대 인원"
              type="number"
              required
              value={formData.maxMembers}
              onChange={handleChange}
              inputProps={{ min: 2 }}
            />

              <FormControl fullWidth required>
                <InputLabel id="study-type-label">스터디 유형</InputLabel>
                <Select
                    labelId="study-type-label"
                    name="studyType"
                    value={formData.studyType}
                    label="스터디 유형"
                    onChange={handleChange}
                >
                  {studyTypes.map(type => (
                      <MenuItem key={type.value} value={type.value}>
                        {type.label}
                      </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {/* 스터디 유형이 OFFLINE일 때만 지도 및 장소 검색 UI 표시 */}
              {formData.studyType === 'OFFLINE' && (
                  <Box>
                    <Typography variant="subtitle2" gutterBottom>장소 선택 (오프라인)</Typography>
                    <Grid container spacing={2} alignItems="center">
                      <Grid item xs={12} sm={8}>
                        <TextField fullWidth label="장소 검색" value={searchKeyword} onChange={(e) => setSearchKeyword(e.target.value)} />
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <Button fullWidth variant="outlined" onClick={handlePlaceSearch} disabled={!searchKeyword.trim()}>검색</Button>
                      </Grid>
                    </Grid>
                    {searchResults.length > 0 && (
                        <Paper elevation={1} sx={{ maxHeight: 200, overflow: 'auto', mt: 1 }}>
                          <List dense>
                            {searchResults.map((place) => (
                                <ListItem key={place.id} button onClick={() => handleSelectPlace(place)}>
                                  <ListItemText primary={place.place_name} secondary={place.road_address_name || place.address_name} />
                                </ListItem>
                            ))}
                          </List>
                        </Paper>
                    )}
                    {selectedPlace && <Typography variant="body2" sx={{ mt: 1, color: 'primary.main' }}>선택된 장소: {selectedPlace.place_name}</Typography>}

                    {/* 지도 컨테이너 */}
                    <Box ref={mapContainer} sx={{ width: '100%', height: '300px', mt: 2, bgcolor: '#f0f0f0' }} />

                    <TextField name="location" label="선택된 장소 주소" fullWidth value={formData.location} InputProps={{ readOnly: true }} sx={{ mt: 1 }} />
                  </Box>
              )}

              {/* 스터디 유형이 OFFLINE이 아닐 때의 장소 입력 필드 */}
              {formData.studyType !== 'OFFLINE' && formData.studyType !== '' && (
                  <TextField
                      name="location"
                      label={formData.studyType === 'ONLINE' ? "온라인 플랫폼 (Zoom, Discord 등)" : "장소 (온/오프라인 병행 시)"}
                      fullWidth
                      value={formData.location}
                      onChange={handleChange}
                      required={formData.studyType === 'ONLINE'} // 온라인은 플랫폼 필수
                      helperText={formData.studyType === 'ONLINE' ? "온라인 스터디 진행 플랫폼 주소 또는 정보를 입력하세요." : "주요 오프라인 장소 또는 온라인 정보를 입력하세요."}
                  />
              )}


              <LocalizationProvider dateAdapter={AdapterDateFns}>
              <Stack direction="row" spacing={2}>
                <DatePicker
                  label="시작 날짜"
                  value={formData.startDate}
                  onChange={(date: Date | null) => setFormData(prev => ({ ...prev, startDate: date }))}
                />
                <DatePicker
                  label="종료 날짜"
                  value={formData.endDate}
                  onChange={(date: Date | null) => setFormData(prev => ({ ...prev, endDate: date }))}
                />
              </Stack>
            </LocalizationProvider>

            <Box>
              <TextField
                label="태그 입력"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={handleTagInputKeyPress}
                helperText="엔터를 눌러 태그를 추가하세요"
                fullWidth
              />
              <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {formData.tags.map(tag => (
                  <Chip
                    key={tag}
                    label={tag}
                    onDelete={() => handleDeleteTag(tag)}
                  />
                ))}
              </Box>
            </Box>

              <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  size="large"
                  sx={{ mt: 3, py: 1.5, fontSize:'1rem' }}
              >
              스터디 만들기
            </Button>
          </Stack>
        </form>
      </Paper>
    </Container>
  );
};

export default CreateStudyPage; 