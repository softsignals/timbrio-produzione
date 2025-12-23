# 🔍 Verifica Database e Credenziali

## ⚠️ Errore 401 - Credenziali non valide

Se ricevi l'errore 401, significa che le credenziali sono sbagliate o il database non è stato popolato.

## ✅ Verifica e Popola il Database

### 1. Assicurati che il database sia popolato

Esegui lo script di seed:

```bash
cd backend
npm run seed
```

Dovresti vedere:
```
✅ Utente Admin creato
✅ Utente Manager creato
✅ Utente Receptionist creato
✅ Dipendente creato
🎉 Seeding completato con successo!
```

### 2. Credenziali Corrette

Usa queste credenziali esatte:

| Ruolo | Email | Password |
|-------|-------|----------|
| **Admin** | `admin@timbrio.com` | `Admin@123456` |
| **Manager** | `manager@timbrio.com` | `Manager@123` |
| **Receptionist** | `receptionist@timbrio.com` | `reception123` |
| **Dipendente** | `dipendente@timbrio.com` | `dipendente123` |

### 3. Testa il Login

1. Avvia il backend: `npm run dev`
2. Avvia l'app mobile
3. Usa una delle credenziali sopra (es: admin@timbrio.com / Admin@123456)
4. Controlla il terminal del backend per eventuali errori

## 🐛 Troubleshooting

### Se lo script seed fallisce:
- Verifica che `MONGODB_URI` sia corretto nel file `.env`
- Verifica che MongoDB sia accessibile
- Controlla che la connection string sia completa

### Se il login continua a fallire:
- Verifica che stai usando le credenziali ESATTE (attenzione a maiuscole/minuscole)
- Controlla il terminal del backend per vedere quale errore viene restituito
- Verifica che l'utente sia attivo nel database

### Per verificare gli utenti nel database:

Puoi creare un semplice script di verifica o usare MongoDB Compass per vedere gli utenti.

