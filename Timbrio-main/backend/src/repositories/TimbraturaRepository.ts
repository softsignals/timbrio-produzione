import { supabase } from '../config/supabase';
import { ITimbratura, ITimbraturaCreate } from '../types';

export class TimbraturaRepository {
  private tableName = 'timbrature';

  // Calcola ore totali
  private calcolaOreTotali(entrata: string, uscita?: string, pausaInizio?: string, pausaFine?: string): number {
    if (!uscita) return 0;

    const entrataDate = new Date(`2000-01-01T${entrata}`);
    const uscitaDate = new Date(`2000-01-01T${uscita}`);

    let oreLavorate = (uscitaDate.getTime() - entrataDate.getTime()) / (1000 * 60 * 60);

    // Sottrai le pause se presenti
    if (pausaInizio && pausaFine) {
      const pausaInizioDate = new Date(`2000-01-01T${pausaInizio}`);
      const pausaFineDate = new Date(`2000-01-01T${pausaFine}`);
      const orePausa = (pausaFineDate.getTime() - pausaInizioDate.getTime()) / (1000 * 60 * 60);
      oreLavorate -= orePausa;
    }

    return Math.max(0, oreLavorate);
  }

  async findAll(): Promise<ITimbratura[]> {
    const { data, error } = await supabase
      .from(this.tableName)
      .select('*, user:users(*)')
      .order('data', { ascending: false });

    if (error) throw new Error(error.message);
    return data || [];
  }

  async findById(id: string): Promise<ITimbratura | null> {
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

  async findByUserId(userId: string): Promise<ITimbratura[]> {
    const { data, error } = await supabase
      .from(this.tableName)
      .select('*, user:users(*)')
      .eq('user_id', userId)
      .order('data', { ascending: false });

    if (error) throw new Error(error.message);
    return data || [];
  }

  async findByUserIdAndDate(userId: string, data: string): Promise<ITimbratura | null> {
    const { data: timbratura, error } = await supabase
      .from(this.tableName)
      .select('*, user:users(*)')
      .eq('user_id', userId)
      .eq('data', data)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(error.message);
    }
    return timbratura;
  }

  async findByPeriod(userId: string, startDate: string, endDate: string): Promise<ITimbratura[]> {
    const { data, error } = await supabase
      .from(this.tableName)
      .select('*, user:users(*)')
      .eq('user_id', userId)
      .gte('data', startDate)
      .lte('data', endDate)
      .order('data', { ascending: true });

    if (error) throw new Error(error.message);
    return data || [];
  }

  async findAllByPeriod(startDate: string, endDate: string): Promise<ITimbratura[]> {
    const { data, error } = await supabase
      .from(this.tableName)
      .select('*, user:users(*)')
      .gte('data', startDate)
      .lte('data', endDate)
      .order('data', { ascending: true });

    if (error) throw new Error(error.message);
    return data || [];
  }

  async findTodayTimbrature(): Promise<ITimbratura[]> {
    const today = new Date().toISOString().split('T')[0];
    
    const { data, error } = await supabase
      .from(this.tableName)
      .select('*, user:users(*)')
      .eq('data', today)
      .order('entrata', { ascending: false });

    if (error) throw new Error(error.message);
    return data || [];
  }

  async findOpenTimbrature(userId: string): Promise<ITimbratura | null> {
    const today = new Date().toISOString().split('T')[0];
    
    const { data, error } = await supabase
      .from(this.tableName)
      .select('*, user:users(*)')
      .eq('user_id', userId)
      .eq('data', today)
      .is('uscita', null)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(error.message);
    }
    return data;
  }

  async create(timbraturaData: ITimbraturaCreate): Promise<ITimbratura> {
    const oreTotali = this.calcolaOreTotali(
      timbraturaData.entrata,
      timbraturaData.uscita,
      timbraturaData.pausa_inizio,
      timbraturaData.pausa_fine
    );

    const { data, error } = await supabase
      .from(this.tableName)
      .insert({
        ...timbraturaData,
        ore_totali: oreTotali,
        metodo_timbratura: timbraturaData.metodo_timbratura || 'qr',
        approvata: timbraturaData.approvata ?? true,
      })
      .select('*, user:users(*)')
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  async update(id: string, updateData: Partial<ITimbratura>): Promise<ITimbratura | null> {
    // Ricalcola ore totali se necessario
    if (updateData.entrata || updateData.uscita) {
      const existing = await this.findById(id);
      if (existing) {
        const entrata = updateData.entrata || existing.entrata;
        const uscita = updateData.uscita || existing.uscita;
        const pausaInizio = updateData.pausa_inizio || existing.pausa_inizio;
        const pausaFine = updateData.pausa_fine || existing.pausa_fine;
        updateData.ore_totali = this.calcolaOreTotali(entrata, uscita, pausaInizio, pausaFine);
      }
    }

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

  async delete(id: string): Promise<boolean> {
    const { error } = await supabase
      .from(this.tableName)
      .delete()
      .eq('id', id);

    if (error) throw new Error(error.message);
    return true;
  }

  async getOreTotaliByPeriod(userId: string, startDate: string, endDate: string): Promise<{ oreTotali: number; giorniLavorati: number }> {
    const { data, error } = await supabase
      .from(this.tableName)
      .select('ore_totali')
      .eq('user_id', userId)
      .gte('data', startDate)
      .lte('data', endDate)
      .not('ore_totali', 'is', null);

    if (error) throw new Error(error.message);

    const oreTotali = data?.reduce((sum, t) => sum + (t.ore_totali || 0), 0) || 0;
    const giorniLavorati = data?.length || 0;

    return { oreTotali, giorniLavorati };
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
}

export const timbraturaRepository = new TimbraturaRepository();

