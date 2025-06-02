import React, { useState, useEffect, useMemo } from 'react'; // useMemo 추가
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
  Snackbar, // 추가
  Alert,    // 추가
} from '@mui/material';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import StudyDetail from '../components/study/StudyDetail';
import InviteMemberModal from '../components/study/InviteMemberModal';

// 스터디 상세 정보 타입 (백엔드 응답 DTO와 일치해야 함)
interface StudyGroupDetail {
  id: number;
  title: string;
  description: string;
  maxMembers: number;
  currentMembers: number; // 승인된 멤버 수
  status: string;
  studyType: string;
  location: string;
  startDate: string;
  endDate: string;
  tags: string[];
  viewCount: number;
  leader: {
    id: number; // User ID
    name: string;
    imageUrl: string;
  };
  members: Array<{ // 이 배열의 각 요소가 MemberInStudyResponse 와 유사한 구조를 가져야 함
    id: number; // 사용자(User)의 ID
    name: string;
    profile: string;
    role: 'LEADER' | 'MEMBER';
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    // studyMemberId?: number; // 백엔드에서 내려준다면 사용 가능
  }>;
}

const StudyDetailPage = () => {
  const { id: studyIdParam } = useParams<{ id: string }>(); // id -> studyIdParam으로 변경 (혼동 방지)
  const studyId = Number(studyIdParam); // 숫자로 변환
  const navigate = useNavigate();
  const { currentUserId, isLoggedIn } = useAuth(); // isAuthenticated 추가
  const [study, setStudy] = useState<StudyGroupDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);

  // 참여 신청 관련 상태
  const [isApplying, setIsApplying] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error' | 'info' | 'warning'>('success');

  const fetchStudyDetail = async () => {
    if (!studyId) return;
    try {
      setLoading(true);
      setError(null); // 에러 초기화
      const response = await api.get<StudyGroupDetail>(`/api/studies/${studyId}`);
      setStudy(response.data);
    } catch (err: any) {
      console.error('Error fetching study detail:', err);
      setError(err.response?.data?.message || '스터디 정보를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudyDetail();
  }, [studyId]); // studyId 변경 시 다시 fetch

  const handleDelete = async () => {
    if (!study) return;
    try {
      await api.delete(`/api/studies/${study.id}`);
      setSnackbarMessage('스터디가 성공적으로 삭제되었습니다.');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
      navigate('/'); // 홈으로 이동
    } catch (err: any) {
      console.error('Error deleting study group:', err);
      setSnackbarMessage(err.response?.data?.message || '스터디 그룹 삭제에 실패했습니다.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    } finally {
      setIsDeleteDialogOpen(false);
    }
  };

  const handleApplyStudy = async () => {
    if (!study || !isLoggedIn || !currentUserId) {
      setSnackbarMessage('로그인이 필요하거나 스터디 정보가 없습니다.');
      setSnackbarSeverity('warning');
      setSnackbarOpen(true);
      return;
    }
    setIsApplying(true);
    try {
      await api.post(`/api/studies/${study.id}/apply`);
      setSnackbarMessage('스터디 참여 신청이 완료되었습니다. 스터디장의 승인을 기다려주세요.');
      setSnackbarSeverity('success');
      fetchStudyDetail(); // 신청 후 스터디 정보(멤버 목록 등) 새로고침
    } catch (err: any) {
      console.error('Error applying to study:', err);
      setSnackbarMessage(err.response?.data?.message || '스터디 참여 신청에 실패했습니다.');
      setSnackbarSeverity('error');
    } finally {
      setIsApplying(false);
      setSnackbarOpen(true);
    }
  };

  const handleCloseSnackbar = (event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbarOpen(false);
  };

  // 현재 로그인한 사용자의 스터디 멤버 정보 (상태: APPROVED, PENDING 등)
  const currentUserMemberInfo = useMemo(() => {
    if (!study || !currentUserId) return null;
    // study.members 배열의 id가 사용자(User)의 ID라고 가정
    return study.members.find(member => member.id === Number(currentUserId));
  }, [study, currentUserId]);

  if (loading) return <Typography sx={{ textAlign: 'center', mt: 4 }}>로딩 중...</Typography>;
  if (error) return <Typography color="error" sx={{ textAlign: 'center', mt: 4 }}>{error}</Typography>;
  if (!study) return <Typography sx={{ textAlign: 'center', mt: 4 }}>스터디 정보를 찾을 수 없습니다.</Typography>;

  const isLeader = study.leader.id === Number(currentUserId);
  const isMemberApproved = currentUserMemberInfo?.status === 'APPROVED';
  const isMemberPending = currentUserMemberInfo?.status === 'PENDING';

  // 참여 신청 버튼 활성화 조건:
  // 1. 로그인 상태여야 함 (isLoggedIn)
  // 2. 스터디장이 아니어야 함 (!isLeader)
  // 3. 이미 승인된 멤버가 아니어야 함 (!isMemberApproved)
  // 4. 이미 신청 후 대기중인 상태가 아니어야 함 (!isMemberPending)
  // 5. 스터디가 모집중(RECRUITING) 상태여야 함 (study.status === 'RECRUITING')
  // 6. 스터디 정원이 차지 않았어야 함 (study.currentMembers < study.maxMembers)
  const canApply = isLoggedIn &&
      !isLeader &&
      !isMemberApproved &&
      !isMemberPending &&
      study.status === 'RECRUITING' &&
      study.currentMembers < study.maxMembers;

  return (
      <Container maxWidth="lg">
        <Box sx={{ mt: 4, mb: 4 }}>
          <StudyDetail
              study={study}
              isLeader={isLeader}
              onInvite={() => setIsInviteModalOpen(true)}
              onEdit={() => navigate(`/studies/${study.id}/edit`)}
              onDelete={() => setIsDeleteDialogOpen(true)}
              // 참여 신청 관련 props 전달
              onApply={handleApplyStudy}
              isApplying={isApplying}
              canApply={canApply}
              isMemberApproved={isMemberApproved}
              isMemberPending={isMemberPending}
              isAuthenticated={isLoggedIn} // 인증 여부도 전달 (버튼 텍스트 등 분기처리용)
          />
        </Box>

        {study && ( // study가 로드된 후에 InviteMemberModal 렌더링
            <InviteMemberModal
                open={isInviteModalOpen}
                onClose={() => setIsInviteModalOpen(false)}
                studyId={study.id} // study.id 사용
                onInviteSuccess={fetchStudyDetail}
            />
        )}

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

        <Snackbar
            open={snackbarOpen}
            autoHideDuration={6000}
            onClose={handleCloseSnackbar}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert onClose={handleCloseSnackbar} severity={snackbarSeverity} sx={{ width: '100%' }}>
            {snackbarMessage}
          </Alert>
        </Snackbar>
      </Container>
  );
};

export default StudyDetailPage;