/**
 * Rate limiter globale per prevenire troppe richieste simultanee
 */

class RateLimiter {
  constructor() {
    this.lastRequestTime = {};
    // Intervalli più brevi per operazioni critiche, più lunghi per polling
    this.endpointIntervals = {
      '/timbrature/qr-scan': 300, // QR scan: molto breve per permettere scansioni rapide
      '/timbrature/me': 1000, // Get timbrature: 1 secondo
      '/timbrature/recent-entries': 2000, // Recent entries: 2 secondi
      '/turni/attivi': 2000, // Turni attivi: 2 secondi
      '/turni': 2000, // Turni: 2 secondi
      'default': 500, // Default: 500ms per altre richieste
    };
    this.pendingRequests = new Map(); // Tiene traccia delle richieste in corso
    this.requestTimeouts = new Map(); // Timeout per rilasciare automaticamente i lock
  }

  /**
   * Ottiene l'intervallo minimo per un endpoint
   * @param {string} endpoint - L'endpoint da chiamare
   * @returns {number} - L'intervallo minimo in millisecondi
   */
  getMinInterval(endpoint) {
    // Controlla se c'è un intervallo specifico per questo endpoint
    for (const [key, interval] of Object.entries(this.endpointIntervals)) {
      if (endpoint.includes(key) && key !== 'default') {
        return interval;
      }
    }
    return this.endpointIntervals.default;
  }

  /**
   * Controlla se una richiesta può essere effettuata
   * @param {string} endpoint - L'endpoint da chiamare (es: '/api/timbrature/me')
   * @returns {boolean} - true se la richiesta può essere fatta, false altrimenti
   */
  canMakeRequest(endpoint) {
    const now = Date.now();
    const lastTime = this.lastRequestTime[endpoint] || 0;
    const timeSinceLastRequest = now - lastTime;
    const minInterval = this.getMinInterval(endpoint);

    // Se c'è già una richiesta in corso per questo endpoint, blocca
    if (this.pendingRequests.has(endpoint)) {
      // Per endpoint critici come QR scan, cancella il lock precedente se è troppo vecchio (>5s)
      const pendingSince = this.pendingRequests.get(endpoint);
      if (now - pendingSince > 5000) {
        console.warn(`[RateLimiter] Lock scaduto per ${endpoint}, rilasciato automaticamente`);
        this.endRequest(endpoint);
      } else {
        return false;
      }
    }

    // Se è passato meno del minimo intervallo, blocca solo per operazioni non critiche
    if (timeSinceLastRequest < minInterval && minInterval >= 1000) {
      // Per operazioni con intervallo >= 1s, applica il rate limit
      return false;
    }

    return true;
  }

  /**
   * Registra l'inizio di una richiesta
   * @param {string} endpoint - L'endpoint chiamato
   */
  startRequest(endpoint) {
    const now = Date.now();
    this.pendingRequests.set(endpoint, now);
    this.lastRequestTime[endpoint] = now;
    
    // Imposta un timeout automatico per rilasciare il lock dopo 10 secondi (safety net)
    if (this.requestTimeouts.has(endpoint)) {
      clearTimeout(this.requestTimeouts.get(endpoint));
    }
    const timeout = setTimeout(() => {
      console.warn(`[RateLimiter] Timeout automatico per ${endpoint}, rilasciato lock`);
      this.endRequest(endpoint);
    }, 10000);
    this.requestTimeouts.set(endpoint, timeout);
  }

  /**
   * Registra la fine di una richiesta
   * @param {string} endpoint - L'endpoint completato
   */
  endRequest(endpoint) {
    this.pendingRequests.delete(endpoint);
    if (this.requestTimeouts.has(endpoint)) {
      clearTimeout(this.requestTimeouts.get(endpoint));
      this.requestTimeouts.delete(endpoint);
    }
  }

  /**
   * Estrae l'endpoint da una configurazione axios
   * @param {object} config - Configurazione axios
   * @returns {string} - L'endpoint normalizzato
   */
  getEndpoint(config) {
    const url = config.url || '';
    // Rimuovi i parametri query per normalizzare
    const endpoint = url.split('?')[0];
    // Rimuovi il baseURL se presente
    const baseURL = config.baseURL || '';
    let normalized = endpoint;
    if (baseURL && endpoint.startsWith(baseURL)) {
      normalized = endpoint.substring(baseURL.length);
    }
    // Normalizza per gruppo (tutti gli endpoint /api/turni/attivi sono considerati lo stesso)
    return normalized;
  }
}

// Istanza singleton
const rateLimiter = new RateLimiter();

export default rateLimiter;

