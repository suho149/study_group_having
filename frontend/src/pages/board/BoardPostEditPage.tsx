import React, { useState, useRef, useEffect } from 'react';
import {
    Container, Paper, Typography, TextField, Button, FormControl,
    InputLabel, Select, MenuItem, Box, Stack, SelectChangeEvent, Alert, CircularProgress
} from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../services/api';

// TOAST UI Editor 관련 import
import { Editor } from '@toast-ui/react-editor';
import 'prismjs/themes/prism.css';
import '@toast-ui/editor/dist/toastui-editor.css';
import '@toast-ui/editor-plugin-code-syntax-highlight/dist/toastui-editor-plugin-code-syntax-highlight.css';
import codeSyntaxHighlight from '@toast-ui/editor-plugin-code-syntax-highlight';
import Prism from 'prismjs';

// 타입 및 상수 정의
import { BoardPostResponseDto } from '../../types/board';
import { BoardCategory } from '../../types/apiSpecificEnums';

const boardCategories = [
    { value: BoardCategory.FREE, label: '자유' },
    { value: BoardCategory.QUESTION, label: '질문' },
    { value: BoardCategory.DISCUSSION, label: '토론' },
    { value: BoardCategory.INFO, label: '정보공유' },
    { value: BoardCategory.ETC, label: '기타' },
];

const BoardPostEditPage: React.FC = () => {
    const { postId } = useParams<{ postId: string }>();
    const navigate = useNavigate();
    const editorRef = useRef<Editor>(null);

    // 폼 상태를 분리하여 관리
    const [title, setTitle] = useState('');
    const [category, setCategory] = useState<BoardCategory | ''>('');

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // 1. 수정할 게시글의 기존 데이터를 불러오는 로직
    useEffect(() => {
        if (!postId) {
            setError("잘못된 접근입니다.");
            setLoading(false);
            return;
        }

        const fetchPostData = async () => {
            setLoading(true);
            try {
                const response = await api.get<BoardPostResponseDto>(`/api/board/posts/${postId}`);
                const post = response.data;

                // 불러온 데이터로 상태를 초기화합니다.
                setTitle(post.title);
                setCategory(post.category as BoardCategory);

                // 에디터 인스턴스가 준비된 후에 내용을 설정합니다.
                const editorInstance = editorRef.current?.getInstance();
                if (editorInstance) {
                    editorInstance.setMarkdown(post.content);
                } else {
                    // 인스턴스가 아직 준비되지 않았다면, initialValue prop을 사용하기 위해 임시 저장
                    // 하지만 보통 이 시점에는 ref가 설정되어 있습니다.
                    // 더 안전하게 하려면 onLoad 콜백을 사용할 수 있습니다.
                    console.warn("Editor instance not ready on fetch. Content will be set via initialValue.");
                }
            } catch (err) {
                setError("게시글 정보를 불러오는 데 실패했습니다.");
            } finally {
                setLoading(false);
            }
        };

        fetchPostData();
    }, [postId]);

    // 2. 폼 제출 시 수정 API를 호출하는 로직
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const content = editorRef.current?.getInstance().getMarkdown();

        if (!title.trim() || !category || !content?.trim()) {
            setError("모든 필드를 입력해주세요.");
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            // 수정 API(PUT) 호출
            await api.put(`/api/board/posts/${postId}`, {
                title,
                content,
                category,
            });
            alert('게시글이 성공적으로 수정되었습니다.');
            navigate(`/board/post/${postId}`); // 수정 후 상세 페이지로 이동
        } catch (err: any) {
            setError(err.response?.data?.message || "게시글 수정에 실패했습니다.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) {
        return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box>;
    }

    if (error && !title) { // 로딩 중 에러 발생 시
        return <Alert severity="error">{error}</Alert>;
    }

    return (
        <Container maxWidth="md" sx={{ py: 4 }}>
            <Paper elevation={2} sx={{ p: { xs: 2, sm: 3, md: 4 }, borderRadius: 2 }}>
                <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold', mb: 3 }}>
                    게시글 수정
                </Typography>

                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

                <form onSubmit={handleSubmit}>
                    <Stack spacing={3}>
                        <FormControl fullWidth required>
                            <InputLabel>카테고리</InputLabel>
                            <Select
                                name="category"
                                value={category}
                                label="카테고리"
                                onChange={(e: SelectChangeEvent) => setCategory(e.target.value as BoardCategory)}
                            >
                                {boardCategories.map(cat => (
                                    <MenuItem key={cat.value} value={cat.value}>{cat.label}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <TextField
                            name="title"
                            label="제목"
                            fullWidth
                            required
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                        />

                        <Box sx={{ border: '1px solid #ccc', borderRadius: 1 }}>
                            <Editor
                                key={editorRef.current?.getInstance().getMarkdown()} // key를 주어 데이터 로드 후 리렌더링 유도
                                ref={editorRef}
                                initialValue={editorRef.current?.getInstance().getMarkdown() || ''} // 초기값 설정
                                previewStyle="vertical"
                                height="400px"
                                initialEditType="markdown"
                                useCommandShortcut={true}
                                plugins={[[codeSyntaxHighlight, { highlighter: Prism }]]}
                                hooks={{
                                    addImageBlobHook: async (blob, callback) => {
                                        const formData = new FormData();
                                        formData.append('image', blob);
                                        try {
                                            const response = await api.post('/api/images/upload', formData, {
                                                headers: { 'Content-Type': 'multipart/form-data' },
                                            });
                                            callback(response.data.url, 'alt text');
                                        } catch (uploadError) {
                                            setError('이미지 업로드에 실패했습니다.');
                                        }
                                    }
                                }}
                            />
                        </Box>

                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                            <Button variant="outlined" onClick={() => navigate(`/board/post/${postId}`)} disabled={isSubmitting}>
                                취소
                            </Button>
                            <Button type="submit" variant="contained" disabled={isSubmitting}>
                                {isSubmitting ? <CircularProgress size={24} color="inherit" /> : '수정 완료'}
                            </Button>
                        </Box>
                    </Stack>
                </form>
            </Paper>
        </Container>
    );
};

export default BoardPostEditPage;