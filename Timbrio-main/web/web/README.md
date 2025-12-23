# Timbrio Web - Interfaccia Web per Sistema di Gestione Presenze

Interfaccia web React per Timbrio, sistema completo di gestione presenze e timbrature.

## Caratteristiche

- **Autenticazione JWT** con gestione sessioni
- **Ruoli multipli**: Dipendente, Manager, Admin, Receptionist
- **Timbrature**: Entrata/Uscita con QR code
- **Documenti**: Gestione buste paghe e documenti
- **Ferie e Permessi**: Richiesta e approvazione
- **Giustificazioni**: Gestione giustificazioni
- **Dashboard Admin**: Gestione completa utenti
- **QR Code**: Generazione e scansione per timbrature
- **Design Responsive**: Mobile-first, adattivo per desktop
- **Dark/Light Mode**: Supporto tema chiaro/scuro

## Tecnologie

- **React 18** con TypeScript
- **Material-UI (MUI)** per componenti UI
- **React Router v6** per routing
- **Axios** per chiamate API
- **React Hook Form** per gestione form
- **date-fns** per gestione date
- **Recharts** per grafici
- **qrcode.react** e **html5-qrcode** per QR code
- **Vite** come build tool

## Installazione

```bash
# Installa dipendenze
npm install

# Avvia server di sviluppo
npm run dev

# Build per produzione
npm run build

# Preview build produzione
npm run preview
```

## Configurazione

Crea un file `.env` nella root del progetto:

```env
VITE_API_BASE_URL=http://localhost:5000/api
VITE_APP_NAME=Timbrio Web
```

## Struttura Progetto

```
web/
├── src/
│   ├── components/      # Componenti riutilizzabili
│   ├── pages/          # Pagine principali
│   ├── context/        # Context API per stato globale
│   ├── services/       # API calls
│   ├── utils/          # Funzioni di utilità
│   ├── types/          # TypeScript types
│   └── routes/         # Configurazione routing
├── public/
└── package.json
```

## Ruoli e Permessi

### Dipendente
- Visualizza e crea timbrature personali
- Visualizza documenti personali
- Richiede ferie e permessi
- Crea giustificazioni

### Manager
- Tutte le funzionalità del dipendente
- Gestisce documenti e buste paghe
- Approva/rifiuta richieste ferie
- Approva/rifiuta giustificazioni
- Visualizza timbrature dipendenti

### Admin
- Tutte le funzionalità del manager
- Gestione completa utenti (CRUD)
- Visualizza tutte le timbrature
- Statistiche aggregate

### Receptionist
- Genera QR code per timbrature
- Scansiona QR code per timbrature dipendenti
- Visualizza timbrature recenti

## API Backend

L'applicazione si connette al backend Timbrio tramite API REST. Assicurati che il backend sia in esecuzione su `http://localhost:5000` (o configura l'URL nel file `.env`).

## Sviluppo

```bash
# Avvia in modalità sviluppo
npm run dev

# L'app sarà disponibile su http://localhost:3000
```

## Build Produzione

```bash
npm run build
```

I file compilati saranno nella cartella `dist/`.

## Note

- L'applicazione richiede che il backend Timbrio sia in esecuzione
- Il token JWT viene salvato in `localStorage`
- Le route sono protette e verificano i permessi in base al ruolo utente

## Licenza

MIT

