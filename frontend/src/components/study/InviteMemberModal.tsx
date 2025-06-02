import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Autocomplete,
  Chip,
  Box,
  Typography,
  Avatar,
  CircularProgress,
  Alert,
} from '@mui/material';
import api from '../../services/api';
import debounce from 'lodash/debounce';
import { AxiosError } from 'axios';

interface User {
  id: number;
  email: string;
  name: string;
  profile?: string;
}

interface InviteMemberModalProps {
  open: boolean;
  onClose: () => void;
  studyId: number;
  onInviteSuccess: () => void;
}

const InviteMemberModal: React.FC<InviteMemberModalProps> = ({
  open,
  onClose,
  studyId,
  onInviteSuccess,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchUsers = debounce(async (keyword: string) => {
    if (!keyword) {
      setSearchResults([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await api.get<User[]>(`/api/users/search?keyword=${keyword}`);
      setSearchResults(response.data.filter(user => 
        !selectedUsers.some(selected => selected.id === user.id)
      ));
    } catch (error) {
      console.error('사용자 검색 실패:', error);
      if ((error as AxiosError)?.response?.status === 401) {
        setError('로그인이 필요합니다. 다시 로그인해주세요.');
        window.location.href = '/login';
      } else {
        setError('사용자 검색에 실패했습니다. 다시 시도해주세요.');
      }
    } finally {
      setLoading(false);
    }
  }, 300);

  useEffect(() => {
    if (open) {
      searchUsers(searchTerm);
    }
    return () => {
      searchUsers.cancel();
    };
  }, [searchTerm, open]);

  const handleInvite = async () => {
    try {
      setError(null);
      await api.post(`/api/studies/${studyId}/invite`, 
        selectedUsers.map(user => user.id)  // 배열 형태로 직접 전송
      );
      onInviteSuccess();
      onClose();
      setSelectedUsers([]);
      setSearchTerm('');
    } catch (error) {
      console.error('초대 실패:', error);
      if ((error as AxiosError)?.response?.status === 401) {
        setError('로그인이 필요합니다. 다시 로그인해주세요.');
        window.location.href = '/login';
      } else {
        setError('멤버 초대에 실패했습니다. 다시 시도해주세요.');
      }
    }
  };

  const handleClose = () => {
    setSearchTerm('');
    setSearchResults([]);
    setError(null);
    onClose();
  };

  const getNameInitial = (name: string) => {
    return name ? name.charAt(0).toUpperCase() : '?';
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>멤버 초대</DialogTitle>
      <DialogContent>
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            초대할 멤버를 검색하여 선택해주세요.
          </Typography>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          <Box sx={{ mb: 2 }}>
            {selectedUsers.map((user) => (
              <Chip
                key={user.id}
                avatar={
                  <Avatar src={user.profile}>
                    {!user.profile && getNameInitial(user.name)}
                  </Avatar>
                }
                label={`${user.name} (${user.email})`}
                onDelete={() => 
                  setSelectedUsers(users => users.filter(u => u.id !== user.id))
                }
                sx={{ m: 0.5 }}
              />
            ))}
          </Box>
          <Autocomplete
            options={searchResults}
            getOptionLabel={(option) => `${option.name} (${option.email})`}
            value={null}
            onChange={(_, newValue) => {
              if (newValue) {
                setSelectedUsers(users => [...users, newValue]);
                setSearchTerm('');
              }
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                variant="outlined"
                placeholder="이메일 또는 이름으로 검색"
                onChange={(e) => setSearchTerm(e.target.value)}
                value={searchTerm}
                fullWidth
                InputProps={{
                  ...params.InputProps,
                  endAdornment: (
                    <>
                      {loading && <CircularProgress size={20} />}
                      {params.InputProps.endAdornment}
                    </>
                  ),
                }}
              />
            )}
            renderOption={(props, option) => {
              const { key, ...otherProps } = props;
              return (
                <li key={key} {...otherProps}>
                  <Box display="flex" alignItems="center" gap={1}>
                    <Avatar
                      src={option.profile}
                      sx={{ width: 32, height: 32 }}
                    >
                      {!option.profile && getNameInitial(option.name)}
                    </Avatar>
                    <Box>
                      <Typography variant="body1">{option.name}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {option.email}
                      </Typography>
                    </Box>
                  </Box>
                </li>
              );
            }}
            loading={loading}
            loadingText="검색중..."
            noOptionsText={
              searchTerm ? "검색 결과가 없습니다." : "이메일 또는 이름을 입력하세요."
            }
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>취소</Button>
        <Button
          onClick={handleInvite}
          variant="contained"
          color="primary"
          disabled={selectedUsers.length === 0 || loading}
        >
          {selectedUsers.length}명 초대하기
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default InviteMemberModal; 