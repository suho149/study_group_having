import React, {useEffect, useRef, useState} from 'react';
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

  const mapRef = useRef<any>(null); // map 상태 대신 ref 사용
  const markerRef = useRef<any>(null); // marker 상태 대신 ref 사용
  const [isMapVisible, setIsMapVisible] = useState(false); // 지도를 보여줄지 여부를 결정하는 상태 추가

  const kakaoMapApiKey = process.env.REACT_APP_KAKAO_MAP_API_KEY; // .env.development 파일에서 키 가져오기

  // 카카오맵 API 로드 및 지도 생성
  // 지도 생성 로직
  useEffect(() => {
    // '오프라인' 유형이 아니면, 지도 관련 상태를 모두 초기화하고 종료
    if (formData.studyType !== 'OFFLINE') {
      setIsMapVisible(false); // 지도 숨기기
      // 필요하다면 mapRef.current = null; 등으로 지도 객체를 완전히 제거할 수도 있습니다.
      return;
    }

    // '오프라인' 유형이 선택되면, 지도를 표시하도록 상태 변경
    setIsMapVisible(true);

    // 지도를 그릴 컨테이너가 준비되지 않았다면 종료
    if (!mapContainer.current) return;

    // kakao.maps.load를 사용하여 API 준비를 기다림
    window.kakao.maps.load(() => {
      const container = mapContainer.current;
      // 컨테이너가 없거나, 이미 지도가 그려져 있다면 다시 그리지 않음
      if (!container || mapRef.current) return;

      console.log(">>>> Map initialization starts now! <<<<"); // 지도 생성 시작 로그

      const mapOption = {
        center: new window.kakao.maps.LatLng(37.566826, 126.9786567),
        level: 3,
      };
      const map = new window.kakao.maps.Map(container, mapOption);
      const marker = new window.kakao.maps.Marker({ position: map.getCenter() });
      marker.setMap(map);

      // 생성된 지도와 마커를 ref에 저장
      mapRef.current = map;
      markerRef.current = marker;

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
          } else {
            setFormData(prev => ({ ...prev, location: "주소 정보 없음" }));
            setSelectedPlace(null);
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
  const handlePlaceSearch = () => {
    if (!searchKeyword.trim()) {
      alert("검색어를 입력해주세요.");
      return;
    }

    // kakao 객체가 없으면 오류 메시지 표시
    if (!window.kakao || !window.kakao.maps) {
      alert('지도 API가 로드되지 않았습니다. 페이지를 새로고침 해주세요.');
      return;
    }

    // 'services' 라이브러리가 로드될 때까지 기다렸다가 검색 실행
    window.kakao.maps.load(() => {
      const ps = new window.kakao.maps.services.Places();
      ps.keywordSearch(searchKeyword, (data: any[], status: any) => {
        if (status === window.kakao.maps.services.Status.OK) {
          setSearchResults(data);
        } else if (status === window.kakao.maps.services.Status.ZERO_RESULT) {
          alert('검색 결과가 존재하지 않습니다.');
          setSearchResults([]);
        } else {
          alert('장소 검색 중 오류가 발생했습니다.');
          setSearchResults([]);
        }
      });
    });
  };

  // 검색 결과에서 장소 선택 시
  const handleSelectPlace = (place: any) => {
    setSelectedPlace(place);
    setFormData(prev => ({
      ...prev,
      location: place.place_name,
      latitude: parseFloat(place.y), // 위도
      longitude: parseFloat(place.x), // 경도
    }));
    setSearchResults([]); // 검색 결과 목록 숨기기
    setSearchKeyword(place.place_name); // 검색창에 선택한 장소 이름 표시

    if (map && marker) {
      const moveLatLon = new window.kakao.maps.LatLng(place.y, place.x);
      map.setCenter(moveLatLon);
      marker.setPosition(moveLatLon);
    }
  };

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
                    <Typography variant="subtitle2" gutterBottom sx={{mt:1, mb:1, fontWeight:'medium'}}>장소 선택 (오프라인)</Typography>
                    <Grid container spacing={2} alignItems="center">
                      <Grid item xs={12} sm={8}>
                        <TextField
                            fullWidth
                            variant="outlined"
                            label="장소 검색"
                            value={searchKeyword}
                            onChange={(e) => setSearchKeyword(e.target.value)}
                            placeholder="예: 강남역 스타벅스"
                        />
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <Button
                            fullWidth
                            variant="outlined"
                            onClick={handlePlaceSearch}
                            disabled={!searchKeyword.trim()}
                        >
                          검색
                        </Button>
                      </Grid>
                    </Grid>
                    {/* 검색 결과 목록 */}
                    {searchResults.length > 0 && (
                        <Paper elevation={1} sx={{ maxHeight: 200, overflow: 'auto', mt: 1, border:'1px solid #eee' }}>
                          <List dense>
                            {searchResults.map((place) => (
                                <ListItem
                                    key={place.id}
                                    button
                                    onClick={() => handleSelectPlace(place)}
                                >
                                  <ListItemText
                                      primary={place.place_name}
                                      secondary={place.road_address_name || place.address_name}
                                  />
                                </ListItem>
                            ))}
                          </List>
                        </Paper>
                    )}
                    {/* 선택된 장소 표시 */}
                    {selectedPlace && (
                        <Typography variant="body2" sx={{mt:1, color:'primary.main'}}>
                          선택된 장소: {selectedPlace.place_name}
                        </Typography>
                    )}
                    {/* 카카오맵 표시 영역 */}
                    <Box
                        ref={mapContainer}
                        id="kakao-map-container"
                        sx={{
                          width: '100%',
                          height: '300px',
                          mt: 2,
                          border: '1px solid #ccc',
                          borderRadius: 1,
                          // 지도가 로딩되기 전까지 사용자에게 안내 메시지를 보여주기 위한 가상 요소(pseudo-element)
                          position: 'relative', // 가상 요소의 기준점
                          '&:empty::before': { // 자식 요소가 없을 때만 (지도가 로딩되기 전)
                            content: '"지도 로딩 중..."',
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                            color: 'text.secondary',
                          }
                        }}
                    >
                      {/* 이 안은 비워둡니다. 카카오맵 API가 여기에 직접 지도를 그립니다. */}
                    </Box>
                    {/* location 필드는 자동으로 채워지거나, 사용자가 직접 수정할 수 있도록 함 */}
                    <TextField
                        name="location"
                        label="선택된 장소 주소 (오프라인)"
                        fullWidth
                        value={formData.location} // 선택된 장소 주소로 자동 채워짐
                        onChange={handleChange} // 필요시 수동 입력/수정 가능
                        InputProps={{ readOnly: true }} // 지도 선택으로만 입력받도록 (선택적)
                        sx={{mt:1}}
                        helperText={formData.latitude && formData.longitude ? `위도: ${formData.latitude.toFixed(6)}, 경도: ${formData.longitude.toFixed(6)}` : "지도에서 장소를 클릭하거나 검색하여 선택하세요."}
                    />
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