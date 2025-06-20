import React, {useEffect, useState} from 'react';
import { Paper, Typography, Grid, Box, CircularProgress, Alert } from '@mui/material';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import api from '../../services/api';
import PeopleIcon from '@mui/icons-material/People';
import ClassIcon from '@mui/icons-material/Class';
import ArticleIcon from '@mui/icons-material/Article';


// API 응답 타입을 정의합니다.
interface StatisticsResponse {
    totalUsers: number;
    totalStudies: number;
    totalPosts: number;
    totalComments: number;
    dailySignups: { date: string; count: number }[];
    popularTags: { tagName: string; count: number }[];
}

// 간단한 통계 카드를 위한 컴포넌트
const StatCard: React.FC<{ title: string; value: string | number; icon: React.ReactElement }> = ({ title, value, icon }) => (
    <Paper sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
        {icon}
        <Box>
            <Typography color="text.secondary">{title}</Typography>
            <Typography variant="h5" component="p" sx={{ fontWeight: 'bold' }}>{value}</Typography>
        </Box>
    </Paper>
);

const StatisticsPage: React.FC = () => {
    const [stats, setStats] = useState<StatisticsResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchStats = async () => {
            setLoading(true);
            try {
                const response = await api.get<StatisticsResponse>('/api/admin/statistics');
                setStats(response.data);
            } catch (err: any) {
                setError('통계 데이터를 불러오는 데 실패했습니다.');
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    if (loading) {
        return <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>;
    }
    if (error) {
        return <Alert severity="error">{error}</Alert>;
    }
    if (!stats) {
        return <Typography>표시할 통계 데이터가 없습니다.</Typography>;
    }

    return (
        <Grid container spacing={3}>
            {/* 상단 요약 카드 */}
            <Grid item xs={12} sm={6} md={3}><StatCard title="총 회원 수" value={stats.totalUsers} icon={<PeopleIcon color="primary" sx={{fontSize: 40}} />} /></Grid>
            <Grid item xs={12} sm={6} md={3}><StatCard title="총 스터디 수" value={stats.totalStudies} icon={<ClassIcon color="secondary" sx={{fontSize: 40}} />} /></Grid>
            <Grid item xs={12} sm={6} md={3}><StatCard title="총 게시글 수" value={stats.totalPosts} icon={<ArticleIcon color="warning" sx={{fontSize: 40}} />} /></Grid>
            <Grid item xs={12} sm={6} md={3}><StatCard title="총 댓글 수" value={stats.totalComments} icon={<ArticleIcon color="info" sx={{fontSize: 40}} />} /></Grid>

            {/* 일별 가입자 수 라인 차트 */}
            <Grid item xs={12} md={7}>
                <Paper sx={{ p: 2, height: 300 }}>
                    <Typography variant="h6" gutterBottom>최근 7일 가입자 현황</Typography>
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={stats.dailySignups} margin={{ top: 5, right: 20, left: -10, bottom: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                            <YAxis allowDecimals={false} />
                            <Tooltip />
                            <Legend />
                            <Line type="monotone" dataKey="count" name="가입자 수" stroke="#8884d8" activeDot={{ r: 8 }} />
                        </LineChart>
                    </ResponsiveContainer>
                </Paper>
            </Grid>

            {/* 인기 태그 바 차트 */}
            <Grid item xs={12} md={5}>
                <Paper sx={{ p: 2, height: 300 }}>
                    <Typography variant="h6" gutterBottom>인기 태그 Top 5</Typography>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={stats.popularTags} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis type="number" allowDecimals={false} />
                            <YAxis type="category" dataKey="tagName" width={60} tick={{ fontSize: 12 }} />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="count" name="사용 횟수" fill="#82ca9d" />
                        </BarChart>
                    </ResponsiveContainer>
                </Paper>
            </Grid>
        </Grid>
    );
};

export default StatisticsPage;