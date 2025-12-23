import { Outlet } from 'react-router-dom';
import { Box } from '@mui/material';
import Header from './Header';
import Sidebar from './Sidebar';
import { useState } from 'react';
import { useTheme } from '../../context/ThemeContext';

const Layout: React.FC = () => {
  const { mode } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <Box
      sx={{
        display: 'flex',
        minHeight: '100vh',
        background: mode === 'light'
          ? 'linear-gradient(135deg, #F8FAFC 0%, #E2E8F0 100%)'
          : 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
        backgroundAttachment: 'fixed',
      }}
    >
      <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 2, sm: 3, md: 4 },
          marginTop: '64px',
          marginLeft: { sm: sidebarOpen ? '260px' : '0' },
          transition: 'margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          width: { sm: `calc(100% - ${sidebarOpen ? 260 : 0}px)` },
          maxWidth: '100%',
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
};

export default Layout;

