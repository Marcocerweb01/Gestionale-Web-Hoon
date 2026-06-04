# Setup Meta App per Social Automation

Guida completa per configurare Meta Business App e connettere account Instagram/Facebook al gestionale.

---

## 📋 Prerequisiti

- [ ] Account Facebook personale
- [ ] Facebook Page (per Instagram Business)
- [ ] Instagram Business Account collegato alla Page
- [ ] Account Meta for Developers

---

## 🚀 Step 1: Creazione Meta App

### 1.1 Accedi a Meta for Developers
1. Vai su [developers.facebook.com](https://developers.facebook.com)
2. Login con account Facebook
3. Click **"My Apps"** → **"Create App"**

### 1.2 Configura App
1. **Tipo di App**: Seleziona **"Business"**
2. **Nome App**: `Gestionale Social Manager` (o nome tuo gestionale)
3. **Email contatto**: La tua email business
4. **Business Manager**: Seleziona il tuo o creane uno nuovo

### 1.3 Aggiungi Prodotti

⚠️ **NOTA**: L'interfaccia Meta cambia spesso. Cerca nella sidebar sinistra o nella dashboard principale.

#### Opzione A: Se vedi "Add Product" o "Products"
1. Nella sidebar sinistra → **"Products"** o **"Add Products"**
2. Cerca e aggiungi:
   - **Facebook Login**
   - **Webhooks**

#### Opzione B: Se NON vedi "Add Product"
1. Nella dashboard app, cerca nel menu:
   - **"Use Cases"** → **"Customize"** o
   - **"App Dashboard"** → Scorri giù fino a vedere i prodotti disponibili
2. Oppure vai direttamente a:
   - Sidebar → **"Facebook Login"** → Click per abilitare
   - Sidebar → **"Webhooks"** → Click per abilitare

#### Instagram Graph API Setup
**IMPORTANTE**: Instagram Graph API non è un "prodotto" separato!
- Viene abilitato automaticamente quando configuri **Facebook Login**
- Per usarlo serve:
  1. ✅ Facebook Login abilitato
  2. ✅ Permessi corretti (li richiederemo dopo)
  3. ✅ Instagram Business Account collegato a Facebook Page

#### Facebook Login - Configurazione
1. Sidebar → **"Facebook Login"** → **"Settings"**
2. **Valid OAuth Redirect URIs** (aggiungi entrambi):
   ```
   http://localhost:3000/api/oauth/meta/callback
   https://your-production-domain.com/api/oauth/meta/callback
   ```
3. **Save Changes**

#### Webhooks - Configurazione Base
1. Sidebar → **"Webhooks"**
2. Lo configureremo nel Step 3 (serve ngrok prima)

---

## 🔑 Step 2: Configurazione Variabili d'Ambiente

### 2.1 Recupera Credenziali
Nella dashboard Meta App:
- **App ID**: Copia da "App ID" nella dashboard
- **App Secret**: Settings → Basic → App Secret → Show

### 2.2 Aggiorna .env.local
```bash
# Nel file .env.local
NEXT_PUBLIC_META_APP_ID=123456789012345
META_APP_SECRET=abc123def456ghi789jkl012mno345
NEXT_PUBLIC_META_REDIRECT_URI=http://localhost:3000/api/oauth/meta/callback
META_WEBHOOK_VERIFY_TOKEN=my_super_secret_token_123
```

⚠️ **IMPORTANTE**: 
- `META_WEBHOOK_VERIFY_TOKEN` deve essere una stringa casuale (genera con password manager)
- NON committare `.env.local` su Git!

---

## 📡 Step 3: Setup Webhooks

### 3.1 Esponi localhost con ngrok (per test)
```bash
# Installa ngrok se non l'hai già
ngrok http 3000
```

Copia l'URL generato (es: `https://abc123.ngrok.io`)

### 3.2 Configura Webhook nella Meta App
1. Nella dashboard Meta App → **Webhooks**
2. Click **"Create Subscription"**
3. **Callback URL**: `https://your-ngrok-url.ngrok.io/api/webhook/meta`
4. **Verify Token**: Stesso valore di `META_WEBHOOK_VERIFY_TOKEN`
5. Click **"Verify and Save"**

### 3.3 Sottoscrivi Eventi
Per **Instagram**:
- ✅ `comments`
- ✅ `messages`
- ✅ `messaging_postbacks`
- ✅ `mentions`

Per **Facebook Page**:
- ✅ `feed` (per post/commenti)
- ✅ `messages`
- ✅ `message_echoes`

---

## 🔐 Step 4: Permessi e Scope

### 4.1 Permessi Instagram
Nella sezione **App Review** della Meta App:
1. Click **"Permissions and Features"**
2. Request questi permessi:

**Per Instagram Business Account:**
- `instagram_basic` ✅ (Approved automaticamente)
- `instagram_manage_comments` ⏳ (Richiede review)
- `instagram_manage_messages` ⏳ (Richiede review)
- `instagram_content_publish` ⏳ (Richiede review)

### 4.2 Permessi Facebook Page
- `pages_manage_posts` ✅
- `pages_read_engagement` ✅
- `pages_manage_engagement` ⏳
- `pages_messaging` ⏳
- `pages_show_list` ✅

### 4.3 Status Permessi
- ✅ = Disponibile in modalità sviluppo
- ⏳ = Richiede App Review (4-6 settimane)

---

## 🧪 Step 5: Test Mode (Sviluppo)

### 5.1 Aggiungi Tester
Prima di andare live, puoi testare con account specifici:

1. Meta App → **Roles** → **Test Users**
2. Add People → Aggiungi email Facebook
3. Questi utenti possono ora autenticarsi con l'app

### 5.2 Test Account Instagram
1. L'account Instagram deve essere **Business Account**
2. Deve essere collegato a una **Facebook Page**
3. Tu devi essere Admin della Page

### 5.3 Primo Test
1. Avvia il gestionale: `npm run dev`
2. Vai su `/Operations/SocialAutomation`
3. Click **"Connetti Account"**
4. Autorizza l'app
5. Verifica che gli account appaiano nella dashboard

---

## 🚀 Step 6: App Review (Per Produzione)

### 6.1 Quando Richiedere Review
Richiedi l'app review quando:
- ✅ Hai testato tutte le funzionalità
- ✅ L'app è stabile e funzionante
- ✅ Hai un dominio di produzione (non localhost)

### 6.2 Cosa Preparare
Meta richiede:

1. **Privacy Policy URL**
   - Crea privacy policy che spiega come usi i dati
   - Pubblica su tuo sito
   - Aggiungi URL in Meta App Settings

2. **Terms of Service URL**
   - Termini e condizioni d'uso
   - Pubblica su tuo sito

3. **App Icon & Display Name**
   - Logo 1024x1024px
   - Nome chiaro dell'app

4. **Video Demo**
   - Registra video di 1-2 minuti
   - Mostra come usi ogni permesso richiesto
   - Esempio: "Clicco su commento → L'app invia DM automatico"

5. **Spiegazione Testuale**
   Per ogni permesso, spiega:
   - Perché ne hai bisogno
   - Come lo usi nell'app
   - Valore per l'utente

### 6.3 Tempi di Revisione
- ⏱ **Standard**: 4-6 settimane
- ⏱ **Con errori**: +2 settimane per correzione
- 💡 **Tip**: Più dettagli fornisci, più veloce è l'approvazione

---

## 🔧 Step 7: Produzione

### 7.1 Deploy Gestionale
1. Deploy su Railway/Vercel/altro
2. Ottieni URL produzione: `https://gestionale.tuodominio.com`

### 7.2 Aggiorna Meta App
1. **Facebook Login** → Valid OAuth Redirect URIs:
   ```
   https://gestionale.tuodominio.com/api/oauth/meta/callback
   ```

2. **Webhooks** → Callback URL:
   ```
   https://gestionale.tuodominio.com/api/webhook/meta
   ```

### 7.3 Aggiorna Environment Variables (Produzione)
```bash
# Su Railway/Vercel
NEXT_PUBLIC_META_APP_ID=123456789012345
META_APP_SECRET=abc123...
NEXT_PUBLIC_META_REDIRECT_URI=https://gestionale.tuodominio.com/api/oauth/meta/callback
META_WEBHOOK_VERIFY_TOKEN=same_token_as_dev
```

### 7.4 Switch a Live Mode
1. Meta App Dashboard → **App Mode**
2. Toggle da **Development** a **Live**
3. ⚠️ Solo dopo App Review approvata!

---

## 📊 Step 8: Monitoraggio

### 8.1 Dashboard Meta
- **Webhooks**: Vedi log eventi ricevuti
- **Analytics**: Utilizzo API
- **Alerts**: Errori o rate limiting

### 8.2 Dashboard Gestionale
- `/Operations/SocialAutomation`: Account connessi
- Stats engagement, lead catturati
- Log interazioni

---

## ⚠️ Troubleshooting Comune

### Errore: "Invalid OAuth redirect URI"
✅ **Soluzione**: Verifica che l'URL in Facebook Login Settings corrisponda esattamente a quello in .env.local

### Errore: "This app does not have permission"
✅ **Soluzione**: Permesso non approvato. Usa in modalità sviluppo o richiedi App Review

### Webhook non riceve eventi
✅ **Soluzione**: 
1. Verifica ngrok sia attivo
2. Controlla Verify Token corretto
3. Verifica sottoscrizioni eventi attive

### Token expired
✅ **Soluzione**: I token Meta durano 60 giorni. Implementa refresh automatico o chiedi riautenticazione

---

## 📚 Risorse Utili

- [Meta for Developers Docs](https://developers.facebook.com/docs/)
- [Instagram Graph API](https://developers.facebook.com/docs/instagram-api)
- [Facebook Login](https://developers.facebook.com/docs/facebook-login)
- [Webhooks Guide](https://developers.facebook.com/docs/graph-api/webhooks)
- [App Review Guidelines](https://developers.facebook.com/docs/app-review)

---

## ✅ Checklist Completa

### Setup Iniziale
- [ ] Meta App creata
- [ ] Instagram Graph API abilitata
- [ ] Facebook Login configurato
- [ ] Variabili ambiente impostate
- [ ] Primo account connesso con successo

### Webhooks
- [ ] ngrok installato e funzionante
- [ ] Webhook verificato su Meta
- [ ] Eventi sottoscritti (comments, messages)
- [ ] Test webhook ricevuto correttamente

### Testing
- [ ] Account Instagram Business collegato
- [ ] Commento test → Webhook ricevuto
- [ ] DM test inviato con successo
- [ ] Token refresh funzionante

### Produzione (Quando pronto)
- [ ] Privacy Policy pubblicata
- [ ] Terms of Service pubblicati
- [ ] Video demo registrato
- [ ] App Review submitted
- [ ] Deploy su dominio produzione
- [ ] Redirect URI aggiornati
- [ ] App Mode → Live

---

## 🎯 Prossimi Passi

Ora che hai configurato Meta App:

1. **Testa Connessione Account**
   ```bash
   npm run dev
   # Vai su /Operations/SocialAutomation
   # Click "Connetti Account"
   ```

2. **Implementa Regole Automazione**
   - Pagina gestione regole
   - Workflow n8n per auto-reply

3. **Dashboard Lead**
   - Visualizza lead catturati
   - Analytics interazioni

4. **Post Scheduler**
   - Calendario post
   - Upload media
   - Pubblicazione automatica

**Hai bisogno di aiuto con qualche step? Chiedi! 🚀**
