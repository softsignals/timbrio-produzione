# Timbrio Backend API

Backend Node.js/Express + TypeScript + MongoDB per il sistema di gestione timbrature Timbrio.

## 🚀 Setup Iniziale

### Prerequisiti

- Node.js >= 18.x
- MongoDB >= 6.0 (locale o MongoDB Atlas)
- npm o yarn

### Installazione

```bash
# Installa le dipendenze
npm install

# Copia il file di esempio delle variabili ambiente
cp env.example .env

# Modifica .env con le tue configurazioni
nano .env
```

### Configurazione `.env`

Configura le seguenti variabili nel file `.env`:

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/timbrio
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:8081
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
```

## 🏃 Avvio

```bash
# Sviluppo (con hot-reload)
npm run dev

# Build per produzione
npm run build

# Avvio produzione
npm start
```

Il server sarà disponibile su `http://localhost:5000`

## 📡 API Endpoints

### Authentication (`/api/auth`)

- `POST /login` - Login utente
- `POST /logout` - Logout
- `GET /me` - Dati utente corrente (richiede auth)
- `POST /register` - Registra nuovo utente (solo admin)
- `POST /reset-password` - Reset password (auth)

### Timbrature (`/api/timbrature`)

- `POST /entrata` - Timbra entrata (auth)
- `POST /uscita` - Timbra uscita (auth)
- `POST /pausa/inizio` - Inizia pausa (auth)
- `POST /pausa/fine` - Termina pausa (auth)
- `GET /me` - Le mie timbrature (auth)
- `GET /all` - Tutte le timbrature (admin)
- `PUT /:id` - Aggiorna timbratura (admin)
- `DELETE /:id` - Elimina timbratura (admin)

## 🔐 Autenticazione

L'API usa JWT (JSON Web Tokens) per l'autenticazione.

### Esempio richiesta autenticata:

```bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  http://localhost:5000/api/timbrature/me
```

### Ruoli Utente

- `dipendente` - Accesso base
- `manager` - Accesso admin parziale
- `admin` - Accesso completo

## 🗄️ Database

### Modelli MongoDB

- **User** - Utenti/Dipendenti
- **Timbratura** - Timbrature entrata/uscita
- **Documento** - Buste paga e documenti
- **RichiestaFerie** - Ferie e permessi
- **Giustificazione** - Giustificazioni mancate timbrature
- **Turno** - Gestione turni
- **Notifica** - Sistema notifiche

### Seed Database (Opzionale)

Per popolare il database con dati di test, puoi creare un admin di default:

```bash
# TODO: Creare script di seeding
npm run seed
```

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests con coverage
npm test -- --coverage
```

## 📦 Struttura Progetto

```
backend/
├── src/
│   ├── config/          # Configurazioni (database, ecc.)
│   ├── controllers/     # Controller per gestire la logica business
│   ├── middleware/      # Middleware (auth, error handling)
│   ├── models/          # Modelli Mongoose
│   ├── routes/          # Definizione routes API
│   ├── services/        # Servizi (email, notifiche, export)
│   ├── types/           # TypeScript types e interfaces
│   ├── utils/           # Utility functions
│   └── server.ts        # Entry point applicazione
├── dist/                # Build output (generato)
├── .env                 # Variabili ambiente (non committare!)
├── env.example          # Template variabili ambiente
├── package.json
├── tsconfig.json
└── README.md
```

## 🛠️ Sviluppo

### Aggiungere una nuova route

1. Creare il controller in `src/controllers/`
2. Creare la route in `src/routes/`
3. Importare e montare la route in `src/server.ts`

### Aggiungere un nuovo modello

1. Definire l'interface in `src/types/index.ts`
2. Creare lo schema Mongoose in `src/models/`

## 📝 TODO

- [ ] Implementare controller Documenti
- [ ] Implementare controller Ferie
- [ ] Implementare controller Giustificazioni
- [ ] Implementare controller Users (CRUD completo)
- [ ] Implementare servizio Email
- [ ] Implementare servizio Export (CSV/Excel/PDF)
- [ ] Aggiungere validazione input con express-validator
- [ ] Implementare upload file con Multer
- [ ] Aggiungere test con Jest
- [ ] Documentazione API con Swagger

## 🐛 Debugging

Per debug dettagliato in sviluppo:

```bash
NODE_ENV=development DEBUG=* npm run dev
```

## 📄 Licenza

MIT

