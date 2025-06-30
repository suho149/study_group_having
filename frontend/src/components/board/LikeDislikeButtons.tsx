// src/components/board/LikeDislikeButtons.tsx
import React, {useEffect, useState} from 'react';
import { Box, IconButton, Typography, CircularProgress, Button, Tooltip } from '@mui/material';
import ThumbUpAltOutlinedIcon from '@mui/icons-material/ThumbUpAltOutlined';
import ThumbUpAltIcon from '@mui/icons-material/ThumbUpAlt';
import ThumbDownAltOutlinedIcon from '@mui/icons-material/ThumbDownAltOutlined';
import ThumbDownAltIcon from '@mui/icons-material/ThumbDownAlt';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { VoteType } from '../../types/apiSpecificEnums'; // VoteType Enum import

interface LikeDislikeButtonsProps {
    targetId: number; // 게시글 ID
    initialLikeCount: number;
    initialDislikeCount: number;
    initialUserVote?: VoteType | null; // 현재 사용자의 초기 투표 상태 ('LIKE', 'DISLIKE', null)
    onVoteSuccess?: (updatedCounts: { likeCount: number; dislikeCount: number; userVote: VoteType | null }) => void; // 투표 성공 후 콜백
    targetType: 'post' | 'comment'; // 투표 대상 타입
}

const LikeDislikeButtons: React.FC<LikeDislikeButtonsProps> = ({
                                                                   targetId,
                                                                   initialLikeCount,
                                                                   initialDislikeCount,
                                                                   initialUserVote = null,
                                                                   onVoteSuccess,
                                                                   targetType,
                                                               }) => {
    const { isLoggedIn, currentUserId } = useAuth();
    const [likeCount, setLikeCount] = useState(initialLikeCount);
    const [dislikeCount, setDislikeCount] = useState(initialDislikeCount);
    const [userVote, setUserVote] = useState<VoteType | null>(initialUserVote);
    const [isLoading, setIsLoading] = useState(false);

    // initial props가 변경될 때 내부 상태 동기화 (예: 부모 컴포넌트에서 데이터 리프레시 시)
    useEffect(() => {
        setLikeCount(initialLikeCount);
        setDislikeCount(initialDislikeCount);
        setUserVote(initialUserVote);
    }, [initialLikeCount, initialDislikeCount, initialUserVote]);

    const handleVote = async (newVoteType: VoteType) => {
        if (!isLoggedIn) {
            alert("로그인이 필요한 기능입니다.");
            // navigate('/login'); // 로그인 페이지로 이동 로직
            return;
        }
        if (isLoading) return;
        setIsLoading(true);

        let previousVote = userVote;
        let previousLikeCount = likeCount;
        let previousDislikeCount = dislikeCount;

        // 낙관적 업데이트 (UI 즉시 변경)
        if (userVote === newVoteType) { // 같은 버튼 다시 클릭 (취소)
            setUserVote(null);
            if (newVoteType === VoteType.LIKE) setLikeCount(prev => prev - 1);
            else setDislikeCount(prev => prev - 1);
        } else { // 새로운 투표 또는 다른 타입으로 변경
            if (userVote === VoteType.LIKE) setLikeCount(prev => prev - 1);
            else if (userVote === VoteType.DISLIKE) setDislikeCount(prev => prev - 1);

            setUserVote(newVoteType);
            if (newVoteType === VoteType.LIKE) setLikeCount(prev => prev + 1);
            else setDislikeCount(prev => prev + 1);
        }

        try {
            // API 요청 시에는 현재 클릭한 voteType을 보냄 (서버에서 토글/변경 로직 처리)
            await api.post(`/api/board/${targetType}s/${targetId}/vote`, { voteType: newVoteType });

            if (onVoteSuccess) {
                // 성공 시, 업데이트된 카운트와 사용자의 최종 투표 상태를 부모에게 전달 가능
                // 또는 부모가 전체 데이터를 다시 fetch 하도록 유도
                onVoteSuccess({
                    likeCount: likeCount, // 이 값은 낙관적 업데이트 후의 값이므로, 서버 응답을 기다린다면 다를 수 있음
                    dislikeCount: dislikeCount,
                    userVote: userVote, // 이 값도 낙관적 업데이트 후의 값
                });
            }
        } catch (error: any) {
            console.error(`${targetType} vote error:`, error);
            alert(error.response?.data?.message || "투표 처리 중 오류가 발생했습니다.");
            // 에러 발생 시 낙관적 업데이트 롤백
            setUserVote(previousVote);
            setLikeCount(previousLikeCount);
            setDislikeCount(previousDislikeCount);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Tooltip title="추천" arrow>
                <IconButton
                    size="small"
                    onClick={() => handleVote(VoteType.LIKE)}
                    disabled={isLoading || !isLoggedIn}
                    color={userVote === VoteType.LIKE ? "primary" : "default"}
                    aria-pressed={userVote === VoteType.LIKE}
                >
                    {userVote === VoteType.LIKE ? <ThumbUpAltIcon fontSize="small" /> : <ThumbUpAltOutlinedIcon fontSize="small" />}
                </IconButton>
            </Tooltip>
            <Typography variant="body2" color="text.secondary" sx={{ minWidth: 18, textAlign: 'center' }}>
                {likeCount}
            </Typography>

            <Tooltip title="비추천" arrow>
                <IconButton
                    size="small"
                    onClick={() => handleVote(VoteType.DISLIKE)}
                    disabled={isLoading || !isLoggedIn}
                    color={userVote === VoteType.DISLIKE ? "secondary" : "default"} // "error" 대신 "secondary" 또는 다른 색상
                    aria-pressed={userVote === VoteType.DISLIKE}
                    sx={{ ml: 1 }} // 추천 버튼과의 간격
                >
                    {userVote === VoteType.DISLIKE ? <ThumbDownAltIcon fontSize="small" /> : <ThumbDownAltOutlinedIcon fontSize="small" />}
                </IconButton>
            </Tooltip>
            <Typography variant="body2" color="text.secondary" sx={{ minWidth: 18, textAlign: 'center' }}>
                {dislikeCount}
            </Typography>
            {isLoading && <CircularProgress size={18} sx={{ml:1}}/>}
        </Box>
    );
};

export default LikeDislikeButtons;