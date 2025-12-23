import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authAPI } from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Carica l'utente salvato all'avvio
  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const savedUser = await AsyncStorage.getItem('@user');
      const savedToken = await AsyncStorage.getItem('@token');
      
      if (savedUser && savedToken) {
        // Verifica che il token sia ancora valido
        try {
          const meResponse = await authAPI.getMe();
          if (meResponse.success && meResponse.data) {
            setUser(meResponse.data);
            await AsyncStorage.setItem('@user', JSON.stringify(meResponse.data));
          } else {
            // Token non valido, rimuovi dati salvati
            await AsyncStorage.removeItem('@user');
            await AsyncStorage.removeItem('@token');
          }
        } catch (error) {
          // Errore nella verifica, usa dati salvati come fallback
          setUser(JSON.parse(savedUser));
        }
      }
    } catch (error) {
      console.error('Errore nel caricamento utente:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const response = await authAPI.login(email, password);
      
      if (response.success && response.data && response.data.user) {
        setUser(response.data.user);
        return { success: true };
      } else {
        return { 
          success: false, 
          error: response.error || 'Email o password non validi' 
        };
      }
    } catch (error) {
      console.error('Errore durante il login:', error);
      
      // Gestione errori di rete
      if (error.message && error.message.includes('Network Error')) {
        return { 
          success: false, 
          error: 'Errore di connessione. Verifica che il backend sia avviato.' 
        };
      }
      
      return { 
        success: false, 
        error: error.response?.data?.error || 'Errore durante il login' 
      };
    }
  };

  const logout = async () => {
    try {
      await authAPI.logout();
      await AsyncStorage.removeItem('@user');
      await AsyncStorage.removeItem('@token');
      setUser(null);
    } catch (error) {
      console.error('Errore durante il logout:', error);
      // Fallback: rimuovi comunque i dati locali
      await AsyncStorage.removeItem('@user');
      await AsyncStorage.removeItem('@token');
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve essere usato dentro AuthProvider');
  }
  return context;
};


