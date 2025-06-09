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
    ListItemText
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

interface CommentItemProps {
    comment: CommentDto;
    currentUserId: number | null;
    onReply: (comment: CommentDto) => void; // 대댓글 작성 시작 콜백
    onDeleteSuccess: () => void; // 삭제 성공 시 부모에게 알림
    onEditSuccess: () => void;   // 수정 성공 시 부모에게 알림
    // isChild?: boolean; // 대댓글인지 여부 (스타일링용)
}

const CommentItem: React.FC<CommentItemProps> = ({
                                                     comment, currentUserId, onReply, onDeleteSuccess, onEditSuccess, // isChild
                                                 }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editedContent, setEditedContent] = useState(comment.content);
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
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
            onEditSuccess(); // 부모에게 알려 목록 새로고침
        } catch (error) {
            console.error("댓글 수정 실패:", error);
            alert("댓글 수정에 실패했습니다.");
        }
    };

    const handleDelete = async () => {
        if (!window.confirm("정말로 이 댓글을 삭제하시겠습니까?")) return;
        try {
            await api.delete(`/api/board/comments/${comment.id}`);
            onDeleteSuccess(); // 부모에게 알려 목록 새로고침
        } catch (error) {
            console.error("댓글 삭제 실패:", error);
            alert("댓글 삭제에 실패했습니다.");
        }
        handleMenuClose();
    };

    // TODO: handleLike, handleDislike 함수 구현 (추천/비추천 API 호출)

    if (comment.isDeleted) {
        return (
            <ListItem alignItems="flex-start" sx={{ pl: /*isChild ? 4 :*/ 0, opacity: 0.7 }}>
                <ListItemText secondary="삭제된 댓글입니다." />
            </ListItem>
        );
    }

    return (
        <ListItem alignItems="flex-start" sx={{ pl: /*isChild ? 4 :*/ 0, flexDirection: 'column', mb:1, borderBottom:'1px solid #f0f0f0', pb:1 }}>
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
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1, pl: 4 }}>
                    <Button size="small" startIcon={<ReplyIcon fontSize="inherit"/>} onClick={() => onReply(comment)}>
                        답글
                    </Button>
                    {/* TODO: 추천/비추천 버튼 (LikeDislikeButton 컴포넌트 사용) */}
                    {/* <Button size="small" startIcon={<ThumbUpAltOutlinedIcon fontSize="inherit"/>} >{comment.likeCount}</Button> */}
                    {/* <Button size="small" startIcon={<ThumbDownAltOutlinedIcon fontSize="inherit"/>} >{comment.dislikeCount}</Button> */}
                </Box>
            )}

            {/* 수정/삭제 메뉴 */}
            <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
                <MenuItem onClick={handleEdit}><EditIcon fontSize="small" sx={{mr:1}}/> 수정</MenuItem>
                <MenuItem onClick={handleDelete} sx={{color: 'error.main'}}><DeleteIcon fontSize="small" sx={{mr:1}}/> 삭제</MenuItem>
            </Menu>

            {/* TODO: 대댓글 목록 렌더링 (comment.children 사용) */}
            {/* {comment.children && comment.children.length > 0 && (
        <List sx={{ pl: 4 }}>
          {comment.children.map(childComment => (
            <CommentItem key={childComment.id} comment={childComment} ... isChild />
          ))}
        </List>
      )} */}
        </ListItem>
    );
};

export default CommentItem;