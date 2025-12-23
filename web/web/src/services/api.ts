import axios, { AxiosInstance, AxiosError } from 'axios';
import { ApiResponse } from '../types';
import type {
  User,
  Timbratura,
  RichiestaFerie,
  Giustificazione,
  Documento,
} from '../types';

// Configurazione API URL
// Usa la variabile d'ambiente VITE_API_BASE_URL o default localhost
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

console.log('🔗 API Base URL:', API_BASE_URL);

// Crea istanza Axios
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor per aggiungere il token JWT
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor per gestire errori
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Token scaduto o non valido - fai logout
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Helper per gestire errori API
export const handleAPIError = (error: unknown): ApiResponse => {
  if (axios.isAxiosError(error)) {
    if (error.response) {
      return {
        success: false,
        error: (error.response.data as any)?.error || 'Errore del server',
      };
    } else if (error.request) {
      return {
        success: false,
        error: 'Impossibile connettersi al server. Verifica la connessione.',
      };
    }
  }
  return {
    success: false,
    error: 'Errore sconosciuto',
  };
};

// ============================================
// AUTH API
// ============================================

export const authAPI = {
  login: async (email: string, password: string): Promise<ApiResponse<{ token: string; user: User }>> => {
    try {
      const response = await api.post('/auth/login', { email, password });
      if (response.data.success && response.data.data.token) {
        localStorage.setItem('token', response.data.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.data.user));
      }
      return response.data;
    } catch (error) {
      return handleAPIError(error);
    }
  },

  logout: async (): Promise<void> => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Errore logout:', error);
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  },

  getMe: async (): Promise<ApiResponse<User>> => {
    try {
      const response = await api.get('/auth/me');
      return response.data;
    } catch (error) {
      return handleAPIError(error);
    }
  },

  resetPassword: async (userId: string, newPassword: string): Promise<ApiResponse> => {
    try {
      const response = await api.post('/auth/reset-password', { userId, newPassword });
      return response.data;
    } catch (error) {
      return handleAPIError(error);
    }
  },
};

// ============================================
// TIMBRATURE API
// ============================================

export const timbratureAPI = {
  timbraEntrata: async (): Promise<ApiResponse<Timbratura>> => {
    try {
      const response = await api.post('/timbrature/entrata', {});
      return response.data;
    } catch (error) {
      return handleAPIError(error);
    }
  },

  timbraUscita: async (): Promise<ApiResponse<Timbratura>> => {
    try {
      const response = await api.post('/timbrature/uscita', {});
      return response.data;
    } catch (error) {
      return handleAPIError(error);
    }
  },

  iniziaPausa: async (): Promise<ApiResponse<Timbratura>> => {
    try {
      const response = await api.post('/timbrature/pausa/inizio', {});
      return response.data;
    } catch (error) {
      return handleAPIError(error);
    }
  },

  terminaPausa: async (): Promise<ApiResponse<Timbratura>> => {
    try {
      const response = await api.post('/timbrature/pausa/fine', {});
      return response.data;
    } catch (error) {
      return handleAPIError(error);
    }
  },

  getMyTimbrature: async (page = 1, limit = 30): Promise<ApiResponse<Timbratura[]>> => {
    try {
      const response = await api.get('/timbrature/me', { params: { page, limit } });
      return response.data;
    } catch (error) {
      return handleAPIError(error);
    }
  },

  getAllTimbrature: async (filters: Record<string, any> = {}): Promise<ApiResponse<Timbratura[]>> => {
    try {
      const response = await api.get('/timbrature/all', { params: filters });
      return response.data;
    } catch (error) {
      return handleAPIError(error);
    }
  },

  updateTimbratura: async (id: string, updates: Partial<Timbratura>): Promise<ApiResponse<Timbratura>> => {
    try {
      const response = await api.put(`/timbrature/${id}`, updates);
      return response.data;
    } catch (error) {
      return handleAPIError(error);
    }
  },

  deleteTimbratura: async (id: string): Promise<ApiResponse> => {
    try {
      const response = await api.delete(`/timbrature/${id}`);
      return response.data;
    } catch (error) {
      return handleAPIError(error);
    }
  },

  getQRToken: async (): Promise<ApiResponse<{ token: string; expiresAt: string }>> => {
    try {
      const response = await api.get('/timbrature/qr-token');
      return response.data;
    } catch (error) {
      return handleAPIError(error);
    }
  },

  timbraDaQR: async (qrToken: string): Promise<ApiResponse<Timbratura>> => {
    try {
      const response = await api.post('/timbrature/qr-scan', { qrToken });
      return response.data;
    } catch (error) {
      return handleAPIError(error);
    }
  },

  getRecentEntries: async (limit = 10): Promise<ApiResponse<Timbratura[]>> => {
    try {
      const response = await api.get('/timbrature/recent-entries', { params: { limit } });
      return response.data;
    } catch (error) {
      return handleAPIError(error);
    }
  },

  exportTimbrature: async (format: 'txt' | 'csv'): Promise<Blob> => {
    const response = await api.get('/timbrature/export', {
      params: { format },
      responseType: 'blob',
    });
    return response.data;
  },
};

// ============================================
// FERIE API
// ============================================

export const ferieAPI = {
  creaRichiesta: async (richiestaData: Omit<RichiestaFerie, '_id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<RichiestaFerie>> => {
    try {
      const response = await api.post('/ferie/richiesta', richiestaData);
      return response.data;
    } catch (error) {
      return handleAPIError(error);
    }
  },

  getMyRichieste: async (): Promise<ApiResponse<RichiestaFerie[]>> => {
    try {
      const response = await api.get('/ferie/me');
      return response.data;
    } catch (error) {
      return handleAPIError(error);
    }
  },

  getAllRichieste: async (filters: Record<string, any> = {}): Promise<ApiResponse<RichiestaFerie[]>> => {
    try {
      const response = await api.get('/ferie/all', { params: filters });
      return response.data;
    } catch (error) {
      return handleAPIError(error);
    }
  },

  approvaRichiesta: async (id: string, noteAdmin?: string): Promise<ApiResponse<RichiestaFerie>> => {
    try {
      const response = await api.put(`/ferie/${id}/approva`, { noteAdmin });
      return response.data;
    } catch (error) {
      return handleAPIError(error);
    }
  },

  rifiutaRichiesta: async (id: string, noteAdmin?: string): Promise<ApiResponse<RichiestaFerie>> => {
    try {
      const response = await api.put(`/ferie/${id}/rifiuta`, { noteAdmin });
      return response.data;
    } catch (error) {
      return handleAPIError(error);
    }
  },

  getCalendario: async (anno: number, mese: number): Promise<ApiResponse<any>> => {
    try {
      const response = await api.get('/ferie/calendario', { params: { anno, mese } });
      return response.data;
    } catch (error) {
      return handleAPIError(error);
    }
  },
};

// ============================================
// GIUSTIFICAZIONI API
// ============================================

export const giustificazioniAPI = {
  creaGiustificazione: async (giustificazioneData: Omit<Giustificazione, '_id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<Giustificazione>> => {
    try {
      const response = await api.post('/giustificazioni', giustificazioneData);
      return response.data;
    } catch (error) {
      return handleAPIError(error);
    }
  },

  getMyGiustificazioni: async (): Promise<ApiResponse<Giustificazione[]>> => {
    try {
      const response = await api.get('/giustificazioni/me');
      return response.data;
    } catch (error) {
      return handleAPIError(error);
    }
  },

  getAllGiustificazioni: async (filters: Record<string, any> = {}): Promise<ApiResponse<Giustificazione[]>> => {
    try {
      const response = await api.get('/giustificazioni/all', { params: filters });
      return response.data;
    } catch (error) {
      return handleAPIError(error);
    }
  },

  approvaGiustificazione: async (id: string, rispostaAdmin?: string): Promise<ApiResponse<Giustificazione>> => {
    try {
      const response = await api.put(`/giustificazioni/${id}/approva`, { rispostaAdmin });
      return response.data;
    } catch (error) {
      return handleAPIError(error);
    }
  },

  rifiutaGiustificazione: async (id: string, rispostaAdmin?: string): Promise<ApiResponse<Giustificazione>> => {
    try {
      const response = await api.put(`/giustificazioni/${id}/rifiuta`, { rispostaAdmin });
      return response.data;
    } catch (error) {
      return handleAPIError(error);
    }
  },
};

// ============================================
// USERS API (Admin)
// ============================================

export const usersAPI = {
  getAllUsers: async (filters: Record<string, any> = {}): Promise<ApiResponse<User[]>> => {
    try {
      const response = await api.get('/users', { params: filters });
      return response.data;
    } catch (error) {
      return handleAPIError(error);
    }
  },

  getUserById: async (id: string): Promise<ApiResponse<User>> => {
    try {
      const response = await api.get(`/users/${id}`);
      return response.data;
    } catch (error) {
      return handleAPIError(error);
    }
  },

  createUser: async (userData: Omit<User, '_id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<User>> => {
    try {
      const response = await api.post('/users', userData);
      return response.data;
    } catch (error) {
      return handleAPIError(error);
    }
  },

  updateUser: async (id: string, updates: Partial<User>): Promise<ApiResponse<User>> => {
    try {
      const response = await api.put(`/users/${id}`, updates);
      return response.data;
    } catch (error) {
      return handleAPIError(error);
    }
  },

  deleteUser: async (id: string): Promise<ApiResponse> => {
    try {
      const response = await api.delete(`/users/${id}`);
      return response.data;
    } catch (error) {
      return handleAPIError(error);
    }
  },

  toggleUserStatus: async (id: string): Promise<ApiResponse<User>> => {
    try {
      const response = await api.patch(`/users/${id}/toggle-status`);
      return response.data;
    } catch (error) {
      return handleAPIError(error);
    }
  },

  getUserStats: async (): Promise<ApiResponse<any>> => {
    try {
      const response = await api.get('/users/stats');
      return response.data;
    } catch (error) {
      return handleAPIError(error);
    }
  },
};

export default api;

