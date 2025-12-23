# 🔐 Credenziali Utenti

## 📋 Utenti Base (4 utenti)

Dopo aver eseguito `npm run seed` nel backend, puoi usare queste credenziali:

### 1. Admin
- **Email**: `admin@timbrio.com`
- **Password**: `Admin@123456`

### 2. Manager
- **Email**: `manager@timbrio.com`
- **Password**: `Manager@123`

### 3. Receptionist
- **Email**: `receptionist@timbrio.com`
- **Password**: `reception123`

### 4. Dipendente
- **Email**: `dipendente@timbrio.com`
- **Password**: `dipendente123`

## ⚠️ Se ricevi errore 401

1. **Verifica che il database sia popolato**:
   ```bash
   cd backend
   npm run seed
   ```

2. **Controlla che le credenziali siano esatte** (attenzione a maiuscole/minuscole)

3. **Verifica che il backend sia avviato**:
   ```bash
   cd backend
   npm run dev
   ```

4. **Controlla il terminal del backend** per vedere se ci sono errori durante il login

## 🔍 Debug

Se continui ad avere problemi, controlla nel terminal del backend quale errore viene restituito durante il tentativo di login.

