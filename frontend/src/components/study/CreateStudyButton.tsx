import React from 'react';
import { Button } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { useNavigate } from 'react-router-dom';

const CreateStudyButton = () => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate('/studies/create');
  };

  return (
    <Button
      variant="contained"
      color="primary"
      startIcon={<AddIcon />}
      onClick={handleClick}
      sx={{
        position: 'fixed',
        bottom: '2rem',
        right: '2rem',
        borderRadius: '28px',
        padding: '12px 24px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
      }}
    >
      스터디 만들기
    </Button>
  );
};

export default CreateStudyButton; 