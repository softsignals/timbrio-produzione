import { supabase, DOCUMENTI_BUCKET } from '../config/supabase';
import { IDocumento, IDocumentoCreate } from '../types';

export class DocumentoRepository {
  private tableName = 'documenti';

  async findAll(): Promise<IDocumento[]> {
    const { data, error } = await supabase
      .from(this.tableName)
      .select('*, user:users(*)')
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return data || [];
  }

  async findById(id: string): Promise<IDocumento | null> {
    const { data, error } = await supabase
      .from(this.tableName)
      .select('*, user:users(*)')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(error.message);
    }
    return data;
  }

  async findByUserId(userId: string): Promise<IDocumento[]> {
    const { data, error } = await supabase
      .from(this.tableName)
      .select('*, user:users(*)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return data || [];
  }

  async findByTipo(tipo: string): Promise<IDocumento[]> {
    const { data, error } = await supabase
      .from(this.tableName)
      .select('*, user:users(*)')
      .eq('tipo', tipo)
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return data || [];
  }

  async findByAnnoMese(anno: number, mese?: string): Promise<IDocumento[]> {
    let query = supabase
      .from(this.tableName)
      .select('*, user:users(*)')
      .eq('anno', anno);

    if (mese) {
      query = query.eq('mese', mese);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return data || [];
  }

  async findNew(userId?: string): Promise<IDocumento[]> {
    let query = supabase
      .from(this.tableName)
      .select('*, user:users(*)')
      .eq('nuovo', true);

    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return data || [];
  }

  async create(documentoData: IDocumentoCreate): Promise<IDocumento> {
    const { data, error } = await supabase
      .from(this.tableName)
      .insert({
        ...documentoData,
        data: new Date().toISOString(),
        nuovo: true,
      })
      .select('*, user:users(*)')
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  async update(id: string, updateData: Partial<IDocumento>): Promise<IDocumento | null> {
    const { data, error } = await supabase
      .from(this.tableName)
      .update({
        ...updateData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select('*, user:users(*)')
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(error.message);
    }
    return data;
  }

  async markAsRead(id: string): Promise<IDocumento | null> {
    return this.update(id, { nuovo: false });
  }

  async markAllAsRead(userId: string): Promise<void> {
    const { error } = await supabase
      .from(this.tableName)
      .update({ nuovo: false, updated_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('nuovo', true);

    if (error) throw new Error(error.message);
  }

  async delete(id: string): Promise<boolean> {
    // Prima ottieni il documento per eliminare il file
    const documento = await this.findById(id);
    
    if (documento) {
      // Elimina il file dallo storage
      await this.deleteFile(documento.file_path);
    }

    const { error } = await supabase
      .from(this.tableName)
      .delete()
      .eq('id', id);

    if (error) throw new Error(error.message);
    return true;
  }

  // Storage methods
  async uploadFile(file: Buffer, fileName: string, mimeType: string): Promise<string> {
    const filePath = `${Date.now()}-${fileName}`;

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

  async downloadFile(filePath: string): Promise<Blob> {
    const { data, error } = await supabase.storage
      .from(DOCUMENTI_BUCKET)
      .download(filePath);

    if (error) throw new Error(`Errore download: ${error.message}`);
    return data;
  }

  async count(): Promise<number> {
    const { count, error } = await supabase
      .from(this.tableName)
      .select('*', { count: 'exact', head: true });

    if (error) throw new Error(error.message);
    return count || 0;
  }

  async countByUser(userId: string): Promise<number> {
    const { count, error } = await supabase
      .from(this.tableName)
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (error) throw new Error(error.message);
    return count || 0;
  }

  async countNew(userId?: string): Promise<number> {
    let query = supabase
      .from(this.tableName)
      .select('*', { count: 'exact', head: true })
      .eq('nuovo', true);

    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { count, error } = await query;

    if (error) throw new Error(error.message);
    return count || 0;
  }
}

export const documentoRepository = new DocumentoRepository();

