import React from 'react';
import {
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Typography,
  Paper,
  Chip,
  Box,
  Divider,
} from '@mui/material';

interface Member {
  id: number;
  name: string;
  imageUrl: string;
  role: 'LEADER' | 'MEMBER';
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
}

interface StudyMemberListProps {
  members: Member[];
}

const StudyMemberList: React.FC<StudyMemberListProps> = ({ members }) => {
  const approvedMembers = members.filter(member => member.status === 'APPROVED');
  const pendingMembers = members.filter(member => member.status === 'PENDING');

  const getMemberStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return 'success';
      case 'PENDING':
        return 'warning';
      case 'REJECTED':
        return 'error';
      default:
        return 'default';
    }
  };

  const getMemberRoleText = (role: string) => {
    return role === 'LEADER' ? '스터디장' : '스터디원';
  };

  const renderMemberList = (memberList: Member[], showStatus: boolean = false) => (
    <List>
      {memberList.map((member) => (
        <React.Fragment key={member.id}>
          <ListItem alignItems="center">
            <ListItemAvatar>
              <Avatar 
                src={member.imageUrl}
                alt={member.name}
                sx={{ width: 40, height: 40 }}
              >
                {member.name[0]}
              </Avatar>
            </ListItemAvatar>
            <ListItemText
              primary={
                <Box display="flex" alignItems="center" gap={1}>
                  <Typography variant="subtitle1">
                    {member.name}
                  </Typography>
                  <Chip
                    label={getMemberRoleText(member.role)}
                    size="small"
                    color={member.role === 'LEADER' ? 'primary' : 'default'}
                    variant="outlined"
                  />
                  {showStatus && (
                    <Chip
                      label={member.status === 'PENDING' ? '대기중' : '승인됨'}
                      size="small"
                      color={getMemberStatusColor(member.status)}
                    />
                  )}
                </Box>
              }
            />
          </ListItem>
          <Divider variant="inset" component="li" />
        </React.Fragment>
      ))}
    </List>
  );

  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        스터디 구성원 ({approvedMembers.length}명)
      </Typography>
      {renderMemberList(approvedMembers)}

      {pendingMembers.length > 0 && (
        <>
          <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
            대기 중인 멤버 ({pendingMembers.length}명)
          </Typography>
          {renderMemberList(pendingMembers, true)}
        </>
      )}
    </Paper>
  );
};

export default StudyMemberList; 