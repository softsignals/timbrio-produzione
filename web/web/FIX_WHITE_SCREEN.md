# 🔧 Fix Schermata Bianca Vite

## Problema
La schermata bianca può essere causata da:
1. **Backend non raggiungibile** - L'app tenta di connettersi al backend all'avvio
2. **Errore JavaScript non gestito** - Un errore blocca il rendering
3. **Configurazione API errata** - L'URL del backend non è corretto

## ✅ Soluzioni

### 1. Configura il file `.env`

Crea un file `.env` nella cartella `web/web/` con:

```env
VITE_API_BASE_URL=http://localhost:5000/api
```

Se il backend è su un'altra porta o IP:
```env
VITE_API_BASE_URL=http://192.168.0.83:5000/api
```

### 2. Assicurati che il backend sia avviato

```bash
cd backend
npm run dev
```

Dovresti vedere:
```
🚀 Server Timbrio avviato con successo!
🔗 URL locale: http://localhost:5000
```

### 3. Riavvia il server Vite

Dopo aver creato/modificato il file `.env`:

```bash
cd web/web
npm run dev
```

### 4. Verifica nella Console del Browser

Apri la console del browser (F12) e controlla:
- **Errori JavaScript** - Se ci sono errori, verranno mostrati qui
- **Chiamate API fallite** - Controlla la tab "Network" per vedere se le richieste al backend falliscono

### 5. Verifica che l'app si carichi

Quando l'app si avvia, dovresti vedere nella console:
```
🔗 API Base URL: http://localhost:5000/api
```

Se vedi questo, significa che la configurazione è corretta.

## 🐛 Debug

### Se vedi ancora la schermata bianca:

1. **Apri la console del browser** (F12 → Console)
2. **Cerca errori in rosso**
3. **Controlla la tab Network** per vedere se le chiamate API falliscono

### Errori comuni:

**"Network Error" o "Failed to fetch"**
→ Il backend non è raggiungibile. Verifica che:
- Il backend sia avviato
- L'URL nel file `.env` sia corretto
- Non ci siano firewall che bloccano la porta 5000

**"CORS Error"**
→ Il backend non permette le richieste dal frontend. Verifica che il backend sia configurato per accettare richieste da `http://localhost:3000`

**Errori TypeScript/React**
→ Controlla che tutti i componenti siano importati correttamente

## 📝 Note

- Il file `.env` deve essere nella cartella `web/web/` (dove c'è `vite.config.ts`)
- Dopo aver modificato `.env`, **riavvia il server Vite**
- Le variabili d'ambiente in Vite devono iniziare con `VITE_`

