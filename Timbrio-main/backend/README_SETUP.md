# 🚀 Setup Backend Timbrio

## 📋 Requisiti

- Node.js >= 16.x
- MongoDB (locale o Atlas)

## 🔧 Configurazione

### 1. Installa le dipendenze

```bash
cd backend
npm install
```

### 2. Configura il file `.env`

Crea un file `.env` nella cartella `backend/` con il seguente contenuto:

```env
# Server
PORT=5000
NODE_ENV=development

# MongoDB - Sostituisci con la tua connection string
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/timbrio?retryWrites=true&w=majority
# oppure per MongoDB locale:
# MONGODB_URI=mongodb://localhost:27017/timbrio

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=7d

# CORS
ALLOWED_ORIGINS=http://localhost:8081,http://localhost:19006

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### 3. Popola il database

Esegui lo script di seeding per creare i 4 utenti base:

```bash
npm run seed
```

Questo creerà:
- **Admin**: `admin@timbrio.com` / `Admin@123456`
- **Manager**: `manager@timbrio.com` / `Manager@123`
- **Receptionist**: `receptionist@timbrio.com` / `reception123`
- **Dipendente**: `dipendente@timbrio.com` / `dipendente123`

### 4. Avvia il server

```bash
npm run dev
```

Il server sarà disponibile su `http://localhost:5000`

## ✅ Verifica funzionamento

Apri il browser su: `http://localhost:5000/health`

Dovresti vedere:
```json
{
  "success": true,
  "message": "Server Timbrio attivo",
  "timestamp": "2025-01-XX...",
  "environment": "development"
}
```

## 🔍 Troubleshooting

### Errore di connessione MongoDB

1. Verifica che la connection string nel `.env` sia corretta
2. Per MongoDB Atlas, assicurati che l'IP sia whitelistato
3. Verifica che username e password siano corretti
4. Controlla che il nome del database sia specificato nella connection string

### Porta già in uso

Cambia la porta nel file `.env`:
```env
PORT=5001
```

## 📚 Endpoint principali

- `GET /health` - Health check
- `POST /api/auth/login` - Login utente
- `GET /api/users` - Lista utenti (admin/manager)
- `POST /api/timbrature/entrata` - Timbra entrata
- `POST /api/timbrature/uscita` - Timbra uscita

