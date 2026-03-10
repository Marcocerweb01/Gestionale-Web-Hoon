# 🔧 Script di Diagnostica e Test

Questa cartella contiene script utili per diagnosticare e testare le automazioni social.

---

## 📁 File Disponibili

### 1. `diagnose-automations.js`
Script Node.js che controlla lo stato di account e automazioni nel database.

**Cosa controlla:**
- ✅ Account social connessi e loro status
- ✅ Token scaduti o in scadenza
- ✅ Automazioni attive/inattive
- ✅ Keywords e messaggi configurati
- ✅ Statistiche di utilizzo
- ✅ Configurazione webhook

**Uso:**
```bash
node scripts/diagnose-automations.js
```

**Output esempio:**
```
🔍 Diagnostica Automazioni Social

━━━ 1. Account Social Connessi ━━━

✅ Trovati 2 account nel database

  1. Casa Bella Real Estate
     Platform: instagram
     Account ID: 123456789012345
     Username: @casabella_re
     Status: active
     Token scade tra: 45 giorni

━━━ 2. Automazioni Configurate ━━━

✅ Trovate 3 automazioni totali
✅ 2 automazioni ATTIVE

  1. "Risposta Info Prezzi"
     Account: casabella_re
     Tipo: comment_reply
     Status: active
     Keywords: prezzo, info, disponibile
     Messaggio: "Ciao! Ti mando subito tutte le info in DM 🏠"
     Azione: both
     Stats: 15 attivazioni, 14 successi, 1 errori
     Ultima esecuzione: 2h fa
```

---

### 2. `test-webhook.ps1`
Script PowerShell per testare il webhook simulando un evento Meta.

**Cosa fa:**
- 🔗 Verifica che il webhook sia raggiungibile
- 📤 Invia un payload di test (commento Instagram)
- 📊 Mostra la risposta del server

**Uso:**
```powershell
# Test su localhost
.\scripts\test-webhook.ps1 http://localhost:3000 123456789012345

# Test su produzione
.\scripts\test-webhook.ps1 https://gestionale.railway.app 123456789012345
```

**Parametri:**
- `[URL]` - URL base del gestionale (default: http://localhost:3000)
- `[ACCOUNT_ID]` - ID dell'account Instagram da testare

**Come trovare l'Account ID:**
1. Esegui `node scripts/diagnose-automations.js`
2. Oppure vai su MongoDB: `db.socialaccounts.find({}, {accountId: 1, username: 1})`
3. Oppure guarda l'URL quando vai su "Gestisci Automazioni" (è nell'URL)

---

### 3. `test-webhook-payload.json`
Esempio di payload webhook Meta per test manuali con curl.

**Uso con curl:**
```bash
# 1. Modifica il file e sostituisci ACCOUNT_ID
# 2. Invia richiesta
curl -X POST http://localhost:3000/api/webhook/social \
  -H "Content-Type: application/json" \
  -d @scripts/test-webhook-payload.json
```

**Payload esempio:**
```json
{
  "object": "instagram",
  "entry": [{
    "id": "123456789012345",
    "changes": [{
      "field": "comments",
      "value": {
        "text": "Ciao! Qual è il prezzo?",
        "from": {
          "id": "user_456",
          "username": "test_user"
        }
      }
    }]
  }]
}
```

---

## 🚀 Workflow di Debug Consigliato

### Problema: "Le automazioni non funzionano"

**Step 1: Diagnostica Base**
```bash
node scripts/diagnose-automations.js
```

Questo ti dirà subito se:
- Hai account connessi
- Hai automazioni attive
- I token sono validi
- Le configurazioni sono corrette

**Step 2: Test Locale**
```powershell
# Assicurati che il server sia avviato
npm run dev

# In un altro terminale
.\scripts\test-webhook.ps1 http://localhost:3000 [TUO_ACCOUNT_ID]
```

Controlla i log del server per vedere cosa succede.

**Step 3: Test su Instagram Reale**

Se il test locale funziona ma Instagram non triggera l'automazione:
1. Verifica che il webhook sia configurato su Meta App
2. Controlla che l'account sia sottoscritto ai webhook:
   ```bash
   curl -X POST https://tuo-dominio.com/api/social-accounts/ACCOUNT_ID/subscribe-webhook
   ```
3. Fai un commento su Instagram con una keyword configurata
4. Attendi ~5 secondi
5. Controlla i log del server

**Step 4: Consulta Troubleshooting**

Se ancora non funziona, leggi:
```
📖 TROUBLESHOOTING_AUTOMAZIONI.md
```

Troverai soluzioni per problemi specifici come:
- "Account non trovato per pageId"
- "Invalid OAuth access token"
- "Keyword non trovata"
- Permessi mancanti
- E altro...

---

## 🔍 Altri Comandi Utili

### Controlla log in tempo reale
```bash
# Linux/Mac
tail -f .next/server/logs.txt | grep WEBHOOK

# Windows PowerShell
Get-Content .next/server/logs.txt -Wait | Select-String "WEBHOOK"
```

### Check MongoDB
```bash
# Entra in MongoDB
mongosh

# Usa il database
use gestionale

# Lista account
db.socialaccounts.find().pretty()

# Lista automazioni attive
db.socialautomations.find({ status: 'active' }).pretty()

# Check stats automazione specifica
db.socialautomations.findOne({ name: "Nome Tua Automazione" })
```

### Test connettività webhook (GET)
```bash
# Con curl
curl "http://localhost:3000/api/webhook/social?hub.mode=subscribe&hub.verify_token=YOUR_TOKEN&hub.challenge=test123"

# Con PowerShell
Invoke-WebRequest -Uri "http://localhost:3000/api/webhook/social?hub.mode=subscribe&hub.verify_token=YOUR_TOKEN&hub.challenge=test123"

# Deve rispondere con: test123
```

---

## ⚠️ Note Importanti

### Limitazioni Development Mode (Pre-App Review)

Durante lo sviluppo, le automazioni funzionano SOLO con:
- Account admin dell'app Meta
- Test Users aggiunti in Meta App → Roles → Test Users
- Facebook Page dove sei admin

NON funziona con utenti casuali fino all'approvazione dell'App Review.

### ngrok per Test Locali

Se stai testando in locale, Meta non può raggiungere `localhost`.
Usa ngrok:

```bash
# Installa ngrok
ngrok http 3000

# Output:
# Forwarding: https://abc123.ngrok.io -> http://localhost:3000

# Aggiorna webhook su Meta con URL ngrok:
# https://abc123.ngrok.io/api/webhook/social
```

⚠️ **Importante**: Ogni volta che riavvii ngrok, l'URL cambia e devi aggiornare Meta!

---

## 📚 Risorse Aggiuntive

- [META_APP_SETUP_GUIDE.md](../META_APP_SETUP_GUIDE.md) - Setup completo Meta App
- [TROUBLESHOOTING_AUTOMAZIONI.md](../TROUBLESHOOTING_AUTOMAZIONI.md) - Guida troubleshooting dettagliata
- [Meta Webhooks Docs](https://developers.facebook.com/docs/graph-api/webhooks)
- [Instagram Graph API](https://developers.facebook.com/docs/instagram-api)

---

## 🆘 Bisogno di Aiuto?

Se hai ancora problemi dopo aver seguito questa guida:

1. Esegui `node scripts/diagnose-automations.js` e salva l'output
2. Controlla i log del server durante un test
3. Prova con `.\scripts\test-webhook.ps1` e condividi l'output
4. Consulta `TROUBLESHOOTING_AUTOMAZIONI.md` per soluzioni specifiche

---

**Happy debugging! 🚀**
