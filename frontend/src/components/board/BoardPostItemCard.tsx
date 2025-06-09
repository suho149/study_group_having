// src/components/board/BoardPostItemCard.tsx
import React from 'react';
import { Card, CardActionArea, CardContent, Typography, Box, Avatar } from '@mui/material';
import { styled, alpha } from '@mui/material/styles';
import VisibilityIcon from '@mui/icons-material/Visibility';
import ThumbUpAltOutlinedIcon from '@mui/icons-material/ThumbUpAltOutlined';
import ChatBubbleOutlineOutlinedIcon from '@mui/icons-material/ChatBubbleOutlineOutlined';
import { useNavigate } from 'react-router-dom';
import { BoardPostSummary } from '../../types/board';
import { Chip, ChipProps } from '@mui/material'; // ChipProps import
import { BoardCategory } from '../../types/apiSpecificEnums'; // 카테고리 레이블용

// CategoryChip의 커스텀 prop 타입을 정의
interface CategoryChipProps extends ChipProps {
    category_type?: BoardCategory | string;
}

const StyledCard = styled(Card)(({ theme }) => ({
    borderRadius: theme.shape.borderRadius * 1.5,
    transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
    '&:hover': {
        transform: 'translateY(-4px)',
        boxShadow: theme.shadows[6],
    },
    display: 'flex',
    flexDirection: 'column',
    height: '100%', // 카드가 같은 높이를 갖도록
}));

const CategoryChip = styled(Chip, {
    // shouldForwardProp을 사용하여 category_type prop이 DOM으로 전달되지 않도록 함
    shouldForwardProp: (prop) => prop !== 'category_type',
})<CategoryChipProps>(({ theme, category_type }) => ({ // theme과 category_type을 구조 분해 할당으로 받음
                                                       // 카테고리별 색상 지정
    backgroundColor: category_type === BoardCategory.QUESTION ? alpha(theme.palette.warning.light, 0.7)
        : category_type === BoardCategory.DISCUSSION ? alpha(theme.palette.info.light, 0.7)
            : category_type === BoardCategory.INFO ? alpha(theme.palette.success.light, 0.7) // INFO 카테고리 예시 추가
                : alpha(theme.palette.secondary.light, 0.7), // 기본 또는 FREE, ETC 등
    color: category_type === BoardCategory.QUESTION ? theme.palette.warning.dark
        : category_type === BoardCategory.DISCUSSION ? theme.palette.info.dark
            : category_type === BoardCategory.INFO ? theme.palette.success.dark
                : theme.palette.secondary.dark,
    fontWeight: 500,
    height: 24,
    fontSize: '0.75rem',
    marginRight: theme.spacing(1),
}));

const CardTitle = styled(Typography)(({ theme }) => ({
    fontWeight: 'bold',
    marginBottom: theme.spacing(1),
    color: theme.palette.text.primary,
    // 여러 줄 말줄임 처리 (필요시)
    // overflow: 'hidden',
    // textOverflow: 'ellipsis',
    // display: '-webkit-box',
    // WebkitLineClamp: 2,
    // WebkitBoxOrient: 'vertical',
    minHeight: '3em', // 제목 영역 최소 높이 (2줄 분량)
}));

const AuthorInfo = styled(Box)(({ theme }) => ({
    display: 'flex',
    alignItems: 'center',
    color: theme.palette.text.secondary,
    marginTop: 'auto', // 카드를 flex column으로 만들고, 이 부분을 아래로 밀어냄
    paddingTop: theme.spacing(1.5), // 내용과의 간격
    borderTop: `1px solid ${theme.palette.divider}`, // 구분선
}));

const PostStats = styled(Box)(({ theme }) => ({
    display: 'flex',
    alignItems: 'center',
    color: theme.palette.text.secondary,
    gap: theme.spacing(0.5), // 아이콘과 숫자 사이 간격
}));

// 백엔드에서 내려오는 BoardCategory Enum 값에 대한 한글 레이블 매핑
const categoryLabels: Record<BoardCategory | string, string> = {
    [BoardCategory.FREE]: '자유',
    [BoardCategory.QUESTION]: '질문',
    [BoardCategory.DISCUSSION]: '토론',
    [BoardCategory.INFO]: '정보',
    [BoardCategory.ETC]: '기타',
};


const BoardPostItemCard: React.FC<BoardPostSummary> = ({
                                                           id,
                                                           category,
                                                           title,
                                                           authorName,
                                                           authorProfileImageUrl,
                                                           createdAt,
                                                           viewCount,
                                                           likeCount,
                                                           commentCount,
                                                           thumbnailUrl, // 아직 사용 안 함
                                                       }) => {
    const navigate = useNavigate();

    const handleCardClick = () => {
        navigate(`/board/post/${id}`); // 게시글 상세 페이지로 이동
    };

    const getCategoryLabel = (catValue: BoardCategory | string) => {
        return categoryLabels[catValue] || String(catValue);
    };

    return (
        <StyledCard>
            <CardActionArea onClick={handleCardClick} sx={{ display: 'flex', flexDirection: 'column', flexGrow: 1, justifyContent: 'space-between' }}>
                <CardContent sx={{ width: '100%'}}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                        <CategoryChip label={getCategoryLabel(category)} size="small" category_type={category}/>
                        <Typography variant="caption" color="text.secondary">
                            {new Date(createdAt).toLocaleDateString('ko-KR', { year: 'numeric', month: 'short', day: 'numeric' })}
                        </Typography>
                    </Box>
                    <CardTitle variant="h6">
                        {title}
                    </CardTitle>
                    {/* 썸네일 이미지가 있다면 여기에 표시 */}
                    {/* {thumbnailUrl && (
            <Box sx={{ my: 1.5, maxHeight: 150, overflow: 'hidden', borderRadius: 1 }}>
              <img src={thumbnailUrl} alt={title} style={{ width: '100%', height: 'auto', display: 'block' }} />
            </Box>
          )} */}
                </CardContent>
                <AuthorInfo sx={{px:2, pb:1.5, pt:1, width: '100%'}}>
                    <Avatar
                        src={authorProfileImageUrl || undefined}
                        alt={authorName}
                        sx={{ width: 28, height: 28, mr: 1, fontSize: '0.8rem' }}
                    >
                        {!authorProfileImageUrl && authorName ? authorName[0] : null}
                    </Avatar>
                    <Typography variant="body2" sx={{flexGrow:1}}>{authorName}</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <PostStats title="추천수">
                            <ThumbUpAltOutlinedIcon sx={{ fontSize: '1rem' }} />
                            <Typography variant="caption">{likeCount}</Typography>
                        </PostStats>
                        <PostStats title="댓글수">
                            <ChatBubbleOutlineOutlinedIcon sx={{ fontSize: '1rem' }} />
                            <Typography variant="caption">{commentCount}</Typography>
                        </PostStats>
                        <PostStats title="조회수">
                            <VisibilityIcon sx={{ fontSize: '1rem' }} />
                            <Typography variant="caption">{viewCount}</Typography>
                        </PostStats>
                    </Box>
                </AuthorInfo>
            </CardActionArea>
        </StyledCard>
    );
};

export default BoardPostItemCard;