import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { timbratureAPI } from '../services/api';

const SyncContext = createContext();

export const SyncProvider = ({ children }) => {
  const [isOnline, setIsOnline] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState(null);

  useEffect(() => {
    // Verifica connessione iniziale
    checkConnection();

    // Listener per cambiamenti di connessione
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOnline(state.isConnected && state.isInternetReachable);
      
      // Se la connessione torna disponibile, sincronizza
      if (state.isConnected && state.isInternetReachable) {
        syncPendingTimbrature();
      }
    });

    // Sincronizzazione periodica ogni 30 secondi quando online
    const syncInterval = setInterval(() => {
      if (isOnline) {
        syncPendingTimbrature();
      }
    }, 30000);

    return () => {
      unsubscribe();
      clearInterval(syncInterval);
    };
  }, [isOnline]);

  const checkConnection = async () => {
    try {
      const state = await NetInfo.fetch();
      setIsOnline(state.isConnected && state.isInternetReachable);
    } catch (error) {
      console.error('Errore verifica connessione:', error);
      setIsOnline(false);
    }
  };

  const syncPendingTimbrature = async () => {
    if (syncing) return;
    
    try {
      setSyncing(true);
      
      // Ottieni timbrature pending da AsyncStorage
      const allTimbrature = await AsyncStorage.getItem('@timbrature');
      if (!allTimbrature) {
        setSyncing(false);
        return;
      }

      const timbrature = JSON.parse(allTimbrature);
      const pendingTimbrature = timbrature.filter(t => t.pendingSync === true);

      if (pendingTimbrature.length === 0) {
        setSyncing(false);
        return;
      }

      // Prepara dati per sync (rimuovi campi locali)
      const timbratureToSync = pendingTimbrature.map(t => ({
        userId: t.userId,
        data: t.data,
        entrata: t.entrata,
        uscita: t.uscita || undefined,
        pausaInizio: t.pausaInizio || undefined,
        pausaFine: t.pausaFine || undefined,
        oreTotali: t.oreTotali || undefined,
        qrToken: t.qrToken || undefined,
        metodoTimbratura: t.metodoTimbratura || 'qr',
        note: t.note || undefined,
      }));

      // Invia al server
      const response = await timbratureAPI.syncTimbrature(timbratureToSync);

      if (response.success) {
        // Aggiorna timbrature locali rimuovendo flag pendingSync
        const updatedTimbrature = timbrature.map(t => {
          if (t.pendingSync) {
            return { ...t, pendingSync: false };
          }
          return t;
        });

        await AsyncStorage.setItem('@timbrature', JSON.stringify(updatedTimbrature));
        setLastSync(new Date());
      }
    } catch (error) {
      console.error('Errore sincronizzazione:', error);
      // Non mostriamo errore all'utente, riproverà al prossimo ciclo
    } finally {
      setSyncing(false);
    }
  };

  const forceSync = async () => {
    await checkConnection();
    if (isOnline) {
      await syncPendingTimbrature();
    }
  };

  return (
    <SyncContext.Provider
      value={{
        isOnline,
        syncing,
        lastSync,
        syncPendingTimbrature,
        forceSync,
        checkConnection,
      }}
    >
      {children}
    </SyncContext.Provider>
  );
};

export const useSync = () => {
  const context = useContext(SyncContext);
  if (!context) {
    throw new Error('useSync deve essere usato dentro SyncProvider');
  }
  return context;
};

