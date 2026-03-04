# Sistema Gestione Domini - Documentazione

## 📋 Panoramica

Sistema completo per la gestione delle scadenze dei domini dei clienti web design, con alert automatici per web designer e amministratori.

## 🎯 Funzionalità

- ✅ **Inserimento data acquisto dominio** con calcolo automatico scadenza (1 anno)
- ✅ **Alert visivi** nella timeline web designer (30 giorni prima della scadenza)
- ✅ **Dashboard centralizzata** per amministratori con panoramica tutti i domini
- ✅ **Notifiche automatiche** via cron job per domini in scadenza
- ✅ **Sistema di tracciamento** per evitare invii multipli di alert

---

## 🚀 Utilizzo

### Per Web Designer

1. **Accedi alla tua timeline** (`/User/[tuo-id]`)
2. Espandi il progetto del cliente
3. Nella sezione **"🌐 Gestione Dominio"**:
   - Inserisci l'URL del dominio
   - Inserisci la **data di acquisto**
   - La **data di scadenza** viene calcolata automaticamente (1 anno dopo)

4. **Indicatori visivi**:
   - 🚨 **Scaduto**: Badge rosso lampeggiante
   - ⚠️ **In scadenza** (≤30 giorni): Badge arancione con giorni rimanenti
   - 📅 **Prossimo alla scadenza** (≤60 giorni): Messaggio giallo
   - ✅ **OK** (>60 giorni): Nessun alert

### Per Amministratori

1. **Dashboard Domini**: Vai su `/Gestione-Domini`
2. Visualizza panoramica completa:
   - Card statistiche (Totali, In Scadenza, Scaduti, OK)
   - Filtri per stato
   - Tabella dettagliata con tutti i domini

3. **Azioni disponibili**:
   - 🔄 **Ricarica**: Aggiorna la lista
   - ⚠️ **Invia Alert Manuale**: Invia notifiche per domini in scadenza
   - 🔗 **Link rapidi**: Vai alla pagina del web designer

---

## 🔧 Configurazione Alert Automatici

### Opzione 1: Cron Job (Server Locale/VPS)

```bash
# Modifica crontab
crontab -e

# Aggiungi questa riga per eseguire ogni giorno alle 9:00
0 9 * * * cd /path/to/newwebarea && node scripts/cron-domini-scadenza.js >> /var/log/domini-cron.log 2>&1
```

**Alternative**:
- Ogni lunedì alle 9:00: `0 9 * * 1`
- Due volte al giorno (9:00 e 15:00): `0 9,15 * * *`
- Ogni ora: `0 * * * *`

### Opzione 2: Vercel Cron (Deployment Vercel)

1. Crea endpoint API per il cron: `app/api/cron/domini/route.js`

```javascript
import CollaborazioneWebDesign from "@/models/Collaborazioniwebdesign";
import { connectToDB } from "@/utils/database";

export async function GET(req) {
  // Verifica token sicurezza (aggiungi in .env.local)
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    await connectToDB();
    
    // Chiama la stessa logica del POST /api/domini/scadenze
    const response = await fetch(`${process.env.NEXTAUTH_URL}/api/domini/scadenze`, {
      method: 'POST'
    });
    
    const data = await response.json();
    
    return new Response(JSON.stringify(data), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500 
    });
  }
}
```

2. Aggiungi in `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/domini",
      "schedule": "0 9 * * *"
    }
  ]
}
```

3. Aggiungi in `.env.local`:

```bash
CRON_SECRET=your_random_secret_token_here_abc123xyz
```

### Opzione 3: N8N Workflow

1. Crea workflow N8N:
   - **Schedule Trigger**: Ogni giorno alle 9:00
   - **HTTP Request**: POST a `https://tuodominio.com/api/domini/scadenze`
   - **Switch**: Controlla se ci sono notifiche
   - **Send Email**: Invia email a destinatari
   - **Set**: Formatta messaggio

2. Template email:

```
🚨 Alert Scadenza Dominio

Cliente: {{ $json.cliente }}
Dominio: {{ $json.dominio }}
Scadenza: {{ $json.dataScadenza }}
Giorni mancanti: {{ $json.giorniMancanti }}

⚠️ Ricordati di procedere al rinnovo!
```

---

## 📊 Struttura Database

### Modello: Collaborazioniwebdesign

```javascript
{
  // ... campi esistenti ...
  
  dominio: {
    dataAcquisto: Date,        // Data acquisto dominio
    dataScadenza: Date,        // Calcolata automaticamente (dataAcquisto + 1 anno)
    urlDominio: String,        // www.esempio.it
    alertInviato: Boolean,     // true se alert già inviato
    novaAlertData: Date        // Timestamp ultimo alert inviato
  }
}
```

---

## 🔌 API Endpoints

### GET `/api/domini/scadenze`

Recupera tutti i domini con le loro scadenze.

**Query Parameters**:
- `onlyExpiring=true`: Ritorna solo domini in scadenza (≤30 giorni)

**Response**:
```json
[
  {
    "_id": "...",
    "cliente": { "etichetta": "Azienda XYZ" },
    "webDesigner": { "nome": "Mario", "cognome": "Rossi" },
    "dominio": {
      "dataAcquisto": "2025-03-01",
      "dataScadenza": "2026-03-01",
      "urlDominio": "www.aziendaxyz.it"
    },
    "giorniMancanti": 30,
    "scaduto": false,
    "inScadenza": true
  }
]
```

### POST `/api/domini/scadenze`

Invia alert per domini in scadenza e segna come notificati.

**Response**:
```json
{
  "message": "Alert inviati per 3 domini in scadenza",
  "notifiche": [
    {
      "collaborazioneId": "...",
      "cliente": "Azienda XYZ",
      "webDesigner": "Mario Rossi",
      "dominio": "www.aziendaxyz.it",
      "giorniMancanti": 25,
      "destinatari": [
        { "tipo": "webDesigner", "email": "mario@esempio.it" },
        { "tipo": "amministratore", "email": "admin@hoon.it" }
      ]
    }
  ]
}
```

### PATCH `/api/collaborazioni-webdesign/[id]`

Aggiorna i dati del dominio (già esistente, modificato).

**Body**:
```json
{
  "dominio": {
    "urlDominio": "www.nuovodominio.it",
    "dataAcquisto": "2026-01-15"
  }
}
```

**Note**: La `dataScadenza` viene calcolata automaticamente dal backend.

---

## 🔔 Sistema Notifiche

### Logica degli Alert

1. **Check giornaliero** (via cron o manuale):
   - Cerca domini con scadenza tra oggi e 30 giorni
   - Filtra solo domini NON già notificati (`alertInviato: false`)

2. **Destinatari**:
   - Web Designer assegnato al progetto
   - Tutti gli amministratori (utenti senza `subRole`)

3. **Invio notifica**:
   - [TODO] Integrazione servizio email (SendGrid, Nodemailer, N8N)
   - Segna `alertInviato: true` e `novaAlertData: Date.now()`

4. **Reset alert**:
   - Quando si aggiorna `dataAcquisto`, `alertInviato` viene resettato
   - Permette nuovo alert per il ciclo successivo

### Integrazione Email (Da implementare)

Scegli una delle seguenti opzioni:

#### A) Nodemailer

```javascript
// In scripts/cron-domini-scadenza.js o API route

const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

// Invia email
await transporter.sendMail({
  from: 'noreply@hoon.it',
  to: destinatari.map(d => d.email).join(','),
  subject: `🚨 Alert Scadenza Dominio - ${cliente}`,
  html: `
    <h2>Alert Scadenza Dominio</h2>
    <p><strong>Cliente:</strong> ${cliente}</p>
    <p><strong>Dominio:</strong> ${dominio}</p>
    <p><strong>Scadenza:</strong> ${dataScadenza}</p>
    <p><strong>Giorni mancanti:</strong> ${giorniMancanti}</p>
  `
});
```

#### B) SendGrid / Resend

```javascript
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

await sgMail.send({
  to: destinatari.map(d => d.email),
  from: 'noreply@hoon.it',
  subject: `🚨 Alert Scadenza Dominio`,
  html: '...'
});
```

#### C) Webhook N8N

```javascript
await fetch(process.env.N8N_WEBHOOK_DOMINI, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    type: 'alert_dominio',
    data: {
      cliente,
      dominio,
      dataScadenza,
      giorniMancanti,
      destinatari
    }
  })
});
```

---

## 🧪 Testing

### Test Manuale

1. **Crea collaborazione web design** con dominio:
   ```javascript
   // Via UI o API
   {
     dominio: {
       urlDominio: "www.test.it",
       dataAcquisto: "2026-02-28" // Data tra ~27 giorni da oggi
     }
   }
   ```

2. **Verifica calcolo scadenza**:
   - Dovrebbe essere automaticamente "2027-02-28"

3. **Controlla alert visivi**:
   - Vai alla timeline web designer
   - Verifica badge arancione e messaggio

4. **Test API**:
   ```bash
   # Recupera domini in scadenza
   curl http://localhost:3000/api/domini/scadenze?onlyExpiring=true
   
   # Invia alert
   curl -X POST http://localhost:3000/api/domini/scadenze
   ```

5. **Dashboard**:
   - Vai su `/Gestione-Domini`
   - Verifica card statistiche
   - Testa filtri e azione "Invia Alert Manuale"

### Test Script Cron

```bash
# Esegui script manualmente
cd /path/to/newwebarea
node scripts/cron-domini-scadenza.js
```

Output atteso:
```
🔍 Inizio controllo domini in scadenza...
📅 Data controllo: 2/3/2026, 10:30:00

⚠️  Trovati 2 domini in scadenza

📋 DOMINIO IN SCADENZA:
   Cliente: Azienda Test
   Dominio: www.test.it
   ...
   ✅ Alert segnato come inviato

✅ Processo completato! 2 alert elaborati.
```

---

## 📝 Note Importanti

1. **Durata domini**: Attualmente impostata a 1 anno. Se alcuni domini hanno durate diverse (es. 2 anni), aggiungere campo `durataDominio` nel modello.

2. **Reset alert**: Quando si rinnova un dominio:
   - Aggiorna `dataAcquisto` con la nuova data
   - `alertInviato` viene automaticamente resettato
   - Si riceverà un nuovo alert per il prossimo ciclo

3. **Spam prevention**: `novaAlertData` traccia l'ultimo invio per evitare duplicati.

4. **Email integration**: Attualmente il sistema segna gli alert ma **non invia email**. Implementare una delle opzioni del capitolo "Sistema Notifiche".

5. **Permessi**: Solo amministratori possono accedere a `/Gestione-Domini`. I web designer vedono solo i propri progetti.

---

## 🔄 Roadmap Futuri Miglioramenti

- [ ] Integrazione email (Nodemailer/SendGrid/N8N)
- [ ] Notifiche in-app (badge nella navbar)
- [ ] Campo `durataDominio` personalizzabile (1, 2, 3 anni)
- [ ] Storico rinnovi dominio
- [ ] Esportazione report Excel
- [ ] Webhook per integrazione Slack/Teams
- [ ] Dashboard widget per homepage admin
- [ ] Reminder multipli (60gg, 30gg, 7gg prima scadenza)

---

## 🆘 Troubleshooting

### Gli alert non vengono inviati

1. Verifica che il cron job sia attivo:
   ```bash
   crontab -l
   ```

2. Controlla i log:
   ```bash
   tail -f /var/log/domini-cron.log
   ```

3. Esegui script manualmente per debug:
   ```bash
   node scripts/cron-domini-scadenza.js
   ```

### I domini non appaiono in scadenza

- Verifica che `dataAcquisto` sia impostata
- Controlla che `dataScadenza` sia corretta
- Verifica che siano entro 30 giorni da oggi

### Le date non si salvano

- Controlla che il formato data sia corretto (YYYY-MM-DD)
- Verifica la connessione MongoDB
- Controlla errori nella console browser/server

---

## 📧 Supporto

Per problemi o domande:
- Consulta questa documentazione
- Controlla i log dell'applicazione
- Verifica lo stato del database MongoDB
