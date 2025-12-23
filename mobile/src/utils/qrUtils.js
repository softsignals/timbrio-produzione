/**
 * Utility per gestione QR Code e token
 */

/**
 * Verifica se siamo in una fascia oraria di timbratura (8-9 o 17-18)
 * @returns {boolean}
 */
export const isTimbraturaTimeWindow = () => {
  const now = new Date();
  const hour = now.getHours();
  return (hour >= 8 && hour < 9) || (hour >= 17 && hour < 18);
};

/**
 * Ottiene l'intervallo di refresh del token in base all'orario
 * @returns {number} Intervallo in millisecondi
 */
export const getTokenRefreshInterval = () => {
  if (isTimbraturaTimeWindow()) {
    return 60000; // 1 minuto durante fasce orarie
  }
  return 300000; // 5 minuti altrimenti
};

/**
 * Valida un token QR
 * @param {string} token - Token da validare
 * @param {number} timestamp - Timestamp del token
 * @returns {boolean}
 */
export const isQRTokenValid = (token, timestamp) => {
  if (!token || !timestamp) return false;
  
  // Se è un token mock, è sempre valido
  if (token.startsWith('mock_')) {
    return true;
  }
  
  const now = Date.now();
  const refreshInterval = getTokenRefreshInterval();
  const maxAge = refreshInterval * 2; // Permette un margine di 2 intervalli
  
  return (now - timestamp) < maxAge;
};

/**
 * Genera dati per QR code
 * @param {string} token - Token da codificare
 * @param {number} timestamp - Timestamp del token
 * @param {string} action - Azione da eseguire: 'timbratura' o 'turno'
 * @param {string} turnoId - ID del turno (se action è 'turno')
 * @returns {string} JSON stringificato
 */
export const generateQRData = (token, timestamp, action = 'timbratura', turnoId = null) => {
  return JSON.stringify({
    token,
    timestamp,
    type: 'timbrio_qr',
    action, // 'timbratura' o 'turno'
    turnoId, // ID turno se action è 'turno'
  });
};

/**
 * Decodifica dati QR
 * @param {string} qrData - Dati QR da decodificare
 * @returns {object|null}
 */
export const decodeQRData = (qrData) => {
  try {
    const data = JSON.parse(qrData);
    if (data.type === 'timbrio_qr' && data.token && data.timestamp) {
      return {
        token: data.token,
        timestamp: data.timestamp,
        action: data.action || 'timbratura', // Default a timbratura per retrocompatibilità
        turnoId: data.turnoId || null,
      };
    }
    return null;
  } catch (error) {
    console.error('Errore decodifica QR:', error);
    return null;
  }
};

/**
 * Ottiene messaggio di benvenuto in base all'orario
 * @returns {string}
 */
export const getWelcomeMessage = () => {
  const now = new Date();
  const hour = now.getHours();
  
  if (hour >= 5 && hour < 12) {
    return 'Buongiorno! 👋';
  } else if (hour >= 12 && hour < 18) {
    return 'Buon pomeriggio! ☀️';
  } else if (hour >= 18 && hour < 22) {
    return 'Buona sera! 🌆';
  } else {
    return 'Buona notte! 🌙';
  }
};

/**
 * Ottiene messaggio di saluto in base all'orario
 * @returns {string}
 */
export const getGreetingMessage = () => {
  const now = new Date();
  const hour = now.getHours();
  
  if (hour >= 8 && hour < 13) {
    return 'Buona giornata di lavoro! 💼';
  } else if (hour >= 17 && hour < 19) {
    return 'Buon riposo! 🏠';
  } else {
    return 'Buon lavoro! ⚡';
  }
};

