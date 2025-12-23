import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const FerieContext = createContext();

export const FerieProvider = ({ children }) => {
  const [richieste, setRichieste] = useState([]);
  const [giorniResiduiFerie, setGiorniResiduiFerie] = useState(22);
  const [giorniResiduiPermessi, setGiorniResiduiPermessi] = useState(3);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFerie();
  }, []);

  const loadFerie = async () => {
    try {
      const saved = await AsyncStorage.getItem('@ferie');
      if (saved) {
        const parsed = JSON.parse(saved);
        setRichieste(parsed.richieste || []);
        setGiorniResiduiFerie(parsed.giorniResiduiFerie ?? 22);
        setGiorniResiduiPermessi(parsed.giorniResiduiPermessi ?? 3);
      } else {
        // Dati di esempio iniziali
        const iniziali = {
          richieste: [
            {
              id: '1',
              tipo: 'ferie',
              dataInizio: '2025-08-01',
              dataFine: '2025-08-15',
              giorni: 11,
              stato: 'approvata',
              motivazione: 'Vacanze estive',
              dataRichiesta: '2025-05-10',
            },
            {
              id: '2',
              tipo: 'permesso',
              dataInizio: '2025-03-15',
              dataFine: '2025-03-15',
              giorni: 1,
              stato: 'in_attesa',
              motivazione: 'Visita medica',
              dataRichiesta: '2025-03-01',
            },
            {
              id: '3',
              tipo: 'ferie',
              dataInizio: '2024-12-23',
              dataFine: '2024-12-31',
              giorni: 7,
              stato: 'approvata',
              motivazione: 'Feste natalizie',
              dataRichiesta: '2024-11-15',
            },
          ],
          giorniResiduiFerie: 22,
          giorniResiduiPermessi: 3,
        };
        setRichieste(iniziali.richieste);
        await saveFerie(iniziali.richieste, iniziali.giorniResiduiFerie, iniziali.giorniResiduiPermessi);
      }
    } catch (error) {
      console.error('Errore caricamento ferie:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveFerie = async (req, ferie, permessi) => {
    try {
      await AsyncStorage.setItem(
        '@ferie',
        JSON.stringify({
          richieste: req,
          giorniResiduiFerie: ferie,
          giorniResiduiPermessi: permessi,
        })
      );
    } catch (error) {
      console.error('Errore salvataggio ferie:', error);
    }
  };

  const richiediFeriePermesso = async (richiesta) => {
    const nuovaRichiesta = {
      ...richiesta,
      id: Date.now().toString(),
      stato: 'in_attesa',
      dataRichiesta: new Date().toISOString().split('T')[0],
    };

    const nuoveRichieste = [nuovaRichiesta, ...richieste];
    setRichieste(nuoveRichieste);
    await saveFerie(nuoveRichieste, giorniResiduiFerie, giorniResiduiPermessi);

    return { success: true, richiesta: nuovaRichiesta };
  };

  const getRichiestePerStato = (stato) => {
    return richieste.filter(r => r.stato === stato);
  };

  const getGiorniTotaliRichiesti = () => {
    return richieste
      .filter(r => r.stato === 'approvata')
      .reduce((acc, r) => acc + r.giorni, 0);
  };

  const getCalendarioMarcato = () => {
    const marcati = {};
    richieste.forEach(richiesta => {
      const start = new Date(richiesta.dataInizio);
      const end = new Date(richiesta.dataFine);
      
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const dateString = d.toISOString().split('T')[0];
        marcati[dateString] = {
          marked: true,
          dotColor: richiesta.stato === 'approvata' ? '#10B981' : 
                   richiesta.stato === 'in_attesa' ? '#F59E0B' : '#EF4444',
          tipo: richiesta.tipo,
          stato: richiesta.stato,
        };
      }
    });
    return marcati;
  };

  return (
    <FerieContext.Provider
      value={{
        richieste,
        giorniResiduiFerie,
        giorniResiduiPermessi,
        loading,
        richiediFeriePermesso,
        getRichiestePerStato,
        getGiorniTotaliRichiesti,
        getCalendarioMarcato,
      }}
    >
      {children}
    </FerieContext.Provider>
  );
};

export const useFerie = () => {
  const context = useContext(FerieContext);
  if (!context) {
    throw new Error('useFerie deve essere usato dentro FerieProvider');
  }
  return context;
};

