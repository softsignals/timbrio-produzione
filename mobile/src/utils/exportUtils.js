/**
 * Utilità per export dati in vari formati
 */

/**
 * Genera CSV delle timbrature
 */
export const exportToCSV = (timbrature, utente) => {
  if (!timbrature || timbrature.length === 0) {
    return null;
  }

  // Header CSV
  let csv = 'Data,Entrata,Uscita,Pausa Inizio,Pausa Fine,Ore Totali,Tipo\n';

  // Righe dati
  timbrature.forEach(t => {
    csv += `${t.data},`;
    csv += `${t.entrata || ''},`;
    csv += `${t.uscita || ''},`;
    csv += `${t.pausaInizio || ''},`;
    csv += `${t.pausaFine || ''},`;
    csv += `${t.oreTotali || ''},`;
    csv += `${t.tipo}\n`;
  });

  return {
    data: csv,
    filename: `timbrature_${utente.cognome}_${new Date().toISOString().split('T')[0]}.csv`,
    mimeType: 'text/csv'
  };
};

/**
 * Genera report JSON
 */
export const exportToJSON = (timbrature, utente, stats) => {
  const report = {
    utente: {
      id: utente.id,
      nome: `${utente.nome} ${utente.cognome}`,
      email: utente.email,
      badge: utente.badge
    },
    statistiche: stats,
    timbrature: timbrature,
    generato: new Date().toISOString()
  };

  return {
    data: JSON.stringify(report, null, 2),
    filename: `report_${utente.cognome}_${new Date().toISOString().split('T')[0]}.json`,
    mimeType: 'application/json'
  };
};

/**
 * Genera testo formattato per condivisione
 */
export const exportToText = (timbrature, utente, stats) => {
  let text = `REPORT PRESENZE\n`;
  text += `================\n\n`;
  text += `Dipendente: ${utente.nome} ${utente.cognome}\n`;
  text += `Badge: ${utente.badge}\n`;
  text += `Data: ${new Date().toLocaleDateString('it-IT')}\n\n`;
  
  text += `STATISTICHE\n`;
  text += `-----------\n`;
  text += `Giorni lavorati: ${stats.totaleDays}\n`;
  text += `Ore totali: ${stats.totaleOre}h\n`;
  text += `Media giornaliera: ${stats.mediaOreGiorno}h\n`;
  text += `Straordinari: ${stats.straordinari}h\n`;
  text += `Ritardi: ${stats.ritardi}\n\n`;
  
  text += `DETTAGLIO TIMBRATURE\n`;
  text += `--------------------\n`;
  timbrature.forEach(t => {
    text += `${t.data}: ${t.entrata || '--:--'} - ${t.uscita || '--:--'}`;
    if (t.oreTotali) {
      text += ` (${t.oreTotali}h)`;
    }
    text += `\n`;
  });

  return {
    data: text,
    filename: `report_${utente.cognome}_${new Date().toISOString().split('T')[0]}.txt`,
    mimeType: 'text/plain'
  };
};

