import React, { useState, useEffect, useCallback } from 'react';
import { Container, Box, Typography, Tabs, Tab, CircularProgress } from '@mui/material';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { StudyGroupSummary } from "../types/study";
import { BoardPostSummary } from '../types/board';
import RecommendedStudies from '../components/home/RecommendedStudies';

// 컴포넌트 분리
import Banner from '../components/home/Banner';
import CreateStudyButton from '../components/study/CreateStudyButton';
import StudyMap from '../components/home/StudyMap';
import ListView from '../components/home/ListView';

const Home: React.FC = () => {
  const { isLoggedIn, isLoading: authLoading } = useAuth();

  // --- 상태 관리 ---
  const [currentView, setCurrentView] = useState(0); // 0: 목록, 1: 지도
  const [currentTab, setCurrentTab] = useState(0); // 0: 전체, 1: 프로젝트, 2: 스터디, 3: 자유 게시판
  const [searchKeyword, setSearchKeyword] = useState('');

  const [studyAndProjectList, setStudyAndProjectList] = useState<StudyGroupSummary[]>([]);
  const [boardPostList, setBoardPostList] = useState<BoardPostSummary[]>([]);
  const [hotPosts, setHotPosts] = useState<BoardPostSummary[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  // --- 데이터 로딩 함수 ---
  const fetchData = useCallback(async (tabIndex: number, keyword: string, page: number, isNewSearch: boolean = false) => {
    if (isNewSearch) setIsLoading(true); else setIsLoadingMore(true);

    try {
      const params: any = { keyword: keyword || undefined, page, size: 9 };
      if (tabIndex <= 2) {
        let categoryParam: 'PROJECT' | 'STUDY' | undefined;
        if (tabIndex === 1) categoryParam = 'PROJECT';
        if (tabIndex === 2) categoryParam = 'STUDY';
        // tabIndex 0 (전체) 일 때는 파라미터를 보내지 않음

        if (categoryParam) {
          params.category = categoryParam;
        }

        const response = await api.get<{ content: StudyGroupSummary[], last: boolean }>('/api/studies', { params });
        if (response.data?.content) {
          setStudyAndProjectList(prev => isNewSearch ? response.data.content : [...prev, ...response.data.content]);
          setHasMore(!response.data.last);
        }
      } else {
        params.sort = 'createdAt,desc';
        const response = await api.get<{ content: BoardPostSummary[], last: boolean }>('/api/board/posts', { params });
        if (response.data?.content) {
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

  const fetchHotPosts = useCallback(async () => {
    if (currentTab !== 3) {
      setHotPosts([]);
      return;
    }
    try {
      const response = await api.get<BoardPostSummary[]>('/api/board/posts/hot');
      setHotPosts(response.data);
    } catch (error) {
      console.error("핫 게시물 조회 실패:", error);
      setHotPosts([]);
    }
  }, [currentTab]);

  // --- 최초 및 탭 변경 시 데이터 로드 ---
  useEffect(() => {
    if (!authLoading) {
      fetchData(currentTab, searchKeyword, 0, true);
      fetchHotPosts();
    }
  }, [authLoading, currentTab, fetchData, fetchHotPosts]);

  // --- 이벤트 핸들러 ---
  const handleViewChange = (event: React.SyntheticEvent, newValue: number) => {
    setCurrentView(newValue);
  };
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
    setSearchKeyword('');
    // '자유 게시판'이 아닌 탭으로 이동 시에만 뷰 전환 탭이 의미 있으므로, 그 외에는 목록 뷰로 초기화
    setCurrentView(0);
  };
  const handleSearchSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    fetchData(currentTab, searchKeyword, 0, true);
  };
  const handleLoadMore = () => {
    if (!isLoading && !isLoadingMore && hasMore) {
      fetchData(currentTab, searchKeyword, currentPage + 1, false);
    }
  };

  if (authLoading) {
    return <Container sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Container>;
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

        {/* --- 로그인한 사용자에게만 추천 섹션 표시 --- */}
        {isLoggedIn && <RecommendedStudies />}

        <Box sx={{ mb: 4, mt: 4 }}>
          <Tabs value={currentView} onChange={handleViewChange} sx={{ mb: 3 }}>
            <Tab label="스터디/게시판 목록" />
            <Tab label="주변 스터디 지도" />
          </Tabs>

          {currentView === 0 ? (
              <ListView
                  currentTab={currentTab}
                  handleTabChange={handleTabChange}
                  handleSearchSubmit={handleSearchSubmit}
                  searchKeyword={searchKeyword}
                  setSearchKeyword={setSearchKeyword}
                  isLoggedIn={isLoggedIn}
                  hotPosts={hotPosts}
                  isLoading={isLoading}
                  studyAndProjectList={studyAndProjectList}
                  boardPostList={boardPostList}
                  hasMore={hasMore}
                  handleLoadMore={handleLoadMore}
                  isLoadingMore={isLoadingMore}
              />
          ) : (
              <StudyMap />
          )}
        </Box>
      </Container>
  );
};

export default Home;