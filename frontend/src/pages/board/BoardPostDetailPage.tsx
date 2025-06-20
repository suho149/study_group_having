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
    DialogTitle, DialogContent, DialogContentText, Tooltip, Menu, MenuItem
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
import CommentForm from '../../components/board/CommentForm';
// --- Viewer 관련 import 추가 ---
import { Viewer } from '@toast-ui/react-editor';
import '@toast-ui/editor/dist/toastui-editor-viewer.css'; // 뷰어용 CSS
// 코드 하이라이팅 플러그인 (작성 페이지와 동일하게)
import 'prismjs/themes/prism.css';
import '@toast-ui/editor-plugin-code-syntax-highlight/dist/toastui-editor-plugin-code-syntax-highlight.css';
import codeSyntaxHighlight from '@toast-ui/editor-plugin-code-syntax-highlight';
import Prism from 'prismjs';
import ReportIcon from '@mui/icons-material/Report';
import ReportModal from '../../components/board/ReportModal';
import { ReportType } from '../../types/report';
import MoreVertIcon from "@mui/icons-material/MoreVert";

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

    // 페이징 관련 상태 추가
    const [commentPage, setCommentPage] = useState(0); // 현재 댓글 페이지 번호
    const [hasMoreComments, setHasMoreComments] = useState(true); // 더 불러올 댓글이 있는지
    const [loadingMoreComments, setLoadingMoreComments] = useState(false); // 더보기 로딩 상태

    const [isReportModalOpen, setIsReportModalOpen] = useState(false); // 게시글 신고 모달 상태

    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => setAnchorEl(event.currentTarget);
    const handleMenuClose = () => setAnchorEl(null);

    // fetchComments 함수를 페이징에 맞게 수정
    const fetchComments = useCallback(async (pageToFetch = 0, initialLoad = false) => {
        if (!postId) return;
        if (pageToFetch === 0 && initialLoad) { // 최초 로드 시에만 전체 로딩 표시
            setLoadingComments(true);
            setComments([]); // 목록 초기화
        } else { // 더보기 로드 시
            setLoadingMoreComments(true);
        }
        setCommentError(null);

        try {
            const response = await api.get<{
                content: CommentDto[];
                last: boolean; // 마지막 페이지인지 여부
            }>(`/api/board/posts/${postId}/comments`, {
                params: {
                    page: pageToFetch,
                    size: 10, // 페이지 당 댓글 수
                    sort: 'createdAt,asc',
                }
            });

            if (response.data && Array.isArray(response.data.content)) {
                const newComments = response.data.content;
                setComments(prevComments =>
                    pageToFetch === 0 ? newComments : [...prevComments, ...newComments]
                );
                setHasMoreComments(!response.data.last); // 마지막 페이지면 false
                setCommentPage(pageToFetch); // 현재 페이지 번호 업데이트
            } else {
                setComments([]);
            }
        } catch (err: any) {
            setCommentError(err.response?.data?.message || "댓글을 불러오는데 실패했습니다.");
        } finally {
            if (pageToFetch === 0 && initialLoad) setLoadingComments(false);
            setLoadingMoreComments(false);
        }
    }, [postId]); // postId가 변경될 때마다 함수가 새로 생성됨

    // 최초 마운트 또는 post 정보 로드 완료 시 첫 페이지 댓글 로드
    useEffect(() => {
        if (post) {
            fetchComments(0, true); // 첫 페이지(0)를 초기 로드
        }
    }, [post, fetchComments]);

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

    const handleCommentCreated = () => {
        setReplyToComment(null); // 대댓글 작성 후 상태 초기화
        fetchPostDetail(); // <--- 이 호출을 추가하여 post 상태를 갱신
        fetchComments(); // 댓글 목록 새로고침
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

    useEffect(() => {
        const fetchAndIncrementView = async () => {
            if (!postId) return;
            setLoading(true);
            setError(null);
            try {
                // 조회수 증가 API를 먼저 호출 (실패해도 게시글 조회는 시도)
                try {
                    // 이 API는 세션/쿠키 기반 중복 방지가 백엔드에서 필요할 수 있음
                    await api.patch(`/api/board/posts/${postId}/view`);
                } catch (viewError) {
                    console.warn("조회수 증가 API 호출 실패:", viewError);
                }
                // 게시글 상세 정보 조회
                const response = await api.get<BoardPostResponseDto>(`/api/board/posts/${postId}`);
                setPost(response.data);
            } catch (err: any) {
                setError(err.response?.data?.message || "게시글을 불러오는데 실패했습니다.");
            } finally {
                setLoading(false);
            }
        };
        fetchAndIncrementView();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [postId]); // postId가 변경될 때만 실행

    // 데이터를 새로고침하는 함수는 이제 조회수 증가 로직이 없음
    const refreshPostData = useCallback(async () => {
        if (!postId) return;
        try {
            const response = await api.get<BoardPostResponseDto>(`/api/board/posts/${postId}`);
            setPost(response.data);
        } catch (error) {
            console.error("게시글 데이터 새로고침 실패:", error);
        }
    }, [postId]);

    const handlePostVoteSuccess = useCallback(() => {
        refreshPostData();
    }, [refreshPostData]);


    // 댓글 작성/수정/삭제 성공 시 콜백 함수
    const handleCommentActionSuccess = () => {
        // 가장 간단한 방법: 첫 페이지만 다시 불러와서 최신 상태 반영
        // (만약 새 댓글이 2페이지에 추가된다면 이 방식으로는 바로 보이지 않을 수 있음)
        // 더 나은 방법: 새 댓글 객체를 API 응답으로 받아 comments 배열에 직접 추가
        fetchComments(0, true);
        fetchPostDetail(); // 게시글의 commentCount 업데이트를 위해
    };

    const handleLoadMoreComments = () => {
        if (!loadingMoreComments && hasMoreComments) {
            fetchComments(commentPage + 1); // 다음 페이지 로드
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

    // post.isBlinded가 true이면, 경고 메시지를 보여주고 렌더링을 중단합니다.
    if (post.isBlinded) {
        return (
            <Container maxWidth="md" sx={{ my: 4 }}>
                <Alert severity="warning" variant="filled">
                    관리자에 의해 숨김 처리된 게시물입니다.
                </Alert>
            </Container>
        );
    }

    const isAuthor = isLoggedIn && Number(currentUserId) === Number(post.author?.id);
    console.log("isAuthor is calculated as:", isAuthor);

    return (
        <Container maxWidth="md" sx={{ my: 4 }}>
            <Paper elevation={2} sx={{ p: { xs: 2, sm: 3, md: 4 }, borderRadius: 2 }}>
                <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Chip label={post.category} color="secondary" size="small" />
                    {isLoggedIn && ( // 로그인한 사용자에게만 더보기 메뉴가 보입니다.
                        <Box>
                            <Tooltip title="더보기">
                                <IconButton onClick={handleMenuOpen}>
                                    <MoreVertIcon />
                                </IconButton>
                            </Tooltip>
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

                {/* --- 기존 게시글 내용 부분을 Viewer 컴포넌트로 교체 --- */}
                <Box sx={{ mb: 4, fontSize: '1.05rem', lineHeight: 1.8, wordBreak: 'break-word' }}>
                    {post.content && (
                        <Viewer
                            initialValue={post.content}
                            plugins={[[codeSyntaxHighlight, { highlighter: Prism }]]}
                        />
                    )}
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
            </Paper>

            {/* 댓글 목록 */}
            <Paper elevation={0} sx={{ mt: 3, p: { xs: 1, sm: 2 }, borderRadius: 2, bgcolor:'transparent' }}>
                <Typography variant="h6" gutterBottom sx={{mb:2}}>
                    댓글 {post.commentCount || comments.length}
                </Typography>
                {loadingComments && comments.length === 0 ? (
                    <Box sx={{display: 'flex', justifyContent: 'center'}}><CircularProgress size={24} /></Box>
                ) : comments.length > 0 ? (
                    <>
                        <List>
                            {comments.map(comment => (
                                <CommentItem
                                    key={comment.id}
                                    comment={comment}
                                    currentUserId={currentUserId}
                                    onReply={handleReplyToComment}
                                    onActionSuccess={handleCommentActionSuccess} // 수정/삭제 성공 시 콜백 연결
                                />
                            ))}
                        </List>
                        {/* "댓글 더보기" 버튼 */}
                        {hasMoreComments && (
                            <Box sx={{ textAlign: 'center', mt: 2 }}>
                                <Button
                                    onClick={handleLoadMoreComments}
                                    disabled={loadingMoreComments}
                                    variant="outlined"
                                >
                                    {loadingMoreComments ? <CircularProgress size={20} /> : '댓글 더보기'}
                                </Button>
                            </Box>
                        )}
                    </>
                ) : (
                    <Typography color="textSecondary" sx={{textAlign:'center', py:2}}>작성된 댓글이 없습니다.</Typography>
                )}
                {commentError && <Alert severity="warning" sx={{mt:2}}>{commentError}</Alert>}
            </Paper>

            {/* 댓글 작성 폼 */}
            {isLoggedIn && (
                <CommentForm
                    key={replyToComment ? `reply-to-${replyToComment.id}` : 'new-comment'} // 대댓글 대상 변경 시 폼을 리셋하기 위해 key 사용
                    postId={post.id}
                    parentComment={replyToComment} // 대댓글 대상 정보 전달
                    onCancelReply={() => setReplyToComment(null)} // 대댓글 작성 취소 핸들러 전달
                    onSubmitSuccess={handleCommentActionSuccess} // 댓글 작성 성공 시 콜백 전달
                />
            )}

            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
            >
                {/* isAuthor가 true일 때만 수정/삭제를 보여주고, 아닐 때 신고를 보여줍니다. */}
                {isAuthor ? (
                    [
                        <MenuItem key="edit" onClick={() => { navigate(`/board/edit/${post.id}`); handleMenuClose(); }}>
                            <EditIcon fontSize="small" sx={{ mr: 1 }} /> 수정
                        </MenuItem>,
                        <MenuItem key="delete" onClick={() => { setIsConfirmDeleteDialogOpen(true); handleMenuClose(); }} sx={{ color: 'error.main' }}>
                            <DeleteIcon fontSize="small" sx={{ mr: 1 }} /> 삭제
                        </MenuItem>
                    ]
                ) : (
                    <MenuItem onClick={() => { setIsReportModalOpen(true); handleMenuClose(); }}>
                        <ReportIcon fontSize="small" sx={{ mr: 1 }}/> 신고하기
                    </MenuItem>
                )}
            </Menu>

            <ReportModal
                open={isReportModalOpen}
                onClose={() => setIsReportModalOpen(false)}
                reportType={ReportType.POST}
                targetId={post.id}
            />

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