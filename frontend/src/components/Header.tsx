import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  Button,
  IconButton,
  Menu,
  MenuItem,
  Divider,
  Badge,
} from '@mui/material';
import {
  Star,
  Notifications,
  AccountCircle,
  BarChart,
  ShowChart,
  Timeline,
  Settings,
  Logout,
} from '@mui/icons-material';

const Header: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [notificationAnchor, setNotificationAnchor] = useState<null | HTMLElement>(null);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleNotificationOpen = (event: React.MouseEvent<HTMLElement>) => {
    setNotificationAnchor(event.currentTarget);
  };

  const handleNotificationClose = () => {
    setNotificationAnchor(null);
  };

  const isActiveRoute = (path: string) => {
    return location.pathname.includes(path);
  };

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
