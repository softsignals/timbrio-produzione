# 🔍 Verifica Connection String MongoDB

L'errore `ENOTFOUND _mongodb._tcp.cluster.mongodb.net` indica che la connection string non è corretta.

## ✅ Connection String Corretta

La tua connection string dovrebbe essere nel formato:

```
mongodb+srv://timbrio:timbr10@cluster0.ijgnbk8.mongodb.net/timbrio?retryWrites=true&w=majority
```

## 📝 Controlla il file `.env`

Apri il file `backend/.env` e verifica che la riga `MONGODB_URI` sia esattamente così:

```env
MONGODB_URI=mongodb+srv://timbrio:timbr10@cluster0.ijgnbk8.mongodb.net/timbrio?retryWrites=true&w=majority
```

## ⚠️ Errori Comuni

1. **Manca il nome del database** (`/timbrio`):
   ❌ `mongodb+srv://timbrio:timbr10@cluster0.ijgnbk8.mongodb.net?retryWrites=true&w=majority`
   ✅ `mongodb+srv://timbrio:timbr10@cluster0.ijgnbk8.mongodb.net/timbrio?retryWrites=true&w=majority`

2. **Spazi nella connection string**:
   ❌ `MONGODB_URI = mongodb+srv://...`
   ✅ `MONGODB_URI=mongodb+srv://...`

3. **Virgolette nella connection string**:
   ❌ `MONGODB_URI="mongodb+srv://..."`
   ✅ `MONGODB_URI=mongodb+srv://...`

4. **Username o password sbagliati**: Verifica che username e password siano corretti

## 🔧 Come Correggere

1. Apri `backend/.env` in un editor di testo
2. Trova la riga `MONGODB_URI=`
3. Assicurati che sia esattamente:
   ```
   MONGODB_URI=mongodb+srv://timbrio:timbr10@cluster0.ijgnbk8.mongodb.net/timbrio?retryWrites=true&w=majority
   ```
4. Salva il file
5. Riesegui `npm run seed`

