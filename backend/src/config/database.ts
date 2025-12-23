import { supabase, testConnection, initStorage } from './supabase';

export const connectDatabase = async (): Promise<void> => {
  try {
    console.log('🔄 Connessione a Supabase...');
    
    const isConnected = await testConnection();
    
    if (!isConnected) {
      console.error('❌ Impossibile connettersi a Supabase');
      console.log('📝 Verifica le credenziali nel file .env');
      // Non usciamo, il database potrebbe essere vuoto
    }
    
    console.log('✅ Supabase connesso con successo');
    console.log(`📊 URL: ${process.env.SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL}`);
    
    // Inizializza storage
    await initStorage();
    console.log('✅ Storage inizializzato');
    
  } catch (error) {
    console.error('❌ Errore connessione Supabase:', error);
    // Non usciamo per permettere al server di avviarsi
    console.log('⚠️  Il server continuerà senza connessione database');
  }
};

export { supabase };
