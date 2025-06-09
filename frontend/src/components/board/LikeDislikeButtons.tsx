// src/components/board/LikeDislikeButtons.tsx
import React, { useState } from 'react';
import { Box, IconButton, Typography, CircularProgress, Button } from '@mui/material';
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
    onVoteSuccess?: (updatedPostData?: any) => void; // 투표 성공 후 콜백 (예: 전체 게시글 데이터 업데이트)
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

    const handleVote = async (voteType: VoteType) => {
        if (!isLoggedIn) {
            alert("로그인이 필요한 기능입니다.");
            // navigate('/login'); // 필요시 로그인 페이지로 이동
            return;
        }
        if (isLoading) return;
        setIsLoading(true);

        const currentVoteForApi = userVote === voteType ? null : voteType; // 같은 버튼 다시 누르면 취소, 아니면 해당 타입으로 투표

        try {
            // 백엔드 API는 요청 시 항상 voteType을 받고, 서버에서 토글/변경 로직 처리
            // 또는 프론트에서 취소 요청을 보내려면 API를 분리하거나 voteType:null을 서버가 해석해야 함
            // 현재 백엔드 voteForPost는 voteType을 받아 처리하므로, 취소 시에도 현재 voteType을 보내면 서버에서 취소됨
            const apiVoteType = userVote === voteType ? voteType : voteType; // 취소 시에도 원래 타입을 보내 서버에서 토글

            await api.post(`/api/board/${targetType}s/${targetId}/vote`, { voteType: apiVoteType });

            // 성공 후 UI 즉시 업데이트 (서버 응답을 기다리지 않고 낙관적 업데이트)
            if (userVote === voteType) { // 같은 버튼 다시 클릭 (취소)
                setUserVote(null);
                if (voteType === VoteType.LIKE) setLikeCount(prev => prev - 1);
                else setDislikeCount(prev => prev - 1);
            } else { // 새로운 투표 또는 다른 타입으로 변경
                if (userVote === VoteType.LIKE) setLikeCount(prev => prev - 1); // 이전 좋아요 취소
                else if (userVote === VoteType.DISLIKE) setDislikeCount(prev => prev - 1); // 이전 비추천 취소

                setUserVote(voteType);
                if (voteType === VoteType.LIKE) setLikeCount(prev => prev + 1);
                else setDislikeCount(prev => prev + 1);
            }

            if (onVoteSuccess) onVoteSuccess(); // 부모 컴포넌트에 알림
        } catch (error: any) {
            console.error(`${targetType} vote error:`, error);
            alert(error.response?.data?.message || "투표 처리 중 오류가 발생했습니다.");
            // 에러 시 UI 롤백 (선택적)
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Button
                size="small"
                startIcon={userVote === VoteType.LIKE ? <ThumbUpAltIcon /> : <ThumbUpAltOutlinedIcon />}
                onClick={() => handleVote(VoteType.LIKE)}
                disabled={isLoading || !isLoggedIn}
                color={userVote === VoteType.LIKE ? "primary" : "inherit"}
            >
                {isLoading && userVote === VoteType.LIKE ? <CircularProgress size={16} color="inherit"/> : likeCount}
            </Button>
            <Button
                size="small"
                startIcon={userVote === VoteType.DISLIKE ? <ThumbDownAltIcon /> : <ThumbDownAltOutlinedIcon />}
                onClick={() => handleVote(VoteType.DISLIKE)}
                disabled={isLoading || !isLoggedIn}
                color={userVote === VoteType.DISLIKE ? "secondary" : "inherit"}
            >
                {isLoading && userVote === VoteType.DISLIKE ? <CircularProgress size={16} color="inherit"/> : dislikeCount}
            </Button>
        </Box>
    );
};

export default LikeDislikeButtons;