import { Request } from 'express';

// User Types
export type UserRole = 'dipendente' | 'manager' | 'admin' | 'receptionist';

export interface IUser {
  id: string;
  nome: string;
  cognome: string;
  email: string;
  password?: string;
  ruolo: UserRole;
  badge: string;
  reparto?: string;
  sede?: string;
  telefono?: string;
  data_assunzione?: string;
  orario_turno?: {
    entrata: string;
    uscita: string;
    pausa_pranzo: string;
  };
  paga_oraria?: number;
  attivo: boolean;
  foto_profilo?: string;
  created_at: string;
  updated_at: string;
}

export interface IUserCreate {
  nome: string;
  cognome: string;
  email: string;
  password: string;
  ruolo?: UserRole;
  badge: string;
  reparto?: string;
  sede?: string;
  telefono?: string;
  data_assunzione?: string;
  orario_turno?: {
    entrata: string;
    uscita: string;
    pausa_pranzo: string;
  };
  paga_oraria?: number;
  attivo?: boolean;
}

// Timbratura Types
export type MetodoTimbratura = 'qr' | 'manual';

export interface ITimbratura {
  id: string;
  user_id: string;
  data: string;
  entrata: string;
  uscita?: string;
  pausa_inizio?: string;
  pausa_fine?: string;
  ore_totali?: number;
  qr_token?: string;
  metodo_timbratura: MetodoTimbratura;
  commessa?: string;
  note?: string;
  approvata: boolean;
  approvata_da?: string;
  data_approvazione?: string;
  created_at: string;
  updated_at: string;
  // Join data
  user?: IUser;
}

export interface ITimbraturaCreate {
  user_id: string;
  data: string;
  entrata: string;
  uscita?: string;
  pausa_inizio?: string;
  pausa_fine?: string;
  ore_totali?: number;
  qr_token?: string;
  metodo_timbratura?: MetodoTimbratura;
  commessa?: string;
  note?: string;
  approvata?: boolean;
  approvata_da?: string;
}

// Documento Types
export type TipoDocumento = 'Busta Paga' | 'Contratto' | 'Certificato' | 'Comunicazione' | 'Altro';

export interface IDocumento {
  id: string;
  user_id: string;
  nome: string;
  tipo: TipoDocumento;
  categoria?: string;
  file_path: string;
  mime_type: string;
  dimensione: number;
  data: string;
  mese?: string;
  anno?: number;
  importo?: number;
  nuovo: boolean;
  caricato_da: string;
  created_at: string;
  updated_at: string;
  // Join data
  user?: IUser;
}

export interface IDocumentoCreate {
  user_id: string;
  nome: string;
  tipo: TipoDocumento;
  categoria?: string;
  file_path: string;
  mime_type: string;
  dimensione: number;
  mese?: string;
  anno?: number;
  importo?: number;
  caricato_da: string;
}

// Request con User autenticato
export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    ruolo: UserRole;
  };
}

// Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

// Pagination Types
export interface PaginationParams {
  page: number;
  limit: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    hasMore: boolean;
  };
}

// Comunicazione Types
export type TipoComunicazione = 'Comunicazione' | 'Documento' | 'Circolare' | 'Avviso' | 'Procedura';
export type PrioritaComunicazione = 'alta' | 'normale' | 'bassa';

export interface IComunicazione {
  id: string;
  titolo: string;
  descrizione?: string;
  tipo: TipoComunicazione;
  priorita: PrioritaComunicazione;
  file_path?: string;
  mime_type?: string;
  dimensione?: number;
  destinatari_ruoli?: string[];
  destinatari_reparti?: string[];
  destinatari_sedi?: string[];
  destinatari_utenti?: string[];
  pubblicato: boolean;
  data_pubblicazione: string;
  data_scadenza?: string;
  richiede_conferma: boolean;
  creato_da: string;
  created_at: string;
  updated_at: string;
  // Join data
  creatore?: IUser;
  letture?: IComunicazioneLettura[];
  letta?: boolean; // Per l'utente corrente
}

export interface IComunicazioneCreate {
  titolo: string;
  descrizione?: string;
  tipo: TipoComunicazione;
  priorita?: PrioritaComunicazione;
  file_path?: string;
  mime_type?: string;
  dimensione?: number;
  destinatari_ruoli?: string[];
  destinatari_reparti?: string[];
  destinatari_sedi?: string[];
  destinatari_utenti?: string[];
  pubblicato?: boolean;
  data_scadenza?: string;
  richiede_conferma?: boolean;
  creato_da: string;
}

export interface IComunicazioneLettura {
  id: string;
  comunicazione_id: string;
  user_id: string;
  letto_il: string;
  // Join data
  user?: IUser;
}