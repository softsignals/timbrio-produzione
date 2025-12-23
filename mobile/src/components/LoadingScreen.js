import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet, Platform } from 'react-native';
import { useTheme } from '../context/ThemeContext';

/**
 * Schermata di caricamento
 */
const LoadingScreen = ({ message = 'Caricamento...' }) => {
  const { theme } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ActivityIndicator 
        size="small"
        color={theme.primary}
        style={{ transform: [{ scale: 1.5 }] }}
      />
      <Text style={[styles.message, { color: theme.textSecondary }]}>
        {message}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  message: {
    marginTop: 16,
    fontSize: 16,
    textAlign: 'center',
  },
});

export default LoadingScreen;

