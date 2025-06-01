import React, { useState, useEffect } from 'react';
import { Container, Box, Tabs, Tab, TextField, InputAdornment, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';
import SearchIcon from '@mui/icons-material/Search';
import axios from 'axios';
import Banner from '../components/home/Banner';
import PostCard from '../components/post/PostCard';
import CreateStudyButton from '../components/study/CreateStudyButton';
import { checkAuthStatus } from '../services/auth';

const StyledTabs = styled(Tabs)({
  marginBottom: '24px',
  '& .MuiTab-root': {
    textTransform: 'none',
    fontSize: '16px',
    fontWeight: 'normal',
    color: '#666',
    '&.Mui-selected': {
      color: '#2196F3',
      fontWeight: 'bold',
    },
  },
  '& .MuiTabs-indicator': {
    backgroundColor: '#2196F3',
  },
});

const SearchField = styled(TextField)({
  marginBottom: '24px',
  '& .MuiOutlinedInput-root': {
    borderRadius: '8px',
    '& fieldset': {
      borderColor: '#E0E0E0',
    },
    '&:hover fieldset': {
      borderColor: '#BDBDBD',
    },
    '&.Mui-focused fieldset': {
      borderColor: '#2196F3',
    },
  },
});

const PostGrid = styled(Box)({
  display: 'grid',
  gridTemplateColumns: 'repeat(1, 1fr)',
  gap: '24px',
  '@media (min-width: 600px)': {
    gridTemplateColumns: 'repeat(2, 1fr)',
  },
  '@media (min-width: 960px)': {
    gridTemplateColumns: 'repeat(3, 1fr)',
  },
});

interface StudyGroup {
  id: number;
  title: string;
  description: string;
  maxMembers: number;
  currentMembers: number;
  studyType: 'PROJECT' | 'STUDY';
  tags: string[];
  createdAt: string;
  modifiedAt: string;
  status: string;
  viewCount: number;
}

const Home = () => {
  const [currentTab, setCurrentTab] = useState(0);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [studyGroups, setStudyGroups] = useState<StudyGroup[]>([]);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const validateAuth = async () => {
      const isValid = await checkAuthStatus();
      setIsLoggedIn(isValid);
    };
    validateAuth();
    fetchStudyGroups();
  }, []);

  const fetchStudyGroups = async (keyword = '') => {
    try {
      setLoading(true);
      const response = await axios.get<{ content: StudyGroup[] }>(`http://localhost:8080/api/studies`, {
        params: {
          keyword: keyword || undefined,
          size: 10
        }
      });
      setStudyGroups(response.data.content);
    } catch (error) {
      console.error('스터디 그룹 목록 조회 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (event: React.FormEvent) => {
    event.preventDefault();
    fetchStudyGroups(searchKeyword);
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Having
      </Typography>
      <Typography variant="subtitle1" gutterBottom>
        함께 성장하는 IT 스터디 플랫폼
      </Typography>
      {isLoggedIn && <CreateStudyButton />}
      
      <Banner />
      
      <Box sx={{ mb: 4 }}>
        <StyledTabs value={currentTab} onChange={handleTabChange}>
          <Tab label="전체" />
          <Tab label="프로젝트" />
          <Tab label="스터디" />
        </StyledTabs>

        <form onSubmit={handleSearch}>
          <SearchField
            fullWidth
            placeholder="검색어를 입력하세요"
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="action" />
                </InputAdornment>
              ),
            }}
          />
        </form>

        <PostGrid>
          {studyGroups.map((study) => (
            <PostCard
              key={study.id}
              id={study.id}
              category={study.studyType === 'PROJECT' ? '프로젝트' : '스터디'}
              title={study.title}
              date={new Date(study.createdAt).toLocaleDateString()}
              views={study.currentMembers}
              tags={study.tags}
              isHot={study.currentMembers >= study.maxMembers * 0.8}
              status={study.status}
              viewCount={study.viewCount}
            />
          ))}
        </PostGrid>
      </Box>
    </Container>
  );
};

export default Home; 