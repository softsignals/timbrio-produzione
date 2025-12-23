/**
 * Utilità per calcoli statistici e reportistica
 */

import { calcolaOreTotali, calcolaRitardo, calcolaStraordinari } from './dateUtils';

/**
 * Calcola statistiche per un array di timbrature
 */
export const calcolaStatistiche = (timbrature, oreLavorativePreviste = 8) => {
  if (!timbrature || timbrature.length === 0) {
    return {
      totaleDays: 0,
      totaleOre: 0,
      mediaOreGiorno: 0,
      straordinari: 0,
      ritardi: 0,
      assenze: 0
    };
  }

  const timbratureCompletate = timbrature.filter(t => t.tipo === 'completata');
  
  const totaleOre = timbratureCompletate.reduce((sum, t) => {
    return sum + parseFloat(t.oreTotali || 0);
  }, 0);

  const ritardi = timbratureCompletate.filter(t => {
    if (t.orarioTurno && t.entrata) {
      return calcolaRitardo(t.entrata, t.orarioTurno.entrata) > 5; // Tolleranza 5 min
    }
    return false;
  }).length;

  const straordinari = timbratureCompletate.reduce((sum, t) => {
    const oreTotali = parseFloat(t.oreTotali || 0);
    return sum + parseFloat(calcolaStraordinari(oreTotali, oreLavorativePreviste));
  }, 0);

  return {
    totaleDays: timbratureCompletate.length,
    totaleOre: totaleOre.toFixed(2),
    mediaOreGiorno: timbratureCompletate.length > 0 
      ? (totaleOre / timbratureCompletate.length).toFixed(2) 
      : 0,
    straordinari: straordinari.toFixed(2),
    ritardi,
    assenze: 0 // Da implementare con logica calendario
  };
};

/**
 * Raggruppa timbrature per settimana
 */
export const raggruppaPerSettimana = (timbrature) => {
  const gruppi = {};
  
  timbrature.forEach(t => {
    const data = new Date(t.data);
    const anno = data.getFullYear();
    const settimana = getWeekNumber(data);
    const chiave = `${anno}-W${settimana}`;
    
    if (!gruppi[chiave]) {
      gruppi[chiave] = [];
    }
    gruppi[chiave].push(t);
  });
  
  return gruppi;
};

/**
 * Raggruppa timbrature per mese
 */
export const raggruppaPerMese = (timbrature) => {
  const gruppi = {};
  
  timbrature.forEach(t => {
    const data = new Date(t.data);
    const anno = data.getFullYear();
    const mese = data.getMonth() + 1;
    const chiave = `${anno}-${String(mese).padStart(2, '0')}`;
    
    if (!gruppi[chiave]) {
      gruppi[chiave] = [];
    }
    gruppi[chiave].push(t);
  });
  
  return gruppi;
};

/**
 * Ottiene il numero della settimana nell'anno
 */
const getWeekNumber = (date) => {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
};

/**
 * Genera report mensile
 */
export const generaReportMensile = (timbrature, oreLavorativePreviste = 8) => {
  const gruppiMese = raggruppaPerMese(timbrature);
  const reports = [];
  
  Object.keys(gruppiMese).sort().reverse().forEach(mese => {
    const timbratureMese = gruppiMese[mese];
    const stats = calcolaStatistiche(timbratureMese, oreLavorativePreviste);
    
    reports.push({
      periodo: mese,
      ...stats,
      timbrature: timbratureMese
    });
  });
  
  return reports;
};

