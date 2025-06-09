import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Navbar from './components/layout/Navbar';
import Home from './pages/Home';
import LoginPage from './pages/LoginPage';
import MyPage from './pages/MyPage';
import CreateStudyPage from './pages/CreateStudyPage';
import StudyDetailPage from './pages/StudyDetailPage';
import OAuth2RedirectHandler from './components/auth/OAuth2RedirectHandler';
import { AuthProvider } from './contexts/AuthContext';
import NotificationPage from './pages/NotificationPage';
import StudyGroupEditPage from './pages/StudyGroupEditPage';
import { ChatProvider } from './contexts/ChatContext';
import ChatRoomPage from "./pages/ChatRoomPage";
import BoardPostCreatePage from './pages/board/BoardPostCreatePage'; // 새로 만들 페이지

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

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <ChatProvider>
          <Router>
            <Navbar />
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/mypage" element={<MyPage />} />
              {/* 추가적인 마이페이지 하위 라우트 (예: 프로필 수정) */}
              {/* <Route path="/mypage/edit-profile" element={<EditProfilePage />} /> */}
              <Route path="/studies/create" element={<CreateStudyPage />} />
              <Route path="/studies/:id" element={<StudyDetailPage />} />
              <Route path="/studies/:id/edit" element={<StudyGroupEditPage />} />
              <Route path="/oauth2/redirect" element={<OAuth2RedirectHandler />} />
              <Route path="/notifications" element={<NotificationPage />} />

              {/* 채팅방 상세 페이지 라우트 추가 */}
              <Route path="/chat/room/:roomId" element={<ChatRoomPage />} /> {/* <--- 이 라우트 추가 */}

              {/* 추가 라우트는 여기에 */}
              <Route path="/board/create" element={<BoardPostCreatePage />} /> {/* 게시글 작성 페이지 라우트 */}
              {/* <Route path="/board/post/:postId" element={<BoardPostDetailPage />} /> */}
              {/* <Route path="/board" element={<BoardListPage />} /> */}
              {/* 예: <Route path="*" element={<NotFoundPage />} /> */}
            </Routes>
          </Router>
        </ChatProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
