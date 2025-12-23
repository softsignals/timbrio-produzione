import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

// Auth
import LoginScreen from '../screens/LoginScreen';

// Bottom Tab Navigator
import BottomTabNavigator from './BottomTabNavigator';

// Schermate aggiuntive DEMO
import DipendenteDetailScreen from '../screens/DipendenteDetailScreen';
import QRScannerScreen from '../screens/QRScannerScreen';
import QRDisplayScreen from '../screens/QRDisplayScreen';
import NuovaComunicazioneScreen from '../screens/NuovaComunicazioneScreen';
import ImpostazioniScreen from '../screens/ImpostazioniScreen';

const Stack = createNativeStackNavigator();

const AppNavigator = () => {
  const { user, loading } = useAuth();
  const { theme } = useTheme();

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
        }}
      >
        {!user ? (
          <Stack.Screen name="Login" component={LoginScreen} />
        ) : (
          <>
            {/* Bottom Tab Navigator come schermata principale */}
            <Stack.Screen name="Main" component={BottomTabNavigator} />
            
            {/* Schermate aggiuntive DEMO */}
            <Stack.Screen name="DipendenteDetail" component={DipendenteDetailScreen} />
            <Stack.Screen name="QRScanner" component={QRScannerScreen} />
            <Stack.Screen name="QRDisplay" component={QRDisplayScreen} />
            <Stack.Screen name="NuovaComunicazione" component={NuovaComunicazioneScreen} />
            <Stack.Screen name="ImpostazioniStack" component={ImpostazioniScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
});

export default AppNavigator;
