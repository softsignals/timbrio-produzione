export type UserRole = 'dipendente' | 'manager' | 'admin' | 'receptionist';

export interface User {
  _id: string;
  nome: string;
  cognome: string;
  email: string;
  ruolo: UserRole;
  badge: string;
  reparto?: string;
  sede?: string;
  telefono?: string;
  dataAssunzione?: string;
  orarioTurno?: {
    entrata: string;
    uscita: string;
    pausaPranzo: string;
  };
  pagaOraria?: number;
  attivo: boolean;
  fotoProfilo?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Timbratura {
  _id: string;
  userId: string;
  data: string;
  entrata: string;
  uscita?: string;
  pausaInizio?: string;
  pausaFine?: string;
  oreTotali?: number;
  qrToken?: string;
  metodoTimbratura: 'qr' | 'manual';
  commessa?: string;
  note?: string;
  approvata: boolean;
  approvataDa?: string;
  dataApprovazione?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Documento {
  _id: string;
  userId: string;
  nome: string;
  tipo: 'Busta Paga' | 'Contratto' | 'Certificato' | 'Comunicazione' | 'Altro';
  categoria?: string;
  filePath: string;
  mimeType: string;
  dimensione: number;
  data: string;
  mese?: string;
  anno?: number;
  importo?: number;
  nuovo: boolean;
  caricatoDa: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface RichiestaFerie {
  _id: string;
  userId: string;
  tipo: 'ferie' | 'permesso';
  dataInizio: string;
  dataFine: string;
  giorni: number;
  motivazione?: string;
  stato: 'in_attesa' | 'approvata' | 'rifiutata';
  approvatoDa?: string;
  dataRisposta?: string;
  noteApprovazione?: string;
  dataRichiesta: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Giustificazione {
  _id: string;
  userId: string;
  data: string;
  motivazione: string;
  tipo: 'mancata_timbratura' | 'ritardo' | 'uscita_anticipata' | 'altro';
  stato: 'in_attesa' | 'approvata' | 'rifiutata';
  approvataDa?: string;
  dataApprovazione?: string;
  rispostaAdmin?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
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

