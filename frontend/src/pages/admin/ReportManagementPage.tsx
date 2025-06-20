import React from 'react';
import { Paper, Typography } from '@mui/material';
import ReportList from '../../components/admin/ReportList';

const ReportManagementPage: React.FC = () => {
    return (
        <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
                신고 접수 내역
            </Typography>
            <ReportList />
        </Paper>
    );
};

export default ReportManagementPage;