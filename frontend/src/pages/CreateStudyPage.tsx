import React, { useState } from 'react';
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
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { useNavigate } from 'react-router-dom';
import axios, { AxiosResponse } from 'axios';
import { format } from 'date-fns';

interface FormData {
  title: string;
  description: string;
  maxMembers: string;
  studyType: string;
  location: string;
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
    location: '',
    startDate: null,
    endDate: null,
    tags: [],
  });
  const [tagInput, setTagInput] = useState('');

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | SelectChangeEvent
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
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
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const requestData = {
        ...formData,
        startDate: formData.startDate ? format(formData.startDate, 'yyyy-MM-dd') : null,
        endDate: formData.endDate ? format(formData.endDate, 'yyyy-MM-dd') : null,
      };

      const response: AxiosResponse = await axios.post('http://localhost:8080/api/studies', requestData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.status === 200) {
        navigate('/');
      }
    } catch (error) {
      console.error('스터디 생성 실패:', error);
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom>
          스터디 만들기
        </Typography>
        <form onSubmit={handleSubmit}>
          <Stack spacing={3}>
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
              <InputLabel>스터디 유형</InputLabel>
              <Select
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

            <TextField
              name="location"
              label="장소"
              fullWidth
              value={formData.location}
              onChange={handleChange}
              helperText="온라인의 경우 플랫폼(Zoom, Discord 등)을 입력해주세요"
            />

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
              sx={{ mt: 2 }}
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