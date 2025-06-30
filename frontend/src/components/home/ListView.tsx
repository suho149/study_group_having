// src/components/home/ListView.tsx (새 파일)
import React from 'react';
import {
    Box, Tabs, Tab, TextField, InputAdornment, Typography, Grid, CircularProgress, Button, Divider
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';
import SearchIcon from '@mui/icons-material/Search';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import StarIcon from '@mui/icons-material/Star';
import { StudyGroupSummary } from "../../types/study";
import { BoardPostSummary } from '../../types/board';
import PostCard from '../post/PostCard';
import BoardPostItemCard from '../board/BoardPostItemCard';

// Home.tsx에 있던 스타일 컴포넌트를 이곳으로 이동
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
    '& .MuiOutlinedInput-root': {
        borderRadius: '8px',
        '& fieldset': {borderColor: '#E0E0E0'},
        '&:hover fieldset': {borderColor: '#BDBDBD'},
        '&.Mui-focused fieldset': {borderColor: '#2196F3'},
    },
});

// Home.tsx로부터 받아올 props 타입 정의
interface ListViewProps {
    currentTab: number;
    handleTabChange: (event: React.SyntheticEvent, newValue: number) => void;
    handleSearchSubmit: (event: React.FormEvent) => void;
    searchKeyword: string;
    setSearchKeyword: (keyword: string) => void;
    isLoggedIn: boolean;
    hotPosts: BoardPostSummary[];
    isLoading: boolean;
    studyAndProjectList: StudyGroupSummary[];
    boardPostList: BoardPostSummary[];
    hasMore: boolean;
    handleLoadMore: () => void;
    isLoadingMore: boolean;
}

const ListView: React.FC<ListViewProps> = ({
                                               currentTab, handleTabChange, handleSearchSubmit, searchKeyword, setSearchKeyword,
                                               isLoggedIn, hotPosts, isLoading, studyAndProjectList, boardPostList, hasMore,
                                               handleLoadMore, isLoadingMore
                                           }) => {
    const navigate = useNavigate();

    return (
        <>
            <StyledTabs value={currentTab} onChange={handleTabChange}>
                <Tab label="전체" />
                <Tab label="프로젝트" />
                <Tab label="스터디" />
                <Tab label="자유 게시판" />
            </StyledTabs>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
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
                                                category={(item as StudyGroupSummary).category}
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
        </>
    );
};

export default ListView;