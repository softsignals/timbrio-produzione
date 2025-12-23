import dotenv from 'dotenv';
import path from 'path';
import bcrypt from 'bcryptjs';
import { createClient } from '@supabase/supabase-js';

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
  console.error('❌ Variabili Supabase mancanti nel file .env');
  console.error('   Cercato in:');
  console.error('   - Root progetto (.env)');
  console.error('   - Cartella backend (.env)');
  console.error('');
  console.error('   Variabili richieste:');
  console.error('   - EXPO_PUBLIC_SUPABASE_URL o SUPABASE_URL');
  console.error('   - EXPO_PUBLIC_SUPABASE_KEY o SUPABASE_SERVICE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const hashPassword = async (password: string): Promise<string> => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

async function seed() {
  console.log('🌱 Inizio seeding database...\n');

  try {
    // Password comune per tutti gli utenti demo
    const defaultPassword = await hashPassword('password123');

    // Utenti di esempio
    const users = [
      {
        nome: 'Admin',
        cognome: 'Sistema',
        email: 'admin@timbrio.it',
        password: defaultPassword,
        ruolo: 'admin',
        badge: 'ADMIN001',
        reparto: 'IT',
        sede: 'Milano',
        attivo: true,
      },
      {
        nome: 'Mario',
        cognome: 'Rossi',
        email: 'mario.rossi@timbrio.it',
        password: defaultPassword,
        ruolo: 'manager',
        badge: 'MNG001',
        reparto: 'Produzione',
        sede: 'Milano',
        attivo: true,
      },
      {
        nome: 'Luigi',
        cognome: 'Bianchi',
        email: 'luigi.bianchi@timbrio.it',
        password: defaultPassword,
        ruolo: 'dipendente',
        badge: 'DIP001',
        reparto: 'Produzione',
        sede: 'Milano',
        attivo: true,
      },
      {
        nome: 'Anna',
        cognome: 'Verdi',
        email: 'anna.verdi@timbrio.it',
        password: defaultPassword,
        ruolo: 'dipendente',
        badge: 'DIP002',
        reparto: 'Amministrazione',
        sede: 'Milano',
        attivo: true,
      },
      {
        nome: 'Reception',
        cognome: 'Timbrio',
        email: 'reception@timbrio.it',
        password: defaultPassword,
        ruolo: 'receptionist',
        badge: 'REC001',
        reparto: 'Reception',
        sede: 'Milano',
        attivo: true,
      },
    ];

    console.log('📝 Inserimento utenti...');

    // Prima elimina eventuali utenti esistenti con le stesse email
    for (const user of users) {
      await supabase.from('users').delete().eq('email', user.email);
    }

    // Inserisci gli utenti
    const { data: insertedUsers, error: usersError } = await supabase
      .from('users')
      .insert(users)
      .select();

    if (usersError) {
      throw new Error(`Errore inserimento utenti: ${usersError.message}`);
    }

    console.log(`✅ ${insertedUsers?.length || 0} utenti inseriti`);

    // Crea alcune timbrature di esempio per oggi
    const today = new Date().toISOString().split('T')[0];
    const dipendenteUser = insertedUsers?.find(u => u.ruolo === 'dipendente');

    if (dipendenteUser) {
      const timbratureEsempio = [
        {
          user_id: dipendenteUser.id,
          data: today,
          entrata: '08:30',
          uscita: '17:30',
          pausa_inizio: '12:30',
          pausa_fine: '13:30',
          ore_totali: 8,
          metodo_timbratura: 'manual',
          approvata: true,
        },
      ];

      console.log('📝 Inserimento timbrature di esempio...');

      // Elimina timbrature esistenti per oggi
      await supabase.from('timbrature').delete().eq('data', today);

      const { error: timbError } = await supabase
        .from('timbrature')
        .insert(timbratureEsempio);

      if (timbError) {
        console.warn(`⚠️ Avviso timbrature: ${timbError.message}`);
      } else {
        console.log('✅ Timbrature di esempio inserite');
      }
    }

    console.log('\n🎉 Seeding completato con successo!');
    console.log('\n📋 Credenziali di accesso:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Admin:       admin@timbrio.it / password123');
    console.log('Manager:     mario.rossi@timbrio.it / password123');
    console.log('Dipendente:  luigi.bianchi@timbrio.it / password123');
    console.log('Dipendente:  anna.verdi@timbrio.it / password123');
    console.log('Receptionist: reception@timbrio.it / password123');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  } catch (error) {
    console.error('❌ Errore durante il seeding:', error);
    process.exit(1);
  }
}

seed();
