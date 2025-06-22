import React, {useCallback, useState} from 'react';
import {
    Box,
    Typography,
    Tabs,
    Tab,
    Paper,
    CircularProgress,
    Alert,
    TextField,
    Button,
    Autocomplete, Avatar
} from '@mui/material';
import FriendList from '../components/friend/FriendList';
import ReceivedRequestList from '../components/friend/ReceivedRequestList';
import SentRequestList from '../components/friend/SentRequestList';
import {UserSearchResponse} from "../types/user";
import debounce from "lodash/debounce";
import api from "../services/api";

const FriendManagementPage: React.FC = () => {
    const [tabIndex, setTabIndex] = useState(0);

    // --- ★★★ 친구 검색 관련 state 추가 ★★★ ---
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState<UserSearchResponse[]>([]);
    const [loadingSearch, setLoadingSearch] = useState(false);
    const [searchStatus, setSearchStatus] = useState(''); // 검색 및 친구 신청 결과 메시지

    const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
        setTabIndex(newValue);
    };

    const searchUsers = useCallback(debounce(async (keyword: string) => {
        if (!keyword.trim()) {
            setSearchResults([]);
            return;
        }
        setLoadingSearch(true);
        setSearchStatus('');
        try {
            const response = await api.get<UserSearchResponse[]>(`/api/users/search?keyword=${keyword}`);
            setSearchResults(response.data);
        } catch (error) { console.error(error); }
        finally { setLoadingSearch(false); }
    }, 500), []);

    const handleFriendRequest = async (toUserId: number) => {
        setSearchStatus('...신청 처리 중...');
        try {
            await api.post(`/api/friends/request/${toUserId}`);
            setSearchStatus(`${searchResults.find(u => u.id === toUserId)?.name}님에게 친구 신청을 보냈습니다.`);
            // 성공 후 검색 결과에서 해당 유저 제거
            setSearchResults(prev => prev.filter(user => user.id !== toUserId));
        } catch (error: any) {
            setSearchStatus(error.response?.data?.message || '친구 신청에 실패했습니다.');
        }
    };

    return (
        <Paper sx={{ p: 3 }}>
            <Typography variant="h5" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
                친구 관리
            </Typography>

            {/* --- ★★★ 친구 검색/추가 UI 추가 ★★★ --- */}
            <Box sx={{ my: 3 }}>
                <Typography variant="h6" gutterBottom>친구 추가</Typography>
                <Autocomplete
                    options={searchResults}
                    getOptionLabel={(option) => option.name}
                    loading={loadingSearch}
                    onInputChange={(_, newInputValue) => searchUsers(newInputValue)}
                    noOptionsText="검색 결과가 없습니다."
                    renderOption={(props, option) => {
                        // --- ★★★ 이 부분을 수정합니다 ★★★ ---
                        // 1. props 객체에서 key를 구조 분해 할당으로 분리합니다.
                        const { key, ...otherProps } = props as any;

                        // 2. li 태그에는 key를 직접 전달하고, 나머지 props만 전개합니다.
                        return (
                            <li key={option.id} {...otherProps} style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    <Avatar src={option.profile} sx={{ width: 32, height: 32, mr: 1.5 }}/>
                                    <Typography>{option.name} ({option.email})</Typography>
                                </Box>
                                <Button
                                    variant="contained"
                                    size="small"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleFriendRequest(option.id);
                                    }}
                                >
                                    신청
                                </Button>
                            </li>
                        );
                        // ------------------------------------
                    }}
                    renderInput={(params) => (
                        <TextField
                            {...params}
                            label="이름 또는 이메일로 사용자 검색"
                            InputProps={{
                                ...params.InputProps,
                                endAdornment: (
                                    <>
                                        {loadingSearch ? <CircularProgress color="inherit" size={20} /> : null}
                                        {params.InputProps.endAdornment}
                                    </>
                                ),
                            }}
                        />
                    )}
                />
                {searchStatus && <Alert severity="info" sx={{mt: 1}}>{searchStatus}</Alert>}
            </Box>
            {/* ------------------------------------- */}

            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs value={tabIndex} onChange={handleTabChange}>
                    <Tab label="내 친구" />
                    <Tab label="받은 신청" />
                    <Tab label="보낸 신청" />
                </Tabs>
            </Box>
            <Box sx={{ pt: 3 }}>
                {tabIndex === 0 && <FriendList />}
                {tabIndex === 1 && <ReceivedRequestList />}
                {tabIndex === 2 && <SentRequestList />}
            </Box>
        </Paper>
    );
};

export default FriendManagementPage;