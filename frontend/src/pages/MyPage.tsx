import React from 'react';
import { Container, Paper, Typography, Box, Avatar, Divider } from '@mui/material';
import { styled } from '@mui/material/styles';

const ProfileContainer = styled(Paper)({
  padding: '40px',
  borderRadius: '12px',
  marginTop: '40px',
});

const ProfileHeader = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  marginBottom: '32px',
});

const ProfileAvatar = styled(Avatar)({
  width: '80px',
  height: '80px',
  marginRight: '24px',
});

const ProfileInfo = styled(Box)({
  flex: 1,
});

const InfoSection = styled(Box)({
  marginTop: '24px',
  '& + &': {
    marginTop: '24px',
  },
});

const SectionTitle = styled(Typography)({
  fontSize: '18px',
  fontWeight: 'bold',
  marginBottom: '16px',
  color: '#333',
});

const MyPage = () => {
  // 실제로는 서버에서 사용자 정보를 가져와야 합니다
  const userInfo = {
    name: '사용자',
    email: 'user@example.com',
    joinDate: '2024.03.15',
  };

  return (
    <Container maxWidth="md">
      <ProfileContainer elevation={1}>
        <ProfileHeader>
          <ProfileAvatar src="/images/default-avatar.png" />
          <ProfileInfo>
            <Typography variant="h5" fontWeight="bold">
              {userInfo.name}님의 프로필
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {userInfo.email}
            </Typography>
          </ProfileInfo>
        </ProfileHeader>

        <Divider />

        <InfoSection>
          <SectionTitle>계정 정보</SectionTitle>
          <Box>
            <Typography variant="body1" gutterBottom>
              <strong>이메일:</strong> {userInfo.email}
            </Typography>
            <Typography variant="body1" gutterBottom>
              <strong>가입일:</strong> {userInfo.joinDate}
            </Typography>
          </Box>
        </InfoSection>

        <InfoSection>
          <SectionTitle>활동 내역</SectionTitle>
          <Box>
            <Typography variant="body1" gutterBottom>
              <strong>작성한 게시글:</strong> 0개
            </Typography>
            <Typography variant="body1" gutterBottom>
              <strong>참여중인 스터디:</strong> 0개
            </Typography>
            <Typography variant="body1" gutterBottom>
              <strong>참여중인 프로젝트:</strong> 0개
            </Typography>
          </Box>
        </InfoSection>
      </ProfileContainer>
    </Container>
  );
};

export default MyPage; 