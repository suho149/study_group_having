import React, { useState, useEffect } from 'react';
import { Container, Box, Tabs, Tab, TextField, InputAdornment, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';
import SearchIcon from '@mui/icons-material/Search';
// import axios from 'axios'; // api 인스턴스 사용으로 변경
import api from '../services/api'; // 수정: axios 대신 api 인스턴스 사용
import Banner from '../components/home/Banner';
import PostCard from '../components/post/PostCard';
import CreateStudyButton from '../components/study/CreateStudyButton';
// import { checkAuthStatus } from '../services/auth'; // AuthContext 사용으로 변경
import { useAuth } from '../contexts/AuthContext';
import {StudyGroupSummary} from "../types/study"; // 추가

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
  const { isLoggedIn, isLoading: authLoading, currentUserId } = useAuth(); // 수정: AuthContext 사용, authLoading 추가
  const [studyGroups, setStudyGroups] = useState<StudyGroupSummary[]>([]);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [loadingStudies, setLoadingStudies] = useState(false); // 스터디 목록 로딩 상태 이름 변경

  useEffect(() => {
    // AuthContext에서 이미 인증 상태를 관리하므로, 여기서는 스터디 목록만 가져옵니다.
    // AuthContext의 isLoading (authLoading)이 false가 된 후 (인증 상태 확인 완료 후)
    // 또는 isLoggedIn 상태가 변경될 때 스터디 목록을 가져올 수 있습니다.
    // 여기서는 authLoading이 false일 때, 즉 인증 상태가 확정되었을 때 가져오도록 합니다.
    if (!authLoading) {
      fetchStudyGroups();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading]); // authLoading 상태가 변경될 때 (특히 true -> false 될 때) 실행

  const fetchStudyGroups = async (keyword = '', studyType?: 'PROJECT' | 'STUDY') => {
    setLoadingStudies(true);
    try {
      const response = await api.get<{ content: StudyGroupSummary[] }>('/api/studies', {
        params: { /* ... keyword, page, size, studyType ... */ }
        // api.get 호출 시, 백엔드가 UserPrincipal을 받으므로,
        // 현재 로그인 사용자 정보는 자동으로 전달되어 liked 여부가 계산된 응답이 옴
      });
      setStudyGroups(response.data.content);
    } catch (error) {
      console.error('스터디 그룹 목록 조회 실패:', error);
      // 사용자에게 오류 메시지 표시 (예: Snackbar)
    } finally {
      setLoadingStudies(false);
    }
  };

  const handleSearch = (event: React.FormEvent) => {
    event.preventDefault();
    fetchStudyGroups(searchKeyword);
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };

  // 인증 상태 로딩 중에는 아무것도 표시하지 않거나 로딩 스피너 표시
  if (authLoading) {
    return <Container maxWidth="lg" sx={{ py: 4, textAlign: 'center' }}><Typography>인증 상태 확인 중...</Typography></Container>;
  }

  return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Having
        </Typography>
        <Typography variant="subtitle1" gutterBottom sx={{ mb: 2 }}>
          함께 성장하는 IT 스터디 플랫폼
        </Typography>
        {/* CreateStudyButton은 로그인 시에만 보이도록 처리 */}
        {isLoggedIn && <Box sx={{ mb: 2 }}><CreateStudyButton /></Box>}

        <Banner />

        <Box sx={{ mb: 4, mt: 4 }}>
          <StyledTabs value={currentTab} onChange={handleTabChange} indicatorColor="primary" textColor="primary">
            <Tab label="전체" />
            <Tab label="프로젝트" />
            <Tab label="스터디" />
          </StyledTabs>

          <form onSubmit={handleSearch}>
            <SearchField
                fullWidth
                variant="outlined" // 추가
                placeholder="관심 있는 스터디나 프로젝트를 검색해보세요"
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

          {loadingStudies ? (
              <Typography sx={{ textAlign: 'center', mt: 4 }}>스터디 목록을 불러오는 중...</Typography>
          ) : studyGroups.length === 0 ? (
              <Typography sx={{ textAlign: 'center', mt: 4 }}>표시할 스터디 그룹이 없습니다.</Typography>
          ) : (
              <PostGrid>
                {studyGroups.map((study) => (
                    <PostCard
                        key={study.id}
                        id={study.id}
                        category={study.studyType === 'PROJECT' ? '프로젝트' : '스터디'}
                        title={study.title}
                        // description={study.description} // PostCard에 description이 필요하다면 추가
                        date={new Date(study.createdAt).toLocaleDateString()}
                        // views는 currentMembers 대신 viewCount를 사용하는 것이 적절해 보입니다.
                        // 또는 PostCard의 views prop의 의미를 명확히 해야 합니다.
                        // 여기서는 스터디 멤버 수로 가정합니다.
                        currentMembers={study.currentMembers}
                        maxMembers={study.maxMembers} // 추가: 최대 멤버 수 (PostCard에서 활용 가능)
                        tags={study.tags}
                        // isHot 조건은 백엔드에서 내려주거나, 여기서 좀 더 복잡한 로직으로 결정 가능
                        isHot={study.viewCount > 100 || (study.currentMembers / study.maxMembers) > 0.8} // 예시 isHot 조건
                        status={study.status} // PostCard에서 상태에 따른 UI 변경 시 사용
                        viewCount={study.viewCount} // PostCard에서 조회수 표시 시 사용
                        initialLikeCount={study.likeCount} // <--- 추가
                        initialIsLiked={study.liked}     // <--- 추가
                    />
                ))}
              </PostGrid>
          )}
        </Box>
      </Container>
  );
};

export default Home; 