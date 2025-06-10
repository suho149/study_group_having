// src/components/board/CommentItem.tsx
import React, { useState } from 'react';
import {
    Box,
    Avatar,
    Typography,
    IconButton,
    Button,
    TextField,
    Menu,
    MenuItem,
    ListItem,
    ListItemText, List
} from '@mui/material';
import ThumbUpAltOutlinedIcon from '@mui/icons-material/ThumbUpAltOutlined';
import ThumbDownAltOutlinedIcon from '@mui/icons-material/ThumbDownAltOutlined';
import ReplyIcon from '@mui/icons-material/Reply';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { formatDistanceToNowStrict, parseISO } from 'date-fns';
import { ko } from 'date-fns/locale';
import { CommentDto } from '../../types/board';
import api from '../../services/api';
import LikeDislikeButtons from './LikeDislikeButtons';
import { VoteType } from '../../types/apiSpecificEnums';

interface CommentItemProps {
    comment: CommentDto;
    currentUserId: number | null;
    onReply: (comment: CommentDto) => void; // 대댓글 작성 시작 콜백
    onActionSuccess: () => void; // 수정/삭제/추천 성공 시 목록 새로고침 콜백
    isChild?: boolean; // 대댓글인지 여부 (스타일링용)
}

const CommentItem: React.FC<CommentItemProps> = ({
                                                     comment, currentUserId, onReply, onActionSuccess, isChild = false
                                                 }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editedContent, setEditedContent] = useState(comment.content);
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [showReplies, setShowReplies] = useState(false); // 대댓글 보기/숨기기
    const isAuthor = currentUserId === comment.author.id;

    const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => setAnchorEl(event.currentTarget);
    const handleMenuClose = () => setAnchorEl(null);

    const handleEdit = () => {
        setIsEditing(true);
        setEditedContent(comment.content); // 수정 시작 시 현재 내용으로 초기화
        handleMenuClose();
    };

    const handleSaveEdit = async () => {
        if (!editedContent.trim()) return;
        try {
            await api.put(`/api/board/comments/${comment.id}`, { content: editedContent });
            setIsEditing(false);
            onActionSuccess(); // 부모에게 알려 목록 새로고침
        } catch (error) {
            console.error("댓글 수정 실패:", error);
            alert("댓글 수정에 실패했습니다.");
        }
    };

    const handleDelete = async () => {
        if (!window.confirm("정말로 이 댓글을 삭제하시겠습니까?")) return;
        try {
            await api.delete(`/api/board/comments/${comment.id}`);
            onActionSuccess(); // 부모에게 알려 목록 새로고침
        } catch (error) {
            console.error("댓글 삭제 실패:", error);
            alert("댓글 삭제에 실패했습니다.");
        }
        handleMenuClose();
    };

    const handleCommentVoteSuccess = () => {
        // 댓글 투표 성공 시, 부모(BoardPostDetailPage)에게 알려 댓글 목록을 새로고침하게 할 수 있음
        // 또는 CommentItem이 받은 comment prop을 직접 업데이트 (더 복잡)
        // 여기서는 onEditSuccess와 유사하게 부모에게 알리는 방식을 가정 (예: onVoteSuccess prop 추가)
        console.log("Comment vote successful for comment ID:", comment.id);
        onActionSuccess(); // 임시로 onEditSuccess 사용 (목록 새로고침 유도)
                         // 또는 별도의 onVoteSuccess 콜백을 만들고 부모에서 처리
    };

    // TODO: handleLike, handleDislike 함수 구현 (추천/비추천 API 호출)

    if (comment.isDeleted) {
        return (
            <ListItem alignItems="flex-start" sx={{ pl: isChild ? 4 : 0, opacity: 0.7, borderBottom: '1px solid #f0f0f0', pb:1 }}>
                <ListItemText secondary="삭제된 댓글입니다." />
                {/* 삭제된 댓글이라도 대댓글은 보여주도록 처리 */}
                {comment.children && comment.children.length > 0 && (
                    <List sx={{ width:'100%', pt:1 }}>
                        {comment.children.map(childComment => (
                            <CommentItem key={childComment.id} comment={childComment} currentUserId={currentUserId} onReply={onReply} onActionSuccess={onActionSuccess} isChild />
                        ))}
                    </List>
                )}
            </ListItem>
        );
    }

    return (
        <ListItem alignItems="flex-start" sx={{ pl: isChild ? 4 : 0, flexDirection: 'column', mb:1, borderBottom: isChild ? 'none' : '1px solid #f0f0f0', pb:1 }}>
            <Box sx={{ display: 'flex', width: '100%', alignItems: 'center', mb: 0.5 }}>
                <Avatar
                    src={comment.author.profileImageUrl || undefined}
                    alt={comment.author.name}
                    sx={{ width: 28, height: 28, mr: 1 }}
                >
                    {!comment.author.profileImageUrl && comment.author.name ? comment.author.name[0] : null}
                </Avatar>
                <Typography variant="body2" sx={{ fontWeight: 'medium', mr: 1 }}>
                    {comment.author.name}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                    {formatDistanceToNowStrict(parseISO(comment.createdAt), { addSuffix: true, locale: ko })}
                </Typography>
                {isAuthor && !isEditing && ( // 자신의 댓글이고, 수정 중이 아닐 때만 메뉴 버튼 표시
                    <IconButton size="small" onClick={handleMenuOpen} sx={{ ml: 'auto' }}>
                        <MoreVertIcon fontSize="inherit" />
                    </IconButton>
                )}
            </Box>

            {isEditing ? (
                <Box sx={{ width: '100%', pl: 4.5 /* Avatar + margin */, mt:1 }}>
                    <TextField
                        fullWidth
                        multiline
                        variant="outlined"
                        size="small"
                        value={editedContent}
                        onChange={(e) => setEditedContent(e.target.value)}
                    />
                    <Box sx={{ mt: 1, textAlign: 'right' }}>
                        <Button size="small" onClick={() => setIsEditing(false)} sx={{mr:1}}>취소</Button>
                        <Button size="small" variant="contained" onClick={handleSaveEdit}>저장</Button>
                    </Box>
                </Box>
            ) : (
                <Typography variant="body2" sx={{ pl: 4.5, whiteSpace: 'pre-line' }}>
                    {comment.content}
                </Typography>
            )}

            {!isEditing && ( // 수정 중이 아닐 때만 답글/추천 버튼 표시
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1, pl: 4.5 /* 아바타 너비 + 간격 */ }}>
                    <Button size="small" startIcon={<ReplyIcon fontSize="inherit"/>} onClick={() => onReply(comment)}>
                        답글
                    </Button>
                    <LikeDislikeButtons
                        targetId={comment.id}
                        initialLikeCount={comment.likeCount}
                        initialDislikeCount={comment.dislikeCount}
                        initialUserVote={
                            comment.likedByCurrentUser ? VoteType.LIKE :
                                comment.dislikedByCurrentUser ? VoteType.DISLIKE : null
                        }
                        onVoteSuccess={handleCommentVoteSuccess}
                        targetType="comment"
                    />
                </Box>
            )}

            {/* 수정/삭제 메뉴 */}
            <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
                <MenuItem onClick={handleEdit}><EditIcon fontSize="small" sx={{mr:1}}/> 수정</MenuItem>
                <MenuItem onClick={handleDelete} sx={{color: 'error.main'}}><DeleteIcon fontSize="small" sx={{mr:1}}/> 삭제</MenuItem>
            </Menu>

            {/* 대댓글 목록 렌더링 */}
            {comment.children && comment.children.length > 0 && (
                <List sx={{ width:'100%', pt:1 }}>
                    {comment.children.map(childComment => (
                        <CommentItem
                            key={childComment.id}
                            comment={childComment}
                            currentUserId={currentUserId}
                            onReply={onReply}
                            onActionSuccess={onActionSuccess}
                            isChild // isChild prop을 true로 전달
                        />
                    ))}
                </List>
            )}
        </ListItem>
    );
};

export default CommentItem;