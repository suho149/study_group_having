import React, { useState, useEffect, useCallback } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions, Button,
    TextField, Autocomplete, Box, Typography, Avatar, CircularProgress, Alert, ListItem, ListItemAvatar, ListItemText
} from '@mui/material';
import api from '../../services/api';
import { UserSearchResponse } from '../../types/user';
import debounce from 'lodash/debounce';
import { useNavigate } from 'react-router-dom';

interface NewDmModalProps {
    open: boolean;
    onClose: () => void;
}

const NewDmModal: React.FC<NewDmModalProps> = ({ open, onClose }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState<UserSearchResponse[]>([]);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    // 사용자 검색 로직 (디바운스 적용)
    const searchUsers = useCallback(debounce(async (keyword: string) => {
        if (!keyword.trim()) {
            setSearchResults([]);
            return;
        }
        setLoading(true);
        try {
            const response = await api.get<UserSearchResponse[]>(`/api/users/search?keyword=${keyword}`);
            setSearchResults(response.data);
        } catch (error) {
            console.error("User search failed:", error);
        } finally {
            setLoading(false);
        }
    }, 300), []);

    useEffect(() => {
        searchUsers(searchTerm);
    }, [searchTerm, searchUsers]);

    // 사용자를 선택했을 때의 핸들러
    const handleUserSelect = (user: UserSearchResponse | null) => {
        if (user) {
            onClose(); // 모달 먼저 닫기
            navigate(`/dm/new/${user.id}`); // 새 대화 시작 경로로 이동
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
            <DialogTitle>새 대화 시작</DialogTitle>
            <DialogContent>
                <Autocomplete
                    options={searchResults}
                    getOptionLabel={(option) => option.name}
                    loading={loading}
                    value={null}
                    onChange={(event, newValue) => handleUserSelect(newValue)}
                    onInputChange={(event, newInputValue) => setSearchTerm(newInputValue)}
                    renderInput={(params) => (
                        <TextField
                            {...params}
                            label="사용자 검색 (이름 또는 이메일)"
                            variant="outlined"
                            InputProps={{
                                ...params.InputProps,
                                endAdornment: (
                                    <>
                                        {loading ? <CircularProgress color="inherit" size={20} /> : null}
                                        {params.InputProps.endAdornment}
                                    </>
                                ),
                            }}
                        />
                    )}
                    renderOption={(props, option) => (
                        <ListItem {...props} key={option.id}>
                            <ListItemAvatar>
                                <Avatar src={option.profile} />
                            </ListItemAvatar>
                            <ListItemText primary={option.name} secondary={option.email} />
                        </ListItem>
                    )}
                />
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>취소</Button>
            </DialogActions>
        </Dialog>
    );
};

export default NewDmModal;