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
        <Router>
          <Navbar />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/mypage" element={<MyPage />} />
            <Route path="/studies/create" element={<CreateStudyPage />} />
            <Route path="/studies/:id" element={<StudyDetailPage />} />
            <Route path="/oauth2/redirect" element={<OAuth2RedirectHandler />} />
            <Route path="/notifications" element={<NotificationPage />} />
            {/* 추가 라우트는 여기에 */}
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
