import React from 'react';
import {
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Typography,
  Chip,
  Box,
  Divider,
  IconButton, // 스터디장 멤버 관리용 (예시)
  Menu,       // 스터디장 멤버 관리용 (예시)
  MenuItem,   // 스터디장 멤버 관리용 (예시)
  CircularProgress, // API 호출 시 로딩 표시용
  ListItemIcon as MuiListItemIcon, // 이름 충돌 방지
  Dialog, // 확인 다이얼로그용
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle, Button, Tooltip,
} from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert'; // 멤버 관리 메뉴 아이콘 (예시)
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'; // 승인 아이콘 (예시)
import HighlightOffIcon from '@mui/icons-material/HighlightOff'; // 거절 아이콘 (예시)
import PersonRemoveIcon from '@mui/icons-material/PersonRemove'; // 강제 탈퇴 아이콘
import api from '../../services/api'; // API 서비스 import (경로 확인 필요)
import { useAuth } from '../../contexts/AuthContext'; // currentUserId 가져오기 위함 (경로 확인 필요)
import { useNavigate } from 'react-router-dom';
import MessageIcon from '@mui/icons-material/Message';
import PersonAddIcon from '@mui/icons-material/PersonAdd'; // 친구 추가 아이콘
import FriendActionButton from '../friend/FriendActionButton'; // 새로 만든 컴포넌트 import


// 1. Member 인터페이스의 imageUrl을 profile로 변경
interface Member {
  id: number; // 사용자(User)의 ID
  name: string;
  profile: string; // imageUrl -> profile로 변경
  role: 'LEADER' | 'MEMBER';
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
}

// 2. StudyMemberListProps 인터페이스 수정
interface StudyMemberListProps {
  members: Member[];
  isLeaderView: boolean; // 현재 사용자가 스터디장인지 여부 (isLeader에서 이름 변경, 명확성 위함)
  studyId: number;       // 현재 스터디 그룹의 ID
  // onMemberStatusChange는 스터디 멤버의 상태(승인/거절)가 변경되었을 때
  // 부모 컴포넌트(StudyDetailPage)에 알려서 데이터를 새로고침하도록 하는 콜백입니다.
  onMemberStatusChange: () => Promise<void> | void;
}

const StudyMemberList: React.FC<StudyMemberListProps> = ({
                                                           members,
                                                           isLeaderView,
                                                           studyId,
                                                           onMemberStatusChange
                                                         }) => {
  const navigate = useNavigate();
  const { currentUserId } = useAuth(); // 현재 로그인한 사용자 ID (본인 프로필 등에 활용 가능)

  // 멤버 관리 메뉴 상태
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const [selectedMember, setSelectedMember] = React.useState<Member | null>(null);
  const [isProcessingMember, setIsProcessingMember] = React.useState(false);

  const handleDmClick = (partnerId: number) => {
    // 채팅방을 찾거나 새로 만들기 위해 /dm/new/:partnerId 경로로 이동
    navigate(`/dm/new/${partnerId}`);
  };

  // 강제 탈퇴 확인 다이얼로그 상태
  const [isRemoveConfirmOpen, setIsRemoveConfirmOpen] = React.useState(false);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, member: Member) => {
    setAnchorEl(event.currentTarget);
    setSelectedMember(member);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedMember(null);
  };

  const handleOpenRemoveConfirm = () => {
    setIsRemoveConfirmOpen(true);
    // 메뉴는 닫되, selectedMember는 유지 (다이얼로그에서 사용하기 위해)
    setAnchorEl(null);
  };

  const handleCloseRemoveConfirm = () => {
    setIsRemoveConfirmOpen(false);
    setSelectedMember(null); // 다이얼로그 닫을 때 selectedMember 초기화
  };

  const handleMemberApprovalAction = async (action: 'approve' | 'reject') => {
    if (!selectedMember || !studyId) return;

    setIsProcessingMember(true);
    handleMenuClose(); // 메뉴 먼저 닫기

    try {
      // 백엔드 API 엔드포인트는 실제 구현에 맞게 수정해야 합니다.
      // 예시: /api/studies/{studyId}/members/{memberUserId}/approve
      // 예시: /api/studies/{studyId}/members/{memberUserId}/reject
      // 여기서는 간단히 'status'를 업데이트하는 요청으로 가정합니다.
      // 백엔드에서는 이 요청을 받으면 해당 멤버의 상태를 변경하고,
      // 필요하다면 스터디 그룹의 currentMembers 수도 업데이트해야 합니다.
      // Notification도 관련자에게 보낼 수 있습니다.

      // 백엔드에 멤버 상태 변경 요청 API 필요
      // 여기서는 예시로 스터디 참여 초대에 대한 응답 API를 활용하거나 유사한 API를 만든다고 가정합니다.
      // 실제로는 스터디장이 '특정 유저'를 '승인/거절'하는 API가 명확히 있어야 합니다.
      // 가상의 API 엔드포인트: POST /api/studies/{studyId}/members/{userId}/status
      // body: { status: 'APPROVED' | 'REJECTED' }

      const newStatus = action === 'approve' ? 'APPROVED' : 'REJECTED';
      // 이 API는 예시이며, 실제 백엔드 API 명세에 맞춰야 합니다.
      // 백엔드에 studyId, selectedMember.id (사용자 ID), newStatus를 보내야 함
      await api.put(`/api/studies/${studyId}/members/${selectedMember.id}/status`, { status: newStatus });

      // 성공 시 부모 컴포넌트에 알림 (데이터 리프레시)
      if (onMemberStatusChange) {
        await onMemberStatusChange();
      }
      // TODO: 성공/실패 Snackbar 알림 추가

    } catch (error) {
      console.error(`Failed to ${action} member:`, error);
      // TODO: 오류 Snackbar 알림 추가
    } finally {
      setIsProcessingMember(false);
    }
  };

  // 멤버 강제 탈퇴 액션 핸들러
  const handleRemoveMemberByLeader = async () => {
    if (!selectedMember || !studyId) return;

    setIsProcessingMember(true);
    // 확인 다이얼로그는 API 호출 전에 닫거나, API 호출 성공/실패 후 닫을 수 있음
    // 여기서는 API 호출 전에 닫고, selectedMember는 API 호출에 사용 후 초기화

    try {
      await api.delete(`/api/studies/${studyId}/members/${selectedMember.id}`);
      if (onMemberStatusChange) {
        await onMemberStatusChange();
      }
      // TODO: 성공 Snackbar ("OOO님을 내보냈습니다.")
    } catch (error: any) {
      console.error('Failed to remove member by leader:', error);
      // TODO: 오류 Snackbar
      alert(error.response?.data?.message || `${selectedMember.name}님을 내보내는 중 오류가 발생했습니다.`);
    } finally {
      setIsProcessingMember(false);
      handleCloseRemoveConfirm(); // 다이얼로그 닫고 selectedMember 초기화
    }
  };

  // 스터디장을 먼저 찾고, 나머지 멤버들을 분리
  const leader = members.find(member => member.role === 'LEADER');
  const approvedMembers = members
      .filter(member => member.role !== 'LEADER' && member.status === 'APPROVED')
      .sort((a, b) => a.name.localeCompare(b.name)); // 이름순 정렬
  const pendingMembers = members
      .filter(member => member.status === 'PENDING') // 역할과 관계없이 PENDING 상태인 멤버
      .sort((a, b) => a.name.localeCompare(b.name));

  const getMemberStatusChip = (member: Member) => {
    if (member.status === 'APPROVED') {
      return <Chip label="승인됨" size="small" color="success" sx={{ height: 20 }} />;
    }
    if (member.status === 'PENDING') {
      return <Chip label="승인 대기" size="small" color="warning" sx={{ height: 20 }} />;
    }
    if (member.status === 'REJECTED') { // REJECTED 상태도 표시할 수 있도록
      return <Chip label="거절됨" size="small" color="error" sx={{ height: 20 }} />;
    }
    return null;
  };

  const getMemberRoleText = (role: 'LEADER' | 'MEMBER') => {
    return role === 'LEADER' ? '스터디장' : '스터디원';
  };

  const renderMemberListItems = (memberList: Member[], listTitle?: string) => (
      <>
        {listTitle && memberList.length > 0 && (
            <Typography variant="subtitle2" gutterBottom sx={{ mt: listTitle === "대기 중인 멤버" ? 2 : 1, fontWeight: 'medium', color: 'text.secondary' }}>
              {listTitle} ({memberList.length}명)
            </Typography>
        )}
        {memberList.length === 0 && listTitle ? (
            <Typography variant="body2" color="text.secondary" sx={{ ml: 1, mb:1 }}>해당 멤버가 없습니다.</Typography>
        ) : (
            <List dense sx={{ p: 0 }}>
              {memberList.map((member) => (
                  <React.Fragment key={member.id}>
                    <ListItem
                        alignItems="flex-start"
                        sx={{ py: 0.8, px: 0.5 }}
                        secondaryAction={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            {/* 1. DM 보내기 버튼 (자기 자신이 아닐 때만 표시) */}
                            {member.id !== currentUserId && (
                                <Tooltip title="DM 보내기">
                                  <IconButton
                                      edge="end"
                                      aria-label={`send dm to ${member.name}`}
                                      onClick={() => handleDmClick(member.id)}
                                      size="small"
                                  >
                                    <MessageIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                            )}

                            {/* ★★★ 친구 신청 버튼 추가 ★★★ */}
                            {/* 친구가 아니고, 신청 중도 아니고, 본인도 아닐 때만 표시 */}
                            {/* ★★★ 기존 친구 신청 버튼을 FriendActionButton으로 교체 ★★★ */}
                            {member.id !== currentUserId && <FriendActionButton targetUserId={member.id} />}

                            {/* 2. 멤버 관리 메뉴 버튼 (기존 로직) */}
                            {isLeaderView && member.id !== currentUserId &&
                                (member.status === 'PENDING' || (member.status === 'APPROVED' && member.role !== 'LEADER')) &&
                                (
                                    isProcessingMember && selectedMember?.id === member.id ? (
                                        <CircularProgress size={24} />
                                    ) : (
                                        <Tooltip title="멤버 관리">
                                          <IconButton
                                              edge="end"
                                              aria-label={`manage member ${member.name}`}
                                              onClick={(e) => handleMenuOpen(e, member)}
                                              size="small"
                                          >
                                            <MoreVertIcon fontSize="small" />
                                          </IconButton>
                                        </Tooltip>
                                    )
                                )
                            }
                          </Box>
                        }
                    >
                      <ListItemAvatar sx={{ minWidth: 'auto', mr: 1.5, mt: 0.5 }}>
                        <Avatar
                            src={member.profile} // imageUrl -> profile
                            alt={member.name}
                            sx={{ width: 32, height: 32 }}
                        >
                          {member.name[0]}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                          primaryTypographyProps={{ component: 'div' }} // primary가 <p>로 렌더링되는 것을 방지
                          primary={
                            <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                              {member.name}
                            </Typography>
                          }
                          secondaryTypographyProps={{ component: 'div' }} // secondary가 <p>로 렌더링되는 것을 방지
                          secondary={
                            <Box display="flex" alignItems="center" gap={0.5} flexWrap="wrap" sx={{ mt: 0.2 }}>
                              <Chip
                                  label={getMemberRoleText(member.role)}
                                  size="small"
                                  color={member.role === 'LEADER' ? 'primary' : 'default'}
                                  variant="outlined"
                                  sx={{ height: 18, fontSize: '0.65rem' }}
                              />
                              {getMemberStatusChip(member)}
                            </Box>
                          }
                      />
                    </ListItem>
                    <Divider variant="inset" component="li" sx={{ ml: '56px' /* Avatar width + margin */}} />
                  </React.Fragment>
              ))}
            </List>
        )}
      </>
  );

  // 전체 멤버 수 (리더 + 승인된 멤버)
  const totalApprovedMembers = (leader ? 1 : 0) + approvedMembers.length;

  return (
      <>
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', mb: 1.5 }}>
          스터디 멤버 ({totalApprovedMembers}명)
        </Typography>

        {leader && renderMemberListItems([leader])}
        {renderMemberListItems(approvedMembers)}

        {isLeaderView && pendingMembers.length > 0 && (
            renderMemberListItems(pendingMembers, "대기 중인 멤버")
        )}

        {/* 스터디장이 PENDING 멤버 관리하는 메뉴 */}
        <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl) && Boolean(selectedMember)}
            onClose={() => { // 메뉴 닫을 때 selectedMember도 초기화 (다이얼로그 안 열렸을 경우)
              setAnchorEl(null);
              if (!isRemoveConfirmOpen) { // 강제탈퇴 다이얼로그가 열려있지 않을 때만 초기화
                setSelectedMember(null);
              }
            }}
            MenuListProps={{
              'aria-labelledby': 'member-actions-button',
            }}
        >
          {/* PENDING 상태 멤버에 대한 액션 */}
          {selectedMember?.status === 'PENDING' && [
            <MenuItem key="approve" onClick={() => handleMemberApprovalAction('approve')} disabled={isProcessingMember}>
              <MuiListItemIcon>
                <CheckCircleOutlineIcon fontSize="small" color="success" />
              </MuiListItemIcon>
              승인하기
            </MenuItem>,
            <MenuItem key="reject" onClick={() => handleMemberApprovalAction('reject')} disabled={isProcessingMember} sx={{ color: 'error.main' }}>
              <MuiListItemIcon>
                <HighlightOffIcon fontSize="small" color="error" />
              </MuiListItemIcon>
              거절하기
            </MenuItem>
          ]}
          {/* APPROVED 상태 멤버 (리더 제외)에 대한 액션 */}
          {selectedMember?.status === 'APPROVED' && selectedMember?.role !== 'LEADER' && (
              <MenuItem onClick={handleOpenRemoveConfirm} disabled={isProcessingMember} sx={{ color: 'error.main' }}>
                <MuiListItemIcon>
                  <PersonRemoveIcon fontSize="small" color="error" />
                </MuiListItemIcon>
                내보내기
              </MenuItem>
          )}
        </Menu>

        {/* 강제 탈퇴 확인 다이얼로그 */}
        {selectedMember && ( // selectedMember가 있을 때만 Dialog 렌더링
            <Dialog
                open={isRemoveConfirmOpen}
                onClose={handleCloseRemoveConfirm} // 사용자가 외부 클릭 등으로 닫을 때
                aria-labelledby="remove-member-dialog-title"
                aria-describedby="remove-member-dialog-description"
            >
              <DialogTitle id="remove-member-dialog-title">멤버 내보내기</DialogTitle>
              <DialogContent>
                <DialogContentText id="remove-member-dialog-description">
                  정말로 '{selectedMember.name}'님을 스터디에서 내보내시겠습니까? 이 작업은 되돌릴 수 없습니다.
                </DialogContentText>
              </DialogContent>
              <DialogActions>
                <Button onClick={handleCloseRemoveConfirm} disabled={isProcessingMember}>취소</Button>
                <Button onClick={handleRemoveMemberByLeader} color="error" variant="contained" disabled={isProcessingMember}>
                  {isProcessingMember ? <CircularProgress size={20} color="inherit" /> : '내보내기'}
                </Button>
              </DialogActions>
            </Dialog>
        )}
      </>
  );
};

export default StudyMemberList;