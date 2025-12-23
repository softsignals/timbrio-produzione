import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import bcrypt from 'bcryptjs';

// ============================================
// TIMBRIO DEMO - API Service con Supabase Diretto
// ============================================

// Configurazione Supabase
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.EXPO_PUBLIC_SUPABASE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.warn('⚠️ Variabili Supabase non configurate!');
}

// Client Supabase
const supabase = createClient(SUPABASE_URL || '', SUPABASE_KEY || '', {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// ============================================
// AUTH API
// ============================================

export const authAPI = {
  login: async (email, password) => {
    try {
      // Trova utente per email
      const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email.toLowerCase())
        .single();

      if (error || !user) {
        return { success: false, error: 'Credenziali non valide' };
      }

      // Verifica password
      const isValid = await bcrypt.compare(password, user.password);
      if (!isValid) {
        return { success: false, error: 'Credenziali non valide' };
      }

      // Verifica utente attivo
      if (!user.attivo) {
        return { success: false, error: 'Account disattivato' };
      }

      // Genera un token semplice (in produzione usare JWT)
      const token = `${user.id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Salva token e user
      await AsyncStorage.setItem('@token', token);
      
      // Rimuovi password prima di salvare
      const { password: _, ...userWithoutPassword } = user;
      await AsyncStorage.setItem('@user', JSON.stringify(userWithoutPassword));

      return {
        success: true,
        message: 'Login effettuato con successo',
        data: {
          user: userWithoutPassword,
          token,
        },
      };
    } catch (error) {
      console.error('Errore login:', error);
      return { success: false, error: error.message || 'Errore durante il login' };
    }
  },

  logout: async () => {
    await AsyncStorage.removeItem('@token');
    await AsyncStorage.removeItem('@user');
  },

  getMe: async () => {
    try {
      const userStr = await AsyncStorage.getItem('@user');
      if (!userStr) {
        return { success: false, error: 'Non autenticato' };
      }
      return { success: true, data: JSON.parse(userStr) };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  updateProfile: async (updates) => {
    try {
      const userStr = await AsyncStorage.getItem('@user');
      if (!userStr) {
        return { success: false, error: 'Non autenticato' };
      }
      const user = JSON.parse(userStr);

      const { data, error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single();

      if (error) throw error;

      // Aggiorna user locale
      const { password: _, ...userWithoutPassword } = data;
      await AsyncStorage.setItem('@user', JSON.stringify(userWithoutPassword));

      return { success: true, data: userWithoutPassword };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  changePassword: async (currentPassword, newPassword) => {
    try {
      const userStr = await AsyncStorage.getItem('@user');
      if (!userStr) {
        return { success: false, error: 'Non autenticato' };
      }
      const user = JSON.parse(userStr);

      // Verifica password attuale
      const { data: userData } = await supabase
        .from('users')
        .select('password')
        .eq('id', user.id)
        .single();

      const isValid = await bcrypt.compare(currentPassword, userData.password);
      if (!isValid) {
        return { success: false, error: 'Password attuale non corretta' };
      }

      // Hash nuova password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(newPassword, salt);

      // Aggiorna
      const { error } = await supabase
        .from('users')
        .update({ password: hashedPassword })
        .eq('id', user.id);

      if (error) throw error;

      return { success: true, message: 'Password aggiornata' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },
};

// ============================================
// TIMBRATURE API
// ============================================

export const timbratureAPI = {
  getMyTimbrature: async () => {
    try {
      const userStr = await AsyncStorage.getItem('@user');
      if (!userStr) return { success: false, error: 'Non autenticato' };
      const user = JSON.parse(userStr);

      const { data, error } = await supabase
        .from('timbrature')
        .select('*')
        .eq('user_id', user.id)
        .order('data', { ascending: false });

      if (error) throw error;
      return { success: true, data: data || [] };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  getCurrentTimbratura: async () => {
    try {
      const userStr = await AsyncStorage.getItem('@user');
      if (!userStr) return { success: false, error: 'Non autenticato' };
      const user = JSON.parse(userStr);

      const oggi = new Date().toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('timbrature')
        .select('*')
        .eq('user_id', user.id)
        .eq('data', oggi)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return { success: true, data: data || null };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  timbraEntrata: async (options = {}) => {
    try {
      const userStr = await AsyncStorage.getItem('@user');
      if (!userStr) return { success: false, error: 'Non autenticato' };
      const user = JSON.parse(userStr);

      const oggi = new Date().toISOString().split('T')[0];
      const now = new Date();
      const oraEntrata = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

      // Verifica se esiste già
      const { data: existing } = await supabase
        .from('timbrature')
        .select('id')
        .eq('user_id', user.id)
        .eq('data', oggi)
        .single();

      if (existing) {
        return { success: false, error: 'Entrata già registrata per oggi' };
      }

      const { data, error } = await supabase
        .from('timbrature')
        .insert({
          user_id: user.id,
          data: oggi,
          entrata: oraEntrata,
          metodo_timbratura: options.metodo || 'manual',
          approvata: true,
        })
        .select()
        .single();

      if (error) throw error;
      return { success: true, message: 'Entrata registrata', data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  timbraUscita: async () => {
    try {
      const userStr = await AsyncStorage.getItem('@user');
      if (!userStr) return { success: false, error: 'Non autenticato' };
      const user = JSON.parse(userStr);

      const oggi = new Date().toISOString().split('T')[0];
      const now = new Date();
      const oraUscita = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

      // Trova timbratura di oggi
      const { data: timbratura, error: findError } = await supabase
        .from('timbrature')
        .select('*')
        .eq('user_id', user.id)
        .eq('data', oggi)
        .single();

      if (findError || !timbratura) {
        return { success: false, error: 'Nessuna entrata registrata per oggi' };
      }

      if (timbratura.uscita) {
        return { success: false, error: 'Uscita già registrata' };
      }

      // Calcola ore totali
      const entrataDate = new Date(`2000-01-01T${timbratura.entrata}`);
      const uscitaDate = new Date(`2000-01-01T${oraUscita}`);
      let oreTotali = (uscitaDate.getTime() - entrataDate.getTime()) / (1000 * 60 * 60);

      if (timbratura.pausa_inizio && timbratura.pausa_fine) {
        const pausaInizio = new Date(`2000-01-01T${timbratura.pausa_inizio}`);
        const pausaFine = new Date(`2000-01-01T${timbratura.pausa_fine}`);
        oreTotali -= (pausaFine.getTime() - pausaInizio.getTime()) / (1000 * 60 * 60);
      }

      const { data, error } = await supabase
        .from('timbrature')
        .update({
          uscita: oraUscita,
          ore_totali: Math.max(0, oreTotali).toFixed(2),
        })
        .eq('id', timbratura.id)
        .select()
        .single();

      if (error) throw error;
      return { success: true, message: 'Uscita registrata', data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  registraPausa: async (tipo) => {
    try {
      const userStr = await AsyncStorage.getItem('@user');
      if (!userStr) return { success: false, error: 'Non autenticato' };
      const user = JSON.parse(userStr);

      const oggi = new Date().toISOString().split('T')[0];
      const now = new Date();
      const ora = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

      const { data: timbratura } = await supabase
        .from('timbrature')
        .select('*')
        .eq('user_id', user.id)
        .eq('data', oggi)
        .single();

      if (!timbratura) {
        return { success: false, error: 'Nessuna timbratura trovata' };
      }

      const updateData = tipo === 'inizio' 
        ? { pausa_inizio: ora }
        : { pausa_fine: ora };

      const { data, error } = await supabase
        .from('timbrature')
        .update(updateData)
        .eq('id', timbratura.id)
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  getAllTimbrature: async (filters = {}) => {
    try {
      let query = supabase
        .from('timbrature')
        .select('*, user:users(nome, cognome, badge)')
        .order('data', { ascending: false });

      if (filters.startDate && filters.endDate) {
        query = query.gte('data', filters.startDate).lte('data', filters.endDate);
      }

      if (filters.userId) {
        query = query.eq('user_id', filters.userId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return { success: true, data: data || [] };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  getTodayTimbrature: async () => {
    try {
      const oggi = new Date().toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('timbrature')
        .select('*, user:users(nome, cognome, badge)')
        .eq('data', oggi)
        .order('entrata', { ascending: false });

      if (error) throw error;
      return { success: true, data: data || [] };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Per receptionist
  getQRToken: async () => {
    const timestamp = Date.now();
    const token = `qr_${timestamp}_${Math.random().toString(36).substr(2, 9)}`;
    return { success: true, data: { token, timestamp } };
  },

  getRecentEntries: async (limit = 10) => {
    try {
      const oggi = new Date().toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('timbrature')
        .select('*, user:users(nome, cognome, badge)')
        .eq('data', oggi)
        .order('entrata', { ascending: false })
        .limit(limit);

      if (error) throw error;

      const entries = (data || []).map(t => ({
        userId: t.user_id,
        nome: t.user?.nome,
        cognome: t.user?.cognome,
        badge: t.user?.badge,
        entrata: t.entrata,
        uscita: t.uscita,
      }));

      return { success: true, data: entries };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  timbraturaQR: async (badge, tipo) => {
    try {
      // Trova utente per badge
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('badge', badge)
        .single();

      if (userError || !user) {
        return { success: false, error: 'Badge non trovato' };
      }

      const oggi = new Date().toISOString().split('T')[0];
      const now = new Date();
      const ora = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

      if (tipo === 'entrata') {
        const { data: existing } = await supabase
          .from('timbrature')
          .select('id')
          .eq('user_id', user.id)
          .eq('data', oggi)
          .single();

        if (existing) {
          return { 
            success: false, 
            error: 'Entrata già registrata',
            user: { nome: user.nome, cognome: user.cognome }
          };
        }

        const { data, error } = await supabase
          .from('timbrature')
          .insert({
            user_id: user.id,
            data: oggi,
            entrata: ora,
            metodo_timbratura: 'qr',
            approvata: true,
          })
          .select()
          .single();

        if (error) throw error;

        return { 
          success: true, 
          message: `Entrata registrata per ${user.nome} ${user.cognome}`,
          data,
          user: { nome: user.nome, cognome: user.cognome }
        };
      } else {
        const { data: timbratura } = await supabase
          .from('timbrature')
          .select('*')
          .eq('user_id', user.id)
          .eq('data', oggi)
          .single();

        if (!timbratura) {
          return { 
            success: false, 
            error: 'Nessuna entrata registrata',
            user: { nome: user.nome, cognome: user.cognome }
          };
        }

        if (timbratura.uscita) {
          return { 
            success: false, 
            error: 'Uscita già registrata',
            user: { nome: user.nome, cognome: user.cognome }
          };
        }

        // Calcola ore
        const entrataDate = new Date(`2000-01-01T${timbratura.entrata}`);
        const uscitaDate = new Date(`2000-01-01T${ora}`);
        const oreTotali = (uscitaDate.getTime() - entrataDate.getTime()) / (1000 * 60 * 60);

        const { data, error } = await supabase
          .from('timbrature')
          .update({
            uscita: ora,
            ore_totali: Math.max(0, oreTotali).toFixed(2),
          })
          .eq('id', timbratura.id)
          .select()
          .single();

        if (error) throw error;

        return { 
          success: true, 
          message: `Uscita registrata per ${user.nome} ${user.cognome}`,
          data,
          user: { nome: user.nome, cognome: user.cognome }
        };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  },
};

// ============================================
// DOCUMENTI API
// ============================================

export const documentiAPI = {
  getMyDocumenti: async () => {
    try {
      const userStr = await AsyncStorage.getItem('@user');
      if (!userStr) return { success: false, error: 'Non autenticato' };
      const user = JSON.parse(userStr);

      const { data, error } = await supabase
        .from('documenti')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { success: true, data: data || [] };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  markAsRead: async (id) => {
    try {
      const { error } = await supabase
        .from('documenti')
        .update({ nuovo: false })
        .eq('id', id);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  countNew: async () => {
    try {
      const userStr = await AsyncStorage.getItem('@user');
      if (!userStr) return { success: false, data: { count: 0 } };
      const user = JSON.parse(userStr);

      const { count, error } = await supabase
        .from('documenti')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('nuovo', true);

      if (error) throw error;
      return { success: true, data: { count: count || 0 } };
    } catch (error) {
      return { success: false, data: { count: 0 } };
    }
  },
};

// ============================================
// USERS API
// ============================================

export const usersAPI = {
  getAllUsers: async (filters = {}) => {
    try {
      let query = supabase
        .from('users')
        .select('id, nome, cognome, email, ruolo, badge, reparto, sede, attivo, created_at')
        .order('cognome', { ascending: true });

      if (filters.ruolo) {
        query = query.eq('ruolo', filters.ruolo);
      }

      if (filters.attivo !== undefined) {
        query = query.eq('attivo', filters.attivo);
      }

      if (filters.search) {
        query = query.or(`nome.ilike.%${filters.search}%,cognome.ilike.%${filters.search}%,email.ilike.%${filters.search}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return { success: true, data: data || [] };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  getUserById: async (id) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, nome, cognome, email, ruolo, badge, reparto, sede, telefono, attivo, data_assunzione, created_at')
        .eq('id', id)
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  createUser: async (userData) => {
    try {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(userData.password, salt);

      const { data, error } = await supabase
        .from('users')
        .insert({
          ...userData,
          email: userData.email.toLowerCase(),
          password: hashedPassword,
          attivo: true,
        })
        .select('id, nome, cognome, email, ruolo, badge, reparto, sede, attivo')
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  updateUser: async (id, updates) => {
    try {
      if (updates.password) {
        const salt = await bcrypt.genSalt(10);
        updates.password = await bcrypt.hash(updates.password, salt);
      }

      const { data, error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', id)
        .select('id, nome, cognome, email, ruolo, badge, reparto, sede, attivo')
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  disableUser: async (id) => {
    return usersAPI.updateUser(id, { attivo: false });
  },

  enableUser: async (id) => {
    return usersAPI.updateUser(id, { attivo: true });
  },

  deleteUser: async (id) => {
    try {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  getUserStats: async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('ruolo, attivo');

      if (error) throw error;

      const stats = {
        totale: data.length,
        attivi: data.filter(u => u.attivo).length,
        inattivi: data.filter(u => !u.attivo).length,
        dipendenti: data.filter(u => u.ruolo === 'dipendente').length,
        managers: data.filter(u => u.ruolo === 'manager').length,
      };

      return { success: true, data: stats };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },
};

// ============================================
// COMUNICAZIONI API
// ============================================

export const comunicazioniAPI = {
  // Ottieni comunicazioni per l'utente corrente
  getMyComunicazioni: async () => {
    try {
      const userStr = await AsyncStorage.getItem('@user');
      if (!userStr) return { success: false, error: 'Non autenticato' };
      const user = JSON.parse(userStr);

      const now = new Date().toISOString();

      // Ottieni tutte le comunicazioni pubblicate e non scadute
      const { data: comunicazioni, error } = await supabase
        .from('comunicazioni')
        .select('*, creatore:users!creato_da(nome, cognome)')
        .eq('pubblicato', true)
        .or(`data_scadenza.is.null,data_scadenza.gt.${now}`)
        .order('priorita', { ascending: true })
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Filtra per destinatari
      const comunicazioniFiltrate = (comunicazioni || []).filter(com => {
        const hasNoFilters = 
          (!com.destinatari_ruoli || com.destinatari_ruoli.length === 0) &&
          (!com.destinatari_reparti || com.destinatari_reparti.length === 0) &&
          (!com.destinatari_sedi || com.destinatari_sedi.length === 0) &&
          (!com.destinatari_utenti || com.destinatari_utenti.length === 0);

        if (hasNoFilters) return true;

        const matchRuolo = com.destinatari_ruoli?.includes(user.ruolo);
        const matchReparto = user.reparto && com.destinatari_reparti?.includes(user.reparto);
        const matchSede = user.sede && com.destinatari_sedi?.includes(user.sede);
        const matchUtente = com.destinatari_utenti?.includes(user.id);

        return matchRuolo || matchReparto || matchSede || matchUtente;
      });

      // Aggiungi stato lettura per ogni comunicazione
      const comunicazioniConLettura = await Promise.all(
        comunicazioniFiltrate.map(async (com) => {
          const { data: lettura } = await supabase
            .from('comunicazioni_letture')
            .select('id')
            .eq('comunicazione_id', com.id)
            .eq('user_id', user.id)
            .single();
          
          return { ...com, letta: !!lettura };
        })
      );

      return { success: true, data: comunicazioniConLettura };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Ottieni tutte le comunicazioni (admin/manager)
  getAllComunicazioni: async () => {
    try {
      const { data, error } = await supabase
        .from('comunicazioni')
        .select('*, creatore:users!creato_da(nome, cognome)')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Aggiungi conteggio letture
      const comunicazioniConStats = await Promise.all(
        (data || []).map(async (com) => {
          const { count } = await supabase
            .from('comunicazioni_letture')
            .select('*', { count: 'exact', head: true })
            .eq('comunicazione_id', com.id);
          
          return { ...com, count_letture: count || 0 };
        })
      );

      return { success: true, data: comunicazioniConStats };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Crea nuova comunicazione
  createComunicazione: async (comunicazioneData) => {
    try {
      const userStr = await AsyncStorage.getItem('@user');
      if (!userStr) return { success: false, error: 'Non autenticato' };
      const user = JSON.parse(userStr);

      let filePath = null;
      let mimeType = null;
      let dimensione = null;

      // Upload file se presente
      if (comunicazioneData.file) {
        const file = comunicazioneData.file;
        // Pulisci il nome del file da caratteri speciali
        const cleanFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
        const fileName = `comunicazioni/${Date.now()}-${cleanFileName}`;
        
        console.log('📤 Caricamento file:', fileName);
        
        try {
          // Converti il file in ArrayBuffer per upload
          const response = await fetch(file.uri);
          const blob = await response.blob();
          
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('documenti')
            .upload(fileName, blob, {
              contentType: file.mimeType || 'application/octet-stream',
              upsert: false,
            });

          if (uploadError) {
            console.error('❌ Errore upload file:', uploadError);
            throw new Error(`Errore caricamento file: ${uploadError.message}`);
          }
          
          console.log('✅ File caricato:', uploadData);
          
          filePath = fileName;
          mimeType = file.mimeType || 'application/octet-stream';
          dimensione = file.size;
        } catch (uploadErr) {
          console.error('❌ Errore durante upload:', uploadErr);
          throw new Error(`Impossibile caricare il file: ${uploadErr.message}`);
        }
      }

      const { data, error } = await supabase
        .from('comunicazioni')
        .insert({
          titolo: comunicazioneData.titolo,
          descrizione: comunicazioneData.descrizione,
          tipo: comunicazioneData.tipo || 'Comunicazione',
          priorita: comunicazioneData.priorita || 'normale',
          file_path: filePath,
          mime_type: mimeType,
          dimensione,
          destinatari_ruoli: comunicazioneData.destinatari_ruoli,
          destinatari_reparti: comunicazioneData.destinatari_reparti,
          destinatari_sedi: comunicazioneData.destinatari_sedi,
          destinatari_utenti: comunicazioneData.destinatari_utenti,
          pubblicato: comunicazioneData.pubblicato !== false,
          data_scadenza: comunicazioneData.data_scadenza,
          richiede_conferma: comunicazioneData.richiede_conferma || false,
          creato_da: user.id,
          data_pubblicazione: new Date().toISOString(),
        })
        .select('*, creatore:users!creato_da(nome, cognome)')
        .single();

      if (error) throw error;
      return { success: true, message: 'Comunicazione creata con successo', data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Segna comunicazione come letta
  markAsRead: async (comunicazioneId) => {
    try {
      const userStr = await AsyncStorage.getItem('@user');
      if (!userStr) return { success: false, error: 'Non autenticato' };
      const user = JSON.parse(userStr);

      // Verifica se già letta
      const { data: existing } = await supabase
        .from('comunicazioni_letture')
        .select('id')
        .eq('comunicazione_id', comunicazioneId)
        .eq('user_id', user.id)
        .single();

      if (existing) {
        return { success: true, message: 'Già letta' };
      }

      const { data, error } = await supabase
        .from('comunicazioni_letture')
        .insert({
          comunicazione_id: comunicazioneId,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Conta comunicazioni non lette
  countUnread: async () => {
    try {
      const result = await comunicazioniAPI.getMyComunicazioni();
      if (!result.success) return { success: false, data: { count: 0 } };
      
      const nonLette = result.data.filter(c => !c.letta).length;
      return { success: true, data: { count: nonLette } };
    } catch (error) {
      return { success: false, data: { count: 0 } };
    }
  },

  // Ottieni conferme di lettura (admin/manager)
  getLetture: async (comunicazioneId) => {
    try {
      const { data: letture, error } = await supabase
        .from('comunicazioni_letture')
        .select('*, user:users(id, nome, cognome, email, reparto)')
        .eq('comunicazione_id', comunicazioneId)
        .order('letto_il', { ascending: false });

      if (error) throw error;

      // Ottieni comunicazione per trovare destinatari
      const { data: comunicazione } = await supabase
        .from('comunicazioni')
        .select('*')
        .eq('id', comunicazioneId)
        .single();

      // Ottieni tutti gli utenti potenziali destinatari
      let queryDestinatari = supabase
        .from('users')
        .select('id, nome, cognome, email, reparto, ruolo, sede')
        .eq('attivo', true);

      const { data: tuttiUtenti } = await queryDestinatari;

      // Filtra destinatari
      let destinatari = tuttiUtenti || [];
      if (comunicazione) {
        const hasFilters = 
          (comunicazione.destinatari_ruoli?.length > 0) ||
          (comunicazione.destinatari_reparti?.length > 0) ||
          (comunicazione.destinatari_sedi?.length > 0) ||
          (comunicazione.destinatari_utenti?.length > 0);

        if (hasFilters) {
          destinatari = destinatari.filter(u => {
            const matchRuolo = comunicazione.destinatari_ruoli?.includes(u.ruolo);
            const matchReparto = comunicazione.destinatari_reparti?.includes(u.reparto);
            const matchSede = comunicazione.destinatari_sedi?.includes(u.sede);
            const matchUtente = comunicazione.destinatari_utenti?.includes(u.id);
            return matchRuolo || matchReparto || matchSede || matchUtente;
          });
        }
      }

      // Costruisci lista con stato lettura
      const destinatariConStato = destinatari.map(user => {
        const lettura = letture?.find(l => l.user_id === user.id);
        return {
          user,
          letto: !!lettura,
          letto_il: lettura?.letto_il,
        };
      });

      return { 
        success: true, 
        data: {
          totale_destinatari: destinatari.length,
          totale_letture: letture?.length || 0,
          percentuale: destinatari.length > 0 
            ? Math.round(((letture?.length || 0) / destinatari.length) * 100) 
            : 0,
          destinatari: destinatariConStato,
        }
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Elimina comunicazione (admin)
  deleteComunicazione: async (id) => {
    try {
      // Ottieni comunicazione per eliminare file
      const { data: comunicazione } = await supabase
        .from('comunicazioni')
        .select('file_path')
        .eq('id', id)
        .single();

      if (comunicazione?.file_path) {
        await supabase.storage
          .from('documenti')
          .remove([comunicazione.file_path]);
      }

      const { error } = await supabase
        .from('comunicazioni')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Download file allegato
  getFileUrl: async (filePath) => {
    try {
      const { data, error } = await supabase.storage
        .from('documenti')
        .createSignedUrl(filePath, 3600);

      if (error) throw error;
      return { success: true, data: { url: data.signedUrl } };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },
};

// ============================================
// HELPER
// ============================================

export const handleAPIError = (error) => {
  return {
    success: false,
    error: error.message || 'Errore sconosciuto',
  };
};

// Export supabase client per uso diretto se necessario
export { supabase };

export default { authAPI, timbratureAPI, documentiAPI, usersAPI, comunicazioniAPI };
