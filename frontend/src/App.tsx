import React, {useEffect} from 'react';
import {BrowserRouter as Router, Routes, Route, useSearchParams, useNavigate} from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Navbar from './components/layout/Navbar';
import Home from './pages/Home';
import LoginPage from './pages/LoginPage';
import MyPage from './pages/MyPage';
import CreateStudyPage from './pages/CreateStudyPage';
import StudyDetailPage from './pages/StudyDetailPage';
import OAuth2RedirectHandler from './components/auth/OAuth2RedirectHandler';
import {AuthProvider, useAuth} from './contexts/AuthContext';
import NotificationPage from './pages/NotificationPage';
import StudyGroupEditPage from './pages/StudyGroupEditPage';
import { ChatProvider } from './contexts/ChatContext';
import ChatRoomPage from "./pages/ChatRoomPage";
import BoardPostCreatePage from './pages/board/BoardPostCreatePage';
import BoardPostDetailPage from "./pages/board/BoardPostDetailPage"; // 새로 만들 페이지
import MyProfilePage from './pages/MyProfilePage'; // 새로 만들 컴포넌트
import LikedPostsPage from './pages/LikedPostsPage'; // 새로 만들 컴포넌트
import LikedStudiesPage from './pages/LikedStudiesPage'; // 새로 추가
import ParticipatingStudiesPage from './pages/ParticipatingStudiesPage'; // 새로 추가
import EditProfilePage from './pages/EditProfilePage'; // 새로 만들 페이지 import
import { SnackbarProvider } from 'notistack'; // SnackbarProvider import
import NotificationListener from './components/notification/NotificationListener'; // 새로 만든 컴포넌트 import
import DmChatPage from './pages/DmChatPage'; // 새로 만든 페이지 import
import DmNotificationListener from './components/dm/DmNotificationListener';
import DmListPage from './pages/DmListPage';
import AdminPage from './pages/admin/AdminPage'; // 새로 만들 페이지
import AdminRoute from './components/auth/AdminRoute'; // 관리자만 접근 가능한 라우트
import ReportManagementPage from './pages/admin/ReportManagementPage'; // 새로 만들 페이지
import StatisticsPage from './pages/admin/StatisticsPage'; // 새로 만들 페이지
import FriendManagementPage from './pages/FriendManagementPage';
import ActivityFeedPage from "./pages/ActivityFeedPage"; // 새로 만들 페이지
import BoardPostEditPage from "./pages/board/BoardPostEditPage";
import { PresenceProvider } from './contexts/PresenceContext';
import LoginSuccessPage from './pages/LoginSuccessPage';

const theme = createTheme({
  palette: {
    primary: {
      main: '#2196F3',
    },
    secondary: {
      main: '#7FD1AE',
    },
    background: {
      default: '#F5F5F5',
    },
  },
  typography: {
    fontFamily: [
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
    ].join(','),
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: '8px',
        },
      },
    },
  },
});

const AuthTokenProcessor: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();

  useEffect(() => {
    const token = searchParams.get('token');
    const refreshToken = searchParams.get('refreshToken');

    if (token && refreshToken) {
      console.log("Token received from URL, processing login...");
      login(); // AuthContext에 토큰 저장 및 로그인 상태 변경
      // URL에서 토큰 정보를 제거하여 주소창을 깨끗하게 만듭니다.
      searchParams.delete('token');
      searchParams.delete('refreshToken');
      navigate({ search: searchParams.toString() }, { replace: true });
    }
  }, [searchParams, login, navigate, setSearchParams]);

  return null; // 이 컴포넌트는 UI를 렌더링하지 않습니다.
};

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <SnackbarProvider maxSnack={3} autoHideDuration={5000}>
        <AuthProvider>
          <ChatProvider>
            <PresenceProvider>
              <Router>
                <AuthTokenProcessor />
                <NotificationListener />
                <DmNotificationListener />
                <Navbar />
                <Routes>
                  {/* 관리자 페이지 라우트 */}
                  <Route path="/admin" element={
                    <AdminRoute>
                      <AdminPage />
                    </AdminRoute>
                  }>
                    {/* 자식 라우트들 */}
                    <Route index element={<StatisticsPage />} /> {/* /admin (기본 경로) */}
                    <Route path="reports" element={<ReportManagementPage />} /> {/* /admin/reports */}
                    {/* 다른 관리자 메뉴가 추가되면 여기에 라우트 추가 */}
                  </Route>

                  <Route path="/" element={<Home />} />
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/mypage" element={<MyPage />}>
                    {/* 자식 라우트들 */}
                    <Route index element={<MyProfilePage />} /> {/* /mypage (기본 경로) */}
                    <Route path="edit-profile" element={<EditProfilePage />} /> {/* 프로필 수정 페이지 라우트 추가 */}
                    <Route path="liked-posts" element={<LikedPostsPage />} /> {/* /mypage/liked-posts */}
                    <Route path="liked-studies" element={<LikedStudiesPage />} /> {/* /mypage/liked-studies */}
                    <Route path="participating-studies" element={<ParticipatingStudiesPage />} /> {/* /mypage/participating-studies */}
                    {/* --- 친구 관리 라우트 추가 --- */}
                    <Route path="friends" element={<FriendManagementPage />} />
                    <Route path="feed" element={<ActivityFeedPage />} />
                    <Route path="notifications" element={<NotificationPage />} />
                  </Route>
                  <Route path="/login/success" element={<LoginSuccessPage />} />
                  {/* 추가적인 마이페이지 하위 라우트 (예: 프로필 수정) */}
                  {/* <Route path="/mypage/edit-profile" element={<EditProfilePage />} /> */}
                  <Route path="/studies/create" element={<CreateStudyPage />} />
                  <Route path="/studies/:id" element={<StudyDetailPage />} />
                  <Route path="/studies/:id/edit" element={<StudyGroupEditPage />} />
                  <Route path="/oauth2/redirect" element={<OAuth2RedirectHandler />} />
                  {/*<Route path="/notifications" element={<NotificationPage />} />*/}

                  {/* 채팅방 상세 페이지 라우트 추가 */}
                  <Route path="/chat/room/:roomId" element={<ChatRoomPage />} /> {/* <--- 이 라우트 추가 */}

                  {/* 추가 라우트는 여기에 */}
                  <Route path="/board/create" element={<BoardPostCreatePage />} /> {/* 게시글 작성 페이지 라우트 */}
                  <Route path="/board/post/:postId" element={<BoardPostDetailPage />} /> {/* 게시글 상세 페이지 라우트 */}
                  <Route path="/board/edit/:postId" element={<BoardPostEditPage />} />
                  {/* <Route path="/board" element={<BoardListPage />} /> */}
                  {/* 예: <Route path="*" element={<NotFoundPage />} /> */}
                  {/* roomId가 있는 경우와 없는 경우(partnerId로 생성)를 모두 처리 */}
                  <Route path="/dm" element={<DmListPage />} /> {/* DM 목록 페이지 */}
                  <Route path="/dm/room/:roomId" element={<DmChatPage />} />
                  <Route path="/dm/new/:partnerId" element={<DmChatPage />} />
                </Routes>
              </Router>
            </PresenceProvider>
          </ChatProvider>
        </AuthProvider>
      </SnackbarProvider>
    </ThemeProvider>
  );
}

export default App;
