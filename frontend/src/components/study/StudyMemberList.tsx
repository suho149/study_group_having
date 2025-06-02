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
  // 스터디장을 먼저 찾고, 나머지 멤버들을 분리
  const leader = members.find(member => member.role === 'LEADER');
  const otherMembers = members
    .filter(member => member.role !== 'LEADER' && member.status === 'APPROVED')
    .sort((a, b) => a.name.localeCompare(b.name)); // 이름순 정렬
  const pendingMembers = members
    .filter(member => member.status === 'PENDING')
    .sort((a, b) => a.name.localeCompare(b.name));

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
    <List dense>
      {memberList.map((member) => (
        <React.Fragment key={member.id}>
          <ListItem alignItems="center">
            <ListItemAvatar>
              <Avatar 
                src={member.imageUrl}
                alt={member.name}
                sx={{ width: 32, height: 32 }}
              >
                {member.name[0]}
              </Avatar>
            </ListItemAvatar>
            <ListItemText
              primary={
                <Box display="flex" alignItems="center" gap={0.5} flexWrap="wrap">
                  <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                    {member.name}
                  </Typography>
                  <Chip
                    label={getMemberRoleText(member.role)}
                    size="small"
                    color={member.role === 'LEADER' ? 'primary' : 'default'}
                    variant="outlined"
                    sx={{ height: 20 }}
                  />
                  {showStatus && (
                    <Chip
                      label={member.status === 'PENDING' ? '대기중' : '승인됨'}
                      size="small"
                      color={getMemberStatusColor(member.status)}
                      sx={{ height: 20 }}
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
    <>
      <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
        스터디 구성원 ({otherMembers.length + 1}명)
      </Typography>
      
      {/* 스터디장 표시 */}
      {leader && (
        <List dense>
          <ListItem alignItems="center">
            <ListItemAvatar>
              <Avatar 
                src={leader.imageUrl}
                alt={leader.name}
                sx={{ 
                  width: 32, 
                  height: 32,
                  border: '2px solid',
                  borderColor: 'primary.main'
                }}
              >
                {leader.name[0]}
              </Avatar>
            </ListItemAvatar>
            <ListItemText
              primary={
                <Box display="flex" alignItems="center" gap={0.5} flexWrap="wrap">
                  <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                    {leader.name}
                  </Typography>
                  <Chip
                    label="스터디장"
                    size="small"
                    color="primary"
                    variant="outlined"
                    sx={{ height: 20 }}
                  />
                </Box>
              }
            />
          </ListItem>
          <Divider variant="inset" component="li" />
        </List>
      )}

      {/* 일반 멤버 표시 */}
      {renderMemberList(otherMembers)}

      {/* 대기 중인 멤버 표시 */}
      {pendingMembers.length > 0 && (
        <>
          <Typography variant="subtitle1" gutterBottom sx={{ mt: 2, fontWeight: 'bold' }}>
            대기 중인 멤버 ({pendingMembers.length}명)
          </Typography>
          {renderMemberList(pendingMembers, true)}
        </>
      )}
    </>
  );
};

export default StudyMemberList; 