import React from 'react';
import { Card, CardContent, Typography, Chip, Box, IconButton } from '@mui/material';
import { styled } from '@mui/material/styles';
import FavoriteIcon from '@mui/icons-material/FavoriteBorder';
import VisibilityIcon from '@mui/icons-material/Visibility';
import GroupIcon from '@mui/icons-material/Group';
import { useNavigate } from 'react-router-dom';

interface PostCardProps {
  id: number;
  category: string;
  title: string;
  date: string;
  views: number;
  maxMembers?: number; // <--- 추가: 최대 멤버 수
  tags: string[];
  isHot?: boolean;
  status: string;
  viewCount: number;
}

const StyledCard = styled(Card)({
  borderRadius: '12px',
  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
  transition: 'transform 0.2s',
  '&:hover': {
    transform: 'translateY(-4px)',
  },
});

const CategoryChip = styled(Chip)({
  backgroundColor: '#F0F0F0',
  color: '#666',
  fontWeight: 'bold',
  height: '24px',
});

const HotChip = styled(Chip)({
  backgroundColor: '#FF6B6B',
  color: '#fff',
  height: '24px',
});

const PostTitle = styled(Typography)({
  fontSize: '18px',
  fontWeight: 'bold',
  marginBottom: '16px',
  color: '#333',
});

const TagContainer = styled(Box)({
  display: 'flex',
  gap: '8px',
  marginBottom: '16px',
  flexWrap: 'wrap',
});

const Tag = styled(Chip)({
  backgroundColor: '#E8F4FF',
  color: '#2196F3',
  '&:hover': {
    backgroundColor: '#D1E9FF',
  },
});

const PostFooter = styled(Box)({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  color: '#999',
});

const ViewCount = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  gap: '4px',
});

const StatusChip = styled(Chip)(({ status }: { status: string }) => ({
  backgroundColor: status === 'RECRUITING' ? '#4CAF50' : '#FF5722',
  color: '#fff',
  height: '24px',
}));

const PostCard: React.FC<PostCardProps> = ({
  id,
  category,
  title,
  date,
  views,
  maxMembers,
  tags,
  isHot = false,
  status,
  viewCount,
}) => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/studies/${id}`);
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'RECRUITING':
        return '모집중';
      case 'CLOSED':
        return '모집완료';
      case 'IN_PROGRESS':
        return '진행중';
      case 'COMPLETED':
        return '완료';
      default:
        return status;
    }
  };

  return (
    <StyledCard onClick={handleClick} sx={{ cursor: 'pointer' }}>
      <CardContent>
        <Box 
          display="flex" 
          alignItems="center"
          justifyContent="space-between" // isHot을 오른쪽으로 보내기 위함 (선택적)
          gap={1} 
          sx={{ mb: 2 }}
        >
          <Box display="flex" alignItems="center" gap={1}>
            <CategoryChip label={category} size="small" />
            <StatusChip label={getStatusLabel(status)} size="small" status={status} />
          </Box>
          {isHot && <HotChip label="🔥 인기" size="small" />}
        </Box>
        <PostTitle variant="h6" noWrap> {/* h6로 변경하고, 길면 ... 처리 */}
          {title}
        </PostTitle>
        <TagContainer sx={{ minHeight: 32, mb: 2 }}> {/* 태그 없을 때 높이 유지 및 마진 조정 */}
          {tags.slice(0, 3).map((tag, index) => ( // 태그는 최대 3개까지만 표시 (예시)
              <Tag key={index} label={`#${tag}`} size="small" /> // 태그 앞에 # 추가
          ))}
          {tags.length > 3 && <Typography variant="caption" sx={{ ml: 0.5 }}>...</Typography>}
        </TagContainer>
        <PostFooter>
          <Typography variant="caption" color="text.secondary">{date}</Typography> {/* 날짜는 caption으로 작게 */}
          <Box display="flex" alignItems="center" gap={1.5}> {/* 아이콘 간 간격 조정 */}
            <ViewCount title="참여 현황">
              <GroupIcon fontSize="small" sx={{ color: 'text.secondary' }} />
              <Typography variant="body2" component="span" sx={{ fontWeight: 500 }}> {/* component="span"으로 변경 */}
                {views}
                {maxMembers !== undefined && `/${maxMembers}`} {/* maxMembers가 있으면 함께 표시 */}
              </Typography>
            </ViewCount>
            <ViewCount title="조회수">
              <VisibilityIcon fontSize="small" sx={{ color: 'text.secondary' }}/>
              <Typography variant="body2" component="span">{viewCount}</Typography>
            </ViewCount>
            {/*
            <IconButton size="small" aria-label="add to favorites">
              <FavoriteIcon fontSize="small" />
            </IconButton>
            */}
          </Box>
        </PostFooter>
      </CardContent>
    </StyledCard>
  );
};

export default PostCard; 