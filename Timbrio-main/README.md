# 🕐 Timbrio DEMO

Sistema di gestione presenze semplificato con **Supabase** (PostgreSQL + Storage).

## 📋 Funzionalità DEMO

### Per Dipendenti
- ✅ **Home** - Dashboard con riepilogo giornaliero
- ✅ **Timbratura** - Registrazione entrata/uscita
- ✅ **Documenti** - Buste paga, documenti e comunicazioni aziendali
- ✅ **Impostazioni** - Profilo e preferenze

### Per Manager/Admin
- ✅ Tutte le funzionalità dipendente
- ✅ **Dipendenti** - Gestione team
- ✅ **Pubblica Comunicazioni** - Documenti e avvisi mirati per ruolo/reparto
- ✅ **Conferme di Lettura** - Tracciamento visualizzazioni comunicazioni

### Per Receptionist (Timbratore)
- ✅ **QR Dashboard** - Display QR per timbrature
- ✅ **QR Scanner** - Scansione badge
- ✅ **Timbrature Recenti** - Elenco ingressi/uscite

---

## 🚀 Quick Start

### 1. Setup Supabase

1. Crea un progetto su [supabase.com](https://supabase.com)
2. Esegui lo script SQL in `backend/SUPABASE_SETUP.md`
3. Crea il bucket `documenti` nello Storage

### 2. Backend

```bash
cd backend
npm install

# Configura le variabili (copia .env.example e modifica)
# SUPABASE_URL=...
# SUPABASE_SERVICE_KEY=...

npm run seed  # Crea utenti di test
npm run dev   # Avvia server (porta 5000)
```

### 3. App Mobile (React Native)

```bash
npm install
npx expo start
```

### 4. Web Dashboard

```bash
cd web/web
npm install
npm run dev  # Avvia su porta 5173
```

---

## 📱 Credenziali di Test

| Ruolo | Email | Password |
|-------|-------|----------|
| Admin | admin@timbrio.it | password123 |
| Manager | mario.rossi@timbrio.it | password123 |
| Dipendente | luigi.bianchi@timbrio.it | password123 |
| Receptionist | reception@timbrio.it | password123 |

---

## 🏗️ Architettura

```
┌─────────────────┐     ┌─────────────────┐
│   React Native  │     │    React Web    │
│   (Mobile App)  │     │   (Dashboard)   │
└────────┬────────┘     └────────┬────────┘
         │                       │
         └───────────┬───────────┘
                     │
              ┌──────┴──────┐
              │   Express   │
              │   Backend   │
              └──────┬──────┘
                     │
         ┌───────────┴───────────┐
         │                       │
    ┌────┴────┐           ┌──────┴──────┐
    │Supabase │           │  Supabase   │
    │PostgreSQL│          │   Storage   │
    └─────────┘           └─────────────┘
```

---

## 📁 Struttura Progetto

```
Timbrio/
├── App.js                 # Entry point React Native
├── src/
│   ├── context/           # React Context (Auth, Theme, etc.)
│   ├── navigation/        # React Navigation
│   ├── screens/           # Schermate app
│   ├── components/        # Componenti riutilizzabili
│   └── services/          # API services
├── backend/
│   ├── src/
│   │   ├── config/        # Configurazione Supabase
│   │   ├── repositories/  # Data access layer
│   │   ├── controllers/   # Business logic
│   │   ├── routes/        # API routes
│   │   └── middleware/    # Auth middleware
│   └── SUPABASE_SETUP.md  # Guida setup database
└── web/web/
    └── src/               # React dashboard
```

---

## 🔧 API Endpoints

### Autenticazione
- `POST /api/auth/login` - Login
- `POST /api/auth/register` - Registrazione
- `GET /api/auth/me` - Profilo corrente

### Timbrature
- `GET /api/timbrature/me` - Mie timbrature
- `GET /api/timbrature/current` - Timbratura di oggi
- `POST /api/timbrature/entrata` - Registra entrata
- `POST /api/timbrature/uscita` - Registra uscita
- `POST /api/timbrature/qr` - Timbratura via QR (receptionist)

### Documenti
- `GET /api/documenti/me` - Miei documenti
- `GET /api/documenti/:id/download` - Scarica documento
- `POST /api/documenti` - Carica documento (admin/manager)

### Comunicazioni Aziendali
- `GET /api/comunicazioni/me` - Mie comunicazioni
- `GET /api/comunicazioni` - Tutte le comunicazioni (admin/manager)
- `POST /api/comunicazioni` - Pubblica comunicazione (admin/manager)
- `PUT /api/comunicazioni/:id/read` - Conferma lettura
- `GET /api/comunicazioni/:id/letture` - Conferme di lettura (admin/manager)
- `GET /api/comunicazioni/unread/count` - Conteggio non lette
- `DELETE /api/comunicazioni/:id` - Elimina comunicazione (admin)

### Utenti
- `GET /api/users` - Lista utenti (manager/admin)
- `POST /api/users` - Crea utente (admin)

---

## 📄 Licenza

MIT © Timbrio Team 2025
