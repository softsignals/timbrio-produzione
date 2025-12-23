import { supabase, DOCUMENTI_BUCKET } from '../config/supabase';
import { IComunicazione, IComunicazioneCreate, IComunicazioneLettura, IUser } from '../types';

export class ComunicazioneRepository {
  private tableName = 'comunicazioni';
  private lettureTable = 'comunicazioni_letture';

  // Ottieni tutte le comunicazioni (admin/manager)
  async findAll(): Promise<IComunicazione[]> {
    const { data, error } = await supabase
      .from(this.tableName)
      .select('*, creatore:users!creato_da(*)')
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return data || [];
  }

  // Ottieni comunicazione per ID
  async findById(id: string): Promise<IComunicazione | null> {
    const { data, error } = await supabase
      .from(this.tableName)
      .select('*, creatore:users!creato_da(*)')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(error.message);
    }
    return data;
  }

  // Ottieni comunicazioni visibili per un utente specifico
  async findForUser(user: { id: string; ruolo: string; reparto?: string; sede?: string }): Promise<IComunicazione[]> {
    const now = new Date().toISOString();
    
    // Query base: comunicazioni pubblicate e non scadute
    let query = supabase
      .from(this.tableName)
      .select('*, creatore:users!creato_da(*)')
      .eq('pubblicato', true)
      .or(`data_scadenza.is.null,data_scadenza.gt.${now}`)
      .order('priorita', { ascending: true }) // alta prima
      .order('created_at', { ascending: false });

    const { data, error } = await query;

    if (error) throw new Error(error.message);

    // Filtra lato applicazione per destinatari
    const comunicazioniFiltrate = (data || []).filter(com => {
      // Se non ci sono filtri destinatari, è per tutti
      const hasNoFilters = 
        (!com.destinatari_ruoli || com.destinatari_ruoli.length === 0) &&
        (!com.destinatari_reparti || com.destinatari_reparti.length === 0) &&
        (!com.destinatari_sedi || com.destinatari_sedi.length === 0) &&
        (!com.destinatari_utenti || com.destinatari_utenti.length === 0);

      if (hasNoFilters) return true;

      // Verifica se l'utente corrisponde a uno dei filtri
      const matchRuolo = com.destinatari_ruoli?.includes(user.ruolo);
      const matchReparto = user.reparto && com.destinatari_reparti?.includes(user.reparto);
      const matchSede = user.sede && com.destinatari_sedi?.includes(user.sede);
      const matchUtente = com.destinatari_utenti?.includes(user.id);

      return matchRuolo || matchReparto || matchSede || matchUtente;
    });

    // Aggiungi info lettura per ogni comunicazione
    const comunicazioniConLettura = await Promise.all(
      comunicazioniFiltrate.map(async (com) => {
        const letta = await this.isReadByUser(com.id, user.id);
        return { ...com, letta };
      })
    );

    return comunicazioniConLettura;
  }

  // Crea nuova comunicazione
  async create(comunicazioneData: IComunicazioneCreate): Promise<IComunicazione> {
    const { data, error } = await supabase
      .from(this.tableName)
      .insert({
        ...comunicazioneData,
        data_pubblicazione: new Date().toISOString(),
      })
      .select('*, creatore:users!creato_da(*)')
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  // Aggiorna comunicazione
  async update(id: string, updateData: Partial<IComunicazione>): Promise<IComunicazione | null> {
    const { data, error } = await supabase
      .from(this.tableName)
      .update({
        ...updateData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select('*, creatore:users!creato_da(*)')
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(error.message);
    }
    return data;
  }

  // Elimina comunicazione
  async delete(id: string): Promise<boolean> {
    // Prima ottieni la comunicazione per eliminare eventuale file
    const comunicazione = await this.findById(id);
    
    if (comunicazione?.file_path) {
      await this.deleteFile(comunicazione.file_path);
    }

    const { error } = await supabase
      .from(this.tableName)
      .delete()
      .eq('id', id);

    if (error) throw new Error(error.message);
    return true;
  }

  // ========================================
  // GESTIONE LETTURE / CONFERME
  // ========================================

  // Verifica se una comunicazione è stata letta da un utente
  async isReadByUser(comunicazioneId: string, userId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from(this.lettureTable)
      .select('id')
      .eq('comunicazione_id', comunicazioneId)
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(error.message);
    }
    return !!data;
  }

  // Segna comunicazione come letta
  async markAsRead(comunicazioneId: string, userId: string): Promise<IComunicazioneLettura> {
    // Verifica se già letta
    const alreadyRead = await this.isReadByUser(comunicazioneId, userId);
    if (alreadyRead) {
      const { data } = await supabase
        .from(this.lettureTable)
        .select('*')
        .eq('comunicazione_id', comunicazioneId)
        .eq('user_id', userId)
        .single();
      return data!;
    }

    const { data, error } = await supabase
      .from(this.lettureTable)
      .insert({
        comunicazione_id: comunicazioneId,
        user_id: userId,
      })
      .select('*')
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  // Ottieni tutte le letture di una comunicazione (per admin/manager)
  async getLetture(comunicazioneId: string): Promise<IComunicazioneLettura[]> {
    const { data, error } = await supabase
      .from(this.lettureTable)
      .select('*, user:users(*)')
      .eq('comunicazione_id', comunicazioneId)
      .order('letto_il', { ascending: false });

    if (error) throw new Error(error.message);
    return data || [];
  }

  // Conta le letture di una comunicazione
  async countLetture(comunicazioneId: string): Promise<number> {
    const { count, error } = await supabase
      .from(this.lettureTable)
      .select('*', { count: 'exact', head: true })
      .eq('comunicazione_id', comunicazioneId);

    if (error) throw new Error(error.message);
    return count || 0;
  }

  // Conta comunicazioni non lette per un utente
  async countUnread(user: { id: string; ruolo: string; reparto?: string; sede?: string }): Promise<number> {
    const comunicazioni = await this.findForUser(user);
    return comunicazioni.filter(c => !c.letta).length;
  }

  // ========================================
  // GESTIONE FILE
  // ========================================

  async uploadFile(file: Buffer, fileName: string, mimeType: string): Promise<string> {
    const filePath = `comunicazioni/${Date.now()}-${fileName}`;

    const { error } = await supabase.storage
      .from(DOCUMENTI_BUCKET)
      .upload(filePath, file, {
        contentType: mimeType,
        upsert: false,
      });

    if (error) throw new Error(`Errore upload: ${error.message}`);
    return filePath;
  }

  async deleteFile(filePath: string): Promise<void> {
    const { error } = await supabase.storage
      .from(DOCUMENTI_BUCKET)
      .remove([filePath]);

    if (error) {
      console.error('Errore eliminazione file:', error.message);
    }
  }

  async getFileUrl(filePath: string, expiresIn = 3600): Promise<string> {
    const { data, error } = await supabase.storage
      .from(DOCUMENTI_BUCKET)
      .createSignedUrl(filePath, expiresIn);

    if (error) throw new Error(`Errore generazione URL: ${error.message}`);
    return data.signedUrl;
  }

  // ========================================
  // STATISTICHE
  // ========================================

  async getStats(): Promise<{
    totali: number;
    pubblicate: number;
    conConferma: number;
    prioritaAlta: number;
  }> {
    const { data, error } = await supabase
      .from(this.tableName)
      .select('pubblicato, richiede_conferma, priorita');

    if (error) throw new Error(error.message);

    const stats = {
      totali: data?.length || 0,
      pubblicate: data?.filter(c => c.pubblicato).length || 0,
      conConferma: data?.filter(c => c.richiede_conferma).length || 0,
      prioritaAlta: data?.filter(c => c.priorita === 'alta').length || 0,
    };

    return stats;
  }

  // Ottieni utenti destinatari di una comunicazione (per visualizzare chi ha/non ha letto)
  async getDestinatari(comunicazioneId: string): Promise<IUser[]> {
    const comunicazione = await this.findById(comunicazioneId);
    if (!comunicazione) return [];

    // Se non ci sono filtri, prendi tutti gli utenti attivi
    const hasNoFilters = 
      (!comunicazione.destinatari_ruoli || comunicazione.destinatari_ruoli.length === 0) &&
      (!comunicazione.destinatari_reparti || comunicazione.destinatari_reparti.length === 0) &&
      (!comunicazione.destinatari_sedi || comunicazione.destinatari_sedi.length === 0) &&
      (!comunicazione.destinatari_utenti || comunicazione.destinatari_utenti.length === 0);

    let query = supabase
      .from('users')
      .select('*')
      .eq('attivo', true);

    if (!hasNoFilters) {
      // Costruisci query con OR per i vari filtri
      const conditions: string[] = [];
      
      if (comunicazione.destinatari_ruoli && comunicazione.destinatari_ruoli.length > 0) {
        conditions.push(`ruolo.in.(${comunicazione.destinatari_ruoli.join(',')})`);
      }
      if (comunicazione.destinatari_reparti && comunicazione.destinatari_reparti.length > 0) {
        conditions.push(`reparto.in.(${comunicazione.destinatari_reparti.join(',')})`);
      }
      if (comunicazione.destinatari_sedi && comunicazione.destinatari_sedi.length > 0) {
        conditions.push(`sede.in.(${comunicazione.destinatari_sedi.join(',')})`);
      }
      if (comunicazione.destinatari_utenti && comunicazione.destinatari_utenti.length > 0) {
        conditions.push(`id.in.(${comunicazione.destinatari_utenti.join(',')})`);
      }

      if (conditions.length > 0) {
        query = query.or(conditions.join(','));
      }
    }

    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return data || [];
  }
}

export const comunicazioneRepository = new ComunicazioneRepository();





