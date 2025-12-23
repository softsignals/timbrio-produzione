import { AppBar, Toolbar, IconButton, Typography, Menu, MenuItem, Avatar, Box, Chip } from '@mui/material';
import { Menu as MenuIcon, AccountCircle, Logout } from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useTheme } from '../../context/ThemeContext';

interface HeaderProps {
  onMenuClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
  const { user, logout } = useAuth();
  const { colors, mode } = useTheme();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
    handleClose();
  };

  const handleProfile = () => {
    navigate('/profilo');
    handleClose();
  };

  const getRoleLabel = (ruolo: string) => {
    const labels: { [key: string]: string } = {
      admin: 'Amministratore',
      manager: 'Manager',
      dipendente: 'Dipendente',
      receptionist: 'Receptionist',
    };
    return labels[ruolo] || ruolo;
  };

  return (
    <AppBar
      position="fixed"
      sx={{
        zIndex: (theme) => theme.zIndex.drawer + 1,
        background: `linear-gradient(135deg, ${colors.gradients.primary[0]}, ${colors.gradients.primary[1]})`,
        boxShadow: `0 4px 20px 0 ${colors.primary}30`,
      }}
    >
      <Toolbar sx={{ px: { xs: 2, sm: 3 } }}>
        <IconButton
          color="inherit"
          aria-label="open drawer"
          edge="start"
          onClick={onMenuClick}
          sx={{
            mr: 2,
            '&:hover': {
              background: 'rgba(255, 255, 255, 0.1)',
            },
          }}
        >
          <MenuIcon />
        </IconButton>
        <Typography
          variant="h5"
          noWrap
          component="div"
          sx={{
            flexGrow: 1,
            fontWeight: 700,
            letterSpacing: '-0.5px',
            background: 'rgba(255, 255, 255, 0.95)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          Timbrio
        </Typography>
        {user && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 1 }}>
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 600,
                  color: 'rgba(255, 255, 255, 0.95)',
                }}
              >
                {user.nome} {user.cognome}
              </Typography>
              <Chip
                label={getRoleLabel(user.ruolo)}
                size="small"
                sx={{
                  background: 'rgba(255, 255, 255, 0.2)',
                  color: 'white',
                  fontWeight: 600,
                  fontSize: '0.7rem',
                  height: 24,
                  '& .MuiChip-label': {
                    px: 1.5,
                  },
                }}
              />
            </Box>
            <IconButton
              size="large"
              aria-label="account of current user"
              aria-controls="menu-appbar"
              aria-haspopup="true"
              onClick={handleMenu}
              sx={{
                '&:hover': {
                  background: 'rgba(255, 255, 255, 0.1)',
                },
              }}
            >
              <Avatar
                sx={{
                  width: 36,
                  height: 36,
                  background: `linear-gradient(135deg, ${colors.gradients.secondary[0]}, ${colors.gradients.secondary[1]})`,
                  fontWeight: 700,
                  fontSize: '0.9rem',
                }}
              >
                {user.nome.charAt(0)}{user.cognome.charAt(0)}
              </Avatar>
            </IconButton>
            <Menu
              id="menu-appbar"
              anchorEl={anchorEl}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'right',
              }}
              keepMounted
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              open={Boolean(anchorEl)}
              onClose={handleClose}
              PaperProps={{
                sx: {
                  mt: 1.5,
                  minWidth: 200,
                  borderRadius: 2,
                  boxShadow: `0 8px 24px 0 ${colors.primary}20`,
                  border: `1px solid ${mode === 'light' ? '#e2e8f0' : '#334155'}`,
                },
              }}
            >
              <MenuItem
                onClick={handleProfile}
                sx={{
                  borderRadius: 1,
                  mx: 1,
                  my: 0.5,
                  '&:hover': {
                    background: `${colors.primary}10`,
                  },
                }}
              >
                <AccountCircle sx={{ mr: 1.5, color: colors.primary }} />
                Profilo
              </MenuItem>
              <MenuItem
                onClick={handleLogout}
                sx={{
                  borderRadius: 1,
                  mx: 1,
                  my: 0.5,
                  '&:hover': {
                    background: `${colors.error}10`,
                  },
                }}
              >
                <Logout sx={{ mr: 1.5, color: colors.error }} />
                Logout
              </MenuItem>
            </Menu>
          </Box>
        )}
      </Toolbar>
    </AppBar>
  );
};

export default Header;

