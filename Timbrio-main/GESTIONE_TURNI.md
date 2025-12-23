# 🕐 Sistema di Gestione Turni

## Panoramica

Il sistema di gestione turni permette all'admin di creare turni lavorativi per ogni dipendente e agli utenti di iniziare, fermare e mettere in pausa i loro turni scansionando codici QR.

## Funzionalità

### Per Admin
- ✅ **CRUD completo** per i turni (crea, leggi, aggiorna, elimina)
- ✅ Creare turni settimanali/mensili/singoli
- ✅ Assegnare turni a specifici dipendenti
- ✅ Attivare/disattivare turni
- ✅ Visualizzare tutti i turni

### Per Dipendenti
- ✅ **Iniziare un turno** scansionando un QR code
- ✅ **Fermare un turno** scansionando un QR code
- ✅ **Mettere in pausa** un turno scansionando un QR code
- ✅ **Riprendere** un turno in pausa scansionando un QR code
- ✅ Visualizzare i propri turni attivi
- ✅ Visualizzare lo storico dei turni

## Modelli Database

### Turno
Contiene la definizione del turno:
- `userId`: Dipendente a cui è assegnato
- `nome`: Nome del turno (es. "Turno Mattina")
- `giornoSettimana`: 0-6 (Domenica-Sabato)
- `dataInizio` / `dataFine`: Date opzionali per turni periodici
- `orarioEntrata`: Orario di inizio (HH:MM)
- `orarioUscita`: Orario di fine (HH:MM)
- `pausaPranzo`: Durata pausa pranzo (HH:MM)
- `ripetizione`: 'settimanale' | 'mensile' | 'singolo'
- `attivo`: Boolean

### TurnoAttivo
Contiene un turno in corso o terminato:
- `userId`: Dipendente
- `turnoId`: Riferimento al turno
- `dataInizio` / `dataFine`: Date effettive
- `orarioInizio` / `orarioFine`: Timestamp effettivi
- `pause`: Array di pause con inizio/fine/durata
- `oreLavorate`: Ore totali calcolate automaticamente
- `stato`: 'in_corso' | 'in_pausa' | 'terminato'
- `qrTokenInizio` / `qrTokenFine`: Token QR usati

## API Endpoints

### CRUD Turni (Admin)
```
GET    /api/turni              - Lista turni (filtri: userId, giornoSettimana, attivo)
GET    /api/turni/:id          - Dettaglio turno
POST   /api/turni              - Crea nuovo turno (admin)
PUT    /api/turni/:id          - Aggiorna turno (admin)
DELETE /api/turni/:id          - Elimina turno (admin)
PATCH  /api/turni/:id/toggle-status - Attiva/disattiva turno (admin)
```

### Gestione Turni Attivi
```
GET  /api/turni/attivi         - Lista turni in corso/pausa
GET  /api/turni/storico        - Storico turni (paginato)
POST /api/turni/inizia         - Inizia un turno (via QR)
POST /api/turni/ferma          - Ferma un turno (via QR)
POST /api/turni/pausa          - Metti in pausa (via QR)
POST /api/turni/riprendi       - Riprendi da pausa (via QR)
```

## Utilizzo QR Code

Il QR code può essere utilizzato per:
1. **Timbratura tradizionale** (entrata/uscita)
2. **Gestione turni** (inizio/ferma/pausa/ripresa)

Il QR code include un campo `action`:
- `action: 'timbratura'` → Gestisce entrata/uscita
- `action: 'turno'` → Gestisce turni (richiede `turnoId`)

### Esempio QR Code per Turni
```json
{
  "token": "abc123...",
  "timestamp": 1234567890,
  "type": "timbrio_qr",
  "action": "turno",
  "turnoId": "507f1f77bcf86cd799439011"
}
```

## Frontend

### Context: `TurniContext`
Fornisce:
- `turni`: Lista turni dell'utente
- `turniAttivi`: Lista turni in corso/pausa
- `iniziaTurno(turnoId, qrToken)`
- `fermaTurno(qrToken)`
- `mettiInPausa(qrToken)`
- `riprendiTurno(qrToken)`
- `createTurno(turnoData)` (admin)
- `updateTurno(id, updates)` (admin)
- `deleteTurno(id)` (admin)

### Scanner QR
Il `QRScannerScreen` gestisce automaticamente:
- Riconoscimento del tipo di QR (timbratura o turno)
- Logica per iniziare/fermare/riprendere turni
- Feedback visivo all'utente

## Seeding Database

Il seed crea automaticamente:
- 5 turni settimanali per il dipendente (Lun-Ven, 8:00-17:00)

Per eseguire il seed:
```bash
cd backend
npm run seed
```

## Note Importanti

1. **Un solo turno attivo**: Un utente non può avere più di un turno in corso contemporaneamente
2. **Calcolo automatico ore**: Le ore lavorate vengono calcolate automaticamente sottraendo le pause
3. **Validazione QR**: Il QR code deve essere valido (non scaduto) e del tipo corretto
4. **Permessi**: Solo admin può creare/modificare/eliminare turni
5. **Turni in pausa**: Un turno in pausa può essere ripreso, ma non può essere iniziato un nuovo turno

## Prossimi Passi

- [ ] Schermata admin per gestione turni (web)
- [ ] Schermata dipendente per visualizzare turni attivi
- [ ] Notifiche quando un turno si avvicina alla fine
- [ ] Report statistiche turni

