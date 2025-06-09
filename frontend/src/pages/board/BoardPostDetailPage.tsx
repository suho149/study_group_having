// src/pages/board/BoardPostDetailPage.tsx
import React, {useState, useEffect, useCallback, useRef} from 'react';
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
import { BoardPostResponseDto } from '../../types/board'; // 상세 DTO 및 댓글 DTO 타입 필요
import { format, parseISO } from 'date-fns'; // 날짜 포맷용
import { ko } from 'date-fns/locale';
import VisibilityIcon from "@mui/icons-material/Visibility"; // 한국어 로케일
import { CommentDto, CommentCreateRequestDto } from '../../types/board';
import CommentItem from "../../components/board/CommentItem"; // CommentCreateRequestDto 추가
import LikeDislikeButtons from '../../components/board/LikeDislikeButtons';
import { VoteType } from '../../types/apiSpecificEnums';

const BoardPostDetailPage: React.FC = () => {
    const { postId } = useParams<{ postId: string }>();
    const navigate = useNavigate();
    const { isLoggedIn, currentUserId, isLoading: authLoading } = useAuth();
    const [post, setPost] = useState<BoardPostResponseDto | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isConfirmDeleteDialogOpen, setIsConfirmDeleteDialogOpen] = useState(false);

    // 댓글 관련
    const [comments, setComments] = useState<CommentDto[]>([]);
    const [loadingComments, setLoadingComments] = useState(false);
    const [commentError, setCommentError] = useState<string | null>(null);
    const [newComment, setNewComment] = useState('');
    const [replyToComment, setReplyToComment] = useState<CommentDto | null>(null); // 대댓글 대상
    const [isSubmittingComment, setIsSubmittingComment] = useState(false);
    const commentFormRef = useRef<HTMLFormElement>(null); // 댓글 작성 폼으로 스크롤하기 위함

    const fetchComments = useCallback(async (currentPage = 0) => { // 페이지 파라미터 추가
        if (!postId) return;
        setLoadingComments(true);
        setCommentError(null);
        try {
            const response = await api.get<{ content: CommentDto[], totalPages: number, number: number, last: boolean }>(
                `/api/board/posts/${postId}/comments`,
                { params: { page: currentPage, size: 10, sort: 'createdAt,asc' } } // 페이징 파라미터
            );
            // 여기서는 최상위 댓글만 가져오고, 대댓글은 CommentItem 내부에서 로드한다고 가정
            // 또는 백엔드 DTO에서 children을 포함하여 한 번에 가져올 수도 있음
            setComments(prev => currentPage === 0 ? response.data.content : [...prev, ...response.data.content]);
            // setHasMoreComments(!response.data.last); // 더보기 페이징 시 필요
        } catch (err: any) {
            console.error("댓글 목록 조회 실패:", err);
            setCommentError(err.response?.data?.message || "댓글을 불러오는데 실패했습니다.");
        } finally {
            setLoadingComments(false);
        }
    }, [postId]);

    useEffect(() => {
        if (post) { // 게시글 정보 로드 완료 후 댓글 로드
            fetchComments();
        }
    }, [post, fetchComments]); // post가 변경되면 댓글 다시 로드

    const handleCommentSubmit = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!newComment.trim() || !isLoggedIn || !currentUserId || !post) {
            setCommentError("댓글 내용을 입력해주세요 또는 로그인이 필요합니다.");
            return;
        }
        setIsSubmittingComment(true);
        setCommentError(null);

        const requestData: CommentCreateRequestDto = { // 타입 사용
            content: newComment,
            parentId: replyToComment ? replyToComment.id : undefined,
        };

        try {
            await api.post(`/api/board/posts/${post.id}/comments`, requestData);
            setNewComment('');
            setReplyToComment(null); // 대댓글 작성 후 초기화
            await fetchComments(); // 댓글 목록 새로고침 (가장 간단한 방법)
            // 또는 응답으로 받은 새 댓글을 로컬 상태에 추가 (더 나은 UX)
            // const newCommentData = response.data;
            // setComments(prev => [...prev, newCommentData]);
        } catch (err: any) {
            console.error("댓글 작성 실패:", err);
            setCommentError(err.response?.data?.message || "댓글 작성에 실패했습니다.");
        } finally {
            setIsSubmittingComment(false);
        }
    };

    const handleReplyToComment = (comment: CommentDto) => {
        setReplyToComment(comment);
        setNewComment(`@${comment.author.name} `); // 대댓글 시 멘션 효과 (선택적)
        commentFormRef.current?.scrollIntoView({ behavior: 'smooth' });
        // commentFormRef.current?.querySelector('textarea')?.focus(); // textarea에 포커스
    };

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

    const handlePostVoteSuccess = async () => {
        // 투표 성공 후 게시글 데이터를 다시 불러와서 정확한 likeCount, dislikedCount,
        // likedByCurrentUser, dislikedByCurrentUser를 반영 (가장 확실한 방법)
        // 또는 LikeDislikeButtons 내부에서 이미 낙관적 업데이트를 했다면,
        // 여기서는 추가 작업이 필요 없을 수도 있음.
        // 하지만 서버와 완벽한 동기화를 위해선 fetchPostDetail 호출 권장.
        if (postId) {
            await fetchPostDetail();
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
                    <LikeDislikeButtons
                        targetId={post.id}
                        initialLikeCount={post.likeCount}
                        initialDislikeCount={post.dislikeCount}
                        initialUserVote={
                            post.likedByCurrentUser ? VoteType.LIKE :
                                post.dislikedByCurrentUser ? VoteType.DISLIKE : null
                        }
                        onVoteSuccess={handlePostVoteSuccess}
                        targetType="post"
                    />
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

            {/* 댓글 목록 */}
            <Paper elevation={0} sx={{ mt: 3, p: { xs: 1, sm: 2 }, borderRadius: 2, bgcolor:'transparent' }}>
                <Typography variant="h6" gutterBottom sx={{mb:2}}>댓글</Typography>
                {loadingComments && comments.length === 0 ? (
                    <CircularProgress size={24} />
                ) : comments.length > 0 ? (
                    <List>
                        {comments.map(comment => (
                            <CommentItem
                                key={comment.id}
                                comment={comment}
                                currentUserId={currentUserId}
                                onReply={handleReplyToComment} // 대댓글 작성 시작 함수 전달
                                onDeleteSuccess={fetchComments} // 댓글 삭제 성공 시 목록 새로고침
                                onEditSuccess={fetchComments}   // 댓글 수정 성공 시 목록 새로고침
                            />
                        ))}
                    </List>
                ) : (
                    <Typography color="textSecondary" sx={{textAlign:'center', py:2}}>작성된 댓글이 없습니다.</Typography>
                )}
                {/* TODO: 댓글 더보기 페이징 UI */}
            </Paper>

            {/* 댓글 작성 폼 */}
            {isLoggedIn && (
                <Paper component="form" ref={commentFormRef} onSubmit={handleCommentSubmit} elevation={2} sx={{ mt: 3, p: 2, borderRadius: 2 }}>
                    <Typography variant="subtitle1" gutterBottom>
                        {replyToComment ? `${replyToComment.author.name}님에게 답글 작성 중...` : "댓글 작성"}
                        {replyToComment && <Button size="small" onClick={() => { setReplyToComment(null); setNewComment(''); }} sx={{ml:1}}>취소</Button>}
                    </Typography>
                    {commentError && <Alert severity="error" sx={{mb:1}} onClose={() => setCommentError(null)}>{commentError}</Alert>}
                    <TextField
                        fullWidth
                        multiline
                        rows={3}
                        variant="outlined"
                        placeholder="댓글을 입력하세요..."
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        required
                    />
                    <Button
                        type="submit"
                        variant="contained"
                        color="primary"
                        disabled={isSubmittingComment || !newComment.trim()}
                        sx={{ mt: 2 }}
                    >
                        {isSubmittingComment ? <CircularProgress size={24} color="inherit" /> : '댓글 등록'}
                    </Button>
                </Paper>
            )}

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