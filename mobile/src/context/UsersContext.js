import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { usersAPI } from '../services/api';
import { useAuth } from './AuthContext';

const UsersContext = createContext();

export const UsersProvider = ({ children }) => {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastFetch, setLastFetch] = useState(null);

  // Carica gli utenti dal backend
  const loadUsers = useCallback(async (filters = {}) => {
    // Solo admin e manager possono vedere gli utenti
    if (!user || (user.ruolo !== 'admin' && user.ruolo !== 'manager')) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const response = await usersAPI.getAllUsers(filters);
      
      if (response.success && response.data) {
        setUsers(response.data);
        setLastFetch(new Date());
      } else {
        setError(response.error || 'Errore nel caricamento degli utenti');
      }
    } catch (error) {
      console.error('Errore caricamento utenti:', error);
      setError('Errore di connessione. Verifica che il backend sia avviato.');
      // Fallback: array vuoto invece di dati mock
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Carica utente specifico
  const loadUserById = useCallback(async (id) => {
    try {
      const response = await usersAPI.getUserById(id);
      if (response.success && response.data) {
        return response.data;
      }
      return null;
    } catch (error) {
      console.error('Errore caricamento utente:', error);
      return null;
    }
  }, []);

  // Crea nuovo utente
  const createUser = useCallback(async (userData) => {
    try {
      const response = await usersAPI.createUser(userData);
      if (response.success) {
        // Ricarica la lista
        await loadUsers();
        return { success: true, data: response.data };
      }
      return { success: false, error: response.error };
    } catch (error) {
      console.error('Errore creazione utente:', error);
      return { 
        success: false, 
        error: error.response?.data?.error || 'Errore durante la creazione' 
      };
    }
  }, [loadUsers]);

  // Aggiorna utente
  const updateUser = useCallback(async (id, updates) => {
    try {
      const response = await usersAPI.updateUser(id, updates);
      if (response.success) {
        // Aggiorna la lista
        await loadUsers();
        return { success: true, data: response.data };
      }
      return { success: false, error: response.error };
    } catch (error) {
      console.error('Errore aggiornamento utente:', error);
      return { 
        success: false, 
        error: error.response?.data?.error || 'Errore durante l\'aggiornamento' 
      };
    }
  }, [loadUsers]);

  // Elimina utente
  const deleteUser = useCallback(async (id) => {
    try {
      const response = await usersAPI.deleteUser(id);
      if (response.success) {
        // Aggiorna la lista
        await loadUsers();
        return { success: true };
      }
      return { success: false, error: response.error };
    } catch (error) {
      console.error('Errore eliminazione utente:', error);
      return { 
        success: false, 
        error: error.response?.data?.error || 'Errore durante l\'eliminazione' 
      };
    }
  }, [loadUsers]);

  // Toggle stato utente
  const toggleUserStatus = useCallback(async (id) => {
    try {
      const response = await usersAPI.toggleUserStatus(id);
      if (response.success) {
        // Aggiorna la lista
        await loadUsers();
        return { success: true, data: response.data };
      }
      return { success: false, error: response.error };
    } catch (error) {
      console.error('Errore toggle status:', error);
      return { 
        success: false, 
        error: error.response?.data?.error || 'Errore durante il cambio stato' 
      };
    }
  }, [loadUsers]);

  // Carica statistiche
  const loadStats = useCallback(async () => {
    try {
      const response = await usersAPI.getUserStats();
      if (response.success && response.data) {
        return response.data;
      }
      return null;
    } catch (error) {
      console.error('Errore caricamento statistiche:', error);
      return null;
    }
  }, []);

  // Carica utenti all'avvio se l'utente è admin/manager
  useEffect(() => {
    if (user && (user.ruolo === 'admin' || user.ruolo === 'manager')) {
      loadUsers();
    } else {
      setUsers([]);
    }
  }, [user, loadUsers]);

  // Helper per ottenere utente per ID dalla lista caricata
  const getUserById = useCallback((id) => {
    // Converte id in stringa per il confronto
    const userId = String(id);
    return users.find(u => String(u._id) === userId || String(u.id) === userId);
  }, [users]);

  // Helper per filtrare utenti
  const getUsersByRole = useCallback((ruolo) => {
    return users.filter(u => u.ruolo === ruolo);
  }, [users]);

  const getUsersByReparto = useCallback((reparto) => {
    return users.filter(u => u.reparto === reparto);
  }, [users]);

  const getActiveUsers = useCallback(() => {
    return users.filter(u => u.attivo !== false);
  }, [users]);

  return (
    <UsersContext.Provider
      value={{
        users,
        loading,
        error,
        lastFetch,
        loadUsers,
        loadUserById,
        createUser,
        updateUser,
        deleteUser,
        toggleUserStatus,
        loadStats,
        getUserById,
        getUsersByRole,
        getUsersByReparto,
        getActiveUsers,
      }}
    >
      {children}
    </UsersContext.Provider>
  );
};

export const useUsers = () => {
  const context = useContext(UsersContext);
  if (!context) {
    throw new Error('useUsers deve essere usato dentro UsersProvider');
  }
  return context;
};

