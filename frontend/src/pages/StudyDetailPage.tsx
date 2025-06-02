import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Box,
  Chip,
  Avatar,
  Divider,
  Grid,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import GroupIcon from '@mui/icons-material/Group';
import VisibilityIcon from '@mui/icons-material/Visibility';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import InviteMemberModal from '../components/study/InviteMemberModal';

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4),
  marginTop: theme.spacing(4),
  marginBottom: theme.spacing(4),
}));

const TagsContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  gap: theme.spacing(1),
  flexWrap: 'wrap',
  marginTop: theme.spacing(2),
  marginBottom: theme.spacing(2),
}));

const InfoItem = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
  marginBottom: theme.spacing(2),
  color: theme.palette.text.secondary,
}));

interface StudyGroupDetail {
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
  leader: {
    id: number;
    name: string;
    profile: string;
    email: string;
  };
  members: Array<{
    id: number;
    name: string;
    profile: string;
    role: string;
    status: string;
  }>;
  createdAt: string;
  modifiedAt: string;
  viewCount: number;
}

const StudyDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentUserId } = useAuth();
  const [study, setStudy] = useState<StudyGroupDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);

  const fetchStudyDetail = async () => {
    try {
      setLoading(true);
      const response = await axios.get<StudyGroupDetail>(
        `http://localhost:8080/api/studies/${id}`
      );
      setStudy(response.data);
      console.log('스터디 정보:', response.data);
      console.log('스터디 리더 ID:', response.data.leader.id);
      console.log('현재 사용자가 리더인가?', Number(currentUserId) === response.data.leader.id);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching study detail:', err);
      setError('스터디 정보를 불러오는데 실패했습니다.');
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log('현재 사용자 ID:', currentUserId);
  }, [currentUserId]);

  useEffect(() => {
    let mounted = true;

    const fetchData = async () => {
      if (mounted) {
        await fetchStudyDetail();
      }
    };

    fetchData();

    return () => {
      mounted = false;
    };
  }, [id, currentUserId]);

  const handleDelete = async () => {
    try {
      await axios.delete(`http://localhost:8080/api/studies/${id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      navigate('/');
    } catch (err) {
      console.error('Error deleting study group:', err);
      setError('스터디 그룹 삭제에 실패했습니다.');
    }
  };

  const handleInviteSuccess = () => {
    fetchStudyDetail();
  };

  // 현재 사용자가 스터디 그룹의 리더인지 확인
  const isLeader = study?.leader.id === Number(currentUserId);

  if (loading) return <Typography>로딩 중...</Typography>;
  if (error) return <Typography color="error">{error}</Typography>;
  if (!study) return <Typography>스터디 정보를 찾을 수 없습니다.</Typography>;

  return (
    <Container maxWidth="lg">
      <StyledPaper elevation={3}>
        <Grid container spacing={4}>
          <Grid item xs={12} md={8}>
            <Typography variant="h4" gutterBottom>
              {study.title}
            </Typography>
            
            <TagsContainer>
              {study.tags.map((tag) => (
                <Chip key={tag} label={tag} color="primary" variant="outlined" />
              ))}
            </TagsContainer>

            <Box sx={{ my: 3 }}>
              <InfoItem>
                <LocationOnIcon />
                <Typography>{study.location}</Typography>
              </InfoItem>
              <InfoItem>
                <CalendarTodayIcon />
                <Typography>
                  {new Date(study.startDate).toLocaleDateString()} ~ {new Date(study.endDate).toLocaleDateString()}
                </Typography>
              </InfoItem>
              <InfoItem>
                <GroupIcon />
                <Typography>
                  {study.currentMembers}/{study.maxMembers}명
                </Typography>
              </InfoItem>
              <InfoItem>
                <VisibilityIcon />
                <Typography>
                  조회수 {study.viewCount}
                </Typography>
              </InfoItem>
            </Box>

            <Divider sx={{ my: 3 }} />

            <Typography variant="h6" gutterBottom>
              스터디 소개
            </Typography>
            <Typography variant="body1" paragraph>
              {study.description}
            </Typography>
          </Grid>

          <Grid item xs={12} md={4}>
            <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                리더 정보
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar src={study.leader.profile} alt={study.leader.name} />
                <Box>
                  <Typography variant="subtitle1">{study.leader.name}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {study.leader.email}
                  </Typography>
                </Box>
              </Box>
            </Paper>

            <Paper elevation={2} sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                참여 멤버 ({study.currentMembers}명)
              </Typography>
              <List>
                {study.members.map((member) => (
                  <ListItem key={member.id}>
                    <ListItemAvatar>
                      <Avatar src={member.profile} alt={member.name} />
                    </ListItemAvatar>
                    <ListItemText
                      primary={member.name}
                      secondary={member.role}
                    />
                  </ListItem>
                ))}
              </List>
            </Paper>

            {!isLeader && currentUserId && (
              <Button
                variant="contained"
                color="primary"
                fullWidth
                sx={{ mt: 3 }}
                disabled={study.currentMembers >= study.maxMembers}
              >
                {study.currentMembers >= study.maxMembers ? '모집 완료' : '참여 신청하기'}
              </Button>
            )}

            {isLeader && (
              <Box sx={{ mb: 2 }}>
                <Button
                  variant="contained"
                  color="primary"
                  fullWidth
                  onClick={() => setIsInviteModalOpen(true)}
                  sx={{ mb: 1 }}
                >
                  멤버 초대하기
                </Button>
                <Button
                  variant="outlined"
                  color="error"
                  fullWidth
                  onClick={() => setIsDeleteDialogOpen(true)}
                >
                  스터디 삭제
                </Button>
              </Box>
            )}
          </Grid>
        </Grid>
      </StyledPaper>

      {/* 멤버 초대 모달 */}
      <InviteMemberModal
        open={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        studyId={Number(id)}
        onInviteSuccess={handleInviteSuccess}
      />

      {/* 삭제 확인 다이얼로그 */}
      <Dialog
        open={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
      >
        <DialogTitle>스터디 그룹 삭제</DialogTitle>
        <DialogContent>
          <Typography>
            정말로 이 스터디 그룹을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsDeleteDialogOpen(false)}>취소</Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            삭제
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default StudyDetailPage; 