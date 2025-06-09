// src/pages/board/BoardPostDetailPage.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';
import {
    Container,
    Paper,
    Typography,
    Box,
    Divider,
    CircularProgress,
    Button,
    Chip,
    Avatar,
    IconButton,
    TextField,
    List,
    ListItem,
    ListItemText,
    ListItemAvatar,
    Alert,
    DialogActions,
    Dialog,
    DialogTitle, DialogContent, DialogContentText
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ThumbUpAltOutlinedIcon from '@mui/icons-material/ThumbUpAltOutlined';
import ThumbUpAltIcon from '@mui/icons-material/ThumbUpAlt'; // 채워진 추천 아이콘
import ThumbDownAltOutlinedIcon from '@mui/icons-material/ThumbDownAltOutlined';
import ThumbDownAltIcon from '@mui/icons-material/ThumbDownAlt'; // 채워진 비추천 아이콘
import ChatBubbleOutlineOutlinedIcon from '@mui/icons-material/ChatBubbleOutlineOutlined';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { BoardPostResponseDto, CommentDto } from '../../types/board'; // 상세 DTO 및 댓글 DTO 타입 필요
import { format, parseISO } from 'date-fns'; // 날짜 포맷용
import { ko } from 'date-fns/locale';
import VisibilityIcon from "@mui/icons-material/Visibility"; // 한국어 로케일

const BoardPostDetailPage: React.FC = () => {
    const { postId } = useParams<{ postId: string }>();
    const navigate = useNavigate();
    const { isLoggedIn, currentUserId, isLoading: authLoading } = useAuth();
    const [post, setPost] = useState<BoardPostResponseDto | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isConfirmDeleteDialogOpen, setIsConfirmDeleteDialogOpen] = useState(false);

    // 댓글 관련 상태 (추후 구현)
    // const [comments, setComments] = useState<CommentDto[]>([]);
    // const [newComment, setNewComment] = useState('');
    // const [submittingComment, setSubmittingComment] = useState(false);

    const fetchPostDetail = useCallback(async () => {
        if (!postId) return;
        setLoading(true);
        setError(null);
        try {
            const response = await api.get<BoardPostResponseDto>(`/api/board/posts/${postId}`);
            setPost(response.data);
        } catch (err: any) {
            console.error("게시글 상세 정보 조회 실패:", err);
            setError(err.response?.data?.message || "게시글을 불러오는데 실패했습니다.");
        } finally {
            setLoading(false);
        }
    }, [postId]);

    useEffect(() => {
        fetchPostDetail();
        // TODO: 댓글 목록 조회 API 호출
    }, [fetchPostDetail]);

    const handleDeletePost = async () => {
        if (!post || !currentUserId || post.id !== currentUserId) {
            alert("삭제 권한이 없습니다.");
            setIsConfirmDeleteDialogOpen(false);
            return;
        }
        try {
            await api.delete(`/api/board/posts/${post.id}`);
            alert("게시글이 삭제되었습니다.");
            navigate('/'); // 또는 게시판 목록으로
        } catch (err: any) {
            console.error("게시글 삭제 실패:", err);
            setError(err.response?.data?.message || "게시글 삭제에 실패했습니다.");
        } finally {
            setIsConfirmDeleteDialogOpen(false);
        }
    };

    // TODO: handleLike, handleDislike, handleCommentSubmit 함수 구현


    if (loading && !post) {
        return <Container sx={{display:'flex', justifyContent:'center', mt:5}}><CircularProgress /></Container>;
    }
    if (error) {
        return <Container sx={{mt:5}}><Alert severity="error">{error}</Alert></Container>;
    }
    if (!post) {
        return <Container sx={{mt:5, textAlign:'center'}}><Typography>게시글을 찾을 수 없습니다.</Typography></Container>;
    }

    const isAuthor = isLoggedIn && currentUserId === post.author?.id;

    return (
        <Container maxWidth="md" sx={{ my: 4 }}>
            <Paper elevation={2} sx={{ p: { xs: 2, sm: 3, md: 4 }, borderRadius: 2 }}>
                <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Chip label={post.category} color="secondary" size="small" />
                    {isAuthor && (
                        <Box>
                            <Button
                                size="small"
                                startIcon={<EditIcon />}
                                onClick={() => navigate(`/board/edit/${post.id}`)} // 수정 페이지로 (추후 구현)
                                sx={{mr:1}}
                            >
                                수정
                            </Button>
                            <Button
                                size="small"
                                color="error"
                                startIcon={<DeleteIcon />}
                                onClick={() => setIsConfirmDeleteDialogOpen(true)}
                            >
                                삭제
                            </Button>
                        </Box>
                    )}
                </Box>

                <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
                    {post.title}
                </Typography>

                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, color: 'text.secondary' }}>
                    {/* post.author가 존재할 때만 Avatar와 이름 표시 */}
                    {post.author && (
                        <>
                            <Avatar
                                src={post.author.profileImageUrl || undefined} // profileImageUrl이 optional이므로 undefined 전달 가능
                                alt={post.author.name}
                                sx={{ width: 32, height: 32, mr: 1.5 }}
                            >
                                {!post.author.profileImageUrl && post.author.name ? post.author.name[0].toUpperCase() : null}
                            </Avatar>
                            <Typography variant="subtitle1" sx={{ fontWeight: 500, mr:1 }}>
                                {post.author.name}
                            </Typography>
                        </>
                    )}
                    <Typography variant="caption" sx={{ mr: 2 }}>
                        {format(parseISO(post.createdAt), 'yyyy.MM.dd HH:mm', { locale: ko })}
                    </Typography>
                    <Box sx={{display:'flex', alignItems:'center', gap:0.5}}>
                        <VisibilityIcon sx={{fontSize: '1rem'}}/>
                        <Typography variant="caption">{post.viewCount}</Typography>
                    </Box>
                </Box>
                <Divider sx={{ my: 3 }} />

                {/* 게시글 내용 (HTML로 렌더링해야 할 경우 dangerouslySetInnerHTML 사용 주의) */}
                <Box sx={{ mb: 4, fontSize: '1.05rem', lineHeight: 1.8, wordBreak: 'break-word' }}>
                    {/* 임시로 pre-wrap 사용, 실제로는 HTML 파서 또는 Markdown 렌더러 필요 */}
                    <Typography component="div" dangerouslySetInnerHTML={{ __html: post.content.replace(/\n/g, '<br />') }} />
                    {/* 만약 순수 텍스트라면: <Typography whiteSpace="pre-wrap">{post.content}</Typography> */}
                </Box>

                {/* TODO: 첨부파일 목록 표시 */}

                <Divider sx={{ my: 3 }} />
                {/* 추천/비추천/댓글 수 표시 및 액션 버튼 */}
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'text.secondary' }}>
                    <Box sx={{ display: 'flex', gap: 2 }}>
                        <Button
                            size="small"
                            startIcon={post.likedByCurrentUser ? <ThumbUpAltIcon /> : <ThumbUpAltOutlinedIcon />}
                            // onClick={handleLike}
                            disabled={!isLoggedIn /* || isLiking */}
                        >
                            추천 {post.likeCount}
                        </Button>
                        {/* <Button
                    size="small"
                    startIcon={post.dislikedByCurrentUser ? <ThumbDownAltIcon /> : <ThumbDownAltOutlinedIcon />}
                    onClick={handleDislike}
                    disabled={!isLoggedIn || isDisliking }
                >
                    비추천 {post.dislikeCount || 0}
                </Button> */}
                    </Box>
                    <Box sx={{display:'flex', alignItems:'center', gap:0.5}}>
                        <ChatBubbleOutlineOutlinedIcon sx={{fontSize:'1.1rem'}}/>
                        <Typography variant="body2">댓글 {post.commentCount || 0}</Typography>
                    </Box>
                </Box>

                {/* TODO: 댓글 목록 및 댓글 작성 폼 */}
                {/* <Divider sx={{ my: 3 }} />
        <Typography variant="h6" gutterBottom>댓글 ({post.commentCount || 0})</Typography>
        <List> ... 댓글 목록 ... </List>
        {isLoggedIn && <CommentForm postId={post.id} onSubmitSuccess={fetchComments} />} */}
            </Paper>

            {/* 삭제 확인 다이얼로그 */}
            <Dialog open={isConfirmDeleteDialogOpen} onClose={() => setIsConfirmDeleteDialogOpen(false)}>
                <DialogTitle>게시글 삭제</DialogTitle>
                <DialogContent><DialogContentText>정말로 이 게시글을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.</DialogContentText></DialogContent>
                <DialogActions>
                    <Button onClick={() => setIsConfirmDeleteDialogOpen(false)}>취소</Button>
                    <Button onClick={handleDeletePost} color="error">삭제</Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
};

export default BoardPostDetailPage;