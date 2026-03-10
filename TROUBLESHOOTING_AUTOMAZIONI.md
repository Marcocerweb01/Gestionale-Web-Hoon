# 🔍 Troubleshooting Automazioni Commenti

Guida completa per diagnosticare e risolvere problemi con le automazioni Instagram/Facebook.

---

## 🎯 Checklist Rapida

Prima di tutto, verifica questi 5 punti critici:

- [ ] **Webhook configurato su Meta App** → [Vai a Step 1](#step-1-verifica-webhook-meta)
- [ ] **Account sottoscritto ai webhook** → [Vai a Step 2](#step-2-sottoscrivi-account-ai-webhook)
- [ ] **accountId corretto nel DB** → [Vai a Step 3](#step-3-verifica-accountid)
- [ ] **Automazione attiva** → [Vai a Step 4](#step-4-verifica-automazioni-db)
- [ ] **Webhook raggiungibile** → [Vai a Step 5](#step-5-testa-webhook-manualmente)

---

## 🛠️ Diagnostica Step-by-Step

### Step 1: Verifica Webhook Meta

#### 1.1 Controlla Configurazione Meta App

1. Vai su [Meta for Developers](https://developers.facebook.com/apps/)
2. Seleziona la tua app
3. Sidebar → **Webhooks**
4. Verifica che ci sia un webhook configurato:
   - **Callback URL**: `https://your-domain.com/api/webhook/social`
   - **Verify Token**: Stesso valore di `META_WEBHOOK_VERIFY_TOKEN` nel .env
   - **Status**: ✅ Verified

#### 1.2 Verifica Eventi Sottoscritti

Per **Instagram**:
- ✅ `comments`
- ✅ `messages`

Per **Facebook Page**:
- ✅ `feed`
- ✅ `messages`

#### ⚠️ Problema Comune
Se il webhook NON è configurato o non è verificato:

```bash
# 1. Verifica che il webhook endpoint risponda
curl "https://your-domain.com/api/webhook/social?hub.mode=subscribe&hub.verify_token=YOUR_TOKEN&hub.challenge=test123"

# Dovrebbe rispondere con: test123
```

Se non risponde, il problema è nel deployment o nelle variabili d'ambiente.

---

### Step 2: Sottoscrivi Account ai Webhook

Anche SE il webhook è configurato su Meta, **ogni account Instagram/Facebook** deve essere sottoscritto individualmente.

#### 2.1 Sottoscrivi via API

Nel gestionale:
1. Vai su `/Operations/SocialAutomation`
2. Trova l'account
3. Click sul pulsante **"⚙️ Settings"** → **"Sottoscrivi webhook"**

Oppure usa l'API direttamente:

```bash
curl -X POST https://your-domain.com/api/social-accounts/ACCOUNT_ID/subscribe-webhook \
  -H "Cookie: YOUR_SESSION_COOKIE"
```

#### 2.2 Verifica Sottoscrizione

Controlla i log dell'API. Dovresti vedere:

```json
{
  "webhookUrl": "https://your-domain.com/api/webhook/social",
  "results": [
    {
      "type": "instagram_account",
      "result": { "success": true }
    }
  ]
}
```

#### ⚠️ Errori Comuni

**Errore: "Invalid OAuth access token"**
→ Il token è scaduto. Riconnetti l'account.

**Errore: "(#200) Provide valid app ID"**
→ L'app Meta non ha i permessi giusti.

---

### Step 3: Verifica accountId

Il problema più comune è il **mismatch tra accountId nel DB e pageId inviato da Meta**.

#### 3.1 Controlla accountId nel DB

Apri MongoDB (o usa un client GUI):

```javascript
// Nel MongoDB shell o Compass
db.socialaccounts.find({ status: 'active' }).pretty()

// Output esempio:
{
  "_id": ObjectId("..."),
  "accountId": "123456789012345",  // <-- QUESTO deve corrispondere!
  "platform": "instagram",
  "username": "test_account"
}
```

#### 3.2 Trova il pageId Corretto

Il pageId che Meta invia è nel webhook payload. Controlla i log:

```bash
# Cerca nei log del server
grep "Processing entry pageId" logs.txt

# Output esempio:
[WEBHOOK] Processing entry pageId: 123456789012345, object: instagram
```

#### 3.3 Confronta

Se `accountId` nel DB ≠ `pageId` nel webhook:

**Soluzione A: Aggiorna il DB**
```javascript
// Nel MongoDB shell
db.socialaccounts.updateOne(
  { username: "test_account" },
  { $set: { accountId: "123456789012345" } }
)
```

**Soluzione B: Salva l'accountId corretto alla connessione**

Il problema potrebbe essere nel file `/api/oauth/meta/callback/route.js`. Verifica che salvi l'accountId corretto:

- Per Instagram Business: usa `ig_business_account.id`
- Per Facebook Page: usa `page.id`

---

### Step 4: Verifica Automazioni DB

#### 4.1 Controlla Automazioni Attive

```javascript
// MongoDB
db.socialautomations.find({ 
  status: 'active',
  accountId: ObjectId("YOUR_ACCOUNT_OBJECT_ID") 
}).pretty()
```

Deve esistere almeno una con:
- `status: "active"`
- `type: "comment_reply"` o `"dm_auto"`
- `action.message: "..."`
- `trigger.keywords: [...]`

#### 4.2 Verifica Keyword Match

Le keyword sono **case-insensitive** e cercano **substring**.

Esempio:
```javascript
{
  "trigger": {
    "keywords": ["prezzo", "info"]
  }
}
```

Match:
- ✅ "Qual è il prezzo?"
- ✅ "PREZZO disponibile?"
- ✅ "Vorrei info"
- ❌ "Sono interessato" (keyword non presente)

#### ⚠️ Problema Comune

**Automazione con keywords vuoto**:
```javascript
"trigger": { "keywords": [] }
```
→ Match **tutti** i commenti (potrebbe essere voluto!)

**Automazione senza message**:
```javascript
"action": { "message": "" }
```
→ Skip automatico. Aggiungi un messaggio!

---

### Step 5: Testa Webhook Manualmente

#### 5.1 Simula Webhook da Meta

```bash
curl -X POST https://your-domain.com/api/webhook/social \
  -H "Content-Type: application/json" \
  -d '{
    "object": "instagram",
    "entry": [{
      "id": "123456789012345",
      "time": 1234567890,
      "changes": [{
        "field": "comments",
        "value": {
          "id": "comment_123",
          "text": "Ciao! Prezzo?",
          "from": {
            "id": "user_456",
            "username": "test_user"
          }
        }
      }]
    }]
  }'
```

#### 5.2 Controlla Log Webhook

Nel log del server dovresti vedere:

```
[WEBHOOK] Ricevuto: {"object":"instagram","entry":[...]}
[WEBHOOK] Processing entry pageId: 123456789012345, object: instagram
[WEBHOOK] ✅ Account trovato: test_account (instagram)
[WEBHOOK] Automazioni attive per account: 1
[WEBHOOK] Instagram comment — text: "Ciao! Prezzo?", commentId: comment_123, fromId: user_456
[WEBHOOK] Check auto "Risposta Info" type:comment_reply status:active
[WEBHOOK] ✅ Match! actionType: send_dm, message: "Ti mando info!"
[WEBHOOK] sendDM (instagram) to user_456: {"id":"..."}
[WEBHOOK] Automazione eseguita: Risposta Info
```

#### 5.3 Debug: Account Non Trovato

Se vedi:
```
[WEBHOOK] ⚠️ Account non trovato per pageId: 123456789012345
[WEBHOOK] Account attivi nel DB: [{"accountId":"999999999","platform":"instagram","username":"altro_account"}]
```

→ L'`accountId` nel DB non corrisponde. Vai allo [Step 3](#step-3-verifica-accountid).

#### 5.4 Debug: Keyword Non Trova Match

Se vedi:
```
[WEBHOOK] Skip: keyword non trovata in "Ciao! Prezzo?", keywords: ["informazioni","disponibilità"]
```

→ Le keyword configurate non includono "prezzo". Aggiorna l'automazione.

---

## 🚨 Problemi Comuni e Soluzioni

### 1. "Webhook non riceve eventi"

**Cause**:
- ngrok scaduto (se in sviluppo)
- URL webhook non raggiungibile
- Eventi non sottoscritti su Meta

**Soluzione**:
```bash
# 1. Testa raggiungibilità
curl https://your-domain.com/api/webhook/social

# 2. Se usi ngrok, riavvialo
ngrok http 3000

# 3. Aggiorna URL webhook su Meta con nuovo URL ngrok
```

---

### 2. "Account non trovato per pageId"

**Causa**: `accountId` nel DB ≠ `pageId` inviato da Meta

**Soluzione**:
1. Vedi i log per trovare il pageId reale
2. Aggiorna il DB oppure riconnetti l'account

---

### 3. "Invalid OAuth access token"

**Causa**: Token scaduto (durano 60 giorni)

**Soluzione**:
1. Vai su `/Operations/SocialAutomation`
2. Disconnetti l'account
3. Riconnetti

Oppure implementa il refresh del token automatico:
```javascript
// Controlla tokenExpiry in DB
if (account.tokenExpiry < new Date()) {
  // Token scaduto → richiedi refresh
}
```

---

### 4. "Automazione non si attiva nonostante keyword match"

**Controlla**:
- ✅ `status: 'active'` (non 'paused' o 'draft')
- ✅ `action.message` non vuoto
- ✅ `type` è `'comment_reply'` o `'dm_auto'`

**Debug**:
```javascript
// Nel MongoDB
db.socialautomations.findOne({ name: "Nome Tua Automazione" })

// Verifica che tutti i campi siano corretti
```

---

### 5. "DM non viene inviato"

**Possibili cause**:

**A) Permessi mancanti**
- Instagram: richiede `instagram_manage_messages` (⏳ App Review)
- Facebook: richiede `pages_messaging` (⏳ App Review)

Fino all'approvazione, usa **Test Users** (vedi META_APP_SETUP_GUIDE.md Step 5.1)

**B) Errore API Meta**

Controlla log webhook:
```
[WEBHOOK] sendDM (instagram) to user_456: {"error":{"message":"(#200) This person isn't available right now"}}
```

→ L'utente deve aver messaggiato prima la pagina/account (limitazione Meta)

**C) commentId mancante**

Il webhook a volte non invia `from.id`. In questo caso, usa `commentId`:
```javascript
// Nel webhook, verifica
if (commentId || fromId) {
  await sendDM('instagram', fromId, message, account.accessToken, pageId, commentId);
}
```

---

## 🧪 Test Completo End-to-End

### 1. Setup Iniziale

```bash
# 1. Avvia server (se locale)
npm run dev

# 2. Avvia ngrok (se necessario)
ngrok http 3000

# 3. Aggiorna webhook Meta con URL ngrok
```

### 2. Connetti Account

1. Vai su `/Operations/SocialAutomation`
2. Click "Connetti Instagram"
3. Autorizza l'app
4. Verifica account appare nella lista

### 3. Sottoscrivi Webhook

```bash
# Via browser
https://your-domain.com/api/social-accounts/ACCOUNT_ID/subscribe-webhook

# Oppure click "⚙️ Settings" → "Sottoscrivi webhook" nell'interfaccia
```

### 4. Crea Automazione

1. Click sull'account
2. "Nuova Automazione"
3. Configura:
   - Nome: "Test Prezzo"
   - Tipo: `dm_auto`
   - Keyword: "prezzo"
   - Azione: `send_dm`
   - Messaggio: "Ti mando info!"
4. Salva → Status deve essere "Attiva"

### 5. Testa con Commento Reale

1. Vai sul post Instagram dell'account connesso
2. Commenta: "Qual è il prezzo?"
3. Attendi ~5 secondi
4. Controlla:
   - Log server: `[WEBHOOK] Automazione eseguita: Test Prezzo`
   - DM ricevuto su Instagram

### 6. Debug se Non Funziona

```bash
# Controlla log in tempo reale
tail -f logs.txt | grep WEBHOOK

# Simula webhook manualmente
curl -X POST http://localhost:3000/api/webhook/social \
  -H "Content-Type: application/json" \
  -d @test-payload.json
```

---

## 📊 Monitoraggio Automazioni

### Check Stats nel DB

```javascript
db.socialautomations.find({}).pretty()

// Ogni automazione ha:
{
  "stats": {
    "triggered": 5,    // Quante volte attivata
    "successful": 4,   // Quante andate a buon fine
    "failed": 1        // Quante fallite
  },
  "lastTriggered": ISODate("2026-03-10T...")
}
```

### Log Monitoring

Aggiungi log persistenti in produzione:

```javascript
// In webhook/social/route.js
import fs from 'fs';

// Log ogni automazione eseguita
fs.appendFileSync('automations.log', 
  `${new Date().toISOString()} - ${auto.name} - ${commentText}\n`
);
```

---

## 🔐 Limitazioni Meta (Pre-Approval)

Durante **Development Mode** (prima dell'App Review):

### ✅ Funziona con:
- Account admin dell'app
- Test Users aggiunti in Meta App
- Facebook Page dove sei admin

### ❌ NON funziona con:
- Utenti casuali/pubblico
- Account non collegati all'app

### 🚀 Dopo App Review:
- ✅ Tutti gli utenti
- ✅ Qualsiasi account pubblico

---

## 📝 Checklist Finale

Se hai fatto tutto correttamente:

- [x] Webhook configurato su Meta e verificato
- [x] Eventi `comments` e `messages` sottoscritti
- [x] Account sottoscritto ai webhook via API
- [x] accountId nel DB corrisponde al pageId
- [x] Automazione attiva con keywords e messaggio
- [x] Test manuale con curl funziona
- [x] Commento reale su Instagram riceve risposta

Se **ancora non funziona**, contatta il supporto Meta o controlla:
- [Meta Webhooks Debugger](https://developers.facebook.com/tools/webhooks/)
- [Instagram Graph API Explorer](https://developers.facebook.com/tools/explorer/)

---

## 🆘 Quick Fix: Non Ho Tempo

Se hai bisogno di una soluzione veloce:

1. **Riconnetti account**:
   - Disconnetti e riconnetti l'account Instagram/Facebook
   
2. **Ricrea automazione**:
   - Elimina quella esistente
   - Creane una nuova con keyword semplici (es. "ciao")
   
3. **Testa con account test**:
   - Crea un Test User su Meta App
   - Usa quello per i test invece del tuo account principale

4. **Verifica log in real-time**:
   ```bash
   # Apri due terminali:
   # Terminal 1: Server
   npm run dev
   
   # Terminal 2: Log watch
   tail -f .next/server/app/api/webhook/social/route.log | grep WEBHOOK
   ```

5. **Check rapido DB**:
   ```bash
   # Verifica account e automazioni esistono
   mongo
   use gestionale
   db.socialaccounts.countDocuments({ status: 'active' })
   db.socialautomations.countDocuments({ status: 'active' })
   ```

---

**Hai ancora problemi?** Condividi:
1. Log completo del webhook
2. Screenshot automazione nel gestionale
3. Screenshot webhook settings su Meta

Buon debugging! 🚀
