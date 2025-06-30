import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { jwtDecode } from 'jwt-decode'; // jwt-decode 라이브러리 사용

const AdminRoute = ({ children }: { children: JSX.Element }) => {
    const { isLoggedIn } = useAuth();
    const token = localStorage.getItem('token');

    if (!isLoggedIn || !token) {
        return <Navigate to="/login" replace />;
    }

    try {
        const decodedToken: { authorities?: string } = jwtDecode(token);
        const isAdmin = decodedToken.authorities?.includes('ROLE_ADMIN');

        if (!isAdmin) {
            // 관리자가 아닌 경우 홈으로 리다이렉트
            alert('관리자만 접근할 수 있는 페이지입니다.');
            return <Navigate to="/" replace />;
        }
    } catch (error) {
        console.error("Invalid token:", error);
        return <Navigate to="/login" replace />;
    }

    return children;
};

export default AdminRoute;