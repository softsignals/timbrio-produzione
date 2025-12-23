# 🌐 Configurazione IP per Dispositivi Mobili

## ⚠️ Problema

Quando usi un **dispositivo iOS/Android fisico**, non puoi usare `localhost` per connetterti al backend sulla tua macchina. Devi usare l'**IP locale** della tua macchina.

## 🔍 Come Trovare il Tuo IP Locale

### Windows

1. Apri **Prompt dei comandi** (CMD) o **PowerShell**
2. Esegui:
   ```cmd
   ipconfig
   ```
3. Cerca **"IPv4 Address"** nella sezione:
   - **"Ethernet adapter"** (se usi cavo)
   - **"Wireless LAN adapter Wi-Fi"** (se usi WiFi)

Esempio:
```
Wireless LAN adapter Wi-Fi:
   IPv4 Address. . . . . . . . . . . : 192.168.1.100
```

### Mac

1. Apri **Terminal**
2. Esegui:
   ```bash
   ifconfig | grep "inet " | grep -v 127.0.0.1
   ```
3. Cerca l'IP che inizia con `192.168.` o `10.0.`

### Linux

1. Apri **Terminal**
2. Esegui:
   ```bash
   ip addr show | grep "inet " | grep -v 127.0.0.1
   ```

## 🔧 Configurazione Frontend

1. Apri il file `src/services/api.js`

2. Trova questa sezione:
   ```javascript
   const USE_LOCAL_IP = true; // Cambia in false per usare localhost (solo emulatori)
   const LOCAL_IP = 'YOUR_LOCAL_IP'; // SOSTITUISCI con il tuo IP locale
   ```

3. Sostituisci `YOUR_LOCAL_IP` con il tuo IP locale:
   ```javascript
   const LOCAL_IP = '192.168.1.100'; // Il tuo IP locale
   ```

4. Se stai usando un **emulatore iOS/Android**, cambia:
   ```javascript
   const USE_LOCAL_IP = false; // Usa localhost per emulatori
   ```

## 🔧 Configurazione Backend

1. Verifica che il file `backend/.env` contenga:
   ```env
   ALLOWED_ORIGINS=http://localhost:8081,http://localhost:19006
   ```

2. Il backend è già configurato per accettare tutte le origini in development.

## ✅ Verifica

1. **Assicurati che il backend sia avviato**:
   ```bash
   cd backend
   npm run dev
   ```

2. **Verifica che backend e dispositivo mobile siano sulla stessa rete WiFi**

3. **Testa la connessione**:
   - Avvia l'app mobile
   - Prova a fare login
   - Se funziona, vedrai le richieste nel terminal del backend

## 🚨 Troubleshooting

### "Network Error"
- ✅ Verifica che il backend sia avviato
- ✅ Verifica che l'IP nel file `api.js` sia corretto
- ✅ Verifica che dispositivo mobile e PC siano sulla stessa rete WiFi
- ✅ Disabilita temporaneamente firewall/antivirus che potrebbero bloccare la porta 5000

### "CORS Error"
- ✅ Il backend è già configurato per permettere tutte le origini in development
- ✅ Verifica che `NODE_ENV=development` nel file `.env`

### "Connection Refused"
- ✅ Verifica che la porta 5000 non sia già in uso
- ✅ Verifica che il backend sia in ascolto su `0.0.0.0` (non solo `localhost`)

## 📝 Note

- **Per emulatori**: Usa `localhost` o `10.0.2.2` (Android emulator)
- **Per dispositivi fisici**: Usa sempre l'IP locale della tua macchina
- **IP dinamico**: Se cambi rete WiFi, devi aggiornare l'IP nel file `api.js`

