import React, {useState, useEffect, useMemo, useCallback} from 'react'; // useMemo 추가
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
  Alert, CircularProgress,    // 추가
} from '@mui/material';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import StudyDetail from '../components/study/StudyDetail';
import InviteMemberModal from '../components/study/InviteMemberModal';
import { List, ListItem, ListItemText, ListItemIcon, Fab, Paper, Divider as MuiDivider } from '@mui/material'; // Fab 등 추가
import ChatIcon from '@mui/icons-material/Chat'; // 채팅 아이콘
import AddIcon from '@mui/icons-material/Add'; // 추가 아이콘
import CreateChatRoomModal from '../components/chat/CreateChatRoomModal'; // 모달 import
import { ChatRoomResponse } from '../types/chat'; // 채팅방 응답 타입
import { StudyGroupDataType, StudyMember } from '../types/study';
import StudyCalendar from "../components/study/StudyCalendar"; // StudyMember도 필요시 import

const StudyDetailPage = () => {
  const { id: studyIdParam } = useParams<{ id: string }>();
  const studyId = Number(studyIdParam);
  const navigate = useNavigate();
  const { currentUserId, isLoggedIn, isLoading: authLoading } = useAuth();

  // 수정: study 상태 타입을 StudyGroupDataType으로 통일하고, 한 번만 선언합니다.
  const [study, setStudy] = useState<StudyGroupDataType | null>(null); // <--- 수정
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error' | 'info' | 'warning'>('success');
  const [chatRooms, setChatRooms] = useState<ChatRoomResponse[]>([]);
  const [loadingChatRooms, setLoadingChatRooms] = useState(false);
  const [isCreateChatModalOpen, setIsCreateChatModalOpen] = useState(false);

  const fetchChatRooms = useCallback(async () => { // useCallback으로 감싸기
    if (!studyId || !isLoggedIn || !currentUserId) { // currentUserId 조건 추가
      setChatRooms([]); // 조건 미충족 시 빈 배열로 초기화
      return;
    }
    setLoadingChatRooms(true);
    try {
      const response = await api.get<ChatRoomResponse[]>(`/api/chat/study-group/${studyId}/rooms`);
      setChatRooms(response.data);
    } catch (err) {
      console.error('Error fetching chat rooms for study group:', err);
      setChatRooms([]); // 에러 발생 시 빈 배열로
    } finally {
      setLoadingChatRooms(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studyId, isLoggedIn, currentUserId]); // currentUserId 의존성 추가

  // 수정: 채팅방 목록은 로그인 상태, 스터디 ID, 사용자 ID가 모두 유효할 때 가져오도록 별도 useEffect로 분리
  useEffect(() => {
    if (isLoggedIn && studyId && currentUserId && !authLoading) { // authLoading 완료 후 실행
      fetchChatRooms();
    } else if (!isLoggedIn) { // 로그아웃 상태면 채팅방 목록 비움
      setChatRooms([]);
    }
  }, [isLoggedIn, studyId, currentUserId, fetchChatRooms, authLoading]);

  // ... (기존 fetchStudyDetail, handleDelete, handleApplyStudy, handleCloseSnackbar, currentUserMemberInfo)

  const handleCreateChatRoomSuccess = (newChatRoomId: number) => {
    // 채팅방 생성 성공 후 목록 새로고침 또는 생성된 채팅방을 목록에 추가
    fetchChatRooms();
    // 필요하다면 생성된 채팅방으로 바로 이동하는 로직 추가
    // navigate(`/chat/room/${newChatRoomId}`);
    // 또는 Snackbar로 성공 메시지 표시
    setSnackbarMessage("새로운 채팅방이 생성되었습니다!");
    setSnackbarSeverity("success");
    setSnackbarOpen(true);
  };

  const isStudyMember = useMemo(() => {
    if (!study || !currentUserId) return false;
    return study.members.some(member => member.id === Number(currentUserId) && member.status === 'APPROVED');
  }, [study, currentUserId]);

  const fetchStudyDetail = async () => {
    if (!studyId) return;
    try {
      setLoading(true);
      setError(null);
      // API 응답 타입도 StudyGroupDataType으로 지정
      const response = await api.get<StudyGroupDataType>(`/api/studies/${studyId}`); // <--- 수정
      setStudy(response.data);
    } catch (err: any) {
      console.error('Error fetching study detail:', err);
      setError(err.response?.data?.message || '스터디 정보를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (studyId) { // studyId가 유효할 때만 fetch
      fetchStudyDetail();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studyId]); // studyId가 변경될 때마다 실행

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

  // study.isBlinded가 true이면, 경고 메시지를 보여주고 렌더링을 중단합니다.
  if (study.isBlinded) {
    return (
        <Container maxWidth="md" sx={{ my: 4 }}>
          <Alert severity="warning" variant="filled">
            관리자에 의해 숨김 처리된 스터디입니다.
          </Alert>
        </Container>
    );
  }

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
              fetchStudyDetail={fetchStudyDetail} // <--- 추가: fetchStudyDetail 함수 전달
          />
        </Box>

        {/* --- 스터디 캘린더 섹션 추가 --- */}
        {isMemberApproved && ( // 승인된 멤버에게만 캘린더가 보이도록
            <Paper elevation={1} sx={{ mt: 4, p: {xs: 1.5, md: 3}, borderRadius: 2 }}>
              <Typography variant="h6" component="h3" fontWeight="bold" sx={{ mb: 2 }}>
                스터디 일정
              </Typography>
              <StudyCalendar studyId={study.id} isLeader={isLeader} />
            </Paper>
        )}
        {/* ----------------------------- */}

        {/* 스터디 채팅방 목록 및 생성 버튼 */}
        {/* 수정: 스터디 정보(study)가 로드되었고, 로그인했고, 현재 사용자가 스터디 멤버일 때만 표시 */}
        {study && isLoggedIn && isStudyMember && (
            <Paper elevation={1} sx={{ mt: 4, p: {xs: 2, md: 3}, borderRadius: 2 }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6" component="h3" fontWeight="bold">
                  스터디 채팅방
                </Typography>
                <Button
                    variant="contained"
                    color="primary"
                    startIcon={<AddIcon />}
                    onClick={() => setIsCreateChatModalOpen(true)}
                    size="small"
                >
                  채팅방 만들기
                </Button>
              </Box>
              {loadingChatRooms ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}><CircularProgress size={24} /></Box>
              ) : chatRooms.length > 0 ? (
                  <List>
                    {chatRooms.map((room) => (
                        <React.Fragment key={room.id}>
                          <ListItem
                              button
                              onClick={() => navigate(`/chat/room/${room.id}`)} // 채팅방 상세 페이지로 이동
                              secondaryAction={
                                <Typography variant="caption" color="text.secondary">
                                  {room.memberCount}명 참여중
                                  {room.lastMessageAt && ` / ${new Date(room.lastMessageAt).toLocaleTimeString('ko-KR',{hour:'2-digit', minute:'2-digit'})}`}
                                </Typography>
                              }
                          >
                            <ListItemIcon>
                              <ChatIcon color="primary"/>
                            </ListItemIcon>
                            <ListItemText
                                primary={room.name}
                                secondary={room.lastMessageContent || "아직 메시지가 없습니다."}
                                primaryTypographyProps={{ fontWeight: 'medium' }}
                                secondaryTypographyProps={{ noWrap: true, sx:{maxWidth: 'calc(100% - 70px)'}}} // 긴 메시지 ... 처리
                            />
                          </ListItem>
                          <MuiDivider component="li" variant="inset" sx={{ml:7}}/>
                        </React.Fragment>
                    ))}
                  </List>
              ) : (
                  <Typography color="textSecondary" sx={{ textAlign: 'center', py: 2 }}>
                    이 스터디에는 아직 채팅방이 없습니다.
                  </Typography>
              )}
            </Paper>
        )}

        {/* 채팅방 생성 모달 */}
        {study && ( // study 객체가 있을 때만 모달 렌더링 (study.members 접근 때문)
            <CreateChatRoomModal
                open={isCreateChatModalOpen}
                onClose={() => setIsCreateChatModalOpen(false)}
                studyGroupId={study.id}
                studyGroupMembers={study.members} // 스터디 멤버 목록 전달
                onCreateSuccess={handleCreateChatRoomSuccess}
            />
        )}

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