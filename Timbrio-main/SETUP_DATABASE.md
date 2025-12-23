# 🗄️ Setup Database MongoDB per Timbrio

## Opzioni disponibili

Il sistema Timbrio supporta **MongoDB** per la sincronizzazione tra dispositivi. MongoDB è già configurato nel backend, devi solo avviare il database.

### ✅ **Consigliato: MongoDB**

MongoDB è la scelta migliore perché:
- ✅ Sincronizza automaticamente tra tutti i dispositivi
- ✅ Database reale e scalabile
- ✅ Già configurato nel backend
- ✅ Supporto per migliaia di utenti
- ✅ Backup e sicurezza integrati

---

## 🚀 Setup MongoDB Locale

### 1. Installazione MongoDB

#### Windows:
```bash
# Scarica MongoDB Community Server da:
# https://www.mongodb.com/try/download/community

# O usa Chocolatey:
choco install mongodb

# Avvia MongoDB come servizio Windows
net start MongoDB
```

#### macOS:
```bash
# Usa Homebrew:
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community
```

#### Linux (Ubuntu/Debian):
```bash
# Importa la chiave GPG
curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | sudo gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor

# Aggiungi repository
echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list

# Installa e avvia
sudo apt-get update
sudo apt-get install -y mongodb-org
sudo systemctl start mongod
sudo systemctl enable mongod
```

### 2. Configurazione Backend

Il backend è già configurato! Devi solo:

```bash
# Vai nella cartella backend
cd backend

# Copia il file .env (se non esiste)
cp env.example .env

# Il file .env dovrebbe contenere:
MONGODB_URI=mongodb://localhost:27017/timbrio
```

### 3. Avvia il Backend

```bash
# Installa dipendenze (se non già fatto)
npm install

# Avvia in modalità sviluppo
npm run dev
```

Se tutto è configurato correttamente, vedrai:
```
✅ MongoDB connesso con successo
📊 Database: timbrio
🚀 Server Timbrio avviato con successo!
```

---

## ☁️ Setup MongoDB Atlas (Cloud - Consigliato per produzione)

MongoDB Atlas è la versione cloud di MongoDB, perfetta per demo e produzione.

### 1. Crea account MongoDB Atlas

1. Vai su https://www.mongodb.com/cloud/atlas/register
2. Crea un account gratuito (512MB gratuiti)
3. Crea un nuovo cluster (gratuito M0 Sandbox)

### 2. Configura Network Access

1. Vai su **Network Access**
2. Clicca **Add IP Address**
3. Seleziona **Allow Access from Anywhere** (`0.0.0.0/0`) per demo
   - ⚠️ In produzione, usa solo IP specifici

### 3. Crea Database User

1. Vai su **Database Access**
2. Clicca **Add New Database User**
3. Scegli **Password Authentication**
4. Username: `timbrio_admin`
5. Password: genera una password sicura
6. Ruolo: **Atlas admin** (o **Read and write to any database**)

### 4. Ottieni Connection String

1. Vai su **Database** → **Connect**
2. Scegli **Connect your application**
3. Copia la connection string (esempio):
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```

### 5. Configura Backend

Nel file `backend/.env`:

```env
MONGODB_URI=mongodb+srv://timbrio_admin:LA_TUA_PASSWORD@cluster0.xxxxx.mongodb.net/timbrio?retryWrites=true&w=majority
```

Sostituisci:
- `timbrio_admin` con il tuo username
- `LA_TUA_PASSWORD` con la password del database user
- `cluster0.xxxxx` con il tuo cluster
- Aggiungi `/timbrio` prima di `?` per usare il database `timbrio`

### 6. Testa la connessione

```bash
cd backend
npm run dev
```

Dovresti vedere:
```
✅ MongoDB connesso con successo
📊 Database: timbrio
```

---

## 🔄 Come funziona la sincronizzazione

### Flusso di sincronizzazione:

1. **Timbratura offline** (senza connessione):
   - L'app salva le timbrature in `AsyncStorage` (locale)
   - Marca le timbrature come `pendingSync: true`

2. **Quando la connessione è disponibile**:
   - `SyncContext` rileva automaticamente la connessione
   - Invia tutte le timbrature pending al backend
   - Il backend salva in MongoDB
   - L'app rimuove le timbrature dal localStorage

3. **Sincronizzazione tra dispositivi**:
   - Tutti i dispositivi si connettono allo stesso MongoDB
   - Le timbrature sono immediatamente visibili su tutti i dispositivi
   - Il backend gestisce i conflitti e duplicati

### API Endpoint di sincronizzazione:

```javascript
POST /api/timbrature/sync
Headers: Authorization: Bearer <token>
Body: {
  timbrature: [
    {
      userId: "user123",
      data: "2024-01-15",
      entrata: "08:30:00",
      uscita: "17:30:00",
      qrToken: "token123",
      metodoTimbratura: "qr"
    }
  ]
}
```

---

## 📱 Test sincronizzazione multi-dispositivo

### Test 1: Timbratura offline e sincronizzazione

1. **Dispositivo A**: Disconnetti internet
2. **Dispositivo A**: Timbra entrata tramite QR
3. **Dispositivo A**: Verifica che sia salvata localmente
4. **Dispositivo A**: Riconnetti internet
5. **Dispositivo A**: Verifica che si sincronizzi automaticamente
6. **Dispositivo B**: Verifica che la timbratura appaia

### Test 2: Sincronizzazione in tempo reale

1. **Dispositivo A**: Timbra entrata (online)
2. **Dispositivo B**: Aggiorna la lista timbrature
3. **Dispositivo B**: La timbratura dovrebbe apparire immediatamente

---

## 🛠️ Troubleshooting

### MongoDB non si avvia

**Windows:**
```bash
# Verifica se il servizio è avviato
net start MongoDB

# Se non funziona, avvia manualmente:
"C:\Program Files\MongoDB\Server\7.0\bin\mongod.exe" --dbpath="C:\data\db"
```

**macOS/Linux:**
```bash
# Verifica status
sudo systemctl status mongod

# Avvia se non è in esecuzione
sudo systemctl start mongod
```

### Errore di connessione al backend

1. Verifica che MongoDB sia in esecuzione:
   ```bash
   # Windows
   net start MongoDB
   
   # macOS/Linux
   sudo systemctl status mongod
   ```

2. Verifica la URI in `backend/.env`:
   ```env
   MONGODB_URI=mongodb://localhost:27017/timbrio
   ```

3. Verifica che la porta 27017 non sia bloccata dal firewall

### Errore "Authentication failed" (MongoDB Atlas)

1. Verifica username e password nel connection string
2. Assicurati che il database user abbia i permessi corretti
3. Verifica che il tuo IP sia nella whitelist di Network Access

### Timbrature non si sincronizzano

1. Verifica la connessione internet
2. Controlla i log del backend per errori
3. Verifica che il token JWT sia valido
4. Controlla `SyncContext` nel frontend

---

## 📊 Struttura Database

Il database MongoDB contiene le seguenti collezioni:

- **users**: Utenti del sistema
- **timbrature**: Timbrature registrate
- **ferie**: Richieste ferie
- **giustificazioni**: Giustificazioni assenze
- **documenti**: Documenti aziendali
- **notifiche**: Notifiche sistema

### Esempio documento Timbratura:

```json
{
  "_id": ObjectId("..."),
  "userId": "user123",
  "data": ISODate("2024-01-15T00:00:00Z"),
  "entrata": "08:30:00",
  "uscita": "17:30:00",
  "qrToken": "token123",
  "metodoTimbratura": "qr",
  "oreTotali": 8.5,
  "approvata": true,
  "createdAt": ISODate("2024-01-15T08:30:00Z")
}
```

---

## 🔐 Sicurezza

### Per produzione:

1. **MongoDB Atlas**:
   - Usa IP whitelist specifici (non `0.0.0.0/0`)
   - Abilita encryption at rest
   - Configura backup automatici

2. **Autenticazione**:
   - Usa password forti per database users
   - Ruota regolarmente le credenziali
   - Usa MongoDB Realm per autenticazione avanzata

3. **Network**:
   - Usa VPN per connessioni remote
   - Configura firewall appropriato
   - Abilita audit logging

---

## 📚 Risorse

- [Documentazione MongoDB](https://docs.mongodb.com/)
- [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
- [Mongoose Documentation](https://mongoosejs.com/docs/)
- [Backend README](./backend/README.md)

---

## ✅ Checklist Setup

- [ ] MongoDB installato e avviato (locale) o account Atlas creato (cloud)
- [ ] File `backend/.env` configurato con `MONGODB_URI`
- [ ] Backend avviato e connesso a MongoDB
- [ ] Test sincronizzazione tra dispositivi funzionante
- [ ] Verifica che le timbrature appaiano su tutti i dispositivi

---

**Domande?** Controlla i log del backend o apri una issue sul repository.

