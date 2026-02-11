# 🚀 Guida Setup n8n + Social Automation

## Fase 1: Deploy n8n su Railway

### 1.1 Crea Nuovo Servizio Railway
1. Vai sul **tuo progetto Railway esistente** (dove hai il gestionale)
2. Clicca "+ New" → "Docker Image"
3. Nel campo "Image" inserisci: `n8nio/n8n:latest`
4. Clicca "Deploy"

### 1.2 Configura Variabili Ambiente
Aggiungi queste variabili nel servizio n8n:

```env
N8N_BASIC_AUTH_ACTIVE=true
N8N_BASIC_AUTH_USER=admin
N8N_BASIC_AUTH_PASSWORD=[genera-password-sicura]
N8N_PROTOCOL=https
WEBHOOK_URL=https://[tuo-dominio-n8n].railway.app/
GENERIC_TIMEZONE=Europe/Rome
N8N_METRICS=true
EXECUTIONS_DATA_SAVE_ON_SUCCESS=all
EXECUTIONS_DATA_SAVE_ON_ERROR=all
```

### 1.3 Configura Dominio
1. Vai su Settings → Networking
2. Copia il dominio generato (es: `n8n-production-xxxx.up.railway.app`)
3. Aggiorna `WEBHOOK_URL` con questo dominio

### 1.4 Deploy
- Railway farà il deploy automatico
- Attendi che lo stato diventi "Active"
- Apri l'URL generato → vedrai il login n8n

---

## Fase 2: Collega MongoDB

### 2.1 Ottieni MongoDB URI
Dal tuo gestionale su Railway:
1. Vai al servizio MongoDB
2. Copia la `MONGODB_URL` dalle variabili

### 2.2 Configura n8n per MongoDB
In n8n:
1. Vai su Settings → Credentials
2. Aggiungi "MongoDB"
3. Incolla il connection string
4. Test & Save

---

## Fase 3: Crea Webhook nel Gestionale

### 3.1 Aggiungi Variabile Ambiente
Nel servizio Next.js su Railway:

```env
N8N_WEBHOOK_URL=https://[tuo-dominio-n8n].railway.app
NEXT_PUBLIC_WEBHOOK_URL=https://[tuo-dominio-gestionale].railway.app/api/webhook/social
META_VERIFY_TOKEN=[genera-token-casuale]
```

### 3.2 Test Webhook
```bash
curl -X POST https://[tuo-gestionale].railway.app/api/webhook/social \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "YOUR_USER_ID",
    "platform": "instagram",
    "leadInfo": {
      "username": "test_user",
      "name": "Test User"
    },
    "interaction": {
      "type": "comment",
      "content": "Interessato!"
    }
  }'
```

---

## Fase 4: Workflow Template Instagram Comment → DM

### 4.1 Crea Workflow in n8n

1. **Webhook Node** (Trigger)
   - Method: POST
   - Path: `/webhook/instagram-comment`
   
2. **IF Node** (Check Keywords)
   - Condition: `{{ $json.body.comment }}` contains "casa" OR "interessato"
   
3. **HTTP Request** (Meta API - Send DM)
   - Method: POST
   - URL: `https://graph.facebook.com/v18.0/me/messages`
   - Authentication: Meta Access Token
   - Body:
     ```json
     {
       "recipient": { "id": "{{$json.body.user_id}}" },
       "message": { 
         "text": "Ciao! Grazie per l'interesse. Ti contatto subito!" 
       }
     }
     ```

4. **HTTP Request** (Save to Gestionale)
   - Method: POST
   - URL: `https://[gestionale].railway.app/api/webhook/social`
   - Body:
     ```json
     {
       "userId": "YOUR_USER_ID",
       "platform": "instagram",
       "automationId": "AUTOMATION_ID",
       "leadInfo": {
         "username": "{{$json.body.username}}",
         "userId": "{{$json.body.user_id}}"
       },
       "interaction": {
         "type": "comment",
         "content": "{{$json.body.comment}}"
       }
     }
     ```

5. **Activate Workflow**

---

## Fase 5: Setup Meta App (Instagram/Facebook)

### 5.1 Crea Meta App
1. Vai su [developers.facebook.com](https://developers.facebook.com)
2. "My Apps" → "Create App"
3. Tipo: "Business"
4. Nome: "Social Manager Bot"

### 5.2 Aggiungi Prodotti
- Instagram Graph API
- Webhooks
- Messenger API (per DM)

### 5.3 Configura Webhook
1. Dashboard → Webhooks → "Configure"
2. Callback URL: `https://[gestionale].railway.app/api/webhook/social`
3. Verify Token: `[tuo META_VERIFY_TOKEN]`
4. Seleziona eventi:
   - `comments`
   - `messages`
   - `messaging_postbacks`

### 5.4 Ottieni Access Token
1. Tools → Graph API Explorer
2. Genera User Access Token
3. Permessi richiesti:
   - `pages_show_list`
   - `pages_messaging`
   - `instagram_basic`
   - `instagram_manage_comments`
   - `instagram_manage_messages`
4. Converti in Long-Lived Token (valido 60 giorni)

### 5.5 Collega Instagram Business Account
1. Settings → Instagram → "Connect Account"
2. Autorizza l'accesso

---

## Fase 6: Test Completo

### 6.1 Simula Commento Instagram
```bash
# n8n espone webhook
curl -X POST https://[n8n].railway.app/webhook/instagram-comment \
  -H "Content-Type: application/json" \
  -d '{
    "comment": "Sono interessato alla casa!",
    "username": "test_user",
    "user_id": "12345"
  }'
```

### 6.2 Verifica
1. Controlla esecuzione in n8n (Executions)
2. Verifica lead salvato nel gestionale
3. Controlla DM inviato su Instagram

---

## 🎯 Workflow Pronti da Usare

Dopo il setup, crea questi workflow in n8n:

### 1. Instagram Comment → DM
**Trigger**: Commento con keyword
**Azione**: Invia DM automatico

### 2. Instagram DM → Lead Save
**Trigger**: Nuovo messaggio
**Azione**: Salva come lead nel gestionale

### 3. Scheduled Post
**Trigger**: Cron (es: ogni giorno alle 18:00)
**Azione**: Pubblica post programmato

### 4. Lead Scoring
**Trigger**: Nuovo lead salvato
**Azione**: Analizza engagement e assegna score

---

## 📊 Costi Stimati

- **Railway n8n**: ~$5/mese (piano Hobby)
- **Railway Gestionale**: Già attivo
- **MongoDB**: Condiviso
- **Meta API**: Gratis (limite 200 chiamate/ora)

**Totale extra**: ~$5/mese

---

## 🔒 Sicurezza

### Variabili da Proteggere
- `N8N_BASIC_AUTH_PASSWORD`
- `META_ACCESS_TOKEN`
- `META_VERIFY_TOKEN`
- `MONGODB_URL`

Salvale solo in Railway environment variables (mai in codice).

---

## 🆘 Troubleshooting

**n8n non parte:**
- Verifica le variabili ambiente
- Controlla i logs su Railway

**Webhook non riceve dati:**
- Test con curl per verificare l'endpoint
- Controlla che l'URL sia pubblico

**Meta webhook non verifica:**
- Verifica `META_VERIFY_TOKEN` corrisponda
- URL deve essere HTTPS

---

## 📚 Risorse

- [n8n Docs](https://docs.n8n.io/)
- [Meta Graph API](https://developers.facebook.com/docs/graph-api/)
- [Instagram API](https://developers.facebook.com/docs/instagram-api/)
- [Railway Docs](https://docs.railway.app/)

---

**Prossimo Step**: Crea la dashboard nel gestionale per gestire le automazioni! 🚀
