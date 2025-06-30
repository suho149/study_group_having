// src/pages/board/BoardPostCreatePage.tsx
import React, { useState, useRef } from 'react';
import {
    Container, Paper, Typography, TextField, Button, FormControl,
    InputLabel, Select, MenuItem, Box, Stack, SelectChangeEvent, Alert, CircularProgress
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

// --- TOAST UI Editor 관련 import 추가 ---
import { Editor } from '@toast-ui/react-editor';
import '@toast-ui/editor/dist/toastui-editor.css'; // 에디터 CSS
// 코드 하이라이팅 플러그인 (선택 사항)
import 'prismjs/themes/prism.css';
import '@toast-ui/editor-plugin-code-syntax-highlight/dist/toastui-editor-plugin-code-syntax-highlight.css';
import codeSyntaxHighlight from '@toast-ui/editor-plugin-code-syntax-highlight';
// ------------------------------------
import Prism from 'prismjs';

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
    //content: string;
    category: string; // 백엔드 BoardCategory Enum의 문자열 값
    // attachments: File[]; // 파일 업로드 시
}

const BoardPostCreatePage: React.FC = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState<BoardFormData>({
        title: '',
        //content: '',
        category: '', // 초기값
    });

    // --- 에디터의 인스턴스를 저장하기 위한 ref 추가 ---
    const editorRef = useRef<Editor>(null);
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

        // --- 에디터의 내용을 가져오는 로직으로 변경 ---
        const editorInstance = editorRef.current?.getInstance();
        const content = editorInstance?.getMarkdown(); // 마크다운 형식으로 내용 가져오기

        if (!formData.category) {
            setError("카테고리를 선택해주세요.");
            return;
        }
        if (!formData.title.trim()) {
            setError("제목을 입력해주세요.");
            return;
        }
        if (!content || !content.trim()) { setError("내용을 입력해주세요."); return; }

        setIsSubmitting(true);
        try {
            // 백엔드 BoardPostCreateRequest와 필드 일치 확인
            const requestData = {
                title: formData.title,
                content: content,
                category: formData.category, // 문자열로 전송, 백엔드에서 Enum으로 변환
            };
            // 파일 업로드는 FormData 객체를 사용해야 함 (추후 구현)

            const response = await api.post('/api/board/posts', requestData);
            setSuccessMessage("게시글이 성공적으로 작성되었습니다!");
            // navigate(`/board/post/${response.data.id}`); // 작성된 게시글 상세 페이지로 이동 (API 응답에 id 포함 시)
            setTimeout(() => {
                navigate(`/board/post/${response.data.id}`);
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
                        <FormControl fullWidth required>
                            <InputLabel>카테고리</InputLabel>
                            <Select name="category" value={formData.category} label="카테고리" onChange={handleChange}>
                                <MenuItem value=""><em>카테고리 선택</em></MenuItem>
                                {boardCategories.map(cat => ( <MenuItem key={cat.value} value={cat.value}>{cat.label}</MenuItem> ))}
                            </Select>
                        </FormControl>

                        <TextField
                            name="title"
                            label="제목"
                            fullWidth
                            required
                            value={formData.title}
                            onChange={handleChange}
                        />

                        {/* --- 기존 TextField를 Editor 컴포넌트로 교체 --- */}
                        <Box sx={{ border: '1px solid #ccc', borderRadius: 1 }}>
                            <Editor
                                ref={editorRef}
                                initialValue=" " // placeholder가 보이게 하려면 빈 문자열 대신 공백 한 칸
                                placeholder="내용을 입력하세요..."
                                previewStyle="vertical" // 미리보기 스타일 (탭 또는 수직)
                                height="400px"
                                initialEditType="markdown" // 초기 타입 (마크다운 또는 위지윅)
                                useCommandShortcut={true}
                                plugins={[[codeSyntaxHighlight, { highlighter: Prism }]]} // 코드 하이라이팅 플러그인 적용
                                // 이미지 업로드 훅(hook) 설정
                                hooks={{
                                    addImageBlobHook: async (blob, callback) => {
                                        const formData = new FormData();
                                        formData.append('image', blob);

                                        try {
                                            const response = await api.post('/api/images/upload', formData, {
                                                headers: { 'Content-Type': 'multipart/form-data' },
                                            });
                                            // 백엔드에서 받은 이미지 URL을 callback 함수에 전달
                                            callback(response.data.url, 'alt text');
                                        } catch (error) {
                                            console.error('이미지 업로드 실패:', error);
                                            // 사용자에게 에러 알림
                                            setError('이미지 업로드에 실패했습니다.');
                                        }
                                    }
                                }}
                            />
                        </Box>
                        {/* ----------------------------------------------- */}

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