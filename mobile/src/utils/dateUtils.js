/**
 * Utilità per la gestione delle date e degli orari
 */

/**
 * Formatta una data nel formato italiano (gg/mm/aaaa)
 */
export const formatDate = (date) => {
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
};

/**
 * Formatta un orario nel formato HH:MM
 */
export const formatTime = (time) => {
  if (!time) return '--:--';
  return time.substring(0, 5);
};

/**
 * Calcola le ore totali tra entrata e uscita, sottraendo la pausa
 */
export const calcolaOreTotali = (entrata, uscita, pausaInizio = null, pausaFine = null) => {
  if (!entrata || !uscita) return 0;
  
  const entrataDate = new Date(`1970-01-01T${entrata}`);
  const uscitaDate = new Date(`1970-01-01T${uscita}`);
  let minutiTotali = (uscitaDate - entrataDate) / (1000 * 60);
  
  if (pausaInizio && pausaFine) {
    const pausaInizioDate = new Date(`1970-01-01T${pausaInizio}`);
    const pausaFineDate = new Date(`1970-01-01T${pausaFine}`);
    const minutiPausa = (pausaFineDate - pausaInizioDate) / (1000 * 60);
    minutiTotali -= minutiPausa;
  }
  
  return (minutiTotali / 60).toFixed(2);
};

/**
 * Ottiene la data corrente nel formato YYYY-MM-DD
 */
export const getToday = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Ottiene l'ora corrente nel formato HH:MM:SS
 */
export const getCurrentTime = () => {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
};

/**
 * Calcola il ritardo rispetto all'orario previsto
 */
export const calcolaRitardo = (orarioEffettivo, orarioPrevisto) => {
  if (!orarioEffettivo || !orarioPrevisto) return 0;
  
  const effettivo = new Date(`1970-01-01T${orarioEffettivo}`);
  const previsto = new Date(`1970-01-01T${orarioPrevisto}`);
  const differenza = (effettivo - previsto) / (1000 * 60);
  
  return differenza > 0 ? differenza : 0;
};

/**
 * Calcola gli straordinari
 */
export const calcolaStraordinari = (oreTotali, orePreviste) => {
  const straordinari = oreTotali - orePreviste;
  return straordinari > 0 ? straordinari.toFixed(2) : 0;
};

/**
 * Ottiene il nome del giorno della settimana
 */
export const getNomeGiorno = (date) => {
  const giorni = ['Domenica', 'Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato'];
  const d = new Date(date);
  return giorni[d.getDay()];
};

/**
 * Ottiene il nome del mese
 */
export const getNomeMese = (date) => {
  const mesi = [
    'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
    'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'
  ];
  const d = new Date(date);
  return mesi[d.getMonth()];
};

/**
 * Ottiene l'inizio e la fine della settimana corrente
 */
export const getCurrentWeekRange = () => {
  const oggi = new Date();
  const giornoSettimana = oggi.getDay();
  const diff = giornoSettimana === 0 ? -6 : 1 - giornoSettimana;
  
  const lunedi = new Date(oggi);
  lunedi.setDate(oggi.getDate() + diff);
  
  const domenica = new Date(lunedi);
  domenica.setDate(lunedi.getDate() + 6);
  
  return {
    start: lunedi.toISOString().split('T')[0],
    end: domenica.toISOString().split('T')[0]
  };
};

/**
 * Ottiene l'inizio e la fine del mese corrente
 */
export const getCurrentMonthRange = () => {
  const oggi = new Date();
  const primoGiorno = new Date(oggi.getFullYear(), oggi.getMonth(), 1);
  const ultimoGiorno = new Date(oggi.getFullYear(), oggi.getMonth() + 1, 0);
  
  return {
    start: primoGiorno.toISOString().split('T')[0],
    end: ultimoGiorno.toISOString().split('T')[0]
  };
};

