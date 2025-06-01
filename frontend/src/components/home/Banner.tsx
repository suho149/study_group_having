import React from 'react';
import { Box, Typography, Paper } from '@mui/material';
import { styled } from '@mui/material/styles';
import GroupsIcon from '@mui/icons-material/Groups';
import EmojiObjectsIcon from '@mui/icons-material/EmojiObjects';

const BannerContainer = styled(Paper)({
  background: 'linear-gradient(135deg, #2196F3 0%, #1976D2 100%)',
  padding: '40px',
  borderRadius: '16px',
  margin: '24px 0',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  color: '#fff',
  overflow: 'hidden',
  position: 'relative',
});

const BannerContent = styled(Box)({
  flex: 1,
  position: 'relative',
  zIndex: 1,
});

const NoticeTag = styled(Typography)({
  display: 'inline-block',
  backgroundColor: 'rgba(255, 255, 255, 0.2)',
  padding: '4px 12px',
  borderRadius: '16px',
  marginBottom: '16px',
  fontSize: '14px',
  fontWeight: 500,
});

const BannerTitle = styled(Typography)({
  fontSize: '32px',
  fontWeight: 'bold',
  marginBottom: '12px',
  textShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
});

const BannerDescription = styled(Typography)({
  fontSize: '18px',
  opacity: 0.9,
  maxWidth: '600px',
  lineHeight: 1.5,
});

const IconContainer = styled(Box)({
  position: 'absolute',
  right: '-20px',
  top: '50%',
  transform: 'translateY(-50%)',
  display: 'flex',
  gap: '20px',
  opacity: 0.2,
  '& .MuiSvgIcon-root': {
    fontSize: '120px',
    color: '#fff',
  },
});

const Banner = () => {
  return (
    <BannerContainer elevation={3}>
      <BannerContent>
        <NoticeTag>HAVING</NoticeTag>
        <BannerTitle>
          함께 성장하는 IT 커뮤니티
        </BannerTitle>
        <BannerDescription>
          프로젝트와 스터디를 통해 실력을 키우고 네트워크를 만들어보세요
        </BannerDescription>
      </BannerContent>
      <IconContainer>
        <GroupsIcon />
        <EmojiObjectsIcon />
      </IconContainer>
    </BannerContainer>
  );
};

export default Banner; 