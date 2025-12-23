import React, { createContext, useState, useContext, useEffect, useCallback, useRef } from 'react';
import { comunicazioniAPI, supabase } from '../services/api';
import { useAuth } from './AuthContext';

const ComunicazioniContext = createContext();

export const ComunicazioniProvider = ({ children }) => {
  const { user } = useAuth();
  const [comunicazioni, setComunicazioni] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [countNonLette, setCountNonLette] = useState(0);

  const isManagerOrAdmin = user?.ruolo === 'admin' || user?.ruolo === 'manager';
  
  // Ref per il canale Supabase Realtime
  const channelRef = useRef(null);
  // Ref per evitare caricamenti multipli
  const loadingRef = useRef(false);

  // Carica comunicazioni - versione stabile senza dipendenze problematiche
  const loadComunicazioni = useCallback(async (showRefreshing = false) => {
    // Ottieni user dallo storage se non disponibile nel context
    const currentUser = user;
    if (!currentUser) return;
    
    // Evita caricamenti multipli simultanei
    if (loadingRef.current && !showRefreshing) return;
    loadingRef.current = true;

    if (showRefreshing) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const isAdmin = currentUser.ruolo === 'admin' || currentUser.ruolo === 'manager';
      
      // Se admin/manager, carica tutte le comunicazioni per gestione
      // Altrimenti carica solo quelle visibili all'utente
      const result = isAdmin 
        ? await comunicazioniAPI.getAllComunicazioni()
        : await comunicazioniAPI.getMyComunicazioni();

      if (result.success) {
        setComunicazioni(result.data || []);
        
        // Conta non lette per badge
        const countResult = await comunicazioniAPI.countUnread();
        if (countResult.success) {
          setCountNonLette(countResult.data.count);
        }
      }
    } catch (error) {
      console.error('Errore caricamento comunicazioni:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
      loadingRef.current = false;
    }
  }, [user]);

  // Carica al mount e quando cambia l'utente
  useEffect(() => {
    if (user) {
      loadComunicazioni();
    } else {
      setComunicazioni([]);
      setCountNonLette(0);
    }
  }, [user?.id]); // Solo quando cambia l'ID utente

  // Sottoscrizione Supabase Realtime separata
  useEffect(() => {
    if (!user) return;
    
    // Rimuovi canale esistente se presente
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }
    
    console.log('📡 Attivazione Realtime per comunicazioni...');
    
    // Sottoscrizione Supabase Realtime per aggiornamenti istantanei
    const channel = supabase
      .channel(`comunicazioni-${user.id}-${Date.now()}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'comunicazioni' },
        (payload) => {
          console.log('📢 Nuova comunicazione ricevuta:', payload.new?.titolo);
          loadComunicazioni(true);
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'comunicazioni' },
        (payload) => {
          console.log('📢 Comunicazione aggiornata:', payload.new?.titolo);
          loadComunicazioni(true);
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'comunicazioni' },
        (payload) => {
          console.log('📢 Comunicazione eliminata:', payload.old?.id);
          loadComunicazioni(true);
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'comunicazioni_letture' },
        (payload) => {
          console.log('📖 Lettura aggiornata:', payload.eventType);
          loadComunicazioni(true);
        }
      )
      .subscribe((status) => {
        console.log('📡 Stato sottoscrizione comunicazioni:', status);
        if (status === 'SUBSCRIBED') {
          console.log('✅ Realtime comunicazioni attivo!');
        }
      });

    channelRef.current = channel;
    
    return () => {
      if (channelRef.current) {
        console.log('📡 Disattivazione Realtime comunicazioni...');
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [user?.id]); // Solo quando cambia l'ID utente

  // Refresh manuale
  const refresh = useCallback(async () => {
    await loadComunicazioni(true);
  }, [loadComunicazioni]);

  // Crea nuova comunicazione (admin/manager)
  const creaComunicazione = useCallback(async (datiComunicazione) => {
    try {
      const result = await comunicazioniAPI.createComunicazione(datiComunicazione);
      if (result.success) {
        // Ricarica lista
        await loadComunicazioni();
      }
      return result;
    } catch (error) {
      return { success: false, error: error.message };
    }
  }, [loadComunicazioni]);

  // Segna come letta
  const segnaComeLetta = useCallback(async (comunicazioneId) => {
    try {
      const result = await comunicazioniAPI.markAsRead(comunicazioneId);
      if (result.success) {
        // Aggiorna stato locale
        setComunicazioni(prev => 
          prev.map(c => c.id === comunicazioneId ? { ...c, letta: true } : c)
        );
        setCountNonLette(prev => Math.max(0, prev - 1));
      }
      return result;
    } catch (error) {
      return { success: false, error: error.message };
    }
  }, []);

  // Ottieni conferme di lettura (admin/manager)
  const getConfermeLettura = useCallback(async (comunicazioneId) => {
    try {
      return await comunicazioniAPI.getLetture(comunicazioneId);
    } catch (error) {
      return { success: false, error: error.message };
    }
  }, []);

  // Elimina comunicazione (admin)
  const eliminaComunicazione = useCallback(async (comunicazioneId) => {
    try {
      const result = await comunicazioniAPI.deleteComunicazione(comunicazioneId);
      if (result.success) {
        setComunicazioni(prev => prev.filter(c => c.id !== comunicazioneId));
      }
      return result;
    } catch (error) {
      return { success: false, error: error.message };
    }
  }, []);

  // Download file allegato
  const downloadFile = useCallback(async (filePath) => {
    try {
      return await comunicazioniAPI.getFileUrl(filePath);
    } catch (error) {
      return { success: false, error: error.message };
    }
  }, []);

  // Filtra comunicazioni per priorità
  const getComunicazioniPrioritaAlta = useCallback(() => {
    return comunicazioni.filter(c => c.priorita === 'alta' && !c.letta);
  }, [comunicazioni]);

  // Filtra comunicazioni non lette
  const getComunicazioniNonLette = useCallback(() => {
    return comunicazioni.filter(c => !c.letta);
  }, [comunicazioni]);

  // Filtra per tipo
  const getComunicazioniPerTipo = useCallback((tipo) => {
    return comunicazioni.filter(c => c.tipo === tipo);
  }, [comunicazioni]);

  return (
    <ComunicazioniContext.Provider
      value={{
        comunicazioni,
        loading,
        refreshing,
        countNonLette,
        refresh,
        creaComunicazione,
        segnaComeLetta,
        getConfermeLettura,
        eliminaComunicazione,
        downloadFile,
        getComunicazioniPrioritaAlta,
        getComunicazioniNonLette,
        getComunicazioniPerTipo,
        isManagerOrAdmin,
      }}
    >
      {children}
    </ComunicazioniContext.Provider>
  );
};

export const useComunicazioni = () => {
  const context = useContext(ComunicazioniContext);
  if (!context) {
    throw new Error('useComunicazioni deve essere usato dentro ComunicazioniProvider');
  }
  return context;
};

