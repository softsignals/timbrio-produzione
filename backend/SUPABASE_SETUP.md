# 🚀 Setup Supabase per Timbrio DEMO

## 1. Crea un progetto Supabase

1. Vai su [supabase.com](https://supabase.com) e crea un account
2. Crea un nuovo progetto
3. Attendi che il progetto sia pronto (~2 minuti)

## 2. Ottieni le credenziali

1. Vai su **Settings** → **API**
2. Copia:
   - **Project URL** → `SUPABASE_URL`
   - **service_role key** (sotto "Project API keys") → `SUPABASE_SERVICE_KEY`

## 3. Crea le tabelle

Vai su **SQL Editor** ed esegui questo script:

```sql
-- ========================================
-- TIMBRIO DEMO - Schema Database
-- ========================================

-- Tabella Users
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome VARCHAR(100) NOT NULL,
  cognome VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  ruolo VARCHAR(20) DEFAULT 'dipendente' CHECK (ruolo IN ('dipendente', 'manager', 'admin', 'receptionist')),
  badge VARCHAR(50) UNIQUE NOT NULL,
  reparto VARCHAR(100),
  sede VARCHAR(100),
  telefono VARCHAR(20),
  data_assunzione DATE,
  orario_turno JSONB,
  paga_oraria DECIMAL(10,2),
  attivo BOOLEAN DEFAULT true,
  foto_profilo TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabella Timbrature
CREATE TABLE IF NOT EXISTS timbrature (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  data DATE NOT NULL,
  entrata VARCHAR(5) NOT NULL,
  uscita VARCHAR(5),
  pausa_inizio VARCHAR(5),
  pausa_fine VARCHAR(5),
  ore_totali DECIMAL(5,2),
  qr_token VARCHAR(255),
  metodo_timbratura VARCHAR(10) DEFAULT 'qr' CHECK (metodo_timbratura IN ('qr', 'manual')),
  commessa VARCHAR(100),
  note TEXT,
  approvata BOOLEAN DEFAULT true,
  approvata_da UUID REFERENCES users(id),
  data_approvazione TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, data)
);

-- Tabella Documenti
CREATE TABLE IF NOT EXISTS documenti (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  nome VARCHAR(255) NOT NULL,
  tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('Busta Paga', 'Contratto', 'Certificato', 'Comunicazione', 'Altro')),
  categoria VARCHAR(100),
  file_path VARCHAR(500) NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  dimensione INTEGER NOT NULL,
  data TIMESTAMPTZ DEFAULT NOW(),
  mese VARCHAR(20),
  anno INTEGER,
  importo DECIMAL(10,2),
  nuovo BOOLEAN DEFAULT true,
  caricato_da UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabella Comunicazioni Aziendali
-- Documenti/comunicazioni destinati a gruppi di utenti con priorità e conferme di lettura
CREATE TABLE IF NOT EXISTS comunicazioni (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  titolo VARCHAR(255) NOT NULL,
  descrizione TEXT,
  tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('Comunicazione', 'Documento', 'Circolare', 'Avviso', 'Procedura')),
  priorita VARCHAR(20) DEFAULT 'normale' CHECK (priorita IN ('alta', 'normale', 'bassa')),
  file_path VARCHAR(500),
  mime_type VARCHAR(100),
  dimensione INTEGER,
  
  -- Destinatari (NULL = tutti)
  destinatari_ruoli TEXT[], -- Array di ruoli: ['dipendente', 'manager']
  destinatari_reparti TEXT[], -- Array di reparti: ['IT', 'HR']
  destinatari_sedi TEXT[], -- Array di sedi
  destinatari_utenti UUID[], -- Array di ID utenti specifici
  
  -- Visibilità
  pubblicato BOOLEAN DEFAULT true,
  data_pubblicazione TIMESTAMPTZ DEFAULT NOW(),
  data_scadenza TIMESTAMPTZ, -- Data oltre la quale non è più visibile
  
  -- Richiede conferma di lettura?
  richiede_conferma BOOLEAN DEFAULT false,
  
  -- Metadata
  creato_da UUID REFERENCES users(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabella Conferme di Lettura
CREATE TABLE IF NOT EXISTS comunicazioni_letture (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  comunicazione_id UUID REFERENCES comunicazioni(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  letto_il TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(comunicazione_id, user_id)
);

-- Indici per performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_badge ON users(badge);
CREATE INDEX IF NOT EXISTS idx_users_ruolo ON users(ruolo);
CREATE INDEX IF NOT EXISTS idx_timbrature_user_data ON timbrature(user_id, data);
CREATE INDEX IF NOT EXISTS idx_timbrature_data ON timbrature(data);
CREATE INDEX IF NOT EXISTS idx_documenti_user ON documenti(user_id);
CREATE INDEX IF NOT EXISTS idx_documenti_tipo ON documenti(tipo);
CREATE INDEX IF NOT EXISTS idx_comunicazioni_tipo ON comunicazioni(tipo);
CREATE INDEX IF NOT EXISTS idx_comunicazioni_priorita ON comunicazioni(priorita);
CREATE INDEX IF NOT EXISTS idx_comunicazioni_pubblicato ON comunicazioni(pubblicato);
CREATE INDEX IF NOT EXISTS idx_comunicazioni_letture_com ON comunicazioni_letture(comunicazione_id);
CREATE INDEX IF NOT EXISTS idx_comunicazioni_letture_user ON comunicazioni_letture(user_id);

-- Trigger per updated_at automatico
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_timbrature_updated_at
    BEFORE UPDATE ON timbrature
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_documenti_updated_at
    BEFORE UPDATE ON documenti
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_comunicazioni_updated_at
    BEFORE UPDATE ON comunicazioni
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
```

## 4. Crea il bucket per i documenti

1. Vai su **Storage**
2. Clicca **New bucket**
3. Nome: `documenti`
4. Public: **No** (lascia privato)
5. File size limit: 10MB
6. Allowed mime types:
   - application/pdf
   - image/jpeg
   - image/png
   - application/msword
   - application/vnd.openxmlformats-officedocument.wordprocessingml.document

## 5. Configura il backend

Il backend supporta automaticamente le variabili Expo esistenti:

- `EXPO_PUBLIC_SUPABASE_URL` → URL del progetto
- `EXPO_PUBLIC_SUPABASE_KEY` → Chiave API (anon o service)

Oppure le variabili standard:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_KEY`

1. Installa le dipendenze:

```bash
cd backend
npm install
```

2. Esegui il seed per creare utenti di test:

```bash
npm run seed
```

## 6. Avvia il server

```bash
npm run dev
```

## 📋 Credenziali di test

| Ruolo | Email | Password |
|-------|-------|----------|
| Admin | admin@timbrio.it | password123 |
| Manager | mario.rossi@timbrio.it | password123 |
| Dipendente | luigi.bianchi@timbrio.it | password123 |
| Dipendente | anna.verdi@timbrio.it | password123 |
| Receptionist | reception@timbrio.it | password123 |

## 🔒 Sicurezza

⚠️ **In produzione**:
- Cambia `JWT_SECRET` con una chiave sicura
- Non usare `service_role` key nel frontend
- Configura Row Level Security (RLS) su Supabase
- Usa HTTPS

