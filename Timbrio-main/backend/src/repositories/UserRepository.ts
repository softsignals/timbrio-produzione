import bcrypt from 'bcryptjs';
import { supabase } from '../config/supabase';
import { IUser, IUserCreate, UserRole } from '../types';

export class UserRepository {
  private tableName = 'users';

  async findAll(): Promise<IUser[]> {
    const { data, error } = await supabase
      .from(this.tableName)
      .select('*')
      .order('cognome', { ascending: true });

    if (error) throw new Error(error.message);
    return data || [];
  }

  async findById(id: string): Promise<IUser | null> {
    const { data, error } = await supabase
      .from(this.tableName)
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(error.message);
    }
    return data;
  }

  async findByEmail(email: string): Promise<IUser | null> {
    const { data, error } = await supabase
      .from(this.tableName)
      .select('*')
      .eq('email', email.toLowerCase())
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(error.message);
    }
    return data;
  }

  async findByEmailWithPassword(email: string): Promise<IUser | null> {
    const { data, error } = await supabase
      .from(this.tableName)
      .select('*, password')
      .eq('email', email.toLowerCase())
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(error.message);
    }
    return data;
  }

  async findByBadge(badge: string): Promise<IUser | null> {
    const { data, error } = await supabase
      .from(this.tableName)
      .select('*')
      .eq('badge', badge)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(error.message);
    }
    return data;
  }

  async findByRole(ruolo: UserRole): Promise<IUser[]> {
    const { data, error } = await supabase
      .from(this.tableName)
      .select('*')
      .eq('ruolo', ruolo)
      .order('cognome', { ascending: true });

    if (error) throw new Error(error.message);
    return data || [];
  }

  async findByReparto(reparto: string): Promise<IUser[]> {
    const { data, error } = await supabase
      .from(this.tableName)
      .select('*')
      .eq('reparto', reparto)
      .order('cognome', { ascending: true });

    if (error) throw new Error(error.message);
    return data || [];
  }

  async findActive(): Promise<IUser[]> {
    const { data, error } = await supabase
      .from(this.tableName)
      .select('*')
      .eq('attivo', true)
      .order('cognome', { ascending: true });

    if (error) throw new Error(error.message);
    return data || [];
  }

  async create(userData: IUserCreate): Promise<IUser> {
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(userData.password, salt);

    const { data, error } = await supabase
      .from(this.tableName)
      .insert({
        ...userData,
        email: userData.email.toLowerCase(),
        password: hashedPassword,
        ruolo: userData.ruolo || 'dipendente',
        attivo: userData.attivo ?? true,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  async update(id: string, updateData: Partial<IUser>): Promise<IUser | null> {
    // Se sta aggiornando la password, la hashiamo
    if (updateData.password) {
      const salt = await bcrypt.genSalt(10);
      updateData.password = await bcrypt.hash(updateData.password, salt);
    }

    // Se sta aggiornando l'email, la normalizziamo
    if (updateData.email) {
      updateData.email = updateData.email.toLowerCase();
    }

    const { data, error } = await supabase
      .from(this.tableName)
      .update({
        ...updateData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
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

  async comparePassword(candidatePassword: string, hashedPassword: string): Promise<boolean> {
    try {
      return await bcrypt.compare(candidatePassword, hashedPassword);
    } catch {
      return false;
    }
  }

  async count(): Promise<number> {
    const { count, error } = await supabase
      .from(this.tableName)
      .select('*', { count: 'exact', head: true });

    if (error) throw new Error(error.message);
    return count || 0;
  }

  async search(query: string): Promise<IUser[]> {
    const { data, error } = await supabase
      .from(this.tableName)
      .select('*')
      .or(`nome.ilike.%${query}%,cognome.ilike.%${query}%,email.ilike.%${query}%,badge.ilike.%${query}%`)
      .order('cognome', { ascending: true });

    if (error) throw new Error(error.message);
    return data || [];
  }
}

export const userRepository = new UserRepository();

