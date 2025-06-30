// src/pages/EditProfilePage.tsx
import React, { useState, useEffect, useRef } from 'react';
import { Container, Paper, Typography, Box, Avatar, TextField, Button, CircularProgress, Alert, IconButton } from '@mui/material';
import { styled } from '@mui/material/styles';
import PhotoCamera from '@mui/icons-material/PhotoCamera';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';

// 데이터 타입
interface UserProfile {
    id: number;
    name: string;
    email: string;
    profileImageUrl?: string;
    createdAt: string;
}

// 스타일 컴포넌트
const ProfileEditContainer = styled(Paper)(({ theme }) => ({
    padding: theme.spacing(4),
    borderRadius: theme.shape.borderRadius * 2,
}));

const AvatarContainer = styled(Box)({
    position: 'relative',
    width: 120,
    height: 120,
    margin: '0 auto 24px auto',
});

const ProfileAvatar = styled(Avatar)({
    width: '100%',
    height: '100%',
    fontSize: '3rem',
});

// UploadButton의 component prop을 제거하여 타입 문제를 해결합니다.
const UploadButton = styled(IconButton)(({ theme }) => ({
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: theme.palette.background.paper,
    boxShadow: theme.shadows[2],
    '&:hover': {
        backgroundColor: theme.palette.grey[200],
    },
}));

const EditProfilePage: React.FC = () => {
    const navigate = useNavigate();
    const { isLoggedIn, isLoading: authLoading, checkAuth } = useAuth();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (authLoading) return;
        if (!isLoggedIn) {
            navigate('/login');
            return;
        }

        const fetchUserProfile = async () => {
            setLoading(true);
            try {
                const response = await api.get<UserProfile>('/api/users/me');
                setName(response.data.name);
                setEmail(response.data.email);
                setPreviewUrl(response.data.profileImageUrl || null);
            } catch (err) {
                setError('프로필 정보를 불러오는데 실패했습니다.');
            } finally {
                setLoading(false);
            }
        };

        fetchUserProfile();
    }, [isLoggedIn, authLoading, navigate]);

    const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setProfileImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviewUrl(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    // 아이콘 버튼 클릭 시 숨겨진 input을 클릭하는 핸들러
    const handleUploadButtonClick = () => {
        fileInputRef.current?.click();
    };

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!name.trim()) {
            setError('이름을 입력해주세요.');
            return;
        }

        setSubmitting(true);
        setError(null);

        const formData = new FormData();
        formData.append('name', name);
        if (profileImageFile) {
            formData.append('profileImage', profileImageFile);
        }

        try {
            await api.put('/api/users/me', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            await checkAuth();
            alert('프로필이 성공적으로 수정되었습니다.');
            navigate('/mypage');
        } catch (err: any) {
            setError(err.response?.data?.message || '프로필 수정에 실패했습니다.');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading || authLoading) {
        return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box>;
    }

    return (
        <ProfileEditContainer>
            <Typography variant="h5" component="h1" fontWeight="bold" sx={{ mb: 4, textAlign: 'center' }}>
                프로필 수정
            </Typography>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            <form onSubmit={handleSubmit}>
                <AvatarContainer>
                    <ProfileAvatar src={previewUrl || undefined} alt={name}>
                        {name ? name[0].toUpperCase() : null}
                    </ProfileAvatar>

                    {/* --- 핵심 수정 사항 --- */}
                    {/* 1. label 태그 제거 */}
                    {/* 2. 숨겨진 input은 그대로 유지 */}
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        hidden
                        onChange={handleImageChange}
                    />
                    {/* 3. UploadButton에 component prop을 제거하고, onClick 이벤트 추가 */}
                    <UploadButton aria-label="upload picture" onClick={handleUploadButtonClick}>
                        <PhotoCamera />
                    </UploadButton>
                    {/* ------------------- */}
                </AvatarContainer>

                <TextField
                    label="이메일 (변경 불가)"
                    value={email}
                    fullWidth
                    disabled
                    margin="normal"
                />
                <TextField
                    label="이름"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    fullWidth
                    required
                    margin="normal"
                />

                <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                    <Button variant="outlined" onClick={() => navigate('/mypage')} disabled={submitting}>
                        취소
                    </Button>
                    <Button type="submit" variant="contained" disabled={submitting}>
                        {submitting ? <CircularProgress size={24} color="inherit" /> : '저장하기'}
                    </Button>
                </Box>
            </form>
        </ProfileEditContainer>
    );
};

export default EditProfilePage;