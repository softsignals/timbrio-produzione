import { createClient, SupabaseClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Carica .env dalla root del progetto (dove si trova per Expo)
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
// Fallback: prova anche nella cartella backend
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
// Fallback: cartella corrente
dotenv.config();

// Supporta sia le variabili Expo che quelle standard
const supabaseUrl = process.env.SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || process.env.EXPO_PUBLIC_SUPABASE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('❌ SUPABASE_URL/EXPO_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_KEY/EXPO_PUBLIC_SUPABASE_KEY sono obbligatori nel file .env');
}

// Client con service key per operazioni server-side
export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Verifica connessione
export const testConnection = async (): Promise<boolean> => {
  try {
    const { error } = await supabase.from('users').select('count').limit(1);
    if (error && error.code !== 'PGRST116') {
      // PGRST116 = tabella non trovata (normale se non esiste ancora)
      console.error('❌ Errore connessione Supabase:', error.message);
      return false;
    }
    return true;
  } catch (error) {
    console.error('❌ Errore connessione Supabase:', error);
    return false;
  }
};

// Bucket per documenti
export const DOCUMENTI_BUCKET = 'documenti';

// Inizializza storage bucket se non esiste
export const initStorage = async (): Promise<void> => {
  try {
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    // Se non possiamo listare i bucket (RLS), assumiamo che esista
    if (listError) {
      console.log('ℹ️  Storage: usando bucket esistente (RLS attivo)');
      return;
    }
    
    const bucketExists = buckets?.some(b => b.name === DOCUMENTI_BUCKET);
    
    if (!bucketExists) {
      const { error } = await supabase.storage.createBucket(DOCUMENTI_BUCKET, {
        public: false,
        fileSizeLimit: 10485760, // 10MB
        allowedMimeTypes: [
          'application/pdf',
          'image/jpeg',
          'image/png',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        ],
      });
      
      if (error) {
        // Ignora errori RLS - il bucket va creato manualmente su Supabase
        if (error.message.includes('row-level security') || error.message.includes('already exists')) {
          console.log('ℹ️  Storage: bucket "documenti" da creare manualmente su Supabase Dashboard');
        } else {
          console.warn('⚠️  Storage:', error.message);
        }
      } else {
        console.log('✅ Bucket documenti creato');
      }
    } else {
      console.log('✅ Bucket documenti esistente');
    }
  } catch (error) {
    // Non è critico, il bucket può essere creato manualmente
    console.log('ℹ️  Storage: configurare bucket "documenti" su Supabase Dashboard');
  }
};

export default supabase;

