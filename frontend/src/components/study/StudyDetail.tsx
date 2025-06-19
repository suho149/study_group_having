import React, {useEffect, useState} from 'react';
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
  ChipProps,
  Tooltip, // 추가
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
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import {useNavigate} from "react-router-dom";
import ReportIcon from '@mui/icons-material/Report';
import ReportModal from '../board/ReportModal'; // 경로 확인
import { ReportType } from '../../types/report';

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
  const { isLoggedIn, currentUserId } = useAuth();
  const [isLeaveConfirmOpen, setIsLeaveConfirmOpen] = React.useState(false);
  const [isLeaving, setIsLeaving] = React.useState(false);
  const navigate = useNavigate();
  // 좋아요 관련 상태 (부모 StudyDetailPage에서 study 객체를 통해 초기값 받음)
  const [isLikedState, setIsLikedState] = useState(study.liked);
  const [likeCountState, setLikeCountState] = useState(study.likeCount);
  const [isLiking, setIsLiking] = useState(false);

  const handleOpenLeaveConfirm = () => setIsLeaveConfirmOpen(true);
  const handleCloseLeaveConfirm = () => setIsLeaveConfirmOpen(false);

  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  // study prop이 변경될 때 좋아요 상태 동기화
  useEffect(() => {
    setIsLikedState(study.liked);
    setLikeCountState(study.likeCount);
  }, [study.liked, study.likeCount]);

  const handleLikeToggle = async () => {
    if (!isLoggedIn) { /* ... 로그인 유도 ... */ return; }
    if (isLiking) return;
    setIsLiking(true);
    try {
      if (isLikedState) {
        await api.delete(`/api/studies/${study.id}/unlike`);
        setIsLikedState(false);
        setLikeCountState(prev => prev - 1);
      } else {
        await api.post(`/api/studies/${study.id}/like`);
        setIsLikedState(true);
        setLikeCountState(prev => prev + 1);
      }
      // 상세 페이지에서는 fetchStudyDetail을 호출하여 전체 study 객체를 갱신하는 것이 좋을 수 있음
      // await fetchStudyDetail(); // 이렇게 하면 위 로컬 상태 업데이트는 불필요
    } catch (error: any) { /* ... 에러 처리 ... */ }
    finally { setIsLiking(false); }
  };

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
    // 1. 스터디장일 경우: 관리 메뉴 반환
    if (isLeader) {
      return (
          <>
            <Tooltip title="멤버 초대">
              <IconButton color="primary" onClick={onInvite}><GroupAddIcon /></IconButton>
            </Tooltip>
            <Tooltip title="스터디 수정">
              <IconButton color="info" onClick={onEdit}><EditIcon /></IconButton>
            </Tooltip>
            <Tooltip title="스터디 삭제">
              <IconButton color="error" onClick={onDelete}><DeleteIcon /></IconButton>
            </Tooltip>
          </>
      );
    }

    // 2. 비로그인 사용자
    if (!isAuthenticated) {
      return <Button variant="outlined" startIcon={<LoginIcon />} onClick={() => navigate('/login')}>로그인 후 신청</Button>;
    }

    // 3. 로그인한 비-리더 사용자 (신고 버튼은 여기서 제외)
    if (isMemberApproved) {
      return <Button variant="outlined" color="error" startIcon={isLeaving ? <CircularProgress size={20}/> : <ExitToAppIcon />} onClick={handleOpenLeaveConfirm} disabled={isLeaving}>{isLeaving ? '나가는 중...' : '스터디 나가기'}</Button>;
    }
    if (isMemberPending) {
      return <Chip label="승인 대기중" color="warning" variant="outlined" />;
    }
    if (canApply) {
      return <Button variant="contained" startIcon={isApplying ? <CircularProgress size={20}/> : <HowToRegIcon />} onClick={onApply} disabled={isApplying}>{isApplying ? '신청 중...' : '참여 신청하기'}</Button>;
    }

    return <Chip label="참여 불가" color="default" variant="outlined" />;
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
              <Stack direction="row" spacing={1} alignItems="center"> {/* 버튼 간 간격 조정 */}
                {/* 1. 신고 버튼 (스터디장이 아닐 때 & 로그인했을 때) */}
                {!isLeader && isLoggedIn && (
                    <Tooltip title="이 스터디 신고하기">
                      <IconButton onClick={() => setIsReportModalOpen(true)} color="warning">
                        <ReportIcon />
                      </IconButton>
                    </Tooltip>
                )}

                {/* 2. 좋아요 버튼 */}
                <Box sx={{ display: 'flex', alignItems: 'center', mr: 1 }}> {/* ★★★ 여기에 mr: 1 추가 ★★★ */}
                  <Tooltip title={isLikedState ? "좋아요 취소" : "좋아요"}>
                        <span>
                          <IconButton onClick={handleLikeToggle} disabled={isLiking || !isLoggedIn} color="error" size="small">
                              {isLiking ? <CircularProgress size={20} color="inherit"/> : (isLikedState ? <FavoriteIcon /> : <FavoriteBorderIcon />)}
                          </IconButton>
                        </span>
                  </Tooltip>
                  <Typography variant="body2" color="textSecondary">{likeCountState}</Typography>
                </Box>

                {/* 3. 나머지 액션 버튼들 (참여/나가기/관리자 메뉴 등) */}
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

        <ReportModal
            open={isReportModalOpen}
            onClose={() => setIsReportModalOpen(false)}
            reportType={ReportType.STUDY_GROUP}
            targetId={study.id}
        />
      </>
  );
};

export default StudyDetailComponent;