import React, { createContext, useState, useContext, useEffect, useCallback, useRef } from 'react';
import { documentiAPI, supabase } from '../services/api';
import { useAuth } from './AuthContext';

const DocumentiContext = createContext();

export const DocumentiProvider = ({ children }) => {
  const { user } = useAuth();
  const [documenti, setDocumenti] = useState([]);
  const [bustePaga, setBustePaga] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [countNuovi, setCountNuovi] = useState(0);

  // Carica documenti dal server
  const loadDocumenti = useCallback(async (showRefreshing = false) => {
    if (!user) {
      setDocumenti([]);
      setBustePaga([]);
      setLoading(false);
      return;
    }

    if (showRefreshing) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const result = await documentiAPI.getMyDocumenti();
      
      if (result.success && result.data) {
        // Separa documenti e buste paga
        const docs = result.data.filter(d => d.tipo !== 'Busta Paga');
        const buste = result.data
          .filter(d => d.tipo === 'Busta Paga')
          .map(b => ({
            ...b,
            mese: b.mese || getMeseNome(b.data),
            anno: b.anno || new Date(b.data).getFullYear(),
            importo: b.importo || 0,
          }));
        
        setDocumenti(docs);
        setBustePaga(buste);
        
        // Conta documenti nuovi
        const nuovi = result.data.filter(d => d.nuovo).length;
        setCountNuovi(nuovi);
      }
    } catch (error) {
      console.error('Errore caricamento documenti:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  // Helper per ottenere il nome del mese dalla data
  const getMeseNome = (dataString) => {
    if (!dataString) return '';
    const mesi = [
      'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
      'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'
    ];
    const data = new Date(dataString);
    return `${mesi[data.getMonth()]} ${data.getFullYear()}`;
  };

  // Ref per il canale Supabase Realtime
  const channelRef = useRef(null);

  // Carica al mount e quando cambia l'utente
  useEffect(() => {
    if (user) {
      loadDocumenti();
    } else {
      setDocumenti([]);
      setBustePaga([]);
      setCountNuovi(0);
    }
  }, [user?.id]); // Solo quando cambia l'ID utente

  // Sottoscrizione Supabase Realtime separata
  useEffect(() => {
    if (!user) return;
    
    // Rimuovi canale esistente se presente
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }
    
    console.log('📡 Attivazione Realtime per documenti...');
    
    // Sottoscrizione Supabase Realtime per aggiornamenti istantanei
    const channel = supabase
      .channel(`documenti-${user.id}-${Date.now()}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'documenti' },
        (payload) => {
          console.log('📄 Nuovo documento ricevuto:', payload.new?.nome);
          loadDocumenti(true);
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'documenti' },
        (payload) => {
          console.log('📄 Documento aggiornato:', payload.new?.nome);
          loadDocumenti(true);
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'documenti' },
        (payload) => {
          console.log('📄 Documento eliminato:', payload.old?.id);
          loadDocumenti(true);
        }
      )
      .subscribe((status) => {
        console.log('📡 Stato sottoscrizione documenti:', status);
        if (status === 'SUBSCRIBED') {
          console.log('✅ Realtime documenti attivo!');
        }
      });

    channelRef.current = channel;
    
    return () => {
      if (channelRef.current) {
        console.log('📡 Disattivazione Realtime documenti...');
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [user?.id]); // Solo quando cambia l'ID utente

  // Refresh manuale
  const refresh = useCallback(async () => {
    await loadDocumenti(true);
  }, [loadDocumenti]);

  // Segna documento come letto
  const segnaLetto = useCallback(async (id) => {
    try {
      const result = await documentiAPI.markAsRead(id);
      if (result.success) {
        // Aggiorna stato locale
        setDocumenti(prev => 
          prev.map(doc => doc.id === id ? { ...doc, nuovo: false } : doc)
        );
        setBustePaga(prev =>
          prev.map(bp => bp.id === id ? { ...bp, nuovo: false } : bp)
        );
        setCountNuovi(prev => Math.max(0, prev - 1));
      }
      return result;
    } catch (error) {
      console.error('Errore segna letto:', error);
      return { success: false, error: error.message };
    }
  }, []);

  // Ottieni ultima busta paga
  const getUltimaBustaPaga = useCallback(() => {
    if (bustePaga.length === 0) return null;
    // Ordina per data decrescente e prendi la prima
    const ordinate = [...bustePaga].sort((a, b) => 
      new Date(b.data || b.created_at) - new Date(a.data || a.created_at)
    );
    return ordinate[0];
  }, [bustePaga]);

  // Ottieni buste paga per anno
  const getBustePagaPerAnno = useCallback((anno) => {
    return bustePaga.filter(bp => bp.anno === anno);
  }, [bustePaga]);

  // Ottieni documenti nuovi (non letti)
  const getDocumentiNuovi = useCallback(() => {
    return documenti.filter(doc => doc.nuovo);
  }, [documenti]);

  // Conta documenti nuovi
  const countNew = useCallback(async () => {
    try {
      const result = await documentiAPI.countNew();
      if (result.success) {
        setCountNuovi(result.data.count);
        return result.data.count;
      }
      return 0;
    } catch (error) {
      return 0;
    }
  }, []);

  return (
    <DocumentiContext.Provider
      value={{
        documenti,
        bustePaga,
        loading,
        refreshing,
        countNuovi,
        refresh,
        segnaLetto,
        getUltimaBustaPaga,
        getBustePagaPerAnno,
        getDocumentiNuovi,
        countNew,
      }}
    >
      {children}
    </DocumentiContext.Provider>
  );
};

export const useDocumenti = () => {
  const context = useContext(DocumentiContext);
  if (!context) {
    throw new Error('useDocumenti deve essere usato dentro DocumentiProvider');
  }
  return context;
};
