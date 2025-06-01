import React from 'react';
import { Card, CardContent, Typography, Chip, Box, IconButton } from '@mui/material';
import { styled } from '@mui/material/styles';
import FavoriteIcon from '@mui/icons-material/FavoriteBorder';
import VisibilityIcon from '@mui/icons-material/Visibility';

interface PostCardProps {
  category: string;
  title: string;
  date: string;
  views: number;
  tags: string[];
  isHot?: boolean;
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

const PostCard: React.FC<PostCardProps> = ({
  category,
  title,
  date,
  views,
  tags,
  isHot = false,
}) => {
  return (
    <StyledCard>
      <CardContent>
        <Box display="flex" alignItems="center">
          <CategoryChip label={category} size="small" />
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
              <VisibilityIcon fontSize="small" />
              <Typography variant="body2">{views}</Typography>
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