import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  Box,
} from '@mui/material';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import StudyDetail from '../components/study/StudyDetail';
import InviteMemberModal from '../components/study/InviteMemberModal';

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
      const response = await api.get<StudyGroupDetail>(`/api/studies/${id}`);
      setStudy(response.data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching study detail:', err);
      setError('스터디 정보를 불러오는데 실패했습니다.');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudyDetail();
  }, [id]);

  const handleDelete = async () => {
    try {
      await api.delete(`/api/studies/${id}`);
      navigate('/');
    } catch (err) {
      console.error('Error deleting study group:', err);
      setError('스터디 그룹 삭제에 실패했습니다.');
    }
  };

  if (loading) return <Typography>로딩 중...</Typography>;
  if (error) return <Typography color="error">{error}</Typography>;
  if (!study) return <Typography>스터디 정보를 찾을 수 없습니다.</Typography>;

  const isLeader = study.leader.id === Number(currentUserId);

  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4, mb: 4 }}>
        <StudyDetail
          study={study}
          isLeader={isLeader}
          onInvite={() => setIsInviteModalOpen(true)}
          onEdit={() => navigate(`/studies/${id}/edit`)}
          onDelete={() => setIsDeleteDialogOpen(true)}
        />
      </Box>

      <InviteMemberModal
        open={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        studyId={Number(id)}
        onInviteSuccess={fetchStudyDetail}
      />

      <Dialog
        open={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
      >
        <DialogTitle>스터디 삭제</DialogTitle>
        <DialogContent>
          <DialogContentText>
            정말로 이 스터디를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
          </DialogContentText>
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