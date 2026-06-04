# Social Media Manager - Architettura Completa

## 🎯 Obiettivo
Piattaforma completa per gestire **multipli account Instagram/Facebook** con:
- Auto-risposta a commenti (sul post o via DM)
- Auto-DM quando qualcuno ti segue
- Programmazione post multi-account
- Dashboard centralizzata

---

## 🏗️ Architettura del Sistema

```
┌─────────────────────────────────────────────────────────────────┐
│                        GESTIONALE WEB                            │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │           Dashboard Social Automation                     │  │
│  │  - Lista account connessi (Instagram/Facebook)            │  │
│  │  - Configurazione regole per ogni account                │  │
│  │  - Calendario post programmati                            │  │
│  │  - Analytics lead e interazioni                          │  │
│  └──────────────────────────────────────────────────────────┘  │
│                              ↕                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    API Routes                             │  │
│  │  /api/social-accounts     → CRUD account                  │  │
│  │  /api/social-rules        → Configurazione regole        │  │
│  │  /api/scheduled-posts     → Gestione post programmati    │  │
│  │  /api/webhook/social      → Riceve eventi da Meta        │  │
│  └──────────────────────────────────────────────────────────┘  │
│                              ↕                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                  MongoDB Database                         │  │
│  │  - SocialAccount (account connessi + access token)        │  │
│  │  - AutomationRule (regole per account)                   │  │
│  │  - ScheduledPost (post da pubblicare)                    │  │
│  │  - SocialLead (lead catturati)                           │  │
│  │  - SocialInteraction (log interazioni)                   │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              ↕
┌─────────────────────────────────────────────────────────────────┐
│                        META WEBHOOKS                             │
│  - Nuovo commento → Webhook al gestionale                       │
│  - Nuovo follow → Webhook al gestionale                         │
│  - DM ricevuto → Webhook al gestionale                          │
└─────────────────────────────────────────────────────────────────┘
                              ↕
┌─────────────────────────────────────────────────────────────────┐
│                          N8N (Worker)                            │
│  Workflow 1: Gestione Commenti                                  │
│    1. Riceve webhook commento da gestionale                     │
│    2. Controlla regole account specifico                        │
│    3. Se match keyword → Risponde (commento o DM)               │
│    4. Salva lead nel gestionale                                 │
│                                                                  │
│  Workflow 2: Auto-DM al Follow                                  │
│    1. Riceve webhook follow da gestionale                       │
│    2. Prende messaggio template per quell'account               │
│    3. Invia DM di benvenuto                                     │
│    4. Log interazione nel gestionale                            │
│                                                                  │
│  Workflow 3: Post Scheduler                                     │
│    1. Ogni 5 minuti controlla post da pubblicare                │
│    2. Pubblica post via Meta Graph API                          │
│    3. Aggiorna stato nel gestionale                             │
│                                                                  │
│  Workflow 4: Sync Account Stats                                 │
│    1. Ogni giorno sincronizza statistiche account               │
│    2. Followers, engagement, reach                              │
│    3. Salva nel gestionale per analytics                        │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📊 Database Schema

### 1. SocialAccount (Account Connessi)
```javascript
{
  userId: ObjectId,           // Utente proprietario
  platform: String,           // 'instagram' | 'facebook'
  accountId: String,          // ID account su Meta
  username: String,           // Nome utente
  displayName: String,        // Nome visualizzato
  profilePicture: String,     // URL immagine profilo
  accessToken: String,        // Access token (encrypted)
  tokenExpiry: Date,          // Scadenza token
  status: String,             // 'active' | 'expired' | 'error'
  permissions: [String],      // Permessi ottenuti
  stats: {
    followers: Number,
    following: Number,
    posts: Number,
    lastSync: Date
  },
  createdAt: Date,
  updatedAt: Date
}
```

### 2. AutomationRule (Regole per Account)
```javascript
{
  accountId: ObjectId,        // Riferimento a SocialAccount
  type: String,               // 'comment' | 'follow' | 'dm'
  name: String,               // Nome regola
  enabled: Boolean,
  
  // Per type='comment'
  trigger: {
    keywords: [String],       // Parole chiave da cercare
    matchType: String,        // 'any' | 'all' | 'exact'
    caseSensitive: Boolean
  },
  
  action: {
    type: String,             // 'reply_comment' | 'send_dm' | 'both'
    message: String,          // Messaggio da inviare
    variables: Object         // {name: '@username', post: '@posturl'}
  },
  
  // Per type='follow'
  welcomeMessage: String,
  delay: Number,              // Minuti prima di inviare DM
  
  stats: {
    triggered: Number,
    successful: Number,
    failed: Number
  },
  
  createdAt: Date,
  updatedAt: Date
}
```

### 3. ScheduledPost (Post Programmati)
```javascript
{
  accountId: ObjectId,
  scheduledFor: Date,
  status: String,             // 'pending' | 'published' | 'failed'
  
  content: {
    type: String,             // 'image' | 'video' | 'carousel'
    caption: String,
    media: [{
      url: String,
      type: String
    }],
    hashtags: [String],
    location: String,
    tagUsers: [String]
  },
  
  publishedAt: Date,
  publishedPostId: String,    // ID post su Meta dopo pubblicazione
  error: String,              // Errore se fallito
  
  createdAt: Date,
  updatedAt: Date
}
```

### 4. SocialInteraction (Log Interazioni)
```javascript
{
  accountId: ObjectId,
  type: String,               // 'comment_reply' | 'dm_sent' | 'post_published'
  platform: String,
  
  source: {
    type: String,             // 'comment' | 'follow' | 'scheduled'
    id: String,               // ID commento/post originale
    username: String,
    content: String
  },
  
  action: {
    type: String,
    message: String,
    success: Boolean,
    error: String
  },
  
  ruleId: ObjectId,           // Regola che ha triggerato l'azione
  leadId: ObjectId,           // Lead creato (se applicabile)
  
  createdAt: Date
}
```

---

## 🔧 Implementazione Step-by-Step

### FASE 1: Setup Base Multi-Account (Settimana 1)

#### 1.1 Database Models
- ✅ Creare model SocialAccount
- ✅ Creare model AutomationRule
- ✅ Creare model ScheduledPost
- ✅ Creare model SocialInteraction

#### 1.2 Meta App Configuration
- 📱 Creare Meta Business App
- 🔐 Configurare OAuth per multi-account
- 📡 Setup webhook subscriptions per:
  - `comments` (nuovi commenti)
  - `mentions` (menzioni)
  - `messages` (DM)
  - `feed` (follow events)

#### 1.3 Account Connection Flow
```
User → Click "Connetti Instagram" 
     → Redirect a Meta OAuth 
     → User autorizza l'app 
     → Callback con access token 
     → Salva token encrypted in SocialAccount
     → Test connessione
```

### FASE 2: Auto-Reply Commenti (Settimana 2)

#### 2.1 Webhook Receiver
```javascript
// app/api/webhook/meta/route.js
POST /api/webhook/meta
- Riceve evento da Meta (comment, follow, message)
- Identifica account tramite page_id
- Trova AutomationRule per quell'account
- Triggera workflow n8n appropriato
```

#### 2.2 N8N Workflow: Comment Handler
```
1. Webhook Trigger (riceve da gestionale)
2. IF Node → Controlla keywords
3. Branch A: Reply to comment (Meta API)
4. Branch B: Send DM (Meta API)
5. HTTP Node → Salva lead nel gestionale
6. HTTP Node → Log interaction
```

#### 2.3 UI Gestione Regole
```jsx
// app/Operations/SocialAutomation/[accountId]/Rules/page.jsx
- Lista regole per account
- Crea nuova regola:
  * Seleziona tipo (comment/follow/dm)
  * Imposta keywords
  * Scegli azione (reply/dm/entrambi)
  * Scrivi messaggio con variabili
- Test regola con commento simulato
```

### FASE 3: Auto-DM al Follow (Settimana 3)

#### 3.1 Follow Event Webhook
```javascript
// Meta invia webhook quando nuovo follower
{
  "object": "instagram",
  "entry": [{
    "id": "ACCOUNT_ID",
    "changes": [{
      "field": "followers",
      "value": {
        "user_id": "FOLLOWER_ID"
      }
    }]
  }]
}
```

#### 3.2 N8N Workflow: Welcome DM
```
1. Webhook (riceve follow event)
2. Get account data (API gestionale)
3. Wait Node (delay configurabile)
4. Get follower info (Meta API)
5. Send DM with template
6. Log interaction
```

### FASE 4: Post Scheduler (Settimana 4)

#### 4.1 UI Calendario Post
```jsx
// app/Operations/SocialAutomation/Scheduler/page.jsx
- Calendario mensile
- Click su giorno → Modal crea post
- Upload immagine/video
- Scrivi caption
- Seleziona account(s)
- Imposta data/ora
- Salva come ScheduledPost
```

#### 4.2 N8N Workflow: Post Publisher
```
Cron Trigger (ogni 5 minuti)
  ↓
HTTP Node → GET /api/scheduled-posts?status=pending&time<=now
  ↓
Loop through posts
  ↓
For each post:
  - Upload media to Meta
  - Publish post
  - Update status in gestionale
  - Log interaction
```

#### 4.3 Best Times Suggester
```javascript
// Analizza statistiche engagement
// Suggerisce orari migliori per pubblicare
// Basato su follower activity
```

---

## 🔐 Meta App Setup Dettagliato

### Permessi Necessari

**Instagram Basic Display API** (NO - limitato)
- ❌ Non supporta commenti/DM/publishing

**Instagram Graph API** (SI - business accounts)
- ✅ `instagram_basic`
- ✅ `instagram_manage_comments`
- ✅ `instagram_manage_messages`
- ✅ `instagram_content_publish`
- ✅ `pages_read_engagement`
- ✅ `pages_manage_posts`

**Facebook Graph API**
- ✅ `pages_messaging`
- ✅ `pages_manage_engagement`
- ✅ `pages_read_engagement`
- ✅ `pages_manage_posts`
- ✅ `publish_to_groups` (opzionale)

### Webhook Configuration
```javascript
// In Meta App Dashboard → Webhooks
Callback URL: https://your-gestionale.com/api/webhook/meta
Verify Token: RANDOM_SECRET_STRING

Subscription Fields:
- comments
- messages  
- feed (for follows)
- mention
- message_echoes
```

---

## 🎨 UI/UX Dashboard

### Main Dashboard (`/Operations/SocialAutomation`)
```
┌─────────────────────────────────────────────────────────┐
│  Social Media Manager                          [+ Account]│
├─────────────────────────────────────────────────────────┤
│  📊 Overview                                             │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │
│  │ 5 Account│ │ 23 Leads │ │ 89% Resp │ │ 12 Posts │  │
│  │ Connessi │ │ Oggi     │ │ Rate     │ │ Scheduled│  │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘  │
│                                                          │
│  📱 Account Connessi                                     │
│  ┌────────────────────────────────────────────────────┐ │
│  │ [IMG] @brandaccount1 · Instagram                   │ │
│  │       5.2K followers · 3 regole attive             │ │
│  │       [Gestisci] [Regole] [Analytics]              │ │
│  ├────────────────────────────────────────────────────┤ │
│  │ [IMG] @brandaccount2 · Facebook                    │ │
│  │       12K followers · 2 regole attive              │ │
│  │       [Gestisci] [Regole] [Analytics]              │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
│  📅 Post Programmati (Prossimi 7 giorni)                │
│  ┌────────────────────────────────────────────────────┐ │
│  │ Mar 4 Feb · 18:00 · @brandaccount1                 │ │
│  │ "Nuovo prodotto in arrivo! 🚀"                     │ │
│  │ [Modifica] [Elimina] [Pubblica Ora]                │ │
│  └────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

### Account Rules (`/Operations/SocialAutomation/[accountId]/Rules`)
```
┌─────────────────────────────────────────────────────────┐
│  Regole Automazione - @brandaccount1           [+ Regola]│
├─────────────────────────────────────────────────────────┤
│  ┌────────────────────────────────────────────────────┐ │
│  │ ✅ Auto-Reply "Prezzo"                     [ON/OFF]│ │
│  │ Tipo: Commento → DM                                │ │
│  │ Keywords: prezzo, quanto costa, costo              │ │
│  │ Risposta: "Ciao {username}! Ti mando info in DM" │ │
│  │ Triggered: 45 volte · Success: 43 · Failed: 2     │ │
│  │ [Modifica] [Test] [Analytics]                      │ │
│  ├────────────────────────────────────────────────────┤ │
│  │ ✅ Welcome Message                         [ON/OFF]│ │
│  │ Tipo: Nuovo Follow → DM                            │ │
│  │ Delay: 30 minuti                                   │ │
│  │ Messaggio: "Grazie per il follow! 🎉..."          │ │
│  │ Triggered: 128 volte · Success: 125               │ │
│  │ [Modifica] [Test] [Analytics]                      │ │
│  └────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

### Post Scheduler (`/Operations/SocialAutomation/Scheduler`)
```
┌─────────────────────────────────────────────────────────┐
│  Calendario Post                      [Vista: Mese ▼]   │
├─────────────────────────────────────────────────────────┤
│  Feb 2026                                               │
│  ┌───┬───┬───┬───┬───┬───┬───┐                         │
│  │ L │ M │ M │ G │ V │ S │ D │                         │
│  ├───┼───┼───┼───┼───┼───┼───┤                         │
│  │   │   │   │   │   │ 1 │ 2 │                         │
│  ├───┼───┼───┼───┼───┼───┼───┤                         │
│  │ 3 │ 4 │ 5 │ 6 │ 7 │ 8 │ 9 │                         │
│  │   │📱│📱│   │   │   │   │  ← 2 post programmati     │
│  ├───┼───┼───┼───┼───┼───┼───┤                         │
│  │...│...│...│...│...│...│...│                         │
│  └───┴───┴───┴───┴───┴───┴───┘                         │
│                                                          │
│  Click su giorno per programmare nuovo post             │
└─────────────────────────────────────────────────────────┘
```

---

## 📈 Roadmap Implementazione

### Sprint 1 (Settimana 1-2) - Foundation
- [ ] Database models (SocialAccount, AutomationRule, etc.)
- [ ] Meta App creation & OAuth setup
- [ ] Account connection flow (UI + API)
- [ ] Webhook receiver base `/api/webhook/meta`

### Sprint 2 (Settimana 2-3) - Comment Automation
- [ ] UI gestione regole commenti
- [ ] N8N workflow comment handler
- [ ] Test reply to comment
- [ ] Test send DM on comment
- [ ] Lead capture & tracking

### Sprint 3 (Settimana 3-4) - Follow Automation
- [ ] N8N workflow welcome DM
- [ ] Follow event webhook handling
- [ ] Delay configuration
- [ ] Template variables ({username}, {account}, etc.)

### Sprint 4 (Settimana 4-5) - Post Scheduler
- [ ] UI calendario post
- [ ] Upload media (immagini/video)
- [ ] N8N workflow post publisher (cron)
- [ ] Media hosting (Railway volumes o S3)
- [ ] Post preview & edit

### Sprint 5 (Settimana 5-6) - Analytics & Optimization
- [ ] Dashboard analytics per account
- [ ] Best times to post
- [ ] Engagement tracking
- [ ] A/B testing messaggi
- [ ] Export report

---

## 💰 Costi Stimati

### Railway Hosting
- Next.js + MongoDB: **$5-10/mese**
- n8n worker: **$5/mese**
- Storage media (10GB): **$2/mese**
**Totale: ~$15/mese**

### Meta API
- **GRATIS** per uso normale
- Rate limits:
  - 200 calls/hour per user
  - 4800 calls/hour per app

### Alternative (se superi rate limits)
- **Buffer** (SaaS): $15-99/mese
- **Hootsuite**: $99-739/mese
- **Tua soluzione custom**: $15/mese! 🚀

---

## 🔒 Sicurezza & Best Practices

1. **Access Token Encryption**
   ```javascript
   import crypto from 'crypto';
   const encrypt = (text) => {
     const cipher = crypto.createCipher('aes-256-cbc', process.env.ENCRYPTION_KEY);
     return cipher.update(text, 'utf8', 'hex') + cipher.final('hex');
   };
   ```

2. **Token Refresh Auto**
   - Meta tokens durano 60 giorni
   - Cron job giornaliero per check scadenza
   - Auto-refresh se < 7 giorni

3. **Rate Limiting**
   - Queue system per API calls
   - Retry con exponential backoff
   - Logging errori Meta API

4. **Webhook Verification**
   ```javascript
   // Verifica signature Meta
   const signature = req.headers['x-hub-signature-256'];
   const hash = crypto
     .createHmac('sha256', APP_SECRET)
     .update(body)
     .digest('hex');
   if (signature !== `sha256=${hash}`) throw new Error('Invalid signature');
   ```

---

## 🎯 Prossimi Passi

**Adesso cosa vuoi fare?**

### Opzione A: Iniziare dall'Inizio
1. Creo tutti i database models
2. Setup Meta App OAuth
3. UI connessione account
4. Test connessione Instagram

### Opzione B: Partire da Un Caso Specifico
1. Setup Meta App per UN account
2. Implemento solo auto-reply commenti
3. Test con account reale
4. Poi espando a multi-account

### Opzione C: UI-First Approach
1. Creo tutta l'interfaccia (dashboard, regole, calendario)
2. Con dati mock
3. Poi collego backend e Meta API

**Cosa preferisci? Dimmi e partiamo! 🚀**
