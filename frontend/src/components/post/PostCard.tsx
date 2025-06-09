import React, {useState} from 'react';
import {Card, CardContent, Typography, Chip, Box, IconButton, CircularProgress} from '@mui/material';
import { styled } from '@mui/material/styles';
import FavoriteIcon from '@mui/icons-material/Favorite'; // 채워진 하트
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder'; // 빈 하트
import VisibilityIcon from '@mui/icons-material/Visibility';
import GroupIcon from '@mui/icons-material/Group';
import { useNavigate } from 'react-router-dom';
import {useAuth} from "../../contexts/AuthContext";
import api from "../../services/api";

interface PostCardProps {
  id: number;
  category: string;
  title: string;
  date: string;
  currentMembers: number;
  maxMembers?: number; // <--- 추가: 최대 멤버 수
  tags: string[];
  isHot?: boolean;
  status: string;
  viewCount: number;
  initialLikeCount: number; // 초기 좋아요 수
  initialIsLiked: boolean;  // 초기 좋아요 상태
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
  currentMembers,
  maxMembers,
  tags,
  isHot = false,
  status,
  viewCount, initialLikeCount, initialIsLiked
}) => {
  const navigate = useNavigate();
  const { isLoggedIn } = useAuth();
  const [isLiked, setIsLiked] = useState(initialIsLiked);
  const [likeCount, setLikeCount] = useState(initialLikeCount);
  const [isLiking, setIsLiking] = useState(false); // 좋아요 처리 중 로딩 상태

  const handleClick = () => {
    navigate(`/studies/${id}`);
  };

  const handleLikeToggle = async (event: React.MouseEvent) => {
    event.stopPropagation(); // 카드 클릭 이벤트 전파 방지
    if (!isLoggedIn) {
      alert("로그인이 필요한 기능입니다.");
      navigate('/login', { state: { from: `/studies/${id}` }}); // 로그인 후 돌아올 경로 전달
      return;
    }
    if (isLiking) return; // 중복 클릭 방지

    setIsLiking(true);
    try {
      if (isLiked) { // 좋아요 취소
        await api.delete(`/api/studies/${id}/unlike`);
        setIsLiked(false);
        setLikeCount(prev => prev - 1);
      } else { // 좋아요 추가
        await api.post(`/api/studies/${id}/like`);
        setIsLiked(true);
        setLikeCount(prev => prev + 1);
      }
    } catch (error: any) {
      console.error("Error toggling like:", error);
      alert(error.response?.data?.message || "좋아요 처리 중 오류가 발생했습니다.");
      // 에러 발생 시 UI 롤백 (선택적)
      // if (isLiked) { // 원래 좋아요였는데 취소 실패 시
      //   setIsLiked(true); setLikeCount(prev => prev + 1);
      // } else { // 원래 안좋아요였는데 추가 실패 시
      //   setIsLiked(false); setLikeCount(prev => prev - 1);
      // }
    } finally {
      setIsLiking(false);
    }
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
          <Typography variant="caption" color="text.secondary">{date}</Typography>
          <Box display="flex" alignItems="center" gap={1}> {/* 아이콘 간 간격 조정 */}
            <Box display="flex" alignItems="center" gap={0.5} title="참여 현황">
              <GroupIcon fontSize="small" sx={{ color: 'text.secondary' }} />
              <Typography variant="body2" component="span" sx={{ fontWeight: 500 }}>
                {currentMembers}{maxMembers !== undefined && `/${maxMembers}`}
              </Typography>
            </Box>
            <Box display="flex" alignItems="center" gap={0.5} title="조회수">
              <VisibilityIcon fontSize="small" sx={{ color: 'text.secondary' }}/>
              <Typography variant="body2" component="span">{viewCount}</Typography>
            </Box>
            <IconButton
                size="small"
                aria-label="like this study"
                onClick={handleLikeToggle}
                disabled={isLiking} // 처리 중 비활성화
                sx={{p:0.5}} // 패딩 조정
            >
              {isLiking ? <CircularProgress size={18} color="inherit" /> :
                  (isLiked ? <FavoriteIcon fontSize="small" color="error" /> : <FavoriteBorderIcon fontSize="small" />)
              }
            </IconButton>
            <Typography variant="body2" component="span" sx={{ minWidth: 20, textAlign: 'left' }}>{likeCount}</Typography> {/* 좋아요 수 표시 */}
          </Box>
        </PostFooter>
      </CardContent>
    </StyledCard>
  );
};

export default PostCard; 