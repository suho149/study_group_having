import React from 'react';
import { Paper, Typography } from '@mui/material';

const StatisticsPage: React.FC = () => {
    return (
        <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
                서비스 통계
            </Typography>
            <Typography>
                여기에 일별 가입자 수, 게시글 수 등의 통계 차트가 표시될 예정입니다.
            </Typography>
        </Paper>
    );
};

export default StatisticsPage;