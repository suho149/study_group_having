import React from 'react';
import { Box, Typography, Paper } from '@mui/material';
import { styled, keyframes } from '@mui/material/styles';
import GroupsIcon from '@mui/icons-material/Groups';
import EmojiObjectsIcon from '@mui/icons-material/EmojiObjects';
import AutoStoriesIcon from '@mui/icons-material/AutoStories'; // 새로운 아이콘 추가

// --- 1. 애니메이션 효과를 위한 keyframes 정의 ---
const floatAnimation = keyframes`
  0% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
  100% { transform: translateY(0px); }
`;

// --- 2. 스타일 컴포넌트 개선 ---
const BannerContainer = styled(Paper)(({ theme }) => ({
  // 새로운 그라데이션 컬러 적용
  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  padding: theme.spacing(5),
  borderRadius: theme.shape.borderRadius * 2.5, // 좀 더 둥글게
  margin: theme.spacing(3, 0),
  color: '#fff',
  overflow: 'hidden',
  position: 'relative',
  boxShadow: '0 10px 20px rgba(0,0,0,0.15)', // 그림자 효과 강화
}));

const BannerContent = styled(Box)({
  position: 'relative',
  zIndex: 2,
});

const Subtitle = styled(Typography)(({ theme }) => ({
  display: 'inline-block',
  backgroundColor: 'rgba(255, 255, 255, 0.15)',
  padding: theme.spacing(0.5, 2),
  borderRadius: theme.shape.borderRadius * 5,
  marginBottom: theme.spacing(2),
  fontSize: '0.9rem',
  fontWeight: 500,
  letterSpacing: '0.5px'
}));

const Title = styled(Typography)(({ theme }) => ({
  fontSize: '2.5rem', // 폰트 크기 조정
  fontWeight: 'bold',
  marginBottom: theme.spacing(1.5),
  textShadow: '0 2px 5px rgba(0, 0, 0, 0.2)',
  lineHeight: 1.2,
}));

const Description = styled(Typography)({
  fontSize: '1.1rem',
  opacity: 0.85,
  maxWidth: '550px',
});

const AnimatedIconContainer = styled(Box)({
  position: 'absolute',
  width: '100%',
  height: '100%',
  top: 0,
  left: 0,
  zIndex: 1,
  '& .icon': {
    position: 'absolute',
    color: 'rgba(255, 255, 255, 0.1)',
    animation: `${floatAnimation} 6s ease-in-out infinite`,
  },
  // 각 아이콘의 위치와 애니메이션 딜레이를 다르게 설정
  '& .icon-1': {
    fontSize: '140px',
    top: '10%',
    right: '15%',
    animationDelay: '0s',
  },
  '& .icon-2': {
    fontSize: '100px',
    bottom: '5%',
    right: '-5%',
    animationDelay: '2s',
  },
  '& .icon-3': {
    fontSize: '80px',
    top: '20%',
    left: '5%',
    animationDelay: '4s',
  },
});

// --- 3. 최종 컴포넌트 ---
const Banner: React.FC = () => {
  return (
      <BannerContainer elevation={4}>
        <BannerContent>
          <Subtitle variant="h6">
            성장의 모든 순간, Having
          </Subtitle>
          <Title variant="h2">
            새로운 경험, 함께하는 성장.
          </Title>
          <Description>
            다양한 스터디와 프로젝트를 통해 관심사를 나누고,
            목표를 향해 함께 나아가세요.
          </Description>
        </BannerContent>
        <AnimatedIconContainer>
          <GroupsIcon className="icon icon-1" />
          <EmojiObjectsIcon className="icon icon-2" />
          <AutoStoriesIcon className="icon icon-3" />
        </AnimatedIconContainer>
      </BannerContainer>
  );
};

export default Banner;