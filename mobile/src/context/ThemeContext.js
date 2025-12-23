import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ThemeContext = createContext();

export const lightTheme = {
  // Colori base - Palette Bianco/Blu moderna
  background: '#FFFFFF',
  backgroundSecondary: '#F8FAFC',
  card: '#FFFFFF',
  cardSecondary: '#F8FAFC',
  
  // Testo
  text: '#1E293B',
  textSecondary: '#64748B',
  textTertiary: '#94A3B8',
  textInverse: '#FFFFFF',
  
  // Colori brand - Blu moderno e pulito
  primary: '#2563EB', // Blu principale moderno
  primaryLight: '#3B82F6',
  primaryDark: '#1E40AF',
  
  secondary: '#0EA5E9', // Blu cielo
  secondaryLight: '#38BDF8',
  
  accent: '#1E40AF', // Blu scuro per accenti
  accentLight: '#2563EB',
  
  // Stati
  success: '#10B981', // Emerald
  successLight: '#34D399',
  warning: '#F59E0B', // Amber
  warningLight: '#FBBF24',
  error: '#EF4444', // Red
  errorLight: '#F87171',
  info: '#3B82F6', // Blue
  infoLight: '#60A5FA',
  
  // Gradienti - Solo essenziali
  gradients: {
    primary: ['#2563EB', '#3B82F6'], // Leggero gradiente blu
    secondary: ['#0EA5E9', '#2563EB'],
    success: ['#10B981', '#059669'],
    ocean: ['#3B82F6', '#2563EB'],
    emerald: ['#10B981', '#059669'], // Gradiente verde smeraldo
    sunset: ['#F59E0B', '#EF4444'], // Gradiente arancione-rosso
    cosmic: ['#667eea', '#764ba2'], // Gradiente viola-blu
  },
  
  // UI Elements
  border: '#E2E8F0',
  borderLight: '#F1F5F9',
  divider: '#E2E8F0',
  shadow: 'rgba(15, 23, 42, 0.08)',
  shadowStrong: 'rgba(15, 23, 42, 0.12)',
  overlay: 'rgba(0, 0, 0, 0.5)',
  
  // Glassmorphism
  glass: 'rgba(255, 255, 255, 0.8)',
  glassStrong: 'rgba(255, 255, 255, 0.95)',
  
  isDark: false,
};

export const darkTheme = {
  // Colori base
  background: '#0F172A', // Slate dark
  backgroundSecondary: '#1E293B',
  card: '#1E293B',
  cardSecondary: '#0F172A',
  
  // Testo
  text: '#F8FAFC',
  textSecondary: '#CBD5E1',
  textTertiary: '#64748B',
  textInverse: '#0F172A',
  
  // Colori brand - Blu più luminosi per il dark mode
  primary: '#3B82F6',
  primaryLight: '#60A5FA',
  primaryDark: '#2563EB',
  
  secondary: '#38BDF8',
  secondaryLight: '#7DD3FC',
  
  accent: '#2563EB',
  accentLight: '#3B82F6',
  
  // Stati
  success: '#34D399',
  successLight: '#6EE7B7',
  warning: '#FBBF24',
  warningLight: '#FCD34D',
  error: '#F87171',
  errorLight: '#FCA5A5',
  info: '#60A5FA',
  infoLight: '#93C5FD',
  
  // Gradienti - Solo essenziali (più luminosi per dark mode)
  gradients: {
    primary: ['#3B82F6', '#60A5FA'],
    secondary: ['#38BDF8', '#3B82F6'],
    success: ['#34D399', '#10B981'],
    ocean: ['#60A5FA', '#3B82F6'],
    emerald: ['#34D399', '#10B981'], // Gradiente verde smeraldo per dark mode
    sunset: ['#FBBF24', '#F87171'], // Gradiente arancione-rosso per dark mode
    cosmic: ['#8b5cf6', '#a855f7'], // Gradiente viola più luminoso per dark mode
  },
  
  // UI Elements
  border: '#334155',
  borderLight: '#1E293B',
  divider: '#334155',
  shadow: 'rgba(0, 0, 0, 0.4)',
  shadowStrong: 'rgba(0, 0, 0, 0.6)',
  overlay: 'rgba(0, 0, 0, 0.7)',
  
  // Glassmorphism
  glass: 'rgba(30, 41, 59, 0.7)',
  glassStrong: 'rgba(30, 41, 59, 0.9)',
  
  isDark: true,
};

export const ThemeProvider = ({ children }) => {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    loadTheme();
  }, []);

  const loadTheme = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem('@theme');
      if (savedTheme) {
        setIsDark(savedTheme === 'dark');
      }
    } catch (error) {
      console.error('Errore nel caricamento tema:', error);
    }
  };

  const toggleTheme = async () => {
    try {
      const newTheme = !isDark;
      setIsDark(newTheme);
      await AsyncStorage.setItem('@theme', newTheme ? 'dark' : 'light');
    } catch (error) {
      console.error('Errore nel salvataggio tema:', error);
    }
  };

  const theme = isDark ? darkTheme : lightTheme;

  return (
    <ThemeContext.Provider value={{ theme, isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme deve essere usato dentro ThemeProvider');
  }
  return context;
};


