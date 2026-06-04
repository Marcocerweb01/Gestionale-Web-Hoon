# GESTIONALE HOON — DOCUMENTAZIONE COMPLETA v2.x
> Base per la costruzione del Gestionale 3.0

---

## 1. STACK TECNOLOGICO

| Categoria | Tecnologia | Versione |
|-----------|-----------|---------|
| Framework | Next.js (App Router) | 16.1.6 |
| UI Library | React | 18 |
| Styling | TailwindCSS | 3.4.1 |
| Icone | Lucide React | 0.469 |
| Database | MongoDB + Mongoose | 8.8.2 |
| Auth | NextAuth.js (CredentialsProvider) | 4.24.11 |
| Email | Nodemailer | 7.0.13 |
| Excel Export | ExcelJS | 4.4.0 |
| QR Code | qrcode | 1.5.4 |
| Image Processing | Sharp | 0.34.5 |
| Date Utils | dayjs + date-fns | — |
| Encryption | bcrypt | 6.0.0 |
| Runtime | Node.js | ≥ 20.9.0 |
| Deploy principale | Railway | — |
| Deploy alternativo | Vercel | — |

---

## 2. AUTENTICAZIONE

### Provider
- `NextAuth` con `CredentialsProvider` (email + password)
- Sessione via **JWT** (non DB sessions)

### Tipi di utente (login multi-modello)
| Tipo | Ruolo sessione | Collezione MongoDB |
|------|---------------|-------------------|
| Collaboratore | `"collaboratore"` | `collaboratores` |
| Amministratore | `"amministratore"` | `amministradores` |
| Segretaria | `"segretaria"` | `amministradores` (campo `ruolo`) |
| Azienda/Cliente | `"azienda"` | `aziendas` |

### Dati in sessione (`session.user`)
```js
{
  id,         // MongoDB _id
  email,
  nome,
  cognome,
  role,       // "amministratore" | "segretaria" | "collaboratore" | "azienda"
  subRoles,   // array: ["smm", "commerciale", "web designer", ...]
  status      // "attivo" | "non_attivo"
}
```

### SubRoles disponibili (Collaboratore)
- `"commerciale"` — gestione lead + note commerciali
- `"smm"` — social media manager (post, appuntamenti, feed)
- `"web designer"` — progetti web design (v1 + v2)
- `"seo"` — (ruolo futuro)
- `"google ads"` — campagne Google Ads
- `"meta ads"` — campagne Meta (Instagram/Facebook)

---

## 3. STRUTTURA PROGETTO

```
/newwebarea
├── app/                    # Next.js App Router
│   ├── api/                # API Routes (REST)
│   ├── [pagine]/           # Pagine frontend
│   ├── layout.jsx          # Layout root (Header wrappato in SessionProvider)
│   └── page.jsx            # Home → redirect a Dashboard
├── Components/             # Componenti React riutilizzabili
├── models/                 # Schemi Mongoose
├── lib/
│   └── auth.js             # Configurazione NextAuth
├── utils/
│   ├── database.js         # Connessione MongoDB (singleton)
│   └── createNotifica.js   # Utility notifiche server-side
├── hooks/
│   └── useCollaboratori.js # Hook custom con refresh globale
├── public/                 # Asset statici (logo ecc.)
├── styles/                 # CSS globale
├── scripts/                # Script di migrazione/manutenzione DB
└── .env.local              # Variabili d'ambiente locali
```

---

## 4. VARIABILI D'AMBIENTE (.env.local)

```env
MONGODB_URI=               # Stringa connessione MongoDB Atlas/Railway
NEXTAUTH_SECRET=           # Secret JWT
NEXTAUTH_URL=              # URL base (http://localhost:3000 in dev)
EMAIL_USER=                # Email mittente Nodemailer
EMAIL_PASS=                # Password email
META_APP_ID=               # Meta (Facebook/Instagram) App ID
META_APP_SECRET=           # Meta App Secret
```

---

## 5. MODELLI DATI (MongoDB / Mongoose)

### 5.1 User.js — 4 modelli nello stesso file
```
Azienda (collezione: aziendas)
  _id, nome, cognome, email, password, partitaIva,
  ragioneSociale, etichetta, indirizzo,
  pagamento: Boolean, livelloAccesso: Number(3)

Collaboratore (collezione: collaboratores)
  _id, nome, cognome, email, password, partitaIva,
  subRoles: [String], status: "attivo"|"non_attivo",
  noteAmministratore: String,
  percentuale_hoon: 50|55|60|70,
  tot_fatturato, guadagno_da_hoon, totale_fatture_terzi,
  livelloAccesso: Number(2)

Amministratore (collezione: amministradores)
  _id, nome, cognome, email, password,
  ruolo: "amministratore"|"segretaria"

Contatto (collezione: contattos)
  _id, referente, numero, email, ragioneSociale,
  indirizzo, notes, livelloAccesso: Number(3)
```

### 5.2 Collaborazioni.js (SMM/Commerciale)
```
Collaborazione (collezione: collaboraziones)
  azienda: ref Azienda
  collaboratore: ref Collaboratore
  aziendaRagioneSociale, collaboratoreNome, collaboratoreCognome
  dataInizio, dataFine, stato: "attiva"|"terminata"|"in sospeso"
  note, numero_appuntamenti, appuntamenti_fatti
  post_ig_fb, post_tiktok, post_linkedin
  post_ig_fb_fatti, post_tiktok_fatti, post_linkedin_fatti
  pagato: "si"|"no"
  post_totali, appuntamenti_totali (cumulativi, mai azzerati)
  post_totali_previsti, appuntamenti_totali_previsti
  durata_contratto: "1 mese"|"3 mesi"|"6 mesi"|"1 anno"
  data_inizio_contratto, data_fine_contratto
  instagram_trim_fatti/totali, tiktok_trim_fatti/totali,
  linkedin_trim_fatti/totali, appuntamenti_trimestrale_fatti/totali
  escludi_reset_trimestrale: Boolean
```

### 5.3 Collaborazioniwebdesign.js (Web Design v1)
```
CollaborazioneWebDesign
  tipoProgetto: "e-commerce"|"sito vetrina"|"sito starter"
  cliente: ref Azienda, webDesigner: ref Collaboratore
  aziendaRagioneSociale, collaboratoreNome, collaboratoreCognome
  tasks: [{ nome, dataInizio, dataFine, tempistica, completata }]
  note, problemi
  stato: "in corso"|"in pausa"|"terminata"
  dataInizioContratto, dataFineContratto
  dominio: { dataAcquisto, dataScadenza, urlDominio, alertInviato, novaAlertData }
```

### 5.4 CollaborazioniWebDesignV2.js (Web Design v2 — attuale)
```
CollaborazioneWebDesignV2
  tipoProgetto: "vetrina"|"e-commerce"
  cliente: ref Azienda, webDesigner: ref Collaboratore
  aziendaRagioneSociale, collaboratoreNome, collaboratoreCognome
  fasi: [{
    nome: "struttura"|"stile"|"consegna"
    tasks: [{ nome, completata }]
    note: String
  }]
  fasiControllo: [{
    tipo: "7gg"|"14gg"|"20gg"|"21gg"|"28gg"|"consegna"
    data: Date, note: String, completata: Boolean
  }]
  note, stato: "in corso"|"in pausa"|"terminata"
  dataInizioContratto, dataFineContratto
  dominio: { dataAcquisto, dataScadenza, urlDominio, alertInviato, novaAlertData }
```

### 5.5 Note.js (note SMM/collaborazioni)
```
Nota
  data, nota, autoreId, autore
  collaborazione: ref Collaborazione
  tipo: "generico"|"appuntamento"|"problema"|"post_mancante"
  data_appuntamento (se tipo=appuntamento)
  feeling_emoji: "😄"|"🙂"|"😐"|"😕"|"😤"|"😵💫"|"🔥"|"🧊"|""
  feeling_note: String
```

### 5.6 Note-comm.js (note commerciale)
```
NotaComm
  data, nota, autoreId, autore
  mainCategoria: "appuntamento"|"contatto"
  tipoContatto: "visita"|"chiamata"
  comeArrivato: "in azienda"|"chiamata"|"referal"|"ricerca"
  referal, nomeAzienda, luogo, indirizzo, numeroTelefono, referente
  data_appuntamento, luogo_appuntamento
```

### 5.7 LeadCommerciale.js
```
LeadCommerciale
  nome_attivita, numero_telefono, referente, indirizzo,
  citta, email, secondo_numero
  commerciale: ref Collaboratore
  timeline: {
    contatto:     { completato, data_completamento }
    appuntamento: { completato, data_completamento }
    preventivo:   { completato, data_completamento }
    contratto:    { completato, data_completamento }
  }
  non_interessato: { completato, data_completamento, nota }
  da_ricontattare: { completato, data_completamento, data_ricontatto, nota }
  nota_generale
  stato_attuale: "in_lavorazione"|"non_interessato"|"da_richiamare"|"completato"
  data_cambio_stato, data_richiamo
  archiviato: Boolean, data_archiviazione
```

### 5.8 PagamentiNuovi.js (sistema pagamenti principale)
```
PagamentoNuovo  [UNIFICATO entrata+uscita]
  tipo: "entrata"|"uscita"
  importo, stato_pagamento: "pagato"|"non_pagato"|"ragazzi"
  data_pagamento, mese(1-12), anno, note

  -- Se tipo="entrata" --
  chi_paga: { cliente_id, nome_cliente, etichetta, ragione_sociale }
  destinatario_entrata: "hoon"|"collaboratori"
  servizio: String
  collaboratori: [{
    collaboratore_id, nome_collaboratore,
    usa_percentuale: Boolean,
    percentuale, cifra_fissa, importo_calcolato
  }]
  uscite_generate_ids: [ref PagamentoNuovo]

  -- Se tipo="uscita" --
  destinatario_tipo: "collaboratore"|"azienda_esterna"|"servizio_esterno"
  destinatario_id, nome_destinatario
  generata_da_entrata: Boolean
  entrata_riferimento_id: ref PagamentoNuovo
  ricorrente: Boolean

Servizio  [servizi personalizzabili]
  nome, attivo: Boolean
```

### 5.9 Fatturazione.js (vecchio sistema fatture)
```
Fatturazione
  data, mese("YYYY-MM"), collaboratore: ref Collaboratore
  totale: Number|null
  statoCollaboratore: "non emessa"|"emessa"
  statoAmministratore: "non pagata"|"pagata"
  INDEX UNIQUE: { collaboratore, mese }
```

### 5.10 Dominio.js (domini standalone)
```
Dominio
  urlDominio, dataScadenza, webDesigner(String nome),
  isEsterno: Boolean, note, alertInviato: Boolean
```

### 5.11 GoogleAds.js
```
GoogleAds
  cliente: ref Azienda, collaboratore: ref Collaboratore
  clienteEtichetta, collaboratoreNome, collaboratoreCognome
  contattato, campagnaAvviata, campagnaTerminata: Boolean
  note
  INDEX UNIQUE: { cliente, collaboratore }
```

### 5.12 Notifica.js
```
Notifica
  tipo: "nota_problema"|"dominio_scadenza"|"fine_mese"
  titolo, messaggio, letta: Boolean(false)
  link: String, refId: String
  (timestamps)
```

### 5.13 SocialAccount.js
```
SocialAccount
  userId: ref User, platform: "instagram"|"facebook"
  accountId (unique), username, displayName, profilePicture
  accessToken, tokenExpiry
  status: "active"|"expired"|"error"
  permissions: [String]
  stats: { followers, following, posts, lastSync }
  metadata: Mixed
```

### 5.14 ScheduledPost.js
```
ScheduledPost
  accountId: ref SocialAccount, userId: ref User
  scheduledFor: Date
  status: "pending"|"processing"|"published"|"failed"|"cancelled"
  content: {
    type: "image"|"video"|"carousel"|"text"
    caption, media:[{url,type,order}], hashtags
    location:{id,name}, tagUsers:[{username,userId}]
  }
  publishedAt, publishedPostId, publishedUrl
  error: { message, code, details }
  retryCount, maxRetries(3)
  analytics: { likes, comments, shares, reach, lastSynced }
```

### 5.15 Altri modelli
```
Faq           — { domanda, risposta, categoria, ordine }
FaqSuggerite  — { testo, autoreId, stato:"pendente"|"approvata"|"rifiutata" }
Dispensa      — { titolo, descrizione, fileUrl, categoria, ordine }
DispensaSuggerita — { testo, autoreId, fileUrl, stato }
Pagamenti     — (vecchio) { collaboratore, mese, anno, importo, pagato }
QrCode        — { userId, url, qrImageUrl, createdAt }
SnapshotCollaborazioni — snapshot mensili per storico
SocialLead    — lead da social automation
SocialInteraction — interazioni social (DM, commenti)
SocialAutomation  — regole di automation social
AutomationRule    — regole n8n/webhook
ConfigurazioneRagazzi — config globale collaboratori
ImageCompression  — tracciamento immagini compresse
```

---

## 6. PAGINE FRONTEND

### Accessibili a tutti gli autenticati
| URL | Componente principale | Descrizione |
|-----|-----------------------|-------------|
| `/` | `Dashboard.jsx` | Home dinamica in base al ruolo |
| `/Login` | — | Login con email+password |
| `/Faq` | — | FAQ consultabili |
| `/Dispense` | — | Dispense/materiale formativo |

### Solo Amministratore / Segretaria
| URL | Descrizione |
|-----|-------------|
| `/Register` | Registra nuovo utente (collab/admin/azienda) |
| `/Lista_clienti` | Lista tutti i clienti (Aziende) con schede |
| `/Lista_collaboratori` | Lista tutti i collaboratori |
| `/Lista_webdesigner` | Lista web designer con accesso ai loro progetti |
| `/Lista_clienti_webdesigner/[id]` | Progetti v2 di uno specifico web designer |
| `/Tabella-collaborazioni` | Vista tabellare tutte le collaborazioni |
| `/Gestione-Collaborazioni-Utente` | Gestione collaborazioni per utente |
| `/Gestione-Domini` | Monitor scadenze domini (standalone + da collaborazioni) |
| `/Pagamenti` | Vecchio sistema pagamenti |
| `/PagamentiNuovi` | Nuovo sistema entrate/uscite |
| `/Fatturazione` | Gestione fatture mensili collaboratori |
| `/Notifiche` | Pagina notifiche full (campanella dropdown = preview) |
| `/Gestione-Utenti` | Gestione ruoli, status, note admin sui collaboratori |
| `/Operations` | Funzioni operative avanzate |
| `/AddCollab` | Wizard creazione nuova collaborazione (SMM/WebDesign/GoogleAds) |

### Solo Collaboratori (con ruolo specifico)
| URL | Ruolo | Descrizione |
|-----|-------|-------------|
| `/Feed-2` | smm | Feed post schedulati Instagram/Facebook |
| `/Feed-comm` | commerciale | Feed note commerciali |
| `/Lead` | commerciale | Lista lead del collaboratore |
| `/Lead-comm` | commerciale | Vista lead con note comm |
| `/AddNota` | smm/commerciale | Aggiunta nota a collaborazione |
| `/User/[id]` | tutti | Scheda profilo utente/azienda |
| `/Edit-Collaboratore` | admin | Modifica dati collaboratore |

### Pagine speciali / Legal
| URL | Descrizione |
|-----|-------------|
| `/privacy-policy` | Privacy policy (GDPR) |
| `/terms-of-service` | Termini servizio |
| `/data-deletion` | Richiesta cancellazione dati (Meta) |
| `/unauthorized` | Accesso negato |
| `/Manage-snapshots` | Gestione snapshot collaborazioni |
| `/Lista-Marketing` | (in sviluppo) |
| `/Operations/` | Sotto-sezioni operations |

---

## 7. API ROUTES

### Auth
| Endpoint | Metodi | Descrizione |
|----------|--------|-------------|
| `/api/auth/[...nextauth]` | GET/POST | NextAuth handler |
| `/api/register` | POST | Crea nuovo utente |

### Utenti & Collaboratori
| Endpoint | Metodi | Descrizione |
|----------|--------|-------------|
| `/api/users/[id]` | GET | Dati singolo utente |
| `/api/lista_collaboratori` | GET | Lista tutti i collaboratori (con subRoles, _id, createdAt) |
| `/api/lista_aziende` | GET | Lista tutte le aziende/clienti |
| `/api/collaboratori/[id]` | GET/PUT/DELETE | CRUD singolo collaboratore |
| `/api/gestione-utenti` | GET/PUT | Lista + modifica status/ruoli/note admin |

### Collaborazioni (SMM/Commerciale)
| Endpoint | Metodi | Descrizione |
|----------|--------|-------------|
| `/api/collaborazioni` | GET/POST | Lista/crea collaborazioni |
| `/api/collaborazioni/[id]` | GET/PUT/DELETE | CRUD singola collaborazione |
| `/api/collaborazioni-utente/[id]` | GET | Collaborazioni di un utente |
| `/api/crea_collaborazioni` | POST | Wizard creazione completa |
| `/api/updateCollab` | PUT | Aggiornamento collaborazione |
| `/api/tabella-collaborazioni` | GET | Vista tabellare con join |

### Note SMM
| Endpoint | Metodi | Descrizione |
|----------|--------|-------------|
| `/api/note` | GET/POST | Lista/crea note per collaborazione |
| `/api/edit_note` | PUT | Modifica nota |
| `/api/delete_note` | DELETE | Elimina nota |
| `/api/feed_note` | GET | Note per feed SMM |
| `/api/problemi` | GET/POST | Note con tipo "problema" |
| `/api/post-mancanti` | GET | Note con tipo "post_mancante" |

### Note Commerciale
| Endpoint | Metodi | Descrizione |
|----------|--------|-------------|
| `/api/note_comm` | GET/POST | Note commerciali |
| `/api/edit_note_comm` | PUT | Modifica nota comm |
| `/api/delete_note_comm` | DELETE | Elimina nota comm |
| `/api/feed_note_comm` | GET | Feed note commerciali |

### Web Design v1
| Endpoint | Metodi | Descrizione |
|----------|--------|-------------|
| `/api/collaborazioni-webdesign/[id]` | GET | Collaborazioni per webDesigner o per ID |
| `/api/collaborazioni-webdesign/crea` | POST | Crea collaborazione webdesign v1 |

### Web Design v2
| Endpoint | Metodi | Descrizione |
|----------|--------|-------------|
| `/api/collaborazioni-webdesign-v2/[id]` | GET/PATCH | Get (per userId o collabId) / Aggiorna |
| `/api/collaborazioni-webdesign-v2/crea` | POST | Crea collaborazione webdesign v2 con fasi |

### Domini
| Endpoint | Metodi | Descrizione |
|----------|--------|-------------|
| `/api/domini` | GET/POST | Lista/crea domini standalone |
| `/api/domini/[id]` | PUT/DELETE | Modifica/elimina dominio |
| `/api/domini/scadenze` | GET | Domini in scadenza (da collaborazioni v1+v2) |
| `/api/domini/webdesigners` | GET | Lista nomi web designer attivi |

### Pagamenti (nuovo sistema)
| Endpoint | Metodi | Descrizione |
|----------|--------|-------------|
| `/api/pagamenti-nuovi` | GET/POST | Lista/crea entrate o uscite |
| `/api/pagamenti-nuovi/[id]` | GET/PUT/DELETE | CRUD singolo pagamento |
| `/api/servizi` | GET/POST/PUT/DELETE | Gestione servizi personalizzabili |

### Pagamenti (vecchio sistema)
| Endpoint | Metodi | Descrizione |
|----------|--------|-------------|
| `/api/pagamenti` | GET/POST | Lista pagamenti mensili |
| `/api/pagamenti/[id]` | PUT | Modifica pagamento |
| `/api/pagamenti/genera` | POST | Genera automaticamente pagamenti mese |

### Fatturazione
| Endpoint | Metodi | Descrizione |
|----------|--------|-------------|
| `/api/fatturazione` | GET/POST | Lista/crea fatture |
| `/api/fatturazione/[id]` | PUT | Modifica fattura |
| `/api/fatturazione/genera` | POST | Genera fatture mese corrente |
| `/api/fatturazione/stats` | GET | Statistiche fatturazione |
| `/api/migra-totali` | POST | Migrazione totali fatture |

### Lead Commerciale
| Endpoint | Metodi | Descrizione |
|----------|--------|-------------|
| `/api/leads` | GET/POST | Lista/crea lead |
| `/api/leads/[id]` | GET/PUT/DELETE | CRUD singolo lead |
| `/api/leads/archivia` | PUT | Archivia/ripristina lead |

### Google Ads
| Endpoint | Metodi | Descrizione |
|----------|--------|-------------|
| `/api/google-ads` | GET/POST | Lista/crea collaborazioni Google Ads |
| `/api/google-ads/[id]` | PUT/DELETE | Modifica/elimina |

### Notifiche
| Endpoint | Metodi | Descrizione |
|----------|--------|-------------|
| `/api/notifiche` | GET/DELETE | Lista notifiche / elimina lette |
| `/api/notifiche/[id]` | PATCH | Segna come letta |
| `/api/notifiche/check-domini` | GET | Controlla scadenze, crea notifiche alle soglie |
| `/api/notifiche/check-fine-mese` | GET | Controlla fine mese, crea notifiche |

### Social / Meta / Automation
| Endpoint | Metodi | Descrizione |
|----------|--------|-------------|
| `/api/social-accounts` | GET/POST | Account social collegati |
| `/api/social-accounts/[id]` | GET/PUT/DELETE | CRUD account social |
| `/api/social-accounts/connect` | POST | Connetti account (OAuth) |
| `/api/social-accounts/refresh` | POST | Refresh token |
| `/api/meta` | POST | Webhook Meta / DM automation |
| `/api/webhook` | POST | Webhook generico (n8n) |
| `/api/oauth` | GET | Callback OAuth Meta |
| `/api/automations` | GET/POST | Regole automazione |

### Export / Download
| Endpoint | Metodi | Descrizione |
|----------|--------|-------------|
| `/api/download-excel` | GET | Download Excel collaborazioni (ExcelJS) |
| `/api/export_complete` | GET | Export JSON completo |
| `/api/export_json` | GET | Export JSON parziale |

### QR Code
| Endpoint | Metodi | Descrizione |
|----------|--------|-------------|
| `/api/qrcode` | POST | Genera QR code |
| `/api/qrcode/[id]` | GET | Recupera QR code |
| `/api/qrcode/delete` | DELETE | Elimina QR code |

### FAQ & Dispense
| Endpoint | Metodi | Descrizione |
|----------|--------|-------------|
| `/api/faq` | GET/POST | Lista/crea FAQ |
| `/api/faq/[id]` | PUT/DELETE | Modifica/elimina FAQ |
| `/api/faq-suggerite` | GET/POST | FAQ suggerite dai collaboratori |
| `/api/faq-suggerite/[id]` | PUT | Approva/rifiuta suggerimento |
| `/api/dispense` | GET/POST | Lista/crea dispense |
| `/api/dispense/[id]` | PUT/DELETE | Modifica/elimina |
| `/api/dispense-suggerite` | GET/POST | Dispense suggerite |
| `/api/compress-image` | POST | Comprimi immagine (Sharp) |

### Appuntamenti / Reset SMM
| Endpoint | Metodi | Descrizione |
|----------|--------|-------------|
| `/api/appuntamenti_fatti` | POST | Incrementa appuntamenti fatti |
| `/api/reset_posts` | POST | Reset mensile contatori post |
| `/api/reset_trimestrali` | POST | Reset contatori trimestrali |
| `/api/riattiva-trimestrali` | POST | Riattiva contatori trimestrali |
| `/api/allinea-appuntamenti-trimestrali` | POST | Allinea appuntamenti |
| `/api/sync-appuntamenti-trimestrali` | POST | Sync appuntamenti |
| `/api/init-valutazione-trimestrale` | POST | Inizializza valutazione trimestrale |

### Debug / Manutenzione (non production)
| Endpoint | Descrizione |
|----------|-------------|
| `/api/debug/*` | Vari endpoint diagnostica |
| `/api/fix-status` | Fix stati collaborazioni |
| `/api/clean-duplicates` | Elimina duplicati DB |
| `/api/clear-snapshots` | Pulizia snapshot |
| `/api/update_clienti_schema` | Migrazione schema clienti |
| `/api/configurazione-ragazzi` | Config globale collaboratori |

---

## 8. COMPONENTI PRINCIPALI

| Componente | Dimensione | Descrizione |
|-----------|-----------|-------------|
| `Dashboard.jsx` | 65 KB | Centro nevralgico: pannello admin + sezioni per ruolo |
| `Lista-clienti.jsx` | 37 KB | Lista clienti con filtri, schede, statistiche |
| `Lista-collaboratori.jsx` | 21 KB | Lista collaboratori con editing inline |
| `PagamentiTable.jsx` | 34 KB | Tabella entrate/uscite nuovo sistema |
| `feed-commerciale.jsx` | 41 KB | Feed note commerciali con timeline |
| `edit-collab.jsx` | 28 KB | Form editing collaborazione complessa |
| `timeline-web-designer.jsx` | 27 KB | Timeline v1 web design (task flat) |
| `timeline-web-designer-v2.jsx` | 22 KB | Timeline v2 (fasi struttura/stile/consegna) |
| `GestioneDomini.jsx` | 27 KB | Monitor domini con filtri e rinnovo |
| `azienda-collab.jsx` | 26 KB | Scheda azienda + collaborazioni associate |
| `TimelineLead.jsx` | 20 KB | Timeline lead commerciale (4 step) |
| `add-collab.jsx` | 20 KB | Wizard aggiunta collaborazione SMM |
| `add-webdesign-v2.jsx` | 14 KB | Form creazione progetto web design v2 |
| `add-webdesign-collab.jsx` | 13 KB | Form creazione progetto web design v1 |
| `add-googleads-collab.jsx` | 13 KB | Form creazione collaborazione Google Ads |
| `NotificheDropdown.jsx` | 6 KB | Campanella notifiche con dropdown |
| `Header.jsx` | 5 KB | Header fisso con nav, logout, notifiche |
| `FormEntrata.jsx` | 16 KB | Form entrata nuovo sistema pagamenti |
| `FormUscita.jsx` | 10 KB | Form uscita nuovo sistema pagamenti |
| `TabellaPagamenti.jsx` | 17 KB | Tabella pagamenti (vecchio sistema) |
| `TabellaGoogleAdsAdmin.jsx` | 11 KB | Vista admin campagne Google Ads |
| `VistaGoogleAdsCollaboratore.jsx` | 10 KB | Vista collaboratore campagne Ads |
| `CreaLead.jsx` | 10 KB | Form creazione lead commerciale |
| `ModificaLead.jsx` | 9 KB | Form modifica lead commerciale |
| `QrCodeGenerator.jsx` | 7 KB | Generatore QR code |
| `StatsCollaboratore.jsx` | 5 KB | Card statistiche collaboratore |

---

## 9. FUNZIONALITÀ PER RUOLO

### AMMINISTRATORE
- **Dashboard** con pannello admin completo
- **Gestione collaboratori**: crea, modifica, disattiva, imposta percentuali
- **Gestione clienti**: lista, scheda dettaglio, note, collaborazioni associate
- **Crea collaborazioni**: wizard multi-tipo (SMM / Web Design v1/v2 / Google Ads)
- **Tabella collaborazioni**: vista globale con filtri
- **Gestione collaborazioni utente**: assegna/rimuovi collaborazioni
- **Gestione domini**: monitor scadenze (standalone + da collab), aggiunta manuale, rinnovo
- **Lista web designer**: accesso progetti v2 di ogni designer
- **Pagamenti (nuovo sistema)**: entrate/uscite, auto-generazione uscite da entrate, percentuali
- **Fatturazione**: genera fatture mensili, traccia stato emissione/pagamento
- **Download dati**: export Excel di tutte le collaborazioni (`/api/download-excel`)
- **Export JSON**: export completo DB (`/api/export_complete`, `/api/export_json`)
- **Reset post mensili**: azzera contatori post SMM
- **Reset/Riattiva trimestrali**: gestione valutazioni trimestrali
- **Genera pagamenti**: genera automaticamente record pagamenti del mese
- **FAQ & Dispense**: crea, modifica, ordina, approva suggerimenti
- **Operations**: varie funzioni operative (config, manutenzione)
- **Notifiche**: campanella con badge non lette, dropdown ultimi 5, pagina completa
- **Gestione utenti**: modifica ruoli, status, note admin
- **QR Code**: generazione QR code per link
- **Gestione snapshot**: snapshot mensili collaborazioni

### SEGRETARIA
- Stessa vista admin ma senza: Funzioni avanzate, gestione utenti avanzata

### COLLABORATORE — SMM
- **Dashboard personale** con proprie collaborazioni attive
- **Feed post**: lista post programmati per i propri clienti
- **Aggiunta nota**: nota a collaborazione (generico/appuntamento/problema/post_mancante)
  - Con feeling emoji + feeling note
- **Scheda cliente** (`/User/[id]`): timeline completa note, stats, contatori
- **Fatturazione**: inserisce totale mensile, segna fattura come emessa
- **FAQ/Dispense**: consultazione + suggerimento nuove
- **QR Code**: generazione personale

### COLLABORATORE — COMMERCIALE
- **Dashboard** con sezione lead + feed note commerciali
- **Lista lead**: tutti i propri lead con stati e filtri
- **Gestione lead**: timeline a 4 step (contatto → appuntamento → preventivo → contratto)
  - Segna non interessato / da richiamare con data
  - Archivio lead completati
- **Aggiunta nota commerciale**: appuntamento o contatto
  - Tipo contatto, come arrivato, referal, luogo, referente
- **Feed commerciale**: feed cronologico di tutte le note

### COLLABORATORE — WEB DESIGNER
- **Dashboard** con sezione Web Design (toggle v1/v2)
- **Progetti v2**: fasi struttura/stile/consegna, fasi di controllo, note per fase
- **Fatturazione**: stessa dei collaboratori SMM

### COLLABORATORE — GOOGLE ADS
- **Dashboard** con vista campagne Google Ads assegnate
- Tracciamento stato: contattato / campagna avviata / campagna terminata

---

## 10. SISTEMA NOTIFICHE

### Tipi
| Tipo | Trigger | Link |
|------|---------|------|
| `dominio_scadenza` | Check automatico domini in scadenza | `/Gestione-Domini` |
| `nota_problema` | Aggiunta nota con tipo "problema" da SMM | `/User/[id]` |
| `fine_mese` | Check automatico a fine mese | `/Fatturazione` |

### Soglie notifiche domini
Notifica inviata **una sola volta** per ogni soglia: **30 → 20 → 10 → 5 → 3 → 2 → 1 giorni**
+ una notifica per dominio scaduto

### Deduplicazione
- `refId = "dominio_{_id}_{soglia}gg"` — univoco per soglia
- Check ALL-TIME: se refId già esiste → non crea duplicato

### Triggering
- Avviene al login dell'admin (via `sessionStorage` — una volta per sessione)
- Polling ogni 60 secondi per aggiornare il badge
- `NotificheDropdown` mostra ultimi 5, link a `/Notifiche` per tutti

---

## 11. SISTEMA PAGAMENTI (nuovo)

### Flusso entrata → uscita automatica
1. Crea **Entrata** con `destinatario = "collaboratori"` + lista collaboratori con percentuali/cifre fisse
2. Al salvataggio → genera automaticamente **Uscite** per ogni collaboratore
3. Le uscite linkano all'entrata (`entrata_riferimento_id`)

### Stati pagamento
- `"pagato"` — transazione completata
- `"non_pagato"` — da saldare
- `"ragazzi"` — intermedio (in attesa dai collaboratori)

### Servizi
- Lista personalizzabile di servizi (`Servizio` model)
- Usati come tag su ogni entrata

---

## 12. WEB DESIGN — DIFFERENZE V1 vs V2

| Feature | V1 | V2 |
|---------|----|----|
| Tipo task | Lista flat con tempistica | 3 fasi (struttura/stile/consegna) |
| Task per fase | No | Sì, con note per fase |
| Fasi di controllo | No | Sì (7gg, 14gg, 20gg, 21gg, 28gg, consegna) |
| Progress visivo | No | Sì (stepper + % per fase) |
| Tipi progetto | e-commerce, sito vetrina, sito starter | vetrina, e-commerce |
| Nota problemi | Campo `problemi` separato | Nelle note generali |
| API | `/api/collaborazioni-webdesign` | `/api/collaborazioni-webdesign-v2` |

---

## 13. DEPLOY & INFRASTRUTTURA

### Railway (principale)
- `railway.json` — config deploy
- `Dockerfile.n8n` — container n8n per automazioni
- `n8n` per webhook automation (Instagram DM, post scheduling)

### Vercel (alternativo)
- `vercel.json` — config con rewrites e funzioni Edge

### n8n / Automation
- `N8N_SETUP.md`, `N8N_SETUP_GUIDE.md` — guide setup
- Workflow: auto-reply Instagram DM (`n8n-instagram-auto-reply.json`)
- Webhook generico (`/api/webhook`)

---

## 14. PROBLEMI NOTI / DEBITO TECNICO

| Problema | Dettaglio |
|----------|-----------|
| Filtro web designer legacy | `Lista_webdesigner/page.jsx` usava `collab.subrole === 'webdesigner'` (bug corretto) |
| API lista_collaboratori | Non esponeva `_id` e `createdAt` (bug corretto) |
| Notifiche domini duplicate | Creava una notifica ogni giorno (bug corretto: ora per soglia) |
| V1 vs V2 web design | Due collection separate, nessuna migrazione automatica |
| `Dominio.webDesigner` | Campo stringa (nome) invece di ref ObjectId — da normalizzare |
| `Note.autoreId` ref "Utenti" | Ref a modello inesistente (dovrebbe essere Collaboratore/Amministratore) |
| Vecchio sistema pagamenti | `Pagamenti.js` legacy in parallelo con `PagamentiNuovi.js` |
| Endpoint debug in produzione | Vari `/api/debug/*` non protetti adeguatamente |
| `.backup` files | `TimelineLead.jsx.backup` nel repo |

---

## 15. SCRIPT DI MANUTENZIONE

```
scripts/               — Script Node.js per manutenzione DB
fix_stati_progetti.js  — Fix stati collaborazioni
update_stati_progetti.js — Update stati bulk
init_configurazione_ragazzi.js — Init config collaboratori
trova_orizzonte_blu.js — Script specifico ricerca dati
```

---

## 16. SUGGERIMENTI PER V3.0

### Architettura
- **Separare** models in cartelle per dominio (`/models/smm/`, `/models/webdesign/`, ecc.)
- **Unificare** il sistema utenti: un solo `User` model con discriminatori Mongoose
- **Normalizzare** `Dominio.webDesigner` da String a ObjectId ref
- **Eliminare** il vecchio sistema pagamenti (`Pagamenti.js`)
- **Rimuovere** endpoint debug da produzione

### Funzionalità nuove da valutare
- 📧 **Email reader** (IMAP via `imapflow`) — preview email in gestionale
- 📊 **Dashboard analytics** — grafici entrate/uscite, KPI collaboratori
- 📱 **PWA / notifiche push** — invece di polling ogni 60s
- 🔗 **CRM integrato** — tracciamento completo customer journey
- 📅 **Calendario** — appuntamenti, scadenze domini, fine contratti
- 🤖 **AI Assistant** — suggerimenti basati su dati storici
- 📤 **Invio fatture** — generazione PDF + invio email via Nodemailer
- 🔔 **Notifiche multi-canale** — email + in-app + WhatsApp
- 🏷️ **Tag/Label** su lead e clienti
- 📁 **File attachment** su note e lead
