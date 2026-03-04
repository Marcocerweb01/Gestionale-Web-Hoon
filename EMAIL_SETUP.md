# Configurazione Email per Alert Domini

## 🎯 Obiettivo
Inviare email automatiche a **hoonweb2022@gmail.com** quando un dominio sta per scadere (30 giorni prima).

---

## 📧 Setup Gmail App Password

Per usare Gmail SMTP con nodemailer, devi creare una **App Password** specifica:

### 1️⃣ Preparazione Account Gmail

1. Vai su [myaccount.google.com](https://myaccount.google.com)
2. Clicca su **Sicurezza** nel menu laterale
3. Assicurati che la **Verifica in due passaggi** sia **ATTIVA**
   - Se non è attiva, clicca su "Verifica in due passaggi" e seguire la procedura
   - È obbligatoria per poter creare App Password

### 2️⃣ Generare App Password

1. Vai su [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
2. Potrebbe richiederti di inserire nuovamente la password dell'account
3. In "Seleziona app", scegli **Mail** (o **Altro** se Mail non è disponibile)
4. In "Seleziona dispositivo", scegli **Computer Windows** (o **Altro**)
5. Clicca su **Genera**
6. Google ti mostrerà una password di 16 caratteri (es: `abcd efgh ijkl mnop`)
7. **COPIA QUESTA PASSWORD** (non potrai più visualizzarla)

### 3️⃣ Configurare .env.local

Apri il file `.env.local` nella root del progetto e aggiorna questa riga:

```env
EMAIL_PASS=abcd efgh ijkl mnop
```

Sostituisci `your_gmail_app_password_here` con la password di 16 caratteri che hai generato.

> ⚠️ **IMPORTANTE**: Puoi includere o escludere gli spazi nella password, nodemailer li gestisce automaticamente.

---

## 🧪 Test Email

Dopo aver configurato la password, testa l'invio email:

### Opzione 1: Test tramite Script

```bash
node scripts/test-gestione-domini.js
```

Seleziona l'opzione **5) 📧 Invia alert manualmente**

### Opzione 2: Test tramite API

```bash
curl -X POST http://localhost:3000/api/domini/scadenze
```

Oppure usa Postman/Insomnia per fare una POST a quella route.

### Opzione 3: Test tramite Dashboard

1. Vai su [http://localhost:3000/Gestione-Domini](http://localhost:3000/Gestione-Domini)
2. Fai login come amministratore
3. Clicca sul pulsante **"📧 Invia Alert Manuale"**

---

## 📋 Variabili Email nel .env.local

```env
# Email Configuration (Gmail SMTP)
EMAIL_HOST=smtp.gmail.com              # Host SMTP di Gmail
EMAIL_PORT=587                          # Porta TLS
EMAIL_USER=hoonweb2022@gmail.com       # Tuo account Gmail
EMAIL_PASS=your_gmail_app_password_here # App Password di 16 caratteri
EMAIL_FROM=hoonweb2022@gmail.com       # Mittente (stesso account)
EMAIL_ALERT_TO=hoonweb2022@gmail.com   # Destinatario alert domini
```

---

## 🚀 Come Funziona

### Email Singole (per dominio specifico)

Quando un dominio entra in scadenza, viene inviata una email con:

- 🏢 **Cliente**: Nome dell'azienda cliente
- 🌐 **Dominio**: URL del dominio
- 👤 **Web Designer**: Chi gestisce il progetto
- 📅 **Data Scadenza**: Quando scade
- ⏰ **Giorni Mancanti**: Countdown
- ⚠️ **Urgenza**: Livello di criticità (🚨 Critico, ⚠️ Urgente, 📅 Attenzione)

### Email Riepilogo (alert manuale o cron)

Quando clicchi "Invia Alert Manuale" o parte il cron, viene inviata una email riepilogo con:

- 📊 **Statistiche**: Totale domini in scadenza, scaduti, ok
- 📋 **Lista Domini**: Ordinati per urgenza
- 🎨 **Formato HTML**: Email ben formattata e leggibile

---

## ⚙️ Automazione con Cron

### Setup Cron Job (Consigliato: giornaliero alle 9:00)

**Windows (Task Scheduler):**

1. Apri **Utilità di Pianificazione**
2. Crea attività base:
   - Nome: "Controllo Scadenza Domini"
   - Trigger: Giornaliero alle 9:00
   - Azione: Avvia programma
   - Programma: `node`
   - Argomenti: `C:\Server\Developer\newwebarea\scripts\cron-domini-scadenza.js`
   - Inizia in: `C:\Server\Developer\newwebarea`

**Linux/Mac (crontab):**

```bash
# Modifica crontab
crontab -e

# Aggiungi questa riga (ogni giorno alle 9:00)
0 9 * * * cd /path/to/newwebarea && node scripts/cron-domini-scadenza.js
```

---

## 🔍 Troubleshooting

### Email non inviata

**Errore: "Invalid login: 535-5.7.8 Username and Password not accepted"**

➡️ Soluzione: 
- Verifica che la Verifica in due passaggi sia attiva
- Rigenerare l'App Password
- Controlla di aver copiato correttamente tutti i 16 caratteri

**Errore: "getaddrinfo ENOTFOUND smtp.gmail.com"**

➡️ Soluzione: 
- Controlla la connessione internet
- Verifica che `EMAIL_HOST` sia `smtp.gmail.com`

**Errore: "self signed certificate in certificate chain"**

➡️ Soluzione: 
- Usa `EMAIL_PORT=587` (TLS) invece di 465 (SSL)
- Il codice in `emailService.js` già usa `secure: false` per TLS

### Email finisce in Spam

➡️ Soluzione:
- È normale per le prime email
- Marca come "Non spam" manualmente
- Aggiungi hoonweb2022@gmail.com ai contatti

### Console mostra "⚠️ EMAIL_PASS non configurata"

➡️ Soluzione:
- Controlla che `.env.local` contenga `EMAIL_PASS=...`
- Riavvia il server Next.js dopo aver modificato `.env.local`

---

## 📝 Note Finali

✅ Le email vengono inviate **solo quando un dominio entra nella finestra di 30 giorni**

✅ Il sistema evita **duplicati** grazie al campo `alertInviato` nel database

✅ Puoi **forzare l'invio** usando il pulsante "Invia Alert Manuale" (resetta `alertInviato`)

✅ Le email sono in **formato HTML** con stile professionale

✅ Il destinatario è **sempre hoonweb2022@gmail.com** (configurabile in `EMAIL_ALERT_TO`)

---

## 🔗 File Coinvolti

- `utils/emailService.js` - Servizio invio email
- `app/api/domini/scadenze/route.js` - API che invia email
- `scripts/cron-domini-scadenza.js` - Script automatico
- `Components/GestioneDomini.jsx` - Pulsante "Invia Alert Manuale"
- `.env.local` - Configurazione credenziali email

---

🎉 **Setup completato!** Ora il sistema invierà email automatiche quando i domini stanno per scadere.
