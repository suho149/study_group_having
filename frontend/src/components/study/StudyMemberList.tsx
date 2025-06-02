import React, { useState } from 'react';
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Button,
  Chip,
} from '@mui/material';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import InviteMemberModal from './InviteMemberModal';

interface StudyMember {
  id: number;
  user?: {
    id: number;
    name: string;
    email: string;
    profile?: string;
  };
  role: 'LEADER' | 'MEMBER';
  status: 'PENDING' | 'ACTIVE' | 'REJECTED';
}

interface StudyMemberListProps {
  studyId: number;
  members: StudyMember[];
  isLeader: boolean;
  onMemberUpdate: () => void;
}

const StudyMemberList: React.FC<StudyMemberListProps> = ({
  studyId,
  members = [],
  isLeader,
  onMemberUpdate,
}) => {
  const [inviteModalOpen, setInviteModalOpen] = useState(false);

  const getStatusColor = (status: string): "success" | "warning" | "error" | "default" => {
    switch (status) {
      case 'ACTIVE':
        return 'success';
      case 'PENDING':
        return 'warning';
      case 'REJECTED':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusText = (status: string): string => {
    switch (status) {
      case 'ACTIVE':
        return '활성';
      case 'PENDING':
        return '대기중';
      case 'REJECTED':
        return '거절됨';
      default:
        return status;
    }
  };

  const getNameInitial = (name?: string): string => {
    return name ? name.charAt(0).toUpperCase() : '?';
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6">
          참여 멤버 ({members.filter(m => m.status === 'ACTIVE').length}명)
        </Typography>
        {isLeader && (
          <Button
            variant="contained"
            color="primary"
            startIcon={<PersonAddIcon />}
            onClick={() => setInviteModalOpen(true)}
          >
            멤버 초대하기
          </Button>
        )}
      </Box>
      <List>
        {members.map((member) => (
          <ListItem
            key={member.id}
            secondaryAction={
              <Chip
                label={getStatusText(member.status)}
                color={getStatusColor(member.status)}
                size="small"
              />
            }
          >
            <ListItemAvatar>
              {member.user?.profile ? (
                <Avatar src={member.user.profile} alt={member.user.name} />
              ) : (
                <Avatar>{getNameInitial(member.user?.name)}</Avatar>
              )}
            </ListItemAvatar>
            <ListItemText
              primary={member.user?.name || '알 수 없는 사용자'}
              secondary={
                <>
                  {member.user?.email}
                  <Chip
                    label={member.role}
                    size="small"
                    variant="outlined"
                    sx={{ ml: 1 }}
                  />
                </>
              }
            />
          </ListItem>
        ))}
      </List>
      <InviteMemberModal
        open={inviteModalOpen}
        onClose={() => setInviteModalOpen(false)}
        studyId={studyId}
        onInviteSuccess={onMemberUpdate}
      />
    </Box>
  );
};

export default StudyMemberList; 