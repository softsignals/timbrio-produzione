# 🚀 Quick Start - Timbrio App Ristrutturata

## ⚡ Installazione e Avvio

### 1. Installa le dipendenze
```bash
npm install
```

### 2. Per iOS (solo se sviluppi su Mac)
```bash
cd ios
pod install
cd ..
```

### 3. Avvia l'app
```bash
# Opzione 1: Pulisci cache e avvia
npx expo start --clear

# Opzione 2: Build nativo (più stabile)
npm run android   # Per Android
npm run ios       # Per iOS
```

### 4. Apri l'app
- Premi **`a`** per Android
- Premi **`i`** per iOS
- Oppure scansiona il QR code con Expo Go

---

## 🔐 Login

Usa le credenziali esistenti nel sistema (controlla `src/data/users.json`)

---

## 🎯 Cosa Testare

### 🏠 Dashboard (Tab Home)
1. **Verifica il messaggio di benvenuto** con il tuo nome
2. **Guarda l'ora in tempo reale** nell'header
3. **Premi il grande pulsante "TIMBRA ORA"**
4. **Verifica che il contatore ore settimanali** funzioni
5. **Clicca su una delle card info** (ferie, permessi, buste paga)
6. **Pull to refresh** trascinando verso il basso

### ⏰ Timbratura (Tab centrale)
1. **Osserva l'orologio gigante** che si aggiorna ogni secondo
2. **Timbra ingresso** (pulsante gradiente)
3. **Verifica che appaia la card "Timbratura di Oggi"**
4. **Prova a iniziare una pausa**
5. **Guarda la lista "Ultimi 7 giorni"**
6. **Clicca "Storico completo"** per vedere il calendario

### 📄 Documenti (Tab documenti)
1. **Passa tra i tab** "Buste Paga" e "Documenti"
2. **Nel tab Buste Paga**:
   - Cambia anno con le frecce
   - Guarda il grafico degli stipendi
   - Premi l'occhio per nascondere/mostrare importi
   - Clicca su una busta paga
3. **Nel tab Documenti**:
   - Usa la barra di ricerca
   - Nota i badge "NUOVO"
   - Clicca su un documento

### 🏖️ Ferie (Tab ferie)
1. **Guarda i contatori** ferie e permessi residui
2. **Premi "Richiedi Ferie/Permesso"**
3. **Compila il form** nel modal:
   - Scegli tipo (ferie/permesso)
   - Inserisci date (formato: YYYY-MM-DD)
   - Aggiungi motivazione
   - Invia
4. **Guarda il calendario** con i giorni marcati
5. **Usa i filtri** (tutti, approvata, in_attesa, rifiutata)
6. **Scorri le richieste** esistenti

### 👤 Profilo (Tab profilo)
1. **Verifica le tue informazioni** personali e lavorative
2. **Attiva/disattiva il tema scuro** (toggle)
3. **Clicca "Modifica Password"**
4. **Compila il form** e salva
5. **Premi "Esci dall'Account"** (poi fai login di nuovo)

---

## 🎨 Features da Notare

### Animazioni
- ✨ **Tutte le card entrano con animazione**
- ✨ **I pulsanti si rimpiccioliscono al tocco**
- ✨ **Il toggle tema scorre fluidamente**
- ✨ **Le tab hanno effetto scale quando attive**
- ✨ **I modal entrano dal basso**

### Gradienti
- 🌈 **Header** di ogni sezione
- 🌈 **Pulsanti principali**
- 🌈 **Icone delle tab attive**
- 🌈 **Card speciali** (orologio, contatori)
- 🌈 **Avatar** nel profilo

### Dark Mode
- 🌙 **Attiva dal profilo**
- 🌙 **Tutti i colori si adattano**
- 🌙 **Gradienti più luminosi**
- 🌙 **Contrasti ottimizzati**

---

## 🐛 Troubleshooting

### L'app non si avvia?
```bash
# Pulisci tutto
rm -rf node_modules
npm install
npx expo start --clear
```

### Errori su iOS?
```bash
cd ios
rm -rf Pods Podfile.lock
pod install
cd ..
```

### Errori su Android?
```bash
cd android
./gradlew clean
cd ..
```

### Le animazioni non funzionano?
- **Riavvia completamente** l'app (non solo refresh)
- Chiudi l'app dal task manager
- Riaprila da zero

### I grafici non si vedono?
- Verifica che `react-native-svg` sia installato
- Riavvia l'app completamente

### Il calendario è in inglese?
- Verifica `LocaleConfig` in `FerieScreen.js`
- È configurato in italiano, ma potrebbe servire un riavvio

---

## 📱 Test Completo (Checklist)

### Navigazione Bottom Tab
- [ ] Posso navigare tra tutte le 5 tab
- [ ] L'icona attiva ha il gradiente
- [ ] Il label è evidenziato
- [ ] La transizione è fluida

### Dashboard
- [ ] Vedo il messaggio di benvenuto
- [ ] L'ora si aggiorna in tempo reale
- [ ] Il pulsante TIMBRA funziona
- [ ] Le card info sono cliccabili
- [ ] I contatori sono corretti
- [ ] Pull to refresh funziona

### Timbratura
- [ ] L'orologio è grande e leggibile
- [ ] I pulsanti timbra funzionano
- [ ] La pausa funziona
- [ ] Vedo le timbrature recenti
- [ ] Posso andare allo storico

### Documenti
- [ ] I tab switchano correttamente
- [ ] Il grafico si visualizza
- [ ] Posso cambiare anno
- [ ] La ricerca funziona
- [ ] I badge "NUOVO" appaiono

### Ferie
- [ ] I contatori sono visibili
- [ ] Posso richiedere ferie
- [ ] Il modal si apre/chiude
- [ ] Il calendario mostra i giorni
- [ ] I filtri funzionano

### Profilo
- [ ] Vedo tutte le mie info
- [ ] Il toggle tema funziona
- [ ] Posso cambiare password
- [ ] Il logout funziona

### Generale
- [ ] Dark mode funziona ovunque
- [ ] Tutte le animazioni sono fluide
- [ ] Non ci sono lag
- [ ] I gradienti sono visibili
- [ ] L'app non crasha

---

## 🎉 Buon Test!

Se tutto funziona, hai un'app **completamente ristrutturata** con:
- ✅ 5 sezioni complete
- ✅ Bottom navigation moderna
- ✅ Grafici interattivi
- ✅ Calendario ferie
- ✅ Design professionale
- ✅ Animazioni fluide
- ✅ Dark mode completo

---

**💡 Consiglio**: Testa prima con il **tema chiaro**, poi attiva il **dark mode** dal profilo e riprova tutto!

