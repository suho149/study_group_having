import React from 'react';
import { Box, Container, Typography, Grid, Paper } from '@mui/material';
// TODO: 통계 차트, 신고 목록 테이블 등 컴포넌트 import

const AdminPage: React.FC = () => {
    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Typography variant="h4" gutterBottom>
                관리자 대시보드
            </Typography>
            <Grid container spacing={3}>
                {/* 통계 섹션 */}
                <Grid item xs={12}>
                    <Paper sx={{ p: 2 }}>
                        <Typography variant="h6">서비스 통계</Typography>
                        {/* 여기에 Chart.js 또는 Recharts 컴포넌트 위치 */}
                    </Paper>
                </Grid>
                {/* 신고 관리 섹션 */}
                <Grid item xs={12}>
                    <Paper sx={{ p: 2 }}>
                        <Typography variant="h6">신고 관리</Typography>
                        {/* 여기에 신고 내역을 보여주는 테이블 컴포넌트 위치 */}
                    </Paper>
                </Grid>
                {/* 사용자/콘텐츠 관리 섹션은 필요에 따라 추가 */}
            </Grid>
        </Container>
    );
};

export default AdminPage;