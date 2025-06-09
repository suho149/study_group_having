import React, {useState, useEffect, useCallback} from 'react';
import {Container, Box, Tabs, Tab, TextField, InputAdornment, Typography, Paper, Chip, Grid} from '@mui/material';
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
import { CircularProgress } from '@mui/material'; // 로딩 스피너
import { Button } from '@mui/material'; // Button import 추가 (CreateStudyButton과 별개)
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline'; // 글쓰기 아이콘 예시
import { useNavigate } from 'react-router-dom'; // useNavigate 추가
import BoardPostItemCard from '../components/board/BoardPostItemCard'; // 새로 만든 카드 컴포넌트 import
import { BoardPostSummary } from '../types/board'; // 게시판 글 요약 타입

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
  const { isLoggedIn, isLoading: authLoading } = useAuth(); // 수정: AuthContext 사용, authLoading 추가
  //const [studyGroups, setStudyGroups] = useState<StudyGroupSummary[]>([]);
  const [studyAndProjectList, setStudyAndProjectList] = useState<StudyGroupSummary[]>([]); // 수정: studyGroups -> studyAndProjectList
  const [searchKeyword, setSearchKeyword] = useState('');
  const [boardPosts, setBoardPosts] = useState<BoardPostSummary[]>([]); // 자유게시판 글 목록 상태
  const [loadingData, setLoadingData] = useState(false); // 통합 로딩 상태
  const navigate = useNavigate(); // useNavigate 훅 사용
  const [boardPostList, setBoardPostList] = useState<BoardPostSummary[]>([]);    // 게시판 글 목록

  // 데이터 로딩 함수
  const fetchData = useCallback(async (tabIndex: number, keyword = '') => {
    setLoadingData(true);
    setStudyAndProjectList([]);
    setBoardPostList([]);
    try {
      if (tabIndex <= 2) { // 전체 스터디, 프로젝트, 일반 스터디
        let studyTypeParam: 'PROJECT' | 'STUDY' | undefined = undefined;
        if (tabIndex === 1) studyTypeParam = 'PROJECT';
        if (tabIndex === 2) studyTypeParam = 'STUDY';

        const params: any = { keyword: keyword || undefined, page: 0, size: 9 };
        if (studyTypeParam) params.studyType = studyTypeParam;

        // API 응답 타입을 Page<StudyGroupSummary> 등으로 명확히 할 수 있다면 더 좋음
        const response = await api.get<{ content: StudyGroupSummary[] }>('/api/studies', { params });
        if (response.data && Array.isArray(response.data.content)) {
          setStudyAndProjectList(response.data.content); // 수정: setStudyGroups -> setStudyAndProjectList
        } else {
          console.error("스터디/프로젝트 목록 API 응답 형식이 예상과 다릅니다:", response.data);
        }
      } else if (tabIndex === 3) { // 자유 게시판
        const params: any = { keyword: keyword || undefined, page: 0, size: 10, sort: 'createdAt,desc' };
        // 예시: 자유 게시판은 특정 카테고리 없이 전체 또는 'FREE' 카테고리
        // params.category = 'FREE'; // 필요하다면 카테고리 지정
        const response = await api.get<{ content: BoardPostSummary[] }>('/api/board/posts', { params });
        if (response.data && Array.isArray(response.data.content)) {
          setBoardPostList(response.data.content);
        } else {
          console.error("게시판 목록 API 응답 형식이 예상과 다릅니다:", response.data);
        }
      }
    } catch (error) {
      console.error(`데이터 조회 실패 (탭: ${tabIndex}):`, error);
    } finally {
      setLoadingData(false);
    }
  }, []); // 의존성 배열은 fetchData를 사용하는 useEffect에서 관리


  useEffect(() => {
    if (!authLoading) {
      fetchData(currentTab, searchKeyword);
    }
  }, [authLoading, currentTab, searchKeyword, fetchData]); // fetchData를 의존성에 추가

  const handleSearch = (event: React.FormEvent) => {
    event.preventDefault();
    fetchData(currentTab, searchKeyword); // 현재 탭 기준으로 검색
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
    setSearchKeyword(''); // 탭 변경 시 검색어 초기화 (선택 사항)
  };

  // 인증 상태 로딩 중에는 아무것도 표시하지 않거나 로딩 스피너 표시
  if (authLoading) {
    return <Container maxWidth="lg" sx={{ py: 4, textAlign: 'center' }}><Typography>인증 상태 확인 중...</Typography></Container>;
  }

  const renderContent = () => {
    if (loadingData) {
      return <Box sx={{display: 'flex', justifyContent: 'center', mt:4}}><CircularProgress /></Box>;
    }

    if (currentTab <= 2) { // 스터디/프로젝트 탭
      return studyAndProjectList.length > 0 ? (
          <PostGrid>
            {studyAndProjectList.map((study) => (
                <PostCard
                    key={study.id}
                    id={study.id}
                    category={study.studyType === 'PROJECT' ? '프로젝트' : '스터디'}
                    title={study.title}
                    date={new Date(study.createdAt).toLocaleDateString('ko-KR')}
                    currentMembers={study.currentMembers}
                    maxMembers={study.maxMembers}
                    tags={study.tags}
                    status={study.status}
                    viewCount={study.viewCount}
                    // 좋아요 관련 props는 PostCard에 맞게 전달
                    initialLikeCount={study.likeCount || 0} // StudyGroup 타입에 likeCount, liked 추가 필요
                    initialIsLiked={study.liked || false}   // StudyGroup 타입에 likeCount, liked 추가 필요
                />
            ))}
          </PostGrid>
      ) : <Typography sx={{ textAlign: 'center', mt: 4, color: 'text.secondary' }}>표시할 스터디/프로젝트가 없습니다.</Typography>;
    }

    if (currentTab === 3) { // 자유 게시판 탭
      return boardPostList.length > 0 ? (
          <Grid container spacing={3}> {/* 게시판 목록은 다른 레이아웃 사용 가능 */}
            {boardPostList.map(post => (
                <Grid item xs={12} sm={6} md={4} key={post.id}>
                  <BoardPostItemCard {...post} />
                </Grid>
            ))}
          </Grid>
      ) : <Typography sx={{ textAlign: 'center', mt: 4, color: 'text.secondary' }}>작성된 게시글이 없습니다.</Typography>;
    }
    return null;
  };

  return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box>
            <Typography variant="h4" component="h1" gutterBottom>Having</Typography>
            <Typography variant="subtitle1" color="text.secondary" gutterBottom>함께 성장하는 IT 스터디 플랫폼</Typography>
          </Box>
          {isLoggedIn && <CreateStudyButton />}
        </Box>
        <Banner />

        <Box sx={{ mb: 4, mt: 4 }}>
          <StyledTabs value={currentTab} onChange={handleTabChange} indicatorColor="primary" textColor="primary">
            <Tab label="전체" />
            <Tab label="프로젝트" />
            <Tab label="스터디" />
            <Tab label="자유 게시판" /> {/* 자유 게시판 탭 추가 */}
          </StyledTabs>

          {/* 현재 탭이 "자유 게시판"이고 로그인 상태일 때만 "글쓰기" 버튼 표시 */}
          {currentTab === 3 && isLoggedIn && (
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                <Button
                    variant="contained"
                    startIcon={<AddCircleOutlineIcon />}
                    onClick={() => navigate('/board/create')} // 게시글 작성 페이지로 이동
                >
                  새 글 작성
                </Button>
              </Box>
          )}

          <form onSubmit={handleSearch}>
            <SearchField
                fullWidth
                variant="outlined" // 추가
                placeholder={currentTab === 3 ? "게시글 검색..." : "스터디/프로젝트 검색..."}
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

          {renderContent()}
        </Box>
      </Container>
  );
};

export default Home; 