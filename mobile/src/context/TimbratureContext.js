import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { timbratureAPI } from '../services/api';

const TimbratureContext = createContext();

export const TimbratureProvider = ({ children }) => {
  const [timbrature, setTimbrature] = useState([]);
  const [currentTimbrata, setCurrentTimbrata] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isReloading, setIsReloading] = useState(false);

  useEffect(() => {
    loadTimbrature();
  }, []);

  const loadTimbrature = async (forceFromServer = false) => {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/aee00c88-6439-4f09-9c24-b3d72a684e7e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'TimbratureContext.js:16',message:'loadTimbrature called',data:{forceFromServer,isReloading,timestamp:Date.now()},sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    try {
      // Carica dal server se richiesto o se non ci sono dati locali
      if (forceFromServer) {
        // Previeni richieste multiple simultanee
        if (isReloading) {
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/aee00c88-6439-4f09-9c24-b3d72a684e7e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'TimbratureContext.js:23',message:'Reload blocked - already in progress',data:{isReloading,timestamp:Date.now()},sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
          // #endregion
          console.log('Reload già in corso, salto questa richiesta');
          return;
        }
        
        setIsReloading(true);
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/aee00c88-6439-4f09-9c24-b3d72a684e7e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'TimbratureContext.js:30',message:'Starting API call getMyTimbrature',data:{timestamp:Date.now()},sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
        // #endregion
        try {
          const response = await timbratureAPI.getMyTimbrature(1, 100);
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/aee00c88-6439-4f09-9c24-b3d72a684e7e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'TimbratureContext.js:32',message:'Server response received',data:{success:response.success,dataCount:response.data?.length||0,firstTimbrata:response.data?.[0]?{_id:response.data[0]._id,userId:response.data[0].userId,data:response.data[0].data,entrata:response.data[0].entrata,uscita:response.data[0].uscita}:null,timestamp:Date.now()},sessionId:'debug-session',runId:'run1',hypothesisId:'G'})}).catch(()=>{});
          // #endregion
          if (response.success && response.data) {
            // Converti formato server a formato locale
            const timbratureFromServer = response.data.map(t => {
              // Gestisci userId che potrebbe essere un oggetto (popolato) o una stringa/ObjectId
              let userId = t.userId;
              if (typeof userId === 'object' && userId !== null) {
                userId = userId._id || userId.id || userId;
              }
              
              // Gestisci data che potrebbe essere stringa ISO o Date
              let dataStr = t.data;
              if (dataStr instanceof Date) {
                dataStr = dataStr.toISOString().split('T')[0];
              } else if (dataStr && dataStr.includes('T')) {
                dataStr = dataStr.split('T')[0];
              }
              
              return {
                id: t._id || t.id,
                userId: userId,
                data: dataStr,
                entrata: t.entrata,
                uscita: t.uscita || null,
                pausaInizio: t.pausaInizio || null,
                pausaFine: t.pausaFine || null,
                oreTotali: t.oreTotali || null,
                tipo: t.uscita ? 'completata' : 'in_corso',
                metodoTimbratura: t.metodoTimbratura || 'manual',
                commessa: t.commessa || null,
              };
            });
            
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/aee00c88-6439-4f09-9c24-b3d72a684e7e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'TimbratureContext.js:60',message:'Timbrature converted and saved',data:{count:timbratureFromServer.length,firstTimbrata:timbratureFromServer[0]?{id:timbratureFromServer[0].id,userId:timbratureFromServer[0].userId,data:timbratureFromServer[0].data,entrata:timbratureFromServer[0].entrata,uscita:timbratureFromServer[0].uscita}:null,timestamp:Date.now()},sessionId:'debug-session',runId:'run1',hypothesisId:'G'})}).catch(()=>{});
            // #endregion
            
            await AsyncStorage.setItem('@timbrature', JSON.stringify(timbratureFromServer));
            setTimbrature(timbratureFromServer);
            setLoading(false);
            // Forza un update immediato dello stato
            return timbratureFromServer;
          }
        } catch (error) {
          console.error('Errore caricamento dal server:', error);
          // Se è un errore di rate limit, non è grave - useremo i dati locali
          // Non loggare come errore critico se è solo rate limiting
          if (error.message && error.message.includes('Rate limit')) {
            console.log('Rate limit raggiunto, uso dati locali');
          }
          // Fallback ai dati locali in caso di errore
        } finally {
          setIsReloading(false);
        }
      }
      
      const saved = await AsyncStorage.getItem('@timbrature');
      if (saved) {
        const parsedTimbrature = JSON.parse(saved);
        setTimbrature(parsedTimbrature);
      }
      
      const current = await AsyncStorage.getItem('@currentTimbrata');
      if (current) {
        setCurrentTimbrata(JSON.parse(current));
      }
    } catch (error) {
      console.error('Errore nel caricamento timbrature:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveTimbrature = async (newTimbrature) => {
    try {
      await AsyncStorage.setItem('@timbrature', JSON.stringify(newTimbrature));
      setTimbrature(newTimbrature);
    } catch (error) {
      console.error('Errore nel salvataggio timbrature:', error);
    }
  };

  const timbraEntrata = async (userId) => {
    try {
      const now = new Date();
      
      const nuovaTimbrata = {
        id: `t_${Date.now()}`,
        userId,
        data: now.toISOString().split('T')[0],
        entrata: now.toTimeString().split(' ')[0],
        uscita: null,
        pausaInizio: null,
        pausaFine: null,
        tipo: 'in_corso',
        note: null,
        pendingSync: true,
      };

      await AsyncStorage.setItem('@currentTimbrata', JSON.stringify(nuovaTimbrata));
      setCurrentTimbrata(nuovaTimbrata);
      
      return { success: true, timbrata: nuovaTimbrata };
    } catch (error) {
      console.error('Errore timbratura entrata:', error);
      return { success: false, error: error.message };
    }
  };

  const timbraUscita = async () => {
    try {
      // Verifica se c'è una timbratura in corso
      if (!currentTimbrata) {
        // Se non c'è timbratura in corso, verifica se ha già timbrato oggi
        const oggi = new Date().toISOString().split('T')[0];
        const haTimbratoOggi = timbrature.some(t => t.data === oggi && t.tipo === 'completata');
        
        if (!haTimbratoOggi) {
          return { success: false, error: 'Non hai ancora timbrato oggi' };
        } else {
          return { success: false, error: 'Hai già completato la timbratura per oggi' };
        }
      }

      const now = new Date();
      
      const timbrataCompletata = {
        ...currentTimbrata,
        uscita: now.toTimeString().split(' ')[0],
        tipo: 'completata',
        pendingSync: true,
      };

      // Calcola ore totali
      const entrata = new Date(`1970-01-01T${timbrataCompletata.entrata}`);
      const uscita = new Date(`1970-01-01T${timbrataCompletata.uscita}`);
      let minutiTotali = (uscita - entrata) / (1000 * 60);
      
      // Sottrai pausa se presente
      if (timbrataCompletata.pausaInizio && timbrataCompletata.pausaFine) {
        const pausaInizio = new Date(`1970-01-01T${timbrataCompletata.pausaInizio}`);
        const pausaFine = new Date(`1970-01-01T${timbrataCompletata.pausaFine}`);
        const minutiPausa = (pausaFine - pausaInizio) / (1000 * 60);
        minutiTotali -= minutiPausa;
      }
      
      timbrataCompletata.oreTotali = (minutiTotali / 60).toFixed(2);

      const nuoveTimbrature = [...timbrature, timbrataCompletata];
      await saveTimbrature(nuoveTimbrature);
      await AsyncStorage.removeItem('@currentTimbrata');
      setCurrentTimbrata(null);

      return { success: true, timbrata: timbrataCompletata };
    } catch (error) {
      console.error('Errore timbratura uscita:', error);
      return { success: false, error: error.message };
    }
  };

  const iniziaPausa = async () => {
    try {
      if (!currentTimbrata) {
        return { success: false, error: 'Nessuna timbratura in corso' };
      }

      const now = new Date();
      const timbrataAggiornata = {
        ...currentTimbrata,
        pausaInizio: now.toTimeString().split(' ')[0]
      };

      await AsyncStorage.setItem('@currentTimbrata', JSON.stringify(timbrataAggiornata));
      setCurrentTimbrata(timbrataAggiornata);

      return { success: true };
    } catch (error) {
      console.error('Errore inizio pausa:', error);
      return { success: false, error: error.message };
    }
  };

  const terminaPausa = async () => {
    try {
      if (!currentTimbrata || !currentTimbrata.pausaInizio) {
        return { success: false, error: 'Nessuna pausa in corso' };
      }

      const now = new Date();
      const timbrataAggiornata = {
        ...currentTimbrata,
        pausaFine: now.toTimeString().split(' ')[0]
      };

      await AsyncStorage.setItem('@currentTimbrata', JSON.stringify(timbrataAggiornata));
      setCurrentTimbrata(timbrataAggiornata);

      return { success: true };
    } catch (error) {
      console.error('Errore fine pausa:', error);
      return { success: false, error: error.message };
    }
  };

  const getTimbratureByUser = (userId) => {
    return timbrature.filter(t => t.userId === userId);
  };

  const getTimbratureByDate = (date) => {
    return timbrature.filter(t => t.data === date);
  };

  const getTimbratureByUserAndDateRange = (userId, startDate, endDate) => {
    return timbrature.filter(
      t => t.userId === userId && t.data >= startDate && t.data <= endDate
    );
  };

  const getTimbratureOggiByUser = (userId) => {
    const oggi = new Date().toISOString().split('T')[0];
    return timbrature.filter(t => t.userId === userId && t.data === oggi);
  };

  const haTimbratoOggi = (userId) => {
    const oggi = new Date().toISOString().split('T')[0];
    return timbrature.some(t => t.userId === userId && t.data === oggi && t.tipo === 'completata');
  };

  const timbraDaQR = async (userId, qrToken) => {
    try {
      const now = new Date();
      const oggi = new Date().toISOString().split('T')[0];
      
      // Verifica se esiste già una timbratura per oggi
      const timbrataEsistente = timbrature.find(
        t => t.userId === userId && t.data === oggi
      );
      
      // Se la timbratura è già completata, ritorna success senza fare nulla
      if (timbrataEsistente && timbrataEsistente.entrata && timbrataEsistente.uscita) {
        return { success: true, timbrata: timbrataEsistente };
      }
      
      if (timbrataEsistente && timbrataEsistente.entrata && !timbrataEsistente.uscita) {
        // Aggiorna uscita
        timbrataEsistente.uscita = now.toTimeString().split(' ')[0];
        timbrataEsistente.qrToken = qrToken;
        timbrataEsistente.tipo = 'completata';
        timbrataEsistente.pendingSync = true;
        
        // Calcola ore totali
        const entrata = new Date(`1970-01-01T${timbrataEsistente.entrata}`);
        const uscita = new Date(`1970-01-01T${timbrataEsistente.uscita}`);
        let minutiTotali = (uscita - entrata) / (1000 * 60);
        
        if (timbrataEsistente.pausaInizio && timbrataEsistente.pausaFine) {
          const pausaInizio = new Date(`1970-01-01T${timbrataEsistente.pausaInizio}`);
          const pausaFine = new Date(`1970-01-01T${timbrataEsistente.pausaFine}`);
          const minutiPausa = (pausaFine - pausaInizio) / (1000 * 60);
          minutiTotali -= minutiPausa;
        }
        
        timbrataEsistente.oreTotali = (minutiTotali / 60).toFixed(2);
        
        // Aggiorna timbrature
        const updatedTimbrature = timbrature.map(t => 
          t.id === timbrataEsistente.id ? timbrataEsistente : t
        );
        await saveTimbrature(updatedTimbrature);
        await AsyncStorage.removeItem('@currentTimbrata');
        setCurrentTimbrata(null);
        
        return { success: true, timbrata: timbrataEsistente };
      }
      
      // Crea nuova timbratura entrata
      const nuovaTimbrata = {
        id: `t_${Date.now()}`,
        userId,
        data: oggi,
        entrata: now.toTimeString().split(' ')[0],
        uscita: null,
        pausaInizio: null,
        pausaFine: null,
        qrToken: qrToken,
        metodoTimbratura: 'qr',
        tipo: 'in_corso',
        note: null,
        pendingSync: true,
      };
      
      await AsyncStorage.setItem('@currentTimbrata', JSON.stringify(nuovaTimbrata));
      setCurrentTimbrata(nuovaTimbrata);
      
      return { success: true, timbrata: nuovaTimbrata };
    } catch (error) {
      console.error('Errore timbratura da QR:', error);
      return { success: false, error: error.message };
    }
  };

  const createMockData = () => {
    const mockTimbrature = [];
    const oggi = new Date();
    
    // Crea dati per gli ultimi 10 giorni per avere più varietà
    for (let i = 9; i >= 0; i--) {
      const data = new Date(oggi);
      data.setDate(oggi.getDate() - i);
      const dataString = data.toISOString().split('T')[0];
      
      // Skip weekend (sabato e domenica)
      const dayOfWeek = data.getDay();
      if (dayOfWeek === 0 || dayOfWeek === 6) continue;
      
      // Genera ore più realistiche con varietà
      let ore;
      const random = Math.random();
      if (random < 0.1) {
        // 10% probabilità di ore basse (malattia/permesso)
        ore = (Math.random() * 2 + 2).toFixed(1);
      } else if (random < 0.2) {
        // 10% probabilità di ore alte (straordinari)
        ore = (Math.random() * 2 + 9).toFixed(1);
      } else {
        // 80% probabilità di ore normali
        ore = (Math.random() * 2 + 7).toFixed(1);
      }
      
      // Calcola orari realistici
      const oreNum = parseFloat(ore);
      const entrataOra = 8 + Math.floor(Math.random() * 2); // 8:00 o 9:00
      const uscitaOra = entrataOra + Math.floor(oreNum);
      const uscitaMinuti = Math.floor((oreNum % 1) * 60);
      
      mockTimbrature.push({
        id: `mock_${dataString}`,
        userId: '1',
        data: dataString,
        entrata: `${entrataOra.toString().padStart(2, '0')}:00:00`,
        uscita: `${uscitaOra.toString().padStart(2, '0')}:${uscitaMinuti.toString().padStart(2, '0')}:00`,
        pausaInizio: '13:00:00',
        pausaFine: '14:00:00',
        oreTotali: ore,
        note: oreNum < 6 ? 'Permesso' : oreNum > 9 ? 'Straordinari' : '',
        approvata: true,
        approvataDa: '1',
        dataApprovazione: new Date().toISOString(),
        tipo: 'completata'
      });
    }
    
    // Salva i dati mock
    const existingTimbrature = timbrature.filter(t => !t.id.startsWith('mock_'));
    const newTimbrature = [...existingTimbrature, ...mockTimbrature];
    saveTimbrature(newTimbrature);
  };

  return (
    <TimbratureContext.Provider
      value={{
        timbrature,
        currentTimbrata,
        loading,
        timbraEntrata,
        timbraUscita,
        timbraDaQR,
        iniziaPausa,
        terminaPausa,
        getTimbratureByUser,
        getTimbratureByDate,
        getTimbratureByUserAndDateRange,
        getTimbratureOggiByUser,
        haTimbratoOggi,
        getAllTimbrature: () => timbrature,
        createMockData,
        reloadTimbrature: async () => {
          await loadTimbrature(true);
          return true;
        },
      }}
    >
      {children}
    </TimbratureContext.Provider>
  );
};

export const useTimbrature = () => {
  const context = useContext(TimbratureContext);
  if (!context) {
    throw new Error('useTimbrature deve essere usato dentro TimbratureProvider');
  }
  return context;
};


