import React, { useState, useEffect } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField,
    Autocomplete, Chip, Box, Typography, Avatar, CircularProgress, Alert,
} from '@mui/material';
import api from '../../services/api';
import debounce from 'lodash/debounce';
import { AxiosError } from 'axios';
import { StudyMember } from '../../types/study'; // 스터디 멤버 타입

interface UserToInvite { // Autocomplete 옵션용
    id: number;
    name: string;
    email: string;
    profile?: string;
}

interface InviteToChatRoomModalProps {
    open: boolean;
    onClose: () => void;
    chatRoomId: number;
    studyGroupId: number; // 스터디 그룹 멤버를 가져오기 위함
    // currentChatMembers: ChatRoomMemberInfo[]; // 이미 채팅방에 있는 멤버 (중복 방지) -> API에서 처리 권장
    onInviteSuccess: () => void;
}

const InviteToChatRoomModal: React.FC<InviteToChatRoomModalProps> = ({
                                                                         open,
                                                                         onClose,
                                                                         chatRoomId,
                                                                         studyGroupId,
                                                                         // currentChatMembers,
                                                                         onInviteSuccess,
                                                                     }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [studyGroupMembers, setStudyGroupMembers] = useState<StudyMember[]>([]); // 스터디 그룹 전체 멤버
    const [availableToInvite, setAvailableToInvite] = useState<UserToInvite[]>([]); // 초대 가능한 멤버
    const [selectedUsers, setSelectedUsers] = useState<UserToInvite[]>([]);
    const [loadingSearch, setLoadingSearch] = useState(false);
    const [loadingInvite, setLoadingInvite] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // 스터디 그룹 멤버 목록 가져오기 (모달 열릴 때 한 번)
    useEffect(() => {
        if (open && studyGroupId) {
            const fetchStudyMembers = async () => {
                setLoadingSearch(true);
                try {
                    // 스터디 상세 정보 API를 통해 members 목록을 가져옴
                    const response = await api.get<{ members: StudyMember[] }>(`/api/studies/${studyGroupId}`);
                    // 현재 채팅방 멤버는 API에서 필터링하거나, 여기서 필터링할 수 있음
                    // 여기서는 모든 스터디 멤버를 가져와서 아래 search 로직에서 필터링한다고 가정
                    console.log("Fetched Study Members:", response.data.members); // <--- API 응답 데이터 확인용 로그
                    setStudyGroupMembers(response.data.members.filter(m => m.status === 'APPROVED'));
                } catch (e) {
                    console.error("Failed to fetch study group members", e);
                    setError("스터디 멤버 정보를 가져오는데 실패했습니다.");
                } finally {
                    setLoadingSearch(false);
                }
            };
            fetchStudyMembers();
        } else {
            // 모달 닫힐 때 상태 초기화
            setSearchTerm('');
            setStudyGroupMembers([]);
            setAvailableToInvite([]);
            setSelectedUsers([]);
            setError(null);
        }
    }, [open, studyGroupId]);


    // 검색어에 따라 초대 가능한 멤버 필터링 (디바운스 적용)
    const filterAvailableMembers = debounce((keyword: string, currentSelected: UserToInvite[]) => {
        if (!keyword.trim()) {
            setAvailableToInvite([]);
            return;
        }
        setLoadingSearch(true);
        const lowerKeyword = keyword.toLowerCase(); // 검색어를 미리 소문자로 변환
        // studyGroupMembers 중에서 검색하고, 이미 선택된 유저 제외, 이미 채팅방 멤버인 유저 제외
        const filtered = studyGroupMembers
            .filter(sgMember => {
                // 방어 코드: sgMember.name과 sgMember.email이 실제로 문자열인지 확인
                const nameMatch = typeof sgMember.name === 'string' && sgMember.name.toLowerCase().includes(lowerKeyword);
                const emailMatch = typeof sgMember.email === 'string' && sgMember.email.toLowerCase().includes(lowerKeyword);

                return (nameMatch || emailMatch) &&
                    !currentSelected.some(sel => sel.id === sgMember.id);
            })
            .map(sgMember => ({ // Autocomplete 옵션 형태로 변환
                id: sgMember.id,
                name: sgMember.name,
                email: (sgMember as any).email || '', // StudyMember 타입에 email이 없다면 추가 또는 (as any) 사용
                profile: sgMember.profile
            }));
        setAvailableToInvite(filtered);
        setLoadingSearch(false);
    }, 300);

    useEffect(() => {
        if (open) {
            filterAvailableMembers(searchTerm, selectedUsers);
        }
        return () => {
            filterAvailableMembers.cancel();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchTerm, open, selectedUsers, studyGroupMembers]); // filterAvailableMembers는 useCallback으로 감싸거나 의존성에서 제거


    const handleInvite = async () => {
        if (selectedUsers.length === 0) {
            setError("초대할 멤버를 선택해주세요.");
            return;
        }
        setLoadingInvite(true);
        setError(null);
        try {
            await api.post(`/api/chat/rooms/${chatRoomId}/invite-members`,
                selectedUsers.map(user => user.id)
            );
            onInviteSuccess();
            onClose(); // 성공 시 모달 닫기
        } catch (err: any) {
            console.error('채팅방 멤버 초대 실패:', err);
            setError(err.response?.data?.message || '멤버 초대에 실패했습니다.');
        } finally {
            setLoadingInvite(false);
        }
    };

    const handleClose = () => {
        // 상태 초기화는 useEffect [open]에서 처리
        onClose();
    };

    const getNameInitial = (name?: string) => name ? name.charAt(0).toUpperCase() : '?';

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
            <DialogTitle>채팅방에 멤버 초대</DialogTitle>
            <DialogContent>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                    이 스터디의 멤버 중에서 초대할 사람을 검색하세요.
                </Typography>
                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                <Box sx={{ mb: 2 }}>
                    {selectedUsers.map((user) => (
                        <Chip
                            key={user.id}
                            avatar={<Avatar src={user.profile}>{getNameInitial(user.name)}</Avatar>}
                            label={`${user.name} (${user.email})`}
                            onDelete={() => setSelectedUsers(users => users.filter(u => u.id !== user.id))}
                            sx={{ m: 0.5 }}
                        />
                    ))}
                </Box>
                <Autocomplete
                    options={availableToInvite}
                    getOptionLabel={(option) => `${option.name} (${option.email})`}
                    value={null} // 선택 시 바로 selectedUsers에 추가되므로 value는 null 유지
                    onInputChange={(_, newInputValue) => {
                        setSearchTerm(newInputValue);
                    }}
                    onChange={(_, newValue) => {
                        if (newValue) {
                            setSelectedUsers(users => {
                                if (!users.some(u => u.id === newValue.id)) { // 중복 선택 방지
                                    return [...users, newValue];
                                }
                                return users;
                            });
                            setSearchTerm(''); // 선택 후 검색창 비우기
                            setAvailableToInvite([]); // 선택 후 검색 결과 비우기
                        }
                    }}
                    renderInput={(params) => (
                        <TextField
                            {...params}
                            variant="outlined"
                            placeholder="이름 또는 이메일로 검색"
                            fullWidth
                            InputProps={{
                                ...params.InputProps,
                                endAdornment: (
                                    <>
                                        {loadingSearch && <CircularProgress size={20} />}
                                        {params.InputProps.endAdornment}
                                    </>
                                ),
                            }}
                        />
                    )}
                    renderOption={(props, option) => ( // props 타입 이슈 해결 위해 구조 분해 할당
                        <Box component="li" sx={{ '& > img': { mr: 2, flexShrink: 0 } }} {...props}>
                            <Avatar src={option.profile} sx={{ width: 32, height: 32, mr: 1 }}>
                                {getNameInitial(option.name)}
                            </Avatar>
                            <Box>
                                <Typography variant="body1">{option.name}</Typography>
                                <Typography variant="body2" color="text.secondary">{option.email}</Typography>
                            </Box>
                        </Box>
                    )}
                    loading={loadingSearch}
                    loadingText="검색중..."
                    noOptionsText={searchTerm.trim() ? "검색 결과가 없습니다." : "초대할 스터디 멤버의 이름 또는 이메일을 입력하세요."}
                    filterOptions={(x) => x} // 외부에서 필터링하므로 내부 필터링 비활성화
                    isOptionEqualToValue={(option, value) => option.id === value.id}
                />
            </DialogContent>
            <DialogActions>
                <Button onClick={handleClose}>취소</Button>
                <Button
                    onClick={handleInvite}
                    variant="contained"
                    color="primary"
                    disabled={selectedUsers.length === 0 || loadingInvite}
                >
                    {loadingInvite ? <CircularProgress size={24} color="inherit"/> : `${selectedUsers.length}명 초대`}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default InviteToChatRoomModal;