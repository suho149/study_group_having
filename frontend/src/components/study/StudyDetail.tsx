import React from 'react';
import { 
  Box, 
  Grid, 
  Paper, 
  Typography, 
  Chip,
  Divider,
  Stack,
  IconButton,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import GroupAddIcon from '@mui/icons-material/GroupAdd';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import PersonIcon from '@mui/icons-material/Person';
import VisibilityIcon from '@mui/icons-material/Visibility';
import StudyMemberList from './StudyMemberList';

interface StudyDetailProps {
  study: {
    id: number;
    title: string;
    description: string;
    maxMembers: number;
    currentMembers: number;
    status: string;
    studyType: string;
    location: string;
    startDate: string;
    endDate: string;
    tags: string[];
    viewCount: number;
    leader: {
      id: number;
      name: string;
      imageUrl: string;
    };
    members: Array<{
      id: number;
      name: string;
      imageUrl: string;
      role: 'LEADER' | 'MEMBER';
      status: 'PENDING' | 'APPROVED' | 'REJECTED';
    }>;
  };
  isLeader: boolean;
  onInvite: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'RECRUITING':
      return 'success';
    case 'IN_PROGRESS':
      return 'info';
    case 'COMPLETED':
      return 'default';
    case 'CANCELLED':
      return 'error';
    default:
      return 'default';
  }
};

const getStatusText = (status: string) => {
  switch (status) {
    case 'RECRUITING':
      return '모집중';
    case 'IN_PROGRESS':
      return '진행중';
    case 'COMPLETED':
      return '완료';
    case 'CANCELLED':
      return '취소됨';
    default:
      return status;
  }
};

const StudyDetail: React.FC<StudyDetailProps> = ({
  study,
  isLeader,
  onInvite,
  onEdit,
  onDelete,
}) => {
  return (
    <Grid container spacing={3}>
      <Grid item xs={12} md={8}>
        <Paper sx={{ p: 3 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Box display="flex" alignItems="center" gap={2}>
              <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
                {study.title}
              </Typography>
              <Chip 
                label={getStatusText(study.status)}
                color={getStatusColor(study.status)}
                size="medium"
              />
            </Box>
            {isLeader && (
              <Stack direction="row" spacing={1}>
                <IconButton 
                  color="primary"
                  onClick={onInvite}
                  title="멤버 초대"
                >
                  <GroupAddIcon />
                </IconButton>
                <IconButton 
                  color="info"
                  onClick={onEdit}
                  title="스터디 수정"
                >
                  <EditIcon />
                </IconButton>
                <IconButton 
                  color="error"
                  onClick={onDelete}
                  title="스터디 삭제"
                >
                  <DeleteIcon />
                </IconButton>
              </Stack>
            )}
          </Box>
          
          <Divider sx={{ my: 2 }} />
          
          <Box sx={{ mb: 3 }}>
            <Typography variant="body1" sx={{ mb: 2, whiteSpace: 'pre-line' }}>
              {study.description}
            </Typography>
          </Box>

          <Box sx={{ mb: 3 }}>
            {study.tags.map((tag) => (
              <Chip
                key={tag}
                label={tag}
                sx={{ mr: 1, mb: 1 }}
                color="primary"
                variant="outlined"
              />
            ))}
          </Box>

          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Box display="flex" alignItems="center" mb={1}>
                <LocationOnIcon sx={{ mr: 1 }} color="action" />
                <Typography>{study.location}</Typography>
              </Box>
              <Box display="flex" alignItems="center" mb={1}>
                <CalendarTodayIcon sx={{ mr: 1 }} color="action" />
                <Typography>
                  {study.startDate} ~ {study.endDate}
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Box display="flex" alignItems="center" mb={1}>
                <PersonIcon sx={{ mr: 1 }} color="action" />
                <Typography>
                  {study.currentMembers}/{study.maxMembers}명
                </Typography>
              </Box>
              <Box display="flex" alignItems="center" mb={1}>
                <VisibilityIcon sx={{ mr: 1 }} color="action" />
                <Typography>조회수 {study.viewCount}</Typography>
              </Box>
            </Grid>
          </Grid>
        </Paper>
      </Grid>

      <Grid item xs={12} md={4} sx={{ display: 'flex', flexDirection: 'column' }}>
        <Paper sx={{ p: 3, flex: 1 }}>
          <StudyMemberList members={study.members} />
        </Paper>
      </Grid>
    </Grid>
  );
};

export default StudyDetail; 