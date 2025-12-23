import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Toolbar,
  Box,
} from '@mui/material';
import {
  Dashboard,
  AccessTime,
  Description,
  People,
  QrCode,
  Person,
  Settings,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ open, onClose }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { hasRole } = useAuth();
  const { colors, mode } = useTheme();

  // Menu items DEMO - semplificato
  const menuItems = [
    {
      text: 'Dashboard',
      icon: <Dashboard />,
      path: '/dashboard',
      roles: ['dipendente', 'manager', 'admin', 'receptionist'],
      gradient: 'primary' as const,
    },
    {
      text: 'Timbrature',
      icon: <AccessTime />,
      path: '/timbrature',
      roles: ['dipendente', 'manager', 'admin'],
      gradient: 'primary' as const,
    },
    {
      text: 'Dipendenti',
      icon: <People />,
      path: '/dipendenti',
      roles: ['manager', 'admin'],
      gradient: 'ocean' as const,
    },
    {
      text: 'Documenti',
      icon: <Description />,
      path: '/documenti',
      roles: ['dipendente', 'manager', 'admin'],
      gradient: 'secondary' as const,
    },
    {
      text: 'Impostazioni',
      icon: <Settings />,
      path: '/impostazioni',
      roles: ['dipendente', 'manager', 'admin'],
      gradient: 'sunset' as const,
    },
    // QR Routes per Receptionist
    {
      text: 'QR Dashboard',
      icon: <QrCode />,
      path: '/qr/dashboard',
      roles: ['receptionist', 'admin'],
      gradient: 'primary' as const,
    },
    {
      text: 'QR Scanner',
      icon: <QrCode />,
      path: '/qr/scanner',
      roles: ['receptionist', 'admin'],
      gradient: 'secondary' as const,
    },
    {
      text: 'Timbrature Recenti',
      icon: <AccessTime />,
      path: '/qr/timbrature-recenti',
      roles: ['receptionist', 'admin'],
      gradient: 'emerald' as const,
    },
  ];

  const filteredMenuItems = menuItems.filter((item) => hasRole(item.roles as any));

  const handleNavigation = (path: string) => {
    navigate(path);
    onClose();
  };

  return (
    <Drawer
      variant="persistent"
      open={open}
      sx={{
        width: 260,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: 260,
          boxSizing: 'border-box',
          background: mode === 'light' ? '#FFFFFF' : '#1E293B',
          borderRight: `1px solid ${mode === 'light' ? '#E2E8F0' : '#334155'}`,
        },
      }}
    >
      <Toolbar />
      <Divider />
      <Box sx={{ py: 2 }}>
        <List sx={{ px: 1 }}>
          {filteredMenuItems.map((item, index) => {
            const isSelected = location.pathname === item.path;
            const gradientColors = colors.gradients[item.gradient];

            return (
              <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
                <ListItemButton
                  selected={isSelected}
                  onClick={() => handleNavigation(item.path)}
                  sx={{
                    borderRadius: 2,
                    mx: 1,
                    py: 1.5,
                    '&.Mui-selected': {
                      background: `linear-gradient(135deg, ${gradientColors[0]}15, ${gradientColors[1]}15)`,
                      borderLeft: `3px solid ${gradientColors[0]}`,
                      '&:hover': {
                        background: `linear-gradient(135deg, ${gradientColors[0]}20, ${gradientColors[1]}20)`,
                      },
                      '& .MuiListItemIcon-root': {
                        color: gradientColors[0],
                      },
                      '& .MuiListItemText-primary': {
                        color: gradientColors[0],
                        fontWeight: 600,
                      },
                    },
                    '&:hover': {
                      background: mode === 'light' ? 'rgba(37, 99, 235, 0.05)' : 'rgba(59, 130, 246, 0.1)',
                      transform: 'translateX(4px)',
                    },
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  }}
                  className="slide-in"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: 40,
                      color: isSelected ? gradientColors[0] : 'text.secondary',
                    }}
                  >
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText
                    primary={item.text}
                    primaryTypographyProps={{
                      fontWeight: isSelected ? 600 : 500,
                      fontSize: '0.95rem',
                    }}
                  />
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>
        <Divider sx={{ my: 2, mx: 2 }} />
        <List sx={{ px: 1 }}>
          <ListItem disablePadding>
            <ListItemButton
              selected={location.pathname === '/profilo'}
              onClick={() => handleNavigation('/profilo')}
              sx={{
                borderRadius: 2,
                mx: 1,
                py: 1.5,
                '&.Mui-selected': {
                  background: `linear-gradient(135deg, ${colors.gradients.secondary[0]}15, ${colors.gradients.secondary[1]}15)`,
                  borderLeft: `3px solid ${colors.gradients.secondary[0]}`,
                  '&:hover': {
                    background: `linear-gradient(135deg, ${colors.gradients.secondary[0]}20, ${colors.gradients.secondary[1]}20)`,
                  },
                  '& .MuiListItemIcon-root': {
                    color: colors.gradients.secondary[0],
                  },
                  '& .MuiListItemText-primary': {
                    color: colors.gradients.secondary[0],
                    fontWeight: 600,
                  },
                },
                '&:hover': {
                  background: mode === 'light' ? 'rgba(14, 165, 233, 0.05)' : 'rgba(56, 189, 248, 0.1)',
                  transform: 'translateX(4px)',
                },
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: 40,
                  color: location.pathname === '/profilo' ? colors.gradients.secondary[0] : 'text.secondary',
                }}
              >
                <Person />
              </ListItemIcon>
              <ListItemText
                primary="Profilo"
                primaryTypographyProps={{
                  fontWeight: location.pathname === '/profilo' ? 600 : 500,
                  fontSize: '0.95rem',
                }}
              />
            </ListItemButton>
          </ListItem>
        </List>
      </Box>
    </Drawer>
  );
};

export default Sidebar;
