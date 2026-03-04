# 🧪 GUIDA RAPIDA TEST GESTIONE DOMINI

## ⚡ Test Veloce (3 minuti)

### 1. Avvia il server di sviluppo
```bash
npm run dev
```
Aspetta che appaia: `✓ Ready in Xs`

### 2. Apri il browser
http://localhost:3000

### 3. Esegui lo script di test
**In un nuovo terminale:**
```bash
node scripts/test-gestione-domini.js
```

Lo script ti permetterà di:
- ✅ Vedere tutte le collaborazioni web design esistenti
- ✅ Creare automaticamente domini di test (in scadenza o scaduti)
- ✅ Testare le API

---

## 🎯 Test Passo-Passo (Manuale)

### Step 1: Login
1. Vai su http://localhost:3000/Login
2. Accedi con le tue credenziali

### Step 2: Crea/Trova una Collaborazione Web Design
**Se NON hai collaborazioni:**
1. Vai su `/Lista_webdesigner`
2. Clicca su un web designer
3. Crea una nuova collaborazione

**Se hai già collaborazioni:**
1. Vai su `/Lista_webdesigner`
2. Clicca su un web designer
3. Clicca su uno dei suoi progetti

### Step 3: Aggiungi Dominio
Nella pagina del progetto:
1. Scorri fino alla sezione **"🌐 Gestione Dominio"**
2. Compila:
   - **URL Dominio**: `www.test-cliente.it`
   - **Data Acquisto**: Scegli una data
   
   **Per testare gli alert:**
   - ⚠️ **In scadenza** (25 giorni): Data `2025-03-08` (circa 340 giorni fa)
   - 🚨 **Scaduto**: Data `2025-02-25` (circa 370 giorni fa)
   - ✅ **OK**: Data `2026-01-01` (recente)

3. La **Data Scadenza** si calcola automaticamente (1 anno dopo)

### Step 4: Verifica Alert Visivi
Nella stessa pagina dovresti vedere:
- 🚨 Badge rosso lampeggiante se scaduto
- ⚠️ Badge arancione con giorni rimanenti se in scadenza (≤30gg)
- 📅 Messaggio giallo se prossimo alla scadenza (≤60gg)

### Step 5: Dashboard Amministratori
1. Vai su http://localhost:3000/Gestione-Domini
2. Verifica:
   - ✅ Card statistiche (Totali, In Scadenza, Scaduti, OK)
   - ✅ Filtri funzionanti
   - ✅ Tabella con tutti i domini

### Step 6: Test API (Opzionale)
**Nel browser o con curl:**

```bash
# Tutti i domini
curl http://localhost:3000/api/domini/scadenze

# Solo domini in scadenza
curl http://localhost:3000/api/domini/scadenze?onlyExpiring=true

# Invia alert manuale
curl -X POST http://localhost:3000/api/domini/scadenze
```

### Step 7: Test Script Cron
```bash
node scripts/cron-domini-scadenza.js
```

Dovresti vedere un output tipo:
```
🔍 Inizio controllo domini in scadenza...
📅 Data controllo: 2/3/2026, 10:30:00

⚠️  Trovati 1 domini in scadenza
...
✅ Processo completato!
```

---

## ✅ Checklist Completa

### Funzionalità UI
- [ ] Input URL dominio funziona
- [ ] Input data acquisto funziona
- [ ] Data scadenza calcolata automaticamente
- [ ] Badge alert visibile per domini in scadenza
- [ ] Messaggio alert visibile sotto i campi
- [ ] Dashboard `/Gestione-Domini` carica correttamente
- [ ] Card statistiche mostrano numeri corretti
- [ ] Filtri funzionano (Tutti, In Scadenza, Scaduti, OK)
- [ ] Tabella mostra tutti i domini
- [ ] Link "Visualizza" porta alla pagina corretta

### Funzionalità API
- [ ] GET `/api/domini/scadenze` ritorna tutti i domini
- [ ] GET `/api/domini/scadenze?onlyExpiring=true` ritorna solo in scadenza
- [ ] POST `/api/domini/scadenze` invia alert e segna come notificati
- [ ] PATCH `/api/collaborazioni-webdesign/[id]` aggiorna dominio
- [ ] Calcolo automatico dataScadenza funziona

### Script e Automazione
- [ ] `node scripts/test-gestione-domini.js` funziona
- [ ] `node scripts/cron-domini-scadenza.js` rileva domini in scadenza
- [ ] Alert vengono segnati come inviati (`alertInviato: true`)

---

## 🐛 Problemi Comuni

### "Nessuna collaborazione trovata"
**Soluzione:** Crea prima una collaborazione web design tramite l'interfaccia web.

### "Cannot connect to MongoDB"
**Soluzione:** Verifica che `MONGODB_URI` sia corretto in `.env.local`

### "404 Not Found" su /Gestione-Domini
**Soluzione:** Riavvia il server (`npm run dev`)

### Date non si salvano
**Soluzione:** Usa formato `YYYY-MM-DD` (es: 2026-01-15)

### Alert non appaiono
**Soluzione:** Verifica che la data di scadenza sia entro 30 giorni da oggi

---

## 📸 Cosa Aspettarsi

### Timeline Web Designer
```
🌐 Gestione Dominio
┌─────────────────────────────────────────┐
│ URL Dominio: www.test-cliente.it        │
│ Data Acquisto: 08/03/2025               │
│ Data Scadenza: 08/03/2026  [⚠️ 25gg]   │
└─────────────────────────────────────────┘
⚠️ ALERT: Il dominio scadrà tra 25 giorni!
```

### Dashboard Admin
```
┌──────────┬─────────────┬─────────┬──────┐
│ Totali   │ In Scadenza │ Scaduti │  OK  │
│    5     │      2      │    1    │   2  │
└──────────┴─────────────┴─────────┴──────┘

Tabella con filtri e dettagli...
```

---

## 🎉 Test Completato!

Se tutto funziona:
1. ✅ Gli alert visivi appaiono correttamente
2. ✅ La dashboard mostra tutti i domini
3. ✅ Le API ritornano i dati corretti
4. ✅ Lo script cron rileva i domini in scadenza

💡 **Next Step:** Configura il cron job per esecuzione automatica quotidiana (vedi GESTIONE_DOMINI.md)
