import React, { useState, useEffect, useCallback } from 'react';
import { Container, Box, Tabs, Tab, TextField, InputAdornment, Typography, Grid, CircularProgress, Button, Divider } from '@mui/material';
import { styled } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';
import SearchIcon from '@mui/icons-material/Search';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import StarIcon from '@mui/icons-material/Star';
import api from '../services/api';
import Banner from '../components/home/Banner';
import PostCard from '../components/post/PostCard';
import CreateStudyButton from '../components/study/CreateStudyButton';
import BoardPostItemCard from '../components/board/BoardPostItemCard';
import { useAuth } from '../contexts/AuthContext';
import { StudyGroupSummary } from "../types/study";
import { BoardPostSummary } from '../types/board';
import { AxiosResponse } from 'axios';

// --- Styled Components (변경 없음) ---
const StyledTabs = styled(Tabs)({
  marginBottom: '24px',
  '& .MuiTab-root': {
    textTransform: 'none',
    fontSize: '16px',
    fontWeight: 'normal',
    color: '#666',
    '&.Mui-selected': {color: '#2196F3', fontWeight: 'bold'}
  },
  '& .MuiTabs-indicator': {backgroundColor: '#2196F3'},
});

const SearchField = styled(TextField)({
  marginBottom: '24px',
  '& .MuiOutlinedInput-root': {
    borderRadius: '8px',
    '& fieldset': {borderColor: '#E0E0E0'},
    '&:hover fieldset': {borderColor: '#BDBDBD'},
    '&.Mui-focused fieldset': {borderColor: '#2196F3'},
  },
});

const PostGrid = styled(Box)({
  display: 'grid',
  gridTemplateColumns: 'repeat(1, 1fr)',
  gap: '24px',
  '@media (min-width: 600px)': {gridTemplateColumns: 'repeat(2, 1fr)'},
  '@media (min-width: 960px)': {gridTemplateColumns: 'repeat(3, 1fr)'},
});

const Home: React.FC = () => {
  const [currentTab, setCurrentTab] = useState(0); // 0: 전체, 1: 프로젝트, 2: 스터디, 3: 자유 게시판
  const {isLoggedIn, isLoading: authLoading} = useAuth();
  const navigate = useNavigate();

  // --- 상태 관리 리팩토링 ---
  const [studyAndProjectList, setStudyAndProjectList] = useState<StudyGroupSummary[]>([]);
  const [boardPostList, setBoardPostList] = useState<BoardPostSummary[]>([]);
  const [hotPosts, setHotPosts] = useState<BoardPostSummary[]>([]);
  const [searchKeyword, setSearchKeyword] = useState('');

  // 로딩 및 페이징 상태
  const [isLoading, setIsLoading] = useState(true); // 초기 로딩 및 탭/검색 변경 시
  const [isLoadingMore, setIsLoadingMore] = useState(false); // "더보기" 로딩
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  // 데이터 로딩 함수 (페이징 적용)
  const fetchData = useCallback(async (
      tabIndex: number,
      keyword: string,
      page: number,
      isNewSearch: boolean = false
  ) => {
    if (isNewSearch) {
      setIsLoading(true);
    } else {
      setIsLoadingMore(true);
    }

    try {
      const params: any = { keyword: keyword || undefined, page };

      if (tabIndex <= 2) {
        let studyTypeParam: 'PROJECT' | 'STUDY' | undefined = undefined;
        if (tabIndex === 1) studyTypeParam = 'PROJECT';
        if (tabIndex === 2) studyTypeParam = 'STUDY';
        if (studyTypeParam) params.studyType = studyTypeParam;
        params.size = 9;
        const response = await api.get<{ content: StudyGroupSummary[], last: boolean }>('/api/studies', { params });
        if (response.data && Array.isArray(response.data.content)) {
          setStudyAndProjectList(prev => isNewSearch ? response.data.content : [...prev, ...response.data.content]);
          setHasMore(!response.data.last);
        }
      } else { // 자유 게시판 탭
        params.size = 9;
        params.sort = 'createdAt,desc';
        const response = await api.get<{ content: BoardPostSummary[], last: boolean }>('/api/board/posts', { params });
        if (response.data && Array.isArray(response.data.content)) {
          setBoardPostList(prev => isNewSearch ? response.data.content : [...prev, ...response.data.content]);
          setHasMore(!response.data.last);
        }
      }
      setCurrentPage(page);
    } catch (error) {
      console.error(`데이터 조회 실패 (탭: ${tabIndex}):`, error);
      setHasMore(false);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, []);

  // 핫 게시물 로드 함수
  const fetchHotPosts = useCallback(async () => {
    // 자유 게시판 탭이 아닐 때는 호출하지 않음
    if (currentTab !== 3) {
      setHotPosts([]); // 다른 탭으로 이동 시 핫 게시물 목록 비움
      return;
    }
    try {
      const response = await api.get<BoardPostSummary[]>('/api/board/posts/hot');
      setHotPosts(response.data);
    } catch (error) {
      console.error("핫 게시물 조회 실패:", error);
      setHotPosts([]); // 에러 시 비움
    }
  }, [currentTab]);

  // 탭 변경 시 데이터 로드
  useEffect(() => {
    if (!authLoading) {
      fetchData(currentTab, searchKeyword, 0, true);
      fetchHotPosts();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, currentTab]); // 검색어 변경 시에는 자동 호출 안 함

  const handleSearchSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    fetchData(currentTab, searchKeyword, 0, true); // 검색 시 첫 페이지부터 다시 로드
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
    setSearchKeyword(''); // 탭 변경 시 검색어 초기화
  };

  const handleLoadMore = () => {
    if (!isLoading && !isLoadingMore && hasMore) {
      fetchData(currentTab, searchKeyword, currentPage + 1, false);
    }
  };

  if (authLoading) {
    return <Container maxWidth="lg" sx={{ py: 4, display: 'flex', justifyContent: 'center' }}><CircularProgress /></Container>;
  }

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
          <StyledTabs value={currentTab} onChange={handleTabChange}>
            <Tab label="전체" />
            <Tab label="프로젝트" />
            <Tab label="스터디" />
            <Tab label="자유 게시판" />
          </StyledTabs>

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <form onSubmit={handleSearchSubmit} style={{ flexGrow: 1 }}>
              <SearchField
                  fullWidth
                  variant="outlined"
                  placeholder={currentTab === 3 ? "게시글 검색..." : "스터디/프로젝트 검색..."}
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  InputProps={{
                    startAdornment: ( <InputAdornment position="start"><SearchIcon color="action" /></InputAdornment> ),
                  }}
              />
            </form>
            {currentTab === 3 && isLoggedIn && (
                <Button
                    variant="contained"
                    startIcon={<AddCircleOutlineIcon />}
                    onClick={() => navigate('/board/create')}
                    sx={{ ml: 2, flexShrink: 0, height: '56px' }}
                >
                  새 글 작성
                </Button>
            )}
          </Box>

          {/* --- 핫 게시물 섹션 --- */}
          {currentTab === 3 && hotPosts.length > 0 && (
              <Box mb={5}>
                <Typography variant="h5" component="h3" gutterBottom sx={{ display: 'flex', alignItems: 'center', fontWeight: 'bold' }}>
                  <StarIcon sx={{ color: 'gold', mr: 1, fontSize: '1.75rem' }} /> 핫 게시물
                </Typography>
                <Grid container spacing={3}>
                  {hotPosts.map(post => (
                      <Grid item xs={12} sm={6} md={4} key={`hot-${post.id}`}>
                        <BoardPostItemCard {...post} />
                      </Grid>
                  ))}
                </Grid>
                <Divider sx={{ my: 4 }} />
              </Box>
          )}

          {/* --- 메인 콘텐츠 렌더링 --- */}
          {isLoading ? (
              <Box sx={{display: 'flex', justifyContent: 'center', mt: 8}}><CircularProgress /></Box>
          ) : (
              <>
                {(currentTab <= 2 ? studyAndProjectList : boardPostList).length > 0 ? (
                    <>
                      <Grid container spacing={3}>
                        {(currentTab <= 2 ? studyAndProjectList : boardPostList).map(item => (
                            <Grid item xs={12} sm={6} md={4} key={item.id}>
                              {currentTab <= 2 ? (
                                  <PostCard
                                      id={item.id}
                                      category={(item as StudyGroupSummary).studyType === 'PROJECT' ? '프로젝트' : '스터디'}
                                      title={item.title}
                                      date={new Date(item.createdAt).toLocaleDateString('ko-KR')}
                                      currentMembers={(item as StudyGroupSummary).currentMembers}
                                      maxMembers={(item as StudyGroupSummary).maxMembers}
                                      tags={(item as StudyGroupSummary).tags}
                                      status={(item as StudyGroupSummary).status}
                                      viewCount={(item as StudyGroupSummary).viewCount}
                                      initialLikeCount={(item as StudyGroupSummary).likeCount || 0}
                                      initialIsLiked={(item as StudyGroupSummary).liked || false}
                                  />
                              ) : (
                                  <BoardPostItemCard
                                      id={item.id}
                                      category={(item as BoardPostSummary).category}
                                      title={item.title}
                                      authorName={(item as BoardPostSummary).authorName}
                                      createdAt={item.createdAt}
                                      viewCount={(item as BoardPostSummary).viewCount}
                                      likeCount={(item as BoardPostSummary).likeCount}
                                      commentCount={(item as BoardPostSummary).commentCount}
                                  />
                              )}
                            </Grid>
                        ))}
                      </Grid>
                      {hasMore && (
                          <Box sx={{ textAlign: 'center', mt: 4 }}>
                            <Button onClick={handleLoadMore} disabled={isLoadingMore} variant="outlined">
                              {isLoadingMore ? <CircularProgress size={20} /> : '더보기'}
                            </Button>
                          </Box>
                      )}
                    </>
                ) : (
                    <Typography sx={{ textAlign: 'center', mt: 8, color: 'text.secondary' }}>
                      {searchKeyword ? `'${searchKeyword}'에 대한 검색 결과가 없습니다.` :
                          (currentTab === 3 ? "작성된 게시글이 없습니다." : "표시할 스터디/프로젝트가 없습니다.")}
                    </Typography>
                )}
              </>
          )}
        </Box>
      </Container>
  );
};

export default Home;