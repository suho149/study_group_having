// src/components/board/CommentForm.tsx (이전 답변의 페이지 내 폼을 컴포넌트로 분리)
import React, { useState, useEffect } from 'react';
import { Paper, Typography, TextField, Button, CircularProgress, Alert, Box } from '@mui/material';
import api from '../../services/api';
import { CommentCreateRequestDto, CommentDto } from '../../types/board';

interface CommentFormProps {
    postId: number;
    parentComment?: CommentDto | null; // 대댓글 대상 (부모 댓글)
    onSubmitSuccess: () => void; // 성공 시 콜백
    onCancelReply?: () => void; // 대댓글 작성 취소 시 콜백
}

const CommentForm: React.FC<CommentFormProps> = ({ postId, parentComment, onSubmitSuccess, onCancelReply }) => {
    const [content, setContent] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // 대댓글 대상이 변경될 때 입력창 포커스 및 멘션 추가 (선택적)
        if (parentComment) {
            setContent(`@${parentComment.author.name} `);
            // TODO: 입력창에 포커스
        }
    }, [parentComment]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!content.trim()) return;
        setIsSubmitting(true);
        setError(null);
        const requestData: CommentCreateRequestDto = {
            content,
            parentId: parentComment ? parentComment.id : undefined,
        };
        try {
            await api.post(`/api/board/posts/${postId}/comments`, requestData);
            setContent('');
            if (onCancelReply) onCancelReply(); // 대댓글 상태 초기화
            onSubmitSuccess(); // 부모에게 알림 (목록 새로고침)
        } catch (err: any) {
            setError(err.response?.data?.message || "댓글 작성에 실패했습니다.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Paper component="form" onSubmit={handleSubmit} elevation={2} sx={{ mt: 3, p: 2, borderRadius: 2 }}>
            {parentComment && (
                <Typography variant="caption" gutterBottom>
                    {parentComment.author.name}님에게 답글 작성 중...
                    <Button size="small" onClick={onCancelReply} sx={{ml:1}}>취소</Button>
                </Typography>
            )}
            {error && <Alert severity="error" sx={{mb:1}}>{error}</Alert>}
            <TextField
                fullWidth multiline rows={3} variant="outlined"
                placeholder="댓글을 입력하세요..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
            />
            <Button type="submit" variant="contained" disabled={isSubmitting || !content.trim()} sx={{ mt: 2 }}>
                {isSubmitting ? <CircularProgress size={24} color="inherit" /> : '댓글 등록'}
            </Button>
        </Paper>
    );
};

export default CommentForm;