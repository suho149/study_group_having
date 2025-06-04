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
  Button, // 추가
  Dialog, // 추가
  DialogActions, // 추가
  DialogContent, // 추가
  DialogContentText, // 추가
  DialogTitle, // 추가
  CircularProgress, // 추가
  ChipProps, // 추가
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import GroupAddIcon from '@mui/icons-material/GroupAdd';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import PersonIcon from '@mui/icons-material/Person';
import VisibilityIcon from '@mui/icons-material/Visibility';
import HowToRegIcon from '@mui/icons-material/HowToReg'; // 참여 신청 아이콘
import LoginIcon from '@mui/icons-material/Login'; // 로그인 필요 아이콘
import StudyMemberList from './StudyMemberList'; // 이 컴포넌트의 members prop 타입도 확인 필요
import ExitToAppIcon from '@mui/icons-material/ExitToApp'; // 스터디 나가기 아이콘 (재활용)
import api from '../../services/api'; // api import 추가
import { useAuth } from '../../contexts/AuthContext'; // currentUserId 가져오기
import { StudyGroupDataType } from '../../types/study'; // <--- 수정

interface StudyDetailProps {
  study: StudyGroupDataType; // <--- 수정: 타입을 StudyGroupDataType으로 변경
  isLeader: boolean;
  onInvite: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onApply: () => void;
  isApplying: boolean;
  canApply: boolean;
  isMemberApproved: boolean;
  isMemberPending: boolean;
  isAuthenticated: boolean;
  fetchStudyDetail: () => void;
}

const getStatusColor = (status: string): ChipProps['color'] => { // ChipProps['color'] 타입 사용
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

const StudyDetailComponent: React.FC<StudyDetailProps> = ({ // 컴포넌트 이름을 StudyDetailComponent로 변경 (선택 사항)
                                                            study,
                                                            isLeader,
                                                            onInvite,
                                                            onEdit,
                                                            onDelete,
                                                            onApply,
                                                            isApplying,
                                                            canApply,
                                                            isMemberApproved,
                                                            isMemberPending,
                                                            isAuthenticated,
                                                            fetchStudyDetail,
                                                          }) => {
  const { currentUserId } = useAuth();
  const [isLeaveConfirmOpen, setIsLeaveConfirmOpen] = React.useState(false);
  const [isLeaving, setIsLeaving] = React.useState(false);

  const handleOpenLeaveConfirm = () => setIsLeaveConfirmOpen(true);
  const handleCloseLeaveConfirm = () => setIsLeaveConfirmOpen(false);

  const handleLeaveStudy = async () => {
    if (!study || !currentUserId) return;
    setIsLeaving(true);
    try {
      await api.delete(`/api/studies/${study.id}/members/leave`);
      await fetchStudyDetail();
    } catch (error: any) {
      console.error('Error leaving study:', error);
      alert(error.response?.data?.message || '스터디 탈퇴 중 오류가 발생했습니다.');
    } finally {
      setIsLeaving(false);
      setIsLeaveConfirmOpen(false);
    }
  };

  const renderActionButtons = () => {
    if (isLeader) {
      return (
          <>
            <IconButton color="primary" onClick={onInvite} title="멤버 초대">
              <GroupAddIcon />
            </IconButton>
            <IconButton color="info" onClick={onEdit} title="스터디 수정">
              <EditIcon />
            </IconButton>
            <IconButton color="error" onClick={onDelete} title="스터디 삭제">
              <DeleteIcon />
            </IconButton>
          </>
      );
    }

    // 스터디장이 아닐 경우
    if (!isAuthenticated) {
      return (
          <Button
              variant="outlined"
              color="primary"
              startIcon={<LoginIcon />}
              onClick={() => { /* 로그인 페이지로 이동하는 로직 추가 필요 */
                // 예: navigate('/login', { state: { from: location.pathname } });
                // 이 컴포넌트에서 navigate를 직접 사용하려면 props로 받거나 HOC 사용
                // 또는 부모 컴포넌트에서 로그인 페이지 이동 함수를 받아 호출
                alert('로그인이 필요한 기능입니다.'); // 임시
              }}
          >
            로그인 후 신청
          </Button>
      );
    }

    // // 스터디장이 아닐 경우
    // if (!isAuthenticated) {
    //   return (
    //       <Button
    //           variant="outlined"
    //           color="primary"
    //           startIcon={<LoginIcon />}
    //           onClick={() => alert('로그인이 필요한 기능입니다.')} // 실제로는 로그인 페이지 이동
    //       >
    //         로그인 후 신청
    //       </Button>
    //   );
    // }

    // 현재 사용자가 승인된 멤버이고, 스터디장이 아닌 경우 "스터디 나가기" 버튼 표시
    if (isMemberApproved && !isLeader) {
      return (
          <Button
              variant="outlined"
              color="error"
              startIcon={isLeaving ? <CircularProgress size={20} color="inherit" /> : <ExitToAppIcon />}
              onClick={handleOpenLeaveConfirm}
              disabled={isLeaving}
          >
            {isLeaving ? '나가는 중...' : '스터디 나가기'}
          </Button>
      );
    }

    if (isMemberApproved) {
      return <Chip label="참여중" color="success" variant="outlined" size="medium" />;
    }
    if (isMemberPending) {
      return <Chip label="승인 대기중" color="warning" variant="outlined" size="medium" />;
    }
    if (canApply) {
      return (
          <Button
              variant="contained"
              color="primary"
              startIcon={isApplying ? <CircularProgress size={20} color="inherit" /> : <HowToRegIcon />}
              onClick={onApply}
              disabled={isApplying} // canApply 조건에서 이미 다른 disabled 조건들은 체크됨
          >
            {isApplying ? '신청 처리중...' : '참여 신청하기'}
          </Button>
      );
    }

    // 참여 신청 불가 사유 표시
    if (study.status !== 'RECRUITING') {
      return <Chip label="모집 마감" color="default" variant="outlined" size="medium" />;
    }
    if (study.currentMembers >= study.maxMembers) {
      return <Chip label="정원 마감" color="default" variant="outlined" size="medium" />;
    }
    // 기타 참여 불가 사유 (예: 이미 거절된 경우 등 - 현재 로직에서는 거절 시 멤버에서 제거되므로 이 경우는 잘 없음)
    // 이 외의 canApply가 false인 경우는 보통 로그인 안했거나, 이미 멤버거나, 이미 신청중인 경우임
    return <Chip label="참여 조건 미충족" color="default" variant="outlined" size="medium" />;
  };

  return (
      <> {/* Fragment 추가 */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, borderRadius: 2 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Box display="flex" alignItems="center" gap={1.5}>
                <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
                  {study.title}
                </Typography>
                <Chip
                    label={getStatusText(study.status)}
                    color={getStatusColor(study.status)}
                    size="medium"
                    sx={{ fontWeight: 500 }}
                />
              </Box>
              <Stack direction="row" spacing={0.5}> {/* 버튼 간 간격 조정 */}
                {renderActionButtons()}
              </Stack>
            </Box>

            <Divider sx={{ my: 2.5 }} />

            <Box sx={{ mb: 3, minHeight: 100 /* 내용 길이에 따른 높이 확보 */ }}>
              <Typography variant="body1" sx={{ whiteSpace: 'pre-line', lineHeight: 1.8 }}>
                {study.description}
              </Typography>
            </Box>

            <Box sx={{ mb: 3 }}>
              {study.tags.map((tag) => (
                  <Chip
                      key={tag}
                      label={`#${tag}`} // 태그 앞에 # 추가
                      sx={{ mr: 0.8, mb: 0.8, fontSize: '0.8rem' }}
                      color="primary"
                      variant="outlined"
                      size="small"
                  />
              ))}
            </Box>

            <Grid container spacing={2} sx={{ color: 'text.secondary' }}>
              <Grid item xs={12} sm={6}>
                <Box display="flex" alignItems="center" mb={1}>
                  <LocationOnIcon sx={{ mr: 1 }} fontSize="small" />
                  <Typography variant="body2">{study.location}</Typography>
                </Box>
                <Box display="flex" alignItems="center" mb={1}>
                  <CalendarTodayIcon sx={{ mr: 1 }} fontSize="small" />
                  <Typography variant="body2">
                    {new Date(study.startDate).toLocaleDateString()} ~ {study.endDate ? new Date(study.endDate).toLocaleDateString() : '미정'}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Box display="flex" alignItems="center" mb={1}>
                  <PersonIcon sx={{ mr: 1 }} fontSize="small" />
                  <Typography variant="body2">
                    멤버: {study.currentMembers} / {study.maxMembers} 명
                  </Typography>
                </Box>
                <Box display="flex" alignItems="center" mb={1}>
                  <VisibilityIcon sx={{ mr: 1 }} fontSize="small" />
                  <Typography variant="body2">조회수 {study.viewCount}</Typography>
                </Box>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4} sx={{ display: 'flex', flexDirection: 'column' }}>
          <Paper sx={{ p: 3, flex: 1, borderRadius: 2 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>스터디 멤버</Typography>
            {/* StudyMemberList에 members props가 어떻게 전달되고 사용되는지 확인 필요.
              onMemberUpdate는 멤버 상태 변경(승인/거절) UI가 StudyMemberList 내부에 있을 경우 사용됨.
              현재 요청은 참여 신청 알림까지이므로, 스터디장이 알림을 보고 멤버 관리 페이지로 이동하여 처리하는 흐름을 가정.
              만약 StudyMemberList에서 PENDING 멤버 승인/거절 기능을 넣는다면 추가 개발 필요.
           */}
            <StudyMemberList
                members={study.members}
                isLeaderView={isLeader}
                studyId={study.id}
                onMemberStatusChange={fetchStudyDetail} // 멤버 상태 변경(예: 스터디장이 PENDING 멤버 승인/거절) 후 부모 컴포넌트에 알림 (데이터 새로고침용)
                // onApply는 현재 참여 신청 함수인데, 재활용 또는 별도 함수 필요
            />
          </Paper>
        </Grid>
      </Grid>
        {/* 스터디 나가기 확인 다이얼로그 */}
        <Dialog
            open={isLeaveConfirmOpen}
            onClose={handleCloseLeaveConfirm}
        >
          <DialogTitle>스터디 나가기</DialogTitle>
          <DialogContent>
            <DialogContentText>
              정말로 '{study.title}' 스터디에서 나가시겠습니까? 이 작업은 되돌릴 수 없습니다.
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseLeaveConfirm} disabled={isLeaving}>취소</Button>
            <Button onClick={handleLeaveStudy} color="error" variant="contained" disabled={isLeaving}>
              {isLeaving ? <CircularProgress size={20} color="inherit" /> : '나가기'}
            </Button>
          </DialogActions>
        </Dialog>
      </>
  );
};

export default StudyDetailComponent;