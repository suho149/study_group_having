import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Checkbox,
  CircularProgress,
  Box,
} from '@mui/material';
import axios from 'axios';
import { debounce } from 'lodash';

interface User {
  id: number;
  name: string;
  email: string;
  profile: string;
}

interface InviteMemberDialogProps {
  open: boolean;
  onClose: () => void;
  studyId: number;
}

const InviteMemberDialog: React.FC<InviteMemberDialogProps> = ({ open, onClose, studyId }) => {
  const [searchKeyword, setSearchKeyword] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(false);

  const searchUsers = debounce(async (keyword: string) => {
    if (!keyword.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      setLoading(true);
      const response = await axios.get<User[]>(`/api/users/search?keyword=${keyword}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      setSearchResults(response.data);
    } catch (error) {
      console.error('사용자 검색 실패:', error);
    } finally {
      setLoading(false);
    }
  }, 500);

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const keyword = event.target.value;
    setSearchKeyword(keyword);
    searchUsers(keyword);
  };

  const handleUserToggle = (userId: number) => {
    const newSelected = new Set(selectedUsers);
    if (selectedUsers.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedUsers(newSelected);
  };

  const handleInvite = async () => {
    try {
      await axios.post(
        `/api/studies/${studyId}/invite`,
        Array.from(selectedUsers),
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );
      onClose();
    } catch (error) {
      console.error('멤버 초대 실패:', error);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>멤버 초대</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          margin="dense"
          label="이메일 또는 이름으로 검색"
          type="text"
          fullWidth
          value={searchKeyword}
          onChange={handleSearchChange}
        />
        <List sx={{ mt: 2 }}>
          {loading ? (
            <Box display="flex" justifyContent="center" p={2}>
              <CircularProgress />
            </Box>
          ) : (
            searchResults.map((user) => (
              <ListItem
                key={user.id}
                button
                onClick={() => handleUserToggle(user.id)}
              >
                <Checkbox
                  checked={selectedUsers.has(user.id)}
                  tabIndex={-1}
                  disableRipple
                />
                <ListItemAvatar>
                  <Avatar src={user.profile} alt={user.name} />
                </ListItemAvatar>
                <ListItemText
                  primary={user.name}
                  secondary={user.email}
                />
              </ListItem>
            ))
          )}
        </List>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>취소</Button>
        <Button
          onClick={handleInvite}
          color="primary"
          disabled={selectedUsers.size === 0}
        >
          초대하기
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default InviteMemberDialog; 