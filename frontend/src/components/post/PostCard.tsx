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
  marginBottom: '12px',
});

const HotChip = styled(Chip)({
  backgroundColor: '#FF6B6B',
  color: '#fff',
  marginLeft: '8px',
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
  marginLeft: '8px',
}));

const PostCard: React.FC<PostCardProps> = ({
  id,
  category,
  title,
  date,
  views,
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
        <Box display="flex" alignItems="center">
          <CategoryChip label={category} size="small" />
          <StatusChip label={getStatusLabel(status)} size="small" status={status} />
          {isHot && <HotChip label="🔥 인기" size="small" />}
        </Box>
        <PostTitle>{title}</PostTitle>
        <TagContainer>
          {tags.map((tag, index) => (
            <Tag key={index} label={tag} size="small" />
          ))}
        </TagContainer>
        <PostFooter>
          <Typography variant="body2">{date}</Typography>
          <Box display="flex" alignItems="center" gap={2}>
            <ViewCount>
              <GroupIcon fontSize="small" />
              <Typography variant="body2">{views}</Typography>
            </ViewCount>
            <ViewCount>
              <VisibilityIcon fontSize="small" />
              <Typography variant="body2">{viewCount}</Typography>
            </ViewCount>
            <IconButton size="small">
              <FavoriteIcon fontSize="small" />
            </IconButton>
          </Box>
        </PostFooter>
      </CardContent>
    </StyledCard>
  );
};

export default PostCard; 