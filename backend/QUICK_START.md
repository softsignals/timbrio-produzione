# ⚡ Quick Start - Backend Timbrio

## 🎯 Setup Rapido

### 1. Configura il file `.env`

Crea/modifica `backend/.env` con la tua connection string MongoDB:

```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/timbrio?retryWrites=true&w=majority
PORT=5000
JWT_SECRET=your-super-secret-key-change-in-production
```

### 2. Installa dipendenze (se non già fatto)

```bash
cd backend
npm install
```

### 3. Popola il database con 4 utenti base

```bash
npm run seed
```

Verranno creati:
- **Admin**: `admin@timbrio.com` / `Admin@123456`
- **Manager**: `manager@timbrio.com` / `Manager@123`
- **Receptionist**: `receptionist@timbrio.com` / `reception123`
- **Dipendente**: `dipendente@timbrio.com` / `dipendente123`

### 4. Avvia il server

```bash
npm run dev
```

Il server sarà disponibile su: `http://localhost:5000`

### 5. Verifica

Apri nel browser: `http://localhost:5000/health`

## ✅ Funzionalità Disponibili

- ✅ Autenticazione (Login/Logout)
- ✅ Gestione utenti (4 utenti base)
- ✅ Timbrature (Entrata/Uscita via QR)
- ✅ Visualizzazione dipendenti

## 🔧 Troubleshooting

**Errore: "MONGODB_URI non configurato"**
→ Verifica che il file `.env` esista e contenga `MONGODB_URI=...`

**Errore di connessione MongoDB**
→ Verifica che la connection string sia corretta e che MongoDB sia accessibile

**Porta già in uso**
→ Cambia `PORT=5001` nel file `.env`

