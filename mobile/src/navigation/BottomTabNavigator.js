import React from 'react';
import { Platform, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import DashboardScreen from '../screens/DashboardScreen';
import TimbraturaScreen from '../screens/TimbraturaScreen';
import DocumentiScreen from '../screens/DocumentiScreen';
import ImpostazioniScreen from '../screens/ImpostazioniScreen';
import DipendentiScreen from '../screens/DipendentiScreen';

const Tab = createBottomTabNavigator();

const BottomTabNavigator = () => {
  const { theme, isDark } = useTheme();
  const { user } = useAuth();

  // Per receptionist, nascondi la tab bar e mostra solo Dashboard (QR)
  const isReceptionist = user?.ruolo === 'receptionist';
  const isManagerOrAdmin = user?.ruolo === 'admin' || user?.ruolo === 'manager';

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.textTertiary,
        tabBarStyle: isReceptionist ? { display: 'none' } : {
          backgroundColor: theme.card,
          borderTopWidth: 1,
          borderTopColor: theme.border,
          height: Platform.OS === 'ios' ? 88 : 70,
          paddingTop: 8,
          paddingBottom: Platform.OS === 'ios' ? 28 : 12,
          elevation: 8,
          shadowColor: theme.shadowStrong,
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.1,
          shadowRadius: 12,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '700',
          marginTop: 4,
        },
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          let IconComponent = Ionicons;

          if (route.name === 'Dashboard') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Timbratura') {
            iconName = focused ? 'time' : 'time-outline';
          } else if (route.name === 'Documenti') {
            IconComponent = MaterialCommunityIcons;
            iconName = focused ? 'file-document' : 'file-document-outline';
          } else if (route.name === 'Dipendenti') {
            IconComponent = MaterialCommunityIcons;
            iconName = focused ? 'account-multiple' : 'account-multiple-outline';
          } else if (route.name === 'Impostazioni') {
            iconName = focused ? 'settings' : 'settings-outline';
          }

          // Se focused, mostra con gradiente
          if (focused) {
            return (
              <LinearGradient
                colors={theme.gradients.primary}
                style={styles.activeIconContainer}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <IconComponent name={iconName} size={size - 2} color="#FFFFFF" />
              </LinearGradient>
            );
          }

          return <IconComponent name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen 
        name="Dashboard" 
        component={DashboardScreen}
        options={{
          tabBarLabel: 'Home',
        }}
      />
      {!isReceptionist && (
        <>
          <Tab.Screen 
            name="Timbratura" 
            component={TimbraturaScreen}
            options={{
              tabBarLabel: 'Timbratura',
            }}
          />
          {isManagerOrAdmin && (
            <Tab.Screen 
              name="Dipendenti" 
              component={DipendentiScreen}
              options={{
                tabBarLabel: 'Dipendenti',
              }}
            />
          )}
          <Tab.Screen 
            name="Documenti" 
            component={DocumentiScreen}
            options={{
              tabBarLabel: 'Documenti',
            }}
          />
          <Tab.Screen 
            name="Impostazioni" 
            component={ImpostazioniScreen}
            options={{
              tabBarLabel: 'Impostazioni',
            }}
          />
        </>
      )}
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  activeIconContainer: {
    width: 48,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default BottomTabNavigator;
