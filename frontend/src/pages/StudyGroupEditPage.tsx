import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Box,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Stack,
  Alert,
  CircularProgress,
  SelectChangeEvent,
} from '@mui/material';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import api from '../services/api';

interface StudyGroupEditForm {
  title: string;
  description: string;
  maxMembers: number;
  status: string;
  studyType: string;
  location: string;
  startDate: Date;
  endDate: Date;
  tags: string[];
}

const StudyGroupEditPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newTag, setNewTag] = useState('');
  const [form, setForm] = useState<StudyGroupEditForm>({
    title: '',
    description: '',
    maxMembers: 2,
    status: 'RECRUITING',
    studyType: 'OFFLINE',
    location: '',
    startDate: new Date(),
    endDate: new Date(),
    tags: [],
  });

  useEffect(() => {
    const fetchStudyGroup = async () => {
      try {
        const response = await api.get(`/api/studies/${id}`);
        const data = response.data;
        setForm({
          title: data.title,
          description: data.description,
          maxMembers: data.maxMembers,
          status: data.status,
          studyType: data.studyType,
          location: data.location,
          startDate: new Date(data.startDate),
          endDate: new Date(data.endDate),
          tags: data.tags,
        });
        setLoading(false);
      } catch (error) {
        console.error('스터디 그룹 조회 실패:', error);
        setError('스터디 그룹 정보를 불러오는데 실패했습니다.');
        setLoading(false);
      }
    };

    fetchStudyGroup();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.put(`/api/studies/${id}`, {
        ...form,
        startDate: form.startDate.toISOString().split('T')[0],
        endDate: form.endDate.toISOString().split('T')[0],
      });
      navigate(`/studies/${id}`);
    } catch (error) {
      console.error('스터디 그룹 수정 실패:', error);
      setError('스터디 그룹 수정에 실패했습니다.');
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | SelectChangeEvent
  ) => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      [name as string]: value,
    }));
  };

  const handleAddTag = () => {
    if (newTag.trim() && !form.tags.includes(newTag.trim())) {
      setForm(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()],
      }));
      setNewTag('');
    }
  };

  const handleDeleteTag = (tagToDelete: string) => {
    setForm(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToDelete),
    }));
  };

  if (loading) return <CircularProgress />;
  if (error) return <Alert severity="error">{error}</Alert>;

  return (
    <Container maxWidth="md">
      <Paper sx={{ p: 4, mt: 4 }}>
        <Typography variant="h4" gutterBottom>
          스터디 수정
        </Typography>
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }}>
          <TextField
            fullWidth
            label="제목"
            name="title"
            value={form.title}
            onChange={handleChange}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="설명"
            name="description"
            value={form.description}
            onChange={handleChange}
            margin="normal"
            multiline
            rows={4}
            required
          />
          <TextField
            fullWidth
            label="최대 인원"
            name="maxMembers"
            type="number"
            value={form.maxMembers}
            onChange={handleChange}
            margin="normal"
            required
            inputProps={{ min: 2 }}
          />
          <FormControl fullWidth margin="normal">
            <InputLabel>상태</InputLabel>
            <Select
              name="status"
              value={form.status}
              onChange={handleChange}
              label="상태"
            >
              <MenuItem value="RECRUITING">모집 중</MenuItem>
              <MenuItem value="IN_PROGRESS">진행 중</MenuItem>
              <MenuItem value="COMPLETED">완료</MenuItem>
              <MenuItem value="CANCELLED">취소</MenuItem>
            </Select>
          </FormControl>
          <FormControl fullWidth margin="normal">
            <InputLabel>스터디 유형</InputLabel>
            <Select
              name="studyType"
              value={form.studyType}
              onChange={handleChange}
              label="스터디 유형"
            >
              <MenuItem value="OFFLINE">오프라인</MenuItem>
              <MenuItem value="ONLINE">온라인</MenuItem>
              <MenuItem value="HYBRID">하이브리드</MenuItem>
            </Select>
          </FormControl>
          <TextField
            fullWidth
            label="장소"
            name="location"
            value={form.location}
            onChange={handleChange}
            margin="normal"
            required
          />
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <Stack spacing={3} sx={{ mt: 2 }}>
              <DatePicker
                label="시작일"
                value={form.startDate}
                onChange={(newValue) => {
                  if (newValue) {
                    setForm(prev => ({ ...prev, startDate: newValue }));
                  }
                }}
              />
              <DatePicker
                label="종료일"
                value={form.endDate}
                onChange={(newValue) => {
                  if (newValue) {
                    setForm(prev => ({ ...prev, endDate: newValue }));
                  }
                }}
              />
            </Stack>
          </LocalizationProvider>
          <Box sx={{ mt: 2 }}>
            <TextField
              label="태그 추가"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddTag();
                }
              }}
            />
            <Button onClick={handleAddTag} sx={{ ml: 1 }}>
              추가
            </Button>
          </Box>
          <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {form.tags.map((tag) => (
              <Chip
                key={tag}
                label={tag}
                onDelete={() => handleDeleteTag(tag)}
              />
            ))}
          </Box>
          <Box sx={{ mt: 4, display: 'flex', gap: 2 }}>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              fullWidth
            >
              수정하기
            </Button>
            <Button
              variant="outlined"
              color="secondary"
              fullWidth
              onClick={() => navigate(`/studies/${id}`)}
            >
              취소
            </Button>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
};

export default StudyGroupEditPage; 