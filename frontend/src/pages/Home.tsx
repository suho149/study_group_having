import React, {useState, useEffect, useCallback} from 'react';
import {Container, Box, Tabs, Tab, TextField, InputAdornment, Typography, Paper} from '@mui/material';
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

// 게시판 글 목록을 위한 인터페이스 (새로 정의 또는 types 폴더에)
interface BoardPostSummary {
  id: number;
  category: string; // 예: "자유", "질문"
  title: string;
  authorName: string;
  createdAt: string; // ISO 문자열
  viewCount: number;
  likeCount: number; // 추천 수
  commentCount: number;
  // thumbnailUrl?: string; // 대표 이미지 URL (사진 업로드 시)
}

const Home = () => {
  const [currentTab, setCurrentTab] = useState(0);
  const { isLoggedIn, isLoading: authLoading, currentUserId } = useAuth(); // 수정: AuthContext 사용, authLoading 추가
  const [studyGroups, setStudyGroups] = useState<StudyGroupSummary[]>([]);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [boardPosts, setBoardPosts] = useState<BoardPostSummary[]>([]); // 자유게시판 글 목록 상태
  const [loadingData, setLoadingData] = useState(false); // 통합 로딩 상태

  // 데이터 로딩 함수
  const fetchData = useCallback(async (tabIndex: number, keyword = '') => {
    setLoadingData(true);
    setStudyGroups([]); // 이전 데이터 초기화 (로딩 중 표시 명확화)
    setBoardPosts([]);  // 이전 데이터 초기화
    try {
      if (tabIndex === 0 || tabIndex === 1 || tabIndex === 2) { // 스터디/프로젝트 탭
        let studyTypeParam: 'PROJECT' | 'STUDY' | undefined = undefined;
        if (tabIndex === 1) studyTypeParam = 'PROJECT';
        if (tabIndex === 2) studyTypeParam = 'STUDY'; // 일반 스터디 (백엔드 Enum과 일치 필요)

        const params: any = {
          keyword: keyword || undefined,
          page: 0,
          size: 9, // 한 번에 보여줄 개수
        };
        if (studyTypeParam) {
          params.studyType = studyTypeParam;
        }
        const response = await api.get<{ content: StudyGroupSummary[] }>('/api/studies', { params });
        console.log('API /api/studies response.data:', response.data);

        if (response.data && Array.isArray(response.data.content)) {
          setStudyGroups(response.data.content);
        } else {
          console.error('API /api/studies 응답 형식이 예상과 다릅니다:', response.data);
          setStudyGroups([]); // 잘못된 형식이면 빈 배열로 설정
        }

      } else if (tabIndex === 3) { // 자유 게시판 탭
        // TODO: 자유 게시판 글 목록 조회 API 호출
        // const response = await api.get<{ content: BoardPostSummary[] }>('/api/board/posts', {
        //   params: { category: 'FREE', keyword: keyword || undefined, page: 0, size: 10 } // 예시
        // });
        // setBoardPosts(response.data.content);
        setBoardPosts([ // 임시 데이터
          {id:1, category: '자유', title: '오늘 날씨 좋네요!', authorName: '날씨요정', createdAt: new Date().toISOString(), viewCount: 10, likeCount: 2, commentCount: 1},
          {id:2, category: '자유', title: '리액트 질문 있습니다.', authorName: '개발새싹', createdAt: new Date().toISOString(), viewCount: 25, likeCount: 5, commentCount: 3},
        ]);
        setStudyGroups([]); // 다른 탭 데이터 초기화
      }
    } catch (error) {
      console.error('데이터 조회 실패:', error);
      // TODO: 사용자에게 에러 메시지 표시
    } finally {
      setLoadingData(false);
    }
  }, []); // 의존성 배열은 fetchData를 사용하는 useEffect에서 관리


  useEffect(() => {
    if (!authLoading) { // 인증 상태 로딩 완료 후
      fetchData(currentTab, searchKeyword); // 현재 탭과 검색어로 데이터 로드
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, currentTab, fetchData]); // searchKeyword는 handleSearch에서 fetchData를 호출하므로 제외 가능

  const handleSearch = (event: React.FormEvent) => {
    event.preventDefault();
    fetchData(currentTab, searchKeyword); // 현재 탭 기준으로 검색
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
            <Tab label="자유 게시판" /> {/* 자유 게시판 탭 추가 */}
          </StyledTabs>

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

          {loadingData ? (
              <Box sx={{display: 'flex', justifyContent: 'center', mt:4}}><CircularProgress /></Box>
          ) : (
              <>
              {(currentTab === 0 || currentTab === 1 || currentTab === 2) && studyGroups.length > 0 && (
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
                {(currentTab === 0 || currentTab === 1 || currentTab === 2) && studyGroups.length === 0 && !loadingData && (
                    <Typography sx={{ textAlign: 'center', mt: 4, color: 'text.secondary' }}>
                      표시할 스터디/프로젝트가 없습니다.
                    </Typography>
                )}

                {currentTab === 3 && boardPosts.length > 0 && (
                    // TODO: 자유 게시판 글 목록을 표시할 컴포넌트 (예: BoardPostItemCard) 사용
                    <Box>
                      <Typography variant="h5" gutterBottom>자유 게시판</Typography>
                      {boardPosts.map(post => (
                          <Paper key={post.id} sx={{p:2, mb:2}}>
                            <Typography variant="h6">{post.title} [{post.commentCount}]</Typography>
                            <Typography variant="caption">{post.authorName} | {new Date(post.createdAt).toLocaleDateString()} | 추천 {post.likeCount} | 조회 {post.viewCount}</Typography>
                          </Paper>
                      ))}
                    </Box>
                )}
                {currentTab === 3 && boardPosts.length === 0 && !loadingData && (
                    <Typography sx={{ textAlign: 'center', mt: 4, color: 'text.secondary' }}>
                      작성된 게시글이 없습니다.
                    </Typography>
                )}
              </>
          )}
        </Box>
      </Container>
  );
};

export default Home; 