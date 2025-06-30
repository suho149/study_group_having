import React from 'react';
import {
    Box,
    Container,
    Typography,
    Grid,
    Paper,
    List,
    ListItemButton,
    ListItemIcon,
    Divider,
    ListItemText
} from '@mui/material';
import BarChartIcon from '@mui/icons-material/BarChart'; // 통계 아이콘
import ReportProblemIcon from '@mui/icons-material/ReportProblem';
import {Outlet, useLocation, useNavigate} from "react-router-dom"; // 신고 관리 아이콘
// TODO: 통계 차트, 신고 목록 테이블 등 컴포넌트 import

const AdminPage: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const isSelected = (path: string) => location.pathname === path;

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold' }}>
                관리자 대시보드
            </Typography>
            <Grid container spacing={4}>
                {/* 왼쪽 메뉴 */}
                <Grid item xs={12} md={3}>
                    <Paper elevation={1}>
                        <List component="nav">
                            <ListItemButton selected={isSelected('/admin')} onClick={() => navigate('/admin')}>
                                <ListItemIcon><BarChartIcon /></ListItemIcon>
                                <ListItemText primary="서비스 통계" />
                            </ListItemButton>
                            <Divider />
                            <ListItemButton selected={isSelected('/admin/reports')} onClick={() => navigate('/admin/reports')}>
                                <ListItemIcon><ReportProblemIcon /></ListItemIcon>
                                <ListItemText primary="신고 관리" />
                            </ListItemButton>
                            {/* 다른 메뉴 추가 가능 */}
                        </List>
                    </Paper>
                </Grid>
                {/* 오른쪽 컨텐츠 영역 */}
                <Grid item xs={12} md={9}>
                    {/* 자식 라우트의 컴포넌트가 여기에 렌더링됩니다. */}
                    <Outlet />
                </Grid>
            </Grid>
        </Container>
    );
};

export default AdminPage;