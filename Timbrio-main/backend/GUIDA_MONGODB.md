# 🗄️ Guida Completa: Collegare MongoDB al Backend

## 📋 Informazioni Necessarie

Per collegare MongoDB al backend, hai bisogno di:

1. **MONGODB_URI** - La stringa di connessione al database
2. **JWT_SECRET** - Una chiave segreta per i token JWT (qualsiasi stringa lunga e casuale)

---

## 🎯 OPZIONE 1: MongoDB Atlas (Cloud - CONSIGLIATO ⭐)

**Perché sceglierlo:**
- ✅ Non serve installare nulla sul PC
- ✅ Gratis fino a 512MB
- ✅ Funziona subito
- ✅ Accessibile da qualsiasi dispositivo
- ✅ Backup automatico

### Passo 1: Crea Account MongoDB Atlas

1. Vai su: https://www.mongodb.com/cloud/atlas/register
2. Clicca su **"Try Free"** o **"Sign Up"**
3. Compila il form con:
   - Email
   - Password
   - Nome
4. Accetta i termini e clicca **"Create your Atlas account"**

### Passo 2: Crea un Cluster

1. Dopo il login, clicca su **"Build a Database"**
2. Seleziona il piano **FREE** (M0 Sandbox)
3. Scegli:
   - **Cloud Provider**: AWS (o quello che preferisci)
   - **Region**: Scegli la più vicina (es. `eu-central-1` per Italia)
4. Lascia il nome cluster di default: `Cluster0`
5. Clicca **"Create"** (ci vogliono 3-5 minuti)

### Passo 3: Configura Accesso di Rete

1. Nel menu laterale, vai su **"Network Access"**
2. Clicca su **"Add IP Address"**
3. Per demo/test, clicca su **"Allow Access from Anywhere"**
   - Questo aggiunge `0.0.0.0/0` (tutti gli IP)
   - ⚠️ Per produzione, usa solo IP specifici
4. Clicca **"Confirm"**

### Passo 4: Crea Database User

1. Vai su **"Database Access"** nel menu laterale
2. Clicca su **"Add New Database User"**
3. Seleziona **"Password"** come metodo di autenticazione
4. Inserisci:
   - **Username**: `timbrio_user` (o quello che preferisci)
   - **Password**: Genera una password sicura (salvala!)
   - Clicca su **"Autogenerate Secure Password"** se vuoi
5. Per **Database User Privileges**, seleziona **"Atlas admin"**
6. Clicca **"Add User"**

### Passo 5: Ottieni Connection String

1. Vai su **"Database"** nel menu laterale
2. Clicca su **"Connect"** sul tuo cluster
3. Seleziona **"Connect your application"**
4. Scegli:
   - **Driver**: Node.js
   - **Version**: 5.5 or later
5. Copia la connection string che appare (tipo):
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```

### Passo 6: Crea File .env

Nel folder `backend`, crea un file chiamato `.env` e inserisci:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# MongoDB Configuration - SOSTITUISCI CON LA TUA CONNECTION STRING
MONGODB_URI=mongodb+srv://timbrio_user:LA_TUA_PASSWORD_QUI@cluster0.xxxxx.mongodb.net/timbrio?retryWrites=true&w=majority

# IMPORTANTE: 
# 1. Sostituisci <username> con il tuo username (es: timbrio_user)
# 2. Sostituisci <password> con la password che hai creato (NON CI SONO SPAZI!)
# 3. Sostituisci cluster0.xxxxx con il tuo cluster
# 4. Aggiungi /timbrio prima di ? per usare il database chiamato "timbrio"

# JWT Configuration
JWT_SECRET=questa-e-una-chiave-segreta-molto-lunga-e-sicura-cambiala-in-produzione-123456789
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=altra-chiave-segreta-per-refresh-token-987654321
JWT_REFRESH_EXPIRES_IN=30d

# CORS Configuration
CLIENT_URL=http://localhost:8081
ALLOWED_ORIGINS=http://localhost:8081,http://localhost:19006

# Email Configuration (opzionale per ora)
EMAIL_SERVICE=gmail
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-specific-password
EMAIL_FROM=Timbrio <noreply@timbrio.com>

# File Upload Configuration
MAX_FILE_SIZE=10485760
UPLOAD_PATH=./uploads
ALLOWED_FILE_TYPES=.pdf,.doc,.docx,.jpg,.jpeg,.png

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Admin Default Credentials
ADMIN_EMAIL=admin@timbrio.com
ADMIN_PASSWORD=Admin@123456
```

**⚠️ IMPORTANTE**: Nella `MONGODB_URI`, assicurati di:
- Sostituire `<username>` con il tuo username (es: `timbrio_user`)
- Sostituire `<password>` con la password che hai scelto
- Se la password contiene caratteri speciali, devi codificarli:
  - `@` diventa `%40`
  - `#` diventa `%23`
  - `$` diventa `%24`
  - `%` diventa `%25`
  - `&` diventa `%26`
  - ecc.
- Aggiungere `/timbrio` prima di `?` per specificare il nome del database

**Esempio di MONGODB_URI corretta:**
```
mongodb+srv://timbrio_user:miaPassword123@cluster0.abc123.mongodb.net/timbrio?retryWrites=true&w=majority
```

### Passo 7: Testa la Connessione

```bash
cd backend
npm run dev
```

Dovresti vedere:
```
✅ MongoDB connesso con successo
📊 Database: timbrio
🚀 Server Timbrio avviato con successo!
```

---

## 💻 OPZIONE 2: MongoDB Locale (Sul tuo PC)

Se preferisci installare MongoDB sul tuo computer:

### Windows:

1. **Scarica MongoDB**:
   - Vai su: https://www.mongodb.com/try/download/community
   - Scegli:
     - Version: Latest (7.0)
     - Platform: Windows
     - Package: MSI
   - Clicca **Download**

2. **Installa MongoDB**:
   - Esegui il file `.msi` scaricato
   - Scegli **"Complete"** installation
   - Installa **MongoDB Compass** (utile per vedere i dati)
   - Scegli **"Install MongoDB as a Service"**
   - Usa la porta di default: `27017`

3. **Crea File .env**:

```env
# MongoDB Configuration - Locale
MONGODB_URI=mongodb://localhost:27017/timbrio

# ... resto uguale all'opzione 1
```

4. **Avvia MongoDB** (se non si avvia automaticamente):

```bash
# Apri PowerShell come Amministratore
net start MongoDB
```

5. **Testa la Connessione**:

```bash
cd backend
npm run dev
```

---

## 🔧 Risoluzione Problemi Comuni

### Errore: "MongoServerError: Authentication failed"

**Problema**: Username o password sbagliati

**Soluzione**:
1. Verifica username e password nella connection string
2. Assicurati che non ci siano spazi
3. Se la password ha caratteri speciali, codificali (`@` → `%40`)
4. Verifica che il database user esista su MongoDB Atlas

### Errore: "getaddrinfo ENOTFOUND"

**Problema**: Connection string non valida o cluster non raggiungibile

**Soluzione**:
1. Verifica che la connection string sia corretta
2. Verifica che il tuo IP sia nella whitelist di MongoDB Atlas
3. Prova a copiare di nuovo la connection string da Atlas

### Errore: "MongoNetworkError: connect ECONNREFUSED"

**Problema**: MongoDB locale non è avviato

**Soluzione**:
```bash
# Windows
net start MongoDB

# macOS/Linux
sudo systemctl start mongod
```

### Errore: Porta 27017 già in uso

**Problema**: Un'altra istanza di MongoDB è già in esecuzione

**Soluzione**:
```bash
# Windows - Termina il processo
taskkill /F /IM mongod.exe

# Poi riavvia
net start MongoDB
```

---

## ✅ Checklist Configurazione

- [ ] Account MongoDB Atlas creato (o MongoDB locale installato)
- [ ] Cluster creato (o MongoDB locale avviato)
- [ ] Network Access configurato (whitelist IP)
- [ ] Database User creato con username e password
- [ ] Connection string copiata
- [ ] File `.env` creato nella cartella `backend`
- [ ] `MONGODB_URI` inserita correttamente nel `.env`
- [ ] `JWT_SECRET` inserito nel `.env`
- [ ] Backend avviato con `npm run dev`
- [ ] Messaggio "✅ MongoDB connesso con successo" visibile

---

## 📞 Esempio File .env Completo (Atlas)

```env
PORT=5000
NODE_ENV=development

# MongoDB Atlas - SOSTITUISCI username, password e cluster!
MONGODB_URI=mongodb+srv://mio_username:mioPassword123@cluster0.abc123.mongodb.net/timbrio?retryWrites=true&w=majority

JWT_SECRET=chiave-segreta-molto-lunga-e-sicura-per-jwt-token-123456789-abcdefgh
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=altra-chiave-segreta-per-refresh-token-987654321-zyxwvuts
JWT_REFRESH_EXPIRES_IN=30d

CLIENT_URL=http://localhost:8081
ALLOWED_ORIGINS=http://localhost:8081,http://localhost:19006

EMAIL_SERVICE=gmail
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-password
EMAIL_FROM=Timbrio <noreply@timbrio.com>

MAX_FILE_SIZE=10485760
UPLOAD_PATH=./uploads
ALLOWED_FILE_TYPES=.pdf,.doc,.docx,.jpg,.jpeg,.png

RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

ADMIN_EMAIL=admin@timbrio.com
ADMIN_PASSWORD=Admin@123456
```

---

**Se hai ancora problemi, condividi il messaggio di errore completo!** 🚀

