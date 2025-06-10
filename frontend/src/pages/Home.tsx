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

  const [loadingMore, setLoadingMore] = useState(false); // "더보기" 로딩
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMore, setHasMore] = useState(true); // 더보기 가능 여부

  // 데이터 로딩 함수 (페이징 적용)
  const fetchData = useCallback(async (tabIndex: number, keyword: string, page: number, isNewSearch: boolean = false) => {
    // isNewSearch가 true이면 초기 로딩, false이면 더보기 로딩
    if (isNewSearch) {
      setLoadingData(true);
      setStudyAndProjectList([]); // 목록 초기화
      setBoardPostList([]);     // 목록 초기화
      setCurrentPage(0);        // 페이지 번호 초기화
      setHasMore(true);         // 더보기 가능 상태로 초기화
    } else {
      setLoadingMore(true);
    }

    try {
      if (tabIndex <= 2) { // 전체 스터디, 프로젝트, 일반 스터디
        let studyTypeParam: 'PROJECT' | 'STUDY' | undefined = undefined;
        if (tabIndex === 1) studyTypeParam = 'PROJECT';
        if (tabIndex === 2) studyTypeParam = 'STUDY';

        const params: any = { keyword: keyword || undefined, page, size: 9 };
        if (studyTypeParam) params.studyType = studyTypeParam;

        const response = await api.get<{ content: StudyGroupSummary[], last: boolean }>('/api/studies', { params });
        if (response.data && Array.isArray(response.data.content)) {
          setStudyAndProjectList(prev => isNewSearch ? response.data.content : [...prev, ...response.data.content]);
          setHasMore(!response.data.last);
          setCurrentPage(page);
        }
      } else if (tabIndex === 3) { // 자유 게시판
        const params: any = { keyword: keyword || undefined, page, size: 10, sort: 'createdAt,desc' };
        const response = await api.get<{ content: BoardPostSummary[], last: boolean }>('/api/board/posts', { params });
        if (response.data && Array.isArray(response.data.content)) {
          setBoardPostList(prev => isNewSearch ? response.data.content : [...prev, ...response.data.content]);
          setHasMore(!response.data.last);
          setCurrentPage(page);
        }
      }
    } catch (error) {
      console.error(`데이터 조회 실패 (탭: ${tabIndex}):`, error);
      setHasMore(false); // 에러 발생 시 더보기 중단
    } finally {
      setLoadingData(false);
      setLoadingMore(false);
    }
  }, []);


  // 탭 또는 검색어 변경 시 첫 페이지부터 다시 로드
  useEffect(() => {
    if (!authLoading) {
      fetchData(currentTab, searchKeyword, 0, true);
    }
  }, [authLoading, currentTab, searchKeyword, fetchData]);

  const handleSearch = (event: React.FormEvent) => {
    event.preventDefault();
    fetchData(currentTab, searchKeyword, 0, true); // 검색은 항상 첫 페이지부터 (isNewSearch = true)
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
    setSearchKeyword(''); // 탭 변경 시 검색어 초기화 (선택 사항)
  };

  const handleLoadMore = () => {
    if (!loadingData && !loadingMore && hasMore) {
      fetchData(currentTab, searchKeyword, currentPage + 1, false); // 다음 페이지 로드 (isNewSearch = false)
    }
  };

  // 인증 상태 로딩 중에는 아무것도 표시하지 않거나 로딩 스피너 표시
  if (authLoading && !isLoggedIn) {
    return <Container maxWidth="lg" sx={{ py: 4, textAlign: 'center' }}><Typography>인증 상태 확인 중...</Typography></Container>;
  }

  const renderContent = () => {
    const listToRender = currentTab <= 2 ? studyAndProjectList : boardPostList;
    const noDataMessage = currentTab <= 2 ? "표시할 스터디/프로젝트가 없습니다." : "작성된 게시글이 없습니다.";

    if (loadingData) {
      return <Box sx={{display: 'flex', justifyContent: 'center', mt:4}}><CircularProgress /></Box>;
    }

    return (
        <>
          {listToRender.length > 0 ? (
              <>
                {currentTab <= 2 ? (
                    <PostGrid>
                      {studyAndProjectList.map((study) => (
                          <PostCard
                              key={study.id}
                              id={study.id}
                              category={study.studyType === 'PROJECT' ? '프로젝트' : '스터디'} // study.studyType을 기반으로 category 생성
                              title={study.title}
                              date={new Date(study.createdAt).toLocaleDateString('ko-KR')} // study.createdAt을 date로 변환
                              currentMembers={study.currentMembers} // PostCardProps에 currentMembers가 있다면 전달
                              maxMembers={study.maxMembers}
                              tags={study.tags}
                              status={study.status}
                              viewCount={study.viewCount}
                              initialLikeCount={study.likeCount || 0} // study.likeCount를 initialLikeCount로 전달
                              initialIsLiked={study.liked || false}   // study.liked를 initialIsLiked로 전달
                              // PostCardProps에 없는 props (예: description, modifiedAt 등)는 전달하지 않음
                          />
                      ))}
                    </PostGrid>
                ) : (
                    <Grid container spacing={3}>
                      {listToRender.map(item => (
                          <Grid item xs={12} sm={6} md={4} key={item.id}>
                            <BoardPostItemCard {...(item as BoardPostSummary)} />
                          </Grid>
                      ))}
                    </Grid>
                )}

                {hasMore && (
                    <Box sx={{ textAlign: 'center', mt: 4 }}>
                      <Button onClick={handleLoadMore} disabled={loadingMore} variant="outlined">
                        {loadingMore ? <CircularProgress size={20} /> : '더보기'}
                      </Button>
                    </Box>
                )}
              </>
          ) : (
              <Typography sx={{ textAlign: 'center', mt: 4, color: 'text.secondary' }}>
                {searchKeyword ? `'${searchKeyword}'에 대한 검색 결과가 없습니다.` : noDataMessage}
              </Typography>
          )}
        </>
    );
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