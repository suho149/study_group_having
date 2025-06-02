import React, { useState, useEffect } from 'react';
import { Container, Box, Grid, Paper, Typography, Button } from '@mui/material';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import InviteMemberModal from './InviteMemberModal';

interface StudyGroup {
  id: number;
  title: string;
  leader: {
    id: number;
  };
}

const StudyDetail: React.FC = () => {
  const { id } = useParams();
  const [studyGroup, setStudyGroup] = useState<StudyGroup | null>(null);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isLeader, setIsLeader] = useState(false);

  useEffect(() => {
    const fetchStudyGroup = async () => {
      try {
        const response = await axios.get(`/api/studies/${id}`);
        setStudyGroup(response.data);
        // 현재 사용자가 리더인지 확인
        const currentUserId = Number(localStorage.getItem('currentUserId'));
        setIsLeader(response.data.leader.id === currentUserId);
      } catch (error) {
        console.error('스터디 그룹 조회 실패:', error);
      }
    };
    fetchStudyGroup();
  }, [id]);

  const handleInviteSuccess = () => {
    // 스터디 그룹 정보 새로고침
    const fetchStudyGroup = async () => {
      try {
        const response = await axios.get(`/api/studies/${id}`);
        setStudyGroup(response.data);
      } catch (error) {
        console.error('스터디 그룹 조회 실패:', error);
      }
    };
    fetchStudyGroup();
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="h4" component="h1">
                  {studyGroup?.title}
                </Typography>
                {isLeader && (
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={() => setIsInviteModalOpen(true)}
                  >
                    멤버 초대
                  </Button>
                )}
              </Box>
              {/* ... rest of the existing code ... */}
            </Paper>
          </Grid>
        </Grid>
      </Box>
      <InviteMemberModal
        open={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        studyId={Number(id)}
        onInviteSuccess={handleInviteSuccess}
      />
    </Container>
  );
}; 