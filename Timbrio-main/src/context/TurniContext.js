import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { turniAPI } from '../services/api';
import { useAuth } from './AuthContext';

const TurniContext = createContext();

export const TurniProvider = ({ children }) => {
  const { user } = useAuth();
  const [turni, setTurni] = useState([]);
  const [turniAttivi, setTurniAttivi] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Carica i turni dell'utente
  const loadTurni = useCallback(async (filters = {}) => {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/aee00c88-6439-4f09-9c24-b3d72a684e7e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'TurniContext.js:15',message:'loadTurni called',data:{hasUser:!!user,userId:user?.id,filters,timestamp:Date.now()},sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
    // #endregion
    if (!user) return;

    try {
      setLoading(true);
      setError(null);
      
      const response = await turniAPI.getAllTurni(filters);
      
      if (response.success && response.data) {
        setTurni(response.data);
      } else {
        setError(response.error || 'Errore nel caricamento dei turni');
      }
    } catch (error) {
      console.error('Errore caricamento turni:', error);
      setError('Errore di connessione. Verifica che il backend sia avviato.');
      setTurni([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Carica turni attivi
  const loadTurniAttivi = useCallback(async () => {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/aee00c88-6439-4f09-9c24-b3d72a684e7e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'TurniContext.js:39',message:'loadTurniAttivi called',data:{hasUser:!!user,userId:user?.id,timestamp:Date.now()},sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
    // #endregion
    if (!user) return;

    try {
      const response = await turniAPI.getTurniAttivi();
      
      if (response.success && response.data) {
        setTurniAttivi(response.data);
        return response.data;
      }
      return [];
    } catch (error) {
      console.error('Errore caricamento turni attivi:', error);
      setTurniAttivi([]);
      return [];
    }
  }, [user]);

  // Inizia un turno
  const iniziaTurno = useCallback(async (turnoId, qrToken = null) => {
    try {
      const response = await turniAPI.iniziaTurno(turnoId, qrToken);
      
      if (response.success) {
        await loadTurniAttivi(); // Ricarica i turni attivi
        return { success: true, data: response.data };
      }
      return { success: false, error: response.error };
    } catch (error) {
      console.error('Errore inizio turno:', error);
      return { 
        success: false, 
        error: error.response?.data?.error || 'Errore durante l\'inizio del turno' 
      };
    }
  }, [loadTurniAttivi]);

  // Ferma un turno
  const fermaTurno = useCallback(async (qrToken = null) => {
    try {
      const response = await turniAPI.fermaTurno(qrToken);
      
      if (response.success) {
        await loadTurniAttivi(); // Ricarica i turni attivi
        return { success: true, data: response.data };
      }
      return { success: false, error: response.error };
    } catch (error) {
      console.error('Errore ferma turno:', error);
      return { 
        success: false, 
        error: error.response?.data?.error || 'Errore durante la fermata del turno' 
      };
    }
  }, [loadTurniAttivi]);

  // Metti in pausa un turno
  const mettiInPausa = useCallback(async (qrToken = null) => {
    try {
      const response = await turniAPI.mettiInPausa(qrToken);
      
      if (response.success) {
        await loadTurniAttivi(); // Ricarica i turni attivi
        return { success: true, data: response.data };
      }
      return { success: false, error: response.error };
    } catch (error) {
      console.error('Errore pausa turno:', error);
      return { 
        success: false, 
        error: error.response?.data?.error || 'Errore durante la pausa' 
      };
    }
  }, [loadTurniAttivi]);

  // Riprendi un turno
  const riprendiTurno = useCallback(async (qrToken = null) => {
    try {
      const response = await turniAPI.riprendiTurno(qrToken);
      
      if (response.success) {
        await loadTurniAttivi(); // Ricarica i turni attivi
        return { success: true, data: response.data };
      }
      return { success: false, error: response.error };
    } catch (error) {
      console.error('Errore riprendi turno:', error);
      return { 
        success: false, 
        error: error.response?.data?.error || 'Errore durante la ripresa del turno' 
      };
    }
  }, [loadTurniAttivi]);

  // Crea nuovo turno (admin)
  const createTurno = useCallback(async (turnoData) => {
    try {
      const response = await turniAPI.createTurno(turnoData);
      if (response.success) {
        await loadTurni(); // Ricarica la lista
        return { success: true, data: response.data };
      }
      return { success: false, error: response.error };
    } catch (error) {
      console.error('Errore creazione turno:', error);
      return { 
        success: false, 
        error: error.response?.data?.error || 'Errore durante la creazione' 
      };
    }
  }, [loadTurni]);

  // Aggiorna turno (admin)
  const updateTurno = useCallback(async (id, updates) => {
    try {
      const response = await turniAPI.updateTurno(id, updates);
      if (response.success) {
        await loadTurni(); // Ricarica la lista
        return { success: true, data: response.data };
      }
      return { success: false, error: response.error };
    } catch (error) {
      console.error('Errore aggiornamento turno:', error);
      return { 
        success: false, 
        error: error.response?.data?.error || 'Errore durante l\'aggiornamento' 
      };
    }
  }, [loadTurni]);

  // Elimina turno (admin)
  const deleteTurno = useCallback(async (id) => {
    try {
      const response = await turniAPI.deleteTurno(id);
      if (response.success) {
        await loadTurni(); // Ricarica la lista
        return { success: true };
      }
      return { success: false, error: response.error };
    } catch (error) {
      console.error('Errore eliminazione turno:', error);
      return { 
        success: false, 
        error: error.response?.data?.error || 'Errore durante l\'eliminazione' 
      };
    }
  }, [loadTurni]);

  // Carica turni all'avvio
  useEffect(() => {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/aee00c88-6439-4f09-9c24-b3d72a684e7e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'TurniContext.js:188',message:'TurniContext useEffect triggered',data:{hasUser:!!user,userId:user?.id,timestamp:Date.now()},sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
    // #endregion
    if (user) {
      // Delay iniziale per evitare sovrapposizione con altre chiamate all'avvio
      const delayTimeout = setTimeout(() => {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/aee00c88-6439-4f09-9c24-b3d72a684e7e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'TurniContext.js:192',message:'Calling loadTurni and loadTurniAttivi (delayed)',data:{timestamp:Date.now()},sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
        // #endregion
        loadTurni();
        // Carica turni attivi con un piccolo delay rispetto a loadTurni
        setTimeout(() => {
          loadTurniAttivi();
        }, 500);
      }, 1500);
      
      return () => clearTimeout(delayTimeout);
    }
  }, [user, loadTurni, loadTurniAttivi]);

  // Helper per ottenere turno attivo corrente
  const getTurnoAttivoCorrente = useCallback(() => {
    return turniAttivi.find(t => 
      t.stato === 'in_corso' || t.stato === 'in_pausa'
    );
  }, [turniAttivi]);

  // Helper per ottenere turni per giorno
  const getTurniPerGiorno = useCallback((giornoSettimana) => {
    return turni.filter(t => t.giornoSettimana === giornoSettimana && t.attivo);
  }, [turni]);

  return (
    <TurniContext.Provider
      value={{
        turni,
        turniAttivi,
        loading,
        error,
        loadTurni,
        loadTurniAttivi,
        iniziaTurno,
        fermaTurno,
        mettiInPausa,
        riprendiTurno,
        createTurno,
        updateTurno,
        deleteTurno,
        getTurnoAttivoCorrente,
        getTurniPerGiorno,
      }}
    >
      {children}
    </TurniContext.Provider>
  );
};

export const useTurni = () => {
  const context = useContext(TurniContext);
  if (!context) {
    throw new Error('useTurni deve essere usato dentro TurniProvider');
  }
  return context;
};

