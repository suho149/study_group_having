// src/pages/board/BoardPostCreatePage.tsx
import React, { useState } from 'react';
import {
    Container, Paper, Typography, TextField, Button, FormControl,
    InputLabel, Select, MenuItem, Box, Stack, SelectChangeEvent, Alert, CircularProgress
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
// 백엔드 BoardCategory Enum과 동일한 값을 가지는 객체 또는 enum 정의
// (또는 API로 카테고리 목록을 받아오는 것이 더 좋음)
const boardCategories = [
    { value: 'FREE', label: '자유' },
    { value: 'QUESTION', label: '질문' },
    { value: 'DISCUSSION', label: '토론' },
    { value: 'INFO', label: '정보공유' },
    { value: 'ETC', label: '기타' },
];

interface BoardFormData {
    title: string;
    content: string;
    category: string; // 백엔드 BoardCategory Enum의 문자열 값
    // attachments: File[]; // 파일 업로드 시
}

const BoardPostCreatePage: React.FC = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState<BoardFormData>({
        title: '',
        content: '',
        category: '', // 초기값
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);


    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | SelectChangeEvent<string>
    ) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name as string]: value,
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccessMessage(null);

        if (!formData.category) {
            setError("카테고리를 선택해주세요.");
            return;
        }
        if (!formData.title.trim()) {
            setError("제목을 입력해주세요.");
            return;
        }
        if (!formData.content.trim()) {
            setError("내용을 입력해주세요.");
            return;
        }

        setIsSubmitting(true);
        try {
            // 백엔드 BoardPostCreateRequest와 필드 일치 확인
            const requestData = {
                title: formData.title,
                content: formData.content,
                category: formData.category, // 문자열로 전송, 백엔드에서 Enum으로 변환
            };
            // 파일 업로드는 FormData 객체를 사용해야 함 (추후 구현)

            const response = await api.post('/api/board/posts', requestData);
            setSuccessMessage("게시글이 성공적으로 작성되었습니다!");
            // navigate(`/board/post/${response.data.id}`); // 작성된 게시글 상세 페이지로 이동 (API 응답에 id 포함 시)
            setTimeout(() => {
                navigate('/'); // 임시로 홈으로 이동
            }, 1500);

        } catch (err: any) {
            console.error('게시글 작성 실패:', err);
            setError(err.response?.data?.message || "게시글 작성에 실패했습니다. 다시 시도해주세요.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Container maxWidth="md" sx={{ py: 4 }}>
            <Paper elevation={2} sx={{ p: { xs: 2, sm: 3, md: 4 }, borderRadius: 2 }}>
                <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold', mb: 3 }}>
                    새 게시글 작성
                </Typography>
                {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}
                {successMessage && <Alert severity="success" sx={{ mb: 2 }}>{successMessage}</Alert>}

                <form onSubmit={handleSubmit}>
                    <Stack spacing={3}>
                        <FormControl fullWidth required error={!!error && error.includes("카테고리")}>
                            <InputLabel id="post-category-label">카테고리</InputLabel>
                            <Select
                                labelId="post-category-label"
                                name="category"
                                value={formData.category}
                                label="카테고리"
                                onChange={handleChange}
                            >
                                <MenuItem value=""><em>카테고리 선택</em></MenuItem>
                                {boardCategories.map(cat => (
                                    <MenuItem key={cat.value} value={cat.value}>
                                        {cat.label}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <TextField
                            name="title"
                            label="제목"
                            fullWidth
                            required
                            value={formData.title}
                            onChange={handleChange}
                            error={!!error && error.includes("제목")}
                        />

                        <TextField
                            name="content"
                            label="내용"
                            fullWidth
                            required
                            multiline
                            rows={10} // 내용 입력 칸 늘리기
                            value={formData.content}
                            onChange={handleChange}
                            placeholder="내용을 입력하세요. (Markdown 지원 예정)"
                            error={!!error && error.includes("내용")}
                        />

                        {/* TODO: 파일 업로드 UI (ImageUploader.tsx 컴포넌트 등) */}
                        {/* <Box>
              <Typography variant="subtitle2" gutterBottom>사진 첨부 (선택)</Typography>
              <input type="file" multiple onChange={handleFileChange} />
            </Box> */}

                        <Button
                            type="submit"
                            variant="contained"
                            color="primary"
                            size="large"
                            disabled={isSubmitting}
                            sx={{ mt: 2, py: 1.5, fontSize:'1rem' }}
                        >
                            {isSubmitting ? <CircularProgress size={24} color="inherit" /> : '게시글 작성'}
                        </Button>
                    </Stack>
                </form>
            </Paper>
        </Container>
    );
};

export default BoardPostCreatePage;