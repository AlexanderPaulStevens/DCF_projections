import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
} from '@mui/material';

const Header: React.FC = () => {
  const navigate = useNavigate();

  return (
    <AppBar
      position="static"
      sx={{
        backgroundColor: 'transparent',
        boxShadow: 'none',
        zIndex: 1200,
      }}
    >
      <Toolbar sx={{ minHeight: 64, px: 2 }}>
        {/* Logo Only */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            cursor: 'pointer',
            '&:hover': {
              transform: 'scale(1.05)',
              transition: 'transform 0.2s ease-in-out',
            }
          }}
          onClick={() => navigate('/')}
        >
          <img
            src="/logo_horizon.png"
            alt="Horizon"
            style={{
              height: '40px',
              marginRight: '12px',
              filter: 'drop-shadow(0 0 20px rgba(0, 212, 255, 0.4))',
            }}
          />
          <Typography
            variant="h5"
            sx={{
              color: '#00d4ff',
              fontWeight: 700,
              textShadow: '0 0 20px rgba(0, 212, 255, 0.5)',
            }}
          >
            Horizon
          </Typography>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header;
