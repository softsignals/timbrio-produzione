import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';

type ThemeMode = 'light' | 'dark';

interface ThemeContextType {
  mode: ThemeMode;
  toggleTheme: () => void;
  colors: {
    primary: string;
    primaryLight: string;
    primaryDark: string;
    secondary: string;
    secondaryLight: string;
    success: string;
    warning: string;
    error: string;
    gradients: {
      primary: string[];
      secondary: string[];
      success: string[];
      ocean: string[];
      emerald: string[];
      sunset: string[];
    };
  };
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const CustomThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [mode, setMode] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem('theme');
    return (saved as ThemeMode) || 'light';
  });

  useEffect(() => {
    localStorage.setItem('theme', mode);
  }, [mode]);

  const toggleTheme = () => {
    setMode((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  // Colori dell'app mobile Timbrio
  const colors = mode === 'light' 
    ? {
        primary: '#2563EB',
        primaryLight: '#3B82F6',
        primaryDark: '#1E40AF',
        secondary: '#0EA5E9',
        secondaryLight: '#38BDF8',
        success: '#10B981',
        warning: '#F59E0B',
        error: '#EF4444',
        gradients: {
          primary: ['#2563EB', '#3B82F6'],
          secondary: ['#0EA5E9', '#2563EB'],
          success: ['#10B981', '#059669'],
          ocean: ['#3B82F6', '#2563EB'],
          emerald: ['#10B981', '#059669'],
          sunset: ['#F59E0B', '#EF4444'],
        },
      }
    : {
        primary: '#3B82F6',
        primaryLight: '#60A5FA',
        primaryDark: '#2563EB',
        secondary: '#38BDF8',
        secondaryLight: '#7DD3FC',
        success: '#34D399',
        warning: '#FBBF24',
        error: '#F87171',
        gradients: {
          primary: ['#3B82F6', '#60A5FA'],
          secondary: ['#38BDF8', '#3B82F6'],
          success: ['#34D399', '#10B981'],
          ocean: ['#60A5FA', '#3B82F6'],
          emerald: ['#34D399', '#10B981'],
          sunset: ['#FBBF24', '#F87171'],
        },
      };

  const theme = createTheme({
    palette: {
      mode,
      primary: {
        main: colors.primary,
        light: colors.primaryLight,
        dark: colors.primaryDark,
      },
      secondary: {
        main: colors.secondary,
        light: colors.secondaryLight,
      },
      success: {
        main: colors.success,
      },
      warning: {
        main: colors.warning,
      },
      error: {
        main: colors.error,
      },
      background: {
        default: mode === 'light' ? '#F8FAFC' : '#0F172A',
        paper: mode === 'light' ? '#FFFFFF' : '#1E293B',
      },
      text: {
        primary: mode === 'light' ? '#1E293B' : '#F8FAFC',
        secondary: mode === 'light' ? '#64748B' : '#CBD5E1',
      },
    },
    shape: {
      borderRadius: 16,
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
      h4: {
        fontWeight: 700,
      },
      h5: {
        fontWeight: 600,
      },
      h6: {
        fontWeight: 600,
      },
    },
    components: {
      MuiCard: {
        styleOverrides: {
          root: {
            boxShadow: mode === 'light' 
              ? '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)'
              : '0 1px 3px 0 rgba(0, 0, 0, 0.4), 0 1px 2px 0 rgba(0, 0, 0, 0.3)',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            '&:hover': {
              boxShadow: mode === 'light'
                ? '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
                : '0 10px 15px -3px rgba(0, 0, 0, 0.4), 0 4px 6px -2px rgba(0, 0, 0, 0.3)',
              transform: 'translateY(-2px)',
            },
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            fontWeight: 600,
            borderRadius: 12,
            padding: '10px 24px',
          },
        },
      },
    },
  });

  return (
    <ThemeContext.Provider value={{ mode, toggleTheme, colors }}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a CustomThemeProvider');
  }
  return context;
};

