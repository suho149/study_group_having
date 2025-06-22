import React, { useState } from 'react';
import { Box, Typography, Tabs, Tab, Paper } from '@mui/material';
import FriendList from '../components/friend/FriendList';
import ReceivedRequestList from '../components/friend/ReceivedRequestList';
import SentRequestList from '../components/friend/SentRequestList';

const FriendManagementPage: React.FC = () => {
    const [tabIndex, setTabIndex] = useState(0);

    const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
        setTabIndex(newValue);
    };

    return (
        <Paper sx={{ p: 3 }}>
            <Typography variant="h5" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
                친구 관리
            </Typography>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs value={tabIndex} onChange={handleTabChange}>
                    <Tab label="내 친구" />
                    <Tab label="받은 신청" />
                    <Tab label="보낸 신청" />
                </Tabs>
            </Box>
            <Box sx={{ pt: 3 }}>
                {tabIndex === 0 && <FriendList />}
                {tabIndex === 1 && <ReceivedRequestList />}
                {tabIndex === 2 && <SentRequestList />}
            </Box>
        </Paper>
    );
};

export default FriendManagementPage;