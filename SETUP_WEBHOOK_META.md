# 🔧 Setup Webhook Meta per Instagram Automazioni

## ⚠️ PROBLEMA
I webhook Instagram non arrivano → Le automazioni non si attivano

## ✅ SOLUZIONE: Configura Webhook su Meta App

---

## 📋 Step 1: Vai su Meta for Developers

1. Apri: **https://developers.facebook.com/apps/**
2. Seleziona la tua app (quella usata per Instagram)
3. Nella sidebar sinistra, cerca **"Webhooks"**

---

## 📋 Step 2: Aggiungi Webhook per Instagram

### 2.1 Se NON vedi la sezione "Webhooks":

1. Vai su **"App settings"** → **"Basic"**
2. Controlla che l'app sia di tipo **"Business"** o **"Consumer"**
3. Aggiungi il prodotto **"Webhooks"** dalla dashboard

### 2.2 Configurazione Webhook:

1. Clicca su **"Instagram"** nella lista dei webhook
2. Clicca **"Edit Subscription"** o **"Subscribe to this object"**

**Inserisci questi dati:**

```
Callback URL: https://gestionale-web-hoon-production.up.railway.app/api/webhook/social
Verify Token: svvfdgddfgsdfhgdfghwe5tw45245twegg2345adTVQ3
```

3. Clicca **"Verify and Save"**
4. Se vedi ✅ **"Verified"** → Ottimo!

### 2.3 Sottoscrivi Eventi:

Dopo aver verificato il webhook, seleziona questi eventi:

- ✅ **`comments`** (ESSENZIALE per le automazioni commenti)
- ✅ **`messages`** (per automazioni DM)
- ✅ **`messaging_postbacks`** (opzionale)
- ✅ **`messaging_optins`** (opzionale)

Clicca **"Save"**

---

## 📋 Step 3: Sottoscrivi l'Account @engyhub

Anche se il webhook è configurato sulla Meta App, **ogni account Instagram deve essere sottoscritto individualmente**.

1. Vai su: **https://gestionale-web-hoon-production.up.railway.app/Operations/SocialAutomation**
2. Trova l'account **@engyhub**
3. Clicca il pulsante **⚡ (fulmine)** per sottoscrivere i webhook
4. Controlla i log: dovresti vedere `[WEBHOOK SUBSCRIBE] Instagram: {"success":true}`

---

## 📋 Step 4: Test

1. Con **@marcocerasaa_**, commenta **"info"** su un post di **@engyhub**
2. Controlla i **log di Railway**
3. Dovresti vedere:
   ```
   🔔 [WEBHOOK] Ricevuto evento COMPLETO
   ✅ [WEBHOOK] Account trovato: @engyhub
   📊 [WEBHOOK] Automazioni attive trovate: 1
   ✅ Match! actionType: send_dm
   ```
4. Dovresti ricevere un **DM automatico** da @engyhub

---

## 🔍 Troubleshooting

### ❌ "Verification Failed" quando aggiungi il webhook

**Cause:**
- URL sbagliato
- Verify Token sbagliato
- L'app Railway è offline

**Soluzione:**
1. Verifica che l'URL sia esattamente: `https://gestionale-web-hoon-production.up.railway.app/api/webhook/social`
2. Verifica il token: `svvfdgddfgsdfhgdfghwe5tw45245twegg2345adTVQ3`
3. Testa manualmente con curl:
   ```bash
   curl "https://gestionale-web-hoon-production.up.railway.app/api/webhook/social?hub.mode=subscribe&hub.verify_token=svvfdgddfgsdfhgdfghwe5tw45245twegg2345adTVQ3&hub.challenge=test123"
   ```
   Deve rispondere: `test123`

### ❌ Webhook configurato ma eventi non arrivano

**Cause:**
- Eventi "comments" non selezionati
- Account non sottoscritto
- App in modalità Development (solo tester ricevono eventi)

**Soluzione:**
1. Verifica che "comments" sia ✅ selezionato
2. Ri-sottoscrivi l'account (pulsante ⚡)
3. Assicurati che @marcocerasaa_ sia un **Tester** dell'app Meta

### ❌ "Invalid OAuth access token"

**Cause:**
- Token scaduto
- Token non valido

**Soluzione:**
1. Riconnetti l'account Instagram:
   - Elimina @engyhub dal gestionale
   - Connetti di nuovo tramite Instagram Login
2. Oppure aspetta che scada il token (60 giorni) e verrà aggiornato automaticamente

---

## 📝 Note Importanti

### App in Development Mode

Se la tua Meta App è in **Development Mode**:
- Solo i **tester** dell'app riceveranno eventi webhook
- Aggiungi @marcocerasaa_ come tester: **App Roles** → **Roles** → **Add Testers**

### App in Live Mode

Per ricevere webhook da TUTTI gli utenti, l'app deve essere in **Live Mode**:
1. Completa l'**App Review** di Meta
2. Richiedi i permessi: `instagram_manage_comments`, `instagram_manage_messages`
3. Dopo l'approvazione, passa in Live Mode

---

## ✅ Checklist Finale

- [ ] Webhook configurato su Meta App
- [ ] Eventi "comments" e "messages" selezionati
- [ ] Status webhook = "Verified" ✅
- [ ] Account @engyhub sottoscritto (pulsante ⚡)
- [ ] @marcocerasaa_ è tester dell'app
- [ ] Test commento "info" → DM ricevuto

Se tutti i check sono ✅ e non funziona ancora, controlla i log di Railway per errori.

---

**Hai bisogno di ulteriore aiuto?** Dimmi a che punto sei bloccato! 🚀
