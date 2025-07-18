import React, { useState, useEffect } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField,
    List, ListItem, ListItemAvatar, Avatar, ListItemText, Checkbox, Typography, Box,
    CircularProgress, ListItemButton
} from '@mui/material';
import api from '../../services/api';
import { UserSummaryDto } from '../../types/user'; // UserSummaryDto 타입 정의 필요
import { StudyMember } from '../../types/study'; // StudyGroupDetail 타입 정의 필요 (멤버 목록 가져오기 위함)
import { ChatRoomCreateRequest } from '../../types/chat'; // ChatRoomCreateRequest 타입 정의 필요
import { useAuth } from '../../contexts/AuthContext'; // <--- useAuth import 추가

interface CreateChatRoomModalProps {
    open: boolean;
    onClose: () => void;
    studyGroupId: number;
    studyGroupMembers: StudyMember[]; // 스터디 그룹의 멤버 목록
    onCreateSuccess: (newChatRoomId: number) => void; // 생성 성공 시 콜백
}

const CreateChatRoomModal: React.FC<CreateChatRoomModalProps> = ({
                                                                     open,
                                                                     onClose,
                                                                     studyGroupId,
                                                                     studyGroupMembers, // 스터디의 전체 멤버 (UserSummaryDto[] 와 유사한 형태)
                                                                     onCreateSuccess,
                                                                 }) => {
    const { currentUserId } = useAuth(); // <--- 현재 로그인한 사용자 ID 가져오기
    const [chatRoomName, setChatRoomName] = useState('');
    const [selectedMemberIds, setSelectedMemberIds] = useState<number[]>([]);
    const [isCreating, setIsCreating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // 스터디 멤버 중에서 APPROVED 상태이고, 현재 로그인한 사용자가 아닌 멤버만 필터링
    const availableMembersToInvite = studyGroupMembers.filter(
        (member) => member.status === 'APPROVED' && member.id !== currentUserId // <--- 수정: currentUserId 제외 조건 추가
    );

    const handleToggleMember = (userId: number) => {
        // selectedMemberIds 상태 업데이트 로직 확인
        setSelectedMemberIds((prevSelectedIds) => {
            if (prevSelectedIds.includes(userId)) {
                return prevSelectedIds.filter(id => id !== userId);
            } else {
                return [...prevSelectedIds, userId];
            }
        });
    };

    const handleSubmit = async () => {
        if (!chatRoomName.trim()) {
            setError('채팅방 이름을 입력해주세요.');
            return;
        }

        // 초대할 멤버가 없어도 채팅방 생성은 가능하도록 할 수 있음 (정책에 따라)
        // 여기서는 최소 1명 초대하도록 유지 (또는 생성자만 있는 방)
        if (selectedMemberIds.length === 0) {
            setError('초대할 멤버를 1명 이상 선택해주세요.');
            return;
        }
        setError(null);
        setIsCreating(true);

        const requestData: ChatRoomCreateRequest = {
            name: chatRoomName,
            invitedMemberIds: selectedMemberIds,
        };

        try {
            const response = await api.post<{ id: number }>(`/api/chat/study-group/${studyGroupId}/rooms`, requestData);
            onCreateSuccess(response.data.id); // 생성된 채팅방 ID 전달
            handleModalClose();
        } catch (err: any) {
            console.error('Error creating chat room:', err);
            setError(err.response?.data?.message || '채팅방 생성에 실패했습니다.');
        } finally {
            setIsCreating(false);
        }
    };

    const handleModalClose = () => {
        setChatRoomName('');
        setSelectedMemberIds([]);
        setError(null);
        onClose();
    };

    return (
        <Dialog open={open} onClose={handleModalClose} maxWidth="xs" fullWidth>
            <DialogTitle>새로운 채팅방 만들기</DialogTitle>
            <DialogContent dividers>
                <TextField
                    autoFocus
                    margin="dense"
                    label="채팅방 이름"
                    type="text"
                    fullWidth
                    variant="outlined"
                    value={chatRoomName}
                    onChange={(e) => setChatRoomName(e.target.value)}
                    error={!!error && error.includes("이름")}
                    helperText={error && error.includes("이름") ? error : ""}
                    sx={{ mb: 2 }}
                />
                <Typography variant="subtitle2" gutterBottom sx={{mt:1}}>멤버 초대 (현재 스터디 멤버)</Typography>
                {availableMembersToInvite.length === 0 ? (
                    <Typography color="textSecondary">초대할 수 있는 스터디 멤버가 없습니다.</Typography>
                ) : (
                    <List dense sx={{ maxHeight: 300, overflow: 'auto', border: '1px solid #eee', borderRadius:1 }}>
                        {availableMembersToInvite.map((member) => {
                            const labelId = `checkbox-list-label-${member.id}`;
                            return (
                                // ListItem의 button prop 대신 ListItemButton 컴포넌트 사용 또는 onClick 이벤트 전파 방지
                                <ListItem
                                    key={member.id}
                                    secondaryAction={
                                        <Checkbox
                                            edge="end"
                                            onChange={() => handleToggleMember(member.id)} // Checkbox 클릭 시에도 토글
                                            checked={selectedMemberIds.includes(member.id)}
                                            inputProps={{ 'aria-labelledby': labelId }}
                                        />
                                    }
                                    disablePadding // ListItemButton 사용 시 필요할 수 있음
                                >
                                    {/* ListItemButton으로 감싸서 전체 영역 클릭 가능하게 */}
                                    <ListItemButton role={undefined} onClick={() => handleToggleMember(member.id)} dense>
                                        <ListItemAvatar>
                                            <Avatar src={member.profile || undefined} alt={member.name} sx={{width:32, height:32}}>
                                                {!member.profile && member.name[0]}
                                            </Avatar>
                                        </ListItemAvatar>
                                        <ListItemText id={labelId} primary={member.name} />
                                    </ListItemButton>
                                </ListItem>
                            );
                        })}
                    </List>
                )}
                {error && !error.includes("이름") && (
                    <Typography color="error" variant="caption" sx={{ mt: 1, display: 'block' }}>
                        {error}
                    </Typography>
                )}
            </DialogContent>
            <DialogActions sx={{ p: '16px 24px' }}>
                <Button onClick={handleModalClose} color="inherit" disabled={isCreating}>취소</Button>
                <Button onClick={handleSubmit} variant="contained" color="primary" disabled={isCreating}>
                    {isCreating ? <CircularProgress size={24} color="inherit" /> : '만들기'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default CreateChatRoomModal;