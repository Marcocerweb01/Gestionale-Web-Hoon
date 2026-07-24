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

## 16. AUDIT FUNZIONALE V3.0

### Obiettivo V3
La versione 3.0 deve trasformare il gestionale da somma di moduli separati a piattaforma unica per agenzia, collaboratori e aziende clienti.

Priorita:
- UI stile WordPress: sidebar sinistra persistente + area dashboard a destra.
- Accessi e permessi chiari per ogni ruolo.
- Collaborazioni molti-a-molti: una azienda puo avere piu collaboratori e un collaboratore puo lavorare con piu aziende.
- Fascicolo azienda unico: social, web design, SEO, Google Ads, Meta Ads, commerciale, domini, ticket, chat, pagamenti, fatture e documenti nello stesso perimetro.
- Reset mensili/trimestrali e valutazioni collaboratori tracciati in modo storico, non solo azzerati.

### Layout V3
Struttura consigliata:
```
AppShell
  Sidebar sinistra stile WordPress
    Dashboard
    Aziende
    Collaborazioni
    Calendario
    Notebook
    Lead commerciali
    Domini
    Pagamenti
    Fatturazione collaboratori
    Ticket
    Chat
    Dispense
    FAQ
    Operations
    Notifiche
    Utenti e permessi
    Impostazioni agenzia
  Main panel a destra
    Header compatto con ricerca globale, notifiche, profilo
    Contenuto pagina
```

Note implementative:
- `Header.jsx` oggi contiene navigazione orizzontale; in V3 va convertito in `AppShell` con sidebar + topbar.
- La ricerca globale va mantenuta nella topbar.
- Le voci sidebar devono essere generate da una matrice permessi, non hardcodate per pagina.
- Ogni pagina deve ricevere contesto ruolo/permessi e mostrare solo azioni consentite.

---

## 17. RUOLI E PERMESSI V3

### Ruoli principali
| Ruolo V3 | Ruolo attuale/sessione | Tipo | Note |
|----------|------------------------|------|------|
| Agenzia | nuovo `agenzia` oppure admin owner | amministratore totale | Puo fare tutto, inclusa gestione agenzia, reset, export, valutazioni |
| Amministrazione | `amministratore` | amministratore operativo | Puo modificare/cancellare tutto tranne eliminare agenzia |
| Segreteria | `segretaria` | amministratore limitato | Puo modificare/cancellare record operativi, non elimina agenzia/admin |
| Collaboratore | `collaboratore` + `subRoles` | operativo | Vede solo collaborazioni assegnate |
| Azienda | `azienda` | cliente | Vede solo proprio fascicolo, chat, avanzamenti e ticket |

### Sub-ruoli collaboratore
| Sub-ruolo | Slug consigliato | Stato attuale |
|-----------|------------------|---------------|
| Social Media Manager | `smm` | presente |
| Web Designer | `web_designer` | presente come `"web designer"` |
| Marketing SEO | `seo` | presente ma da definire |
| Marketing Google Ads | `google_ads` | presente come `"google ads"` |
| Marketing Meta Ads | `meta_ads` | presente come `"meta ads"` |
| Commerciale | `commerciale` | presente |

Nota: normalizzare gli slug eliminando spazi. Mantenere compatibilita in migrazione:
- `"web designer"` -> `web_designer`
- `"google ads"` -> `google_ads`
- `"meta ads"` -> `meta_ads`

### Matrice permessi
| Azione | Agenzia | Amministrazione | Segreteria | Collaboratore | Azienda |
|--------|---------|-----------------|------------|----------------|---------|
| Creare/modificare agenzia | si | no eliminazione | no | no | no |
| Eliminare agenzia | si | no | no | no | no |
| Creare/modificare admin | si | si | no eliminazione admin | no | no |
| Eliminare admin | si | si | no | no | no |
| Creare aziende | si | si | si | solo commerciale come lead/proposta | no |
| Modificare aziende | si | si | si | solo campi operativi assegnati | no |
| Eliminare aziende | si | si | si, esclusi vincoli critici | no | no |
| Creare collaborazioni | si | si | si | no | no |
| Spostare collaboratori tra collaborazioni | si | si | si | no | no |
| Gestire proprie collaborazioni | si | si | si | solo assegnate | sola lettura avanzamento |
| Gestire pagamenti agenzia | si | si | no o sola lettura | no | no |
| Gestire fatture collaboratori | si | si | si operativa | proprie fatture | no |
| Export/download dati | si | si | si limitato | no | no |
| Reset mensile/trimestrale | si | si | no o solo avvio guidato | no | no |
| Valutazioni collaboratori | si | si | no o sola lettura | no | no |
| Chat | si | si | si | solo proprie aziende | solo propri collaboratori |
| Ticket assistenza | si | si | si | assegnati | propri ticket |
| Operations | si | si | si limitata | strumenti personali | no |

### Permessi tecnici consigliati
Usare permessi granulari oltre al ruolo:
```
permissions: [
  "agency.manage",
  "users.manage",
  "admins.delete",
  "companies.manage",
  "collaborations.manage",
  "collaborations.assign",
  "collaborations.export",
  "collaborations.reset_monthly",
  "collaborations.reset_quarterly",
  "evaluations.manage",
  "payments.manage",
  "invoices.manage",
  "domains.manage",
  "tickets.manage",
  "chat.use",
  "knowledge.manage",
  "operations.use",
  "notifications.manage"
]
```

---

## 18. ENTITA E CAMPI MANCANTI PER V3

### 18.1 Agenzia
Oggi non esiste un modello agenzia separato: il gestionale e single-agency implicito.

Campi richiesti:
```
Agenzia
  _id
  nome
  ragioneSociale
  partitaIva
  codiceFiscale
  codiceUnivoco
  pec
  email
  telefono
  sitoWeb
  indirizzo: { via, citta, provincia, cap, nazione }
  logoUrl
  impostazioni:
    timezone
    valuta
    resetMensileAbilitato
    resetTrimestraleAbilitato
    soglieNotificheDomini
  billing:
    iban
    banca
    intestatario
  createdBy, updatedBy
  createdAt, updatedAt
```

### 18.2 Utente unificato
Oggi esistono `Azienda`, `Collaboratore`, `Amministratore`, `Contatto` separati. Per V3 conviene unificare login e profilo.

Campi richiesti:
```
User
  _id
  agenziaId: ref Agenzia
  tipo: "agenzia"|"amministrazione"|"segretaria"|"collaboratore"|"azienda"
  nome
  cognome
  displayName
  email
  telefono
  passwordHash
  avatarUrl
  stato: "attivo"|"sospeso"|"disattivato"
  subRoles: ["smm","web_designer","seo","google_ads","meta_ads","commerciale"]
  permissions: [String]
  ultimoAccessoAt
  preferenze:
    sidebarCollapsed
    dashboardDefaultView
    notificheEmail
    notificheInApp
  sicurezza:
    mustChangePassword
    passwordUpdatedAt
    twoFactorEnabled
  createdBy, updatedBy
  createdAt, updatedAt
```

Compatibilita:
- `Collaboratore` puo restare come profilo operativo collegato a `User`.
- `Azienda` puo restare come anagrafica cliente collegata a uno o piu utenti azienda.

### 18.3 Azienda cliente
Campi attuali insufficienti per portale cliente, fatturazione, domini, servizi e collaborazioni.

Campi richiesti:
```
Azienda
  _id
  agenziaId: ref Agenzia
  ragioneSociale
  etichetta
  partitaIva
  codiceFiscale
  codiceUnivoco
  pec
  email
  telefono
  sitoWeb
  settore
  descrizioneAttivita
  indirizzoLegale: { via, citta, provincia, cap, nazione }
  indirizzoOperativo: { via, citta, provincia, cap, nazione }
  referenti: [{
    nome
    cognome
    ruolo
    email
    telefono
    principale
  }]
  utentiPortale: [ref User]
  statoCliente: "lead"|"attivo"|"in pausa"|"ex_cliente"
  origine: "commerciale"|"referal"|"chiamata"|"ricerca"|"social"|"altro"
  commercialeOwner: ref User
  tags: [String]
  noteInterne
  privacy:
    consensoMarketing
    consensoTrattamentoDati
  createdBy, updatedBy
  createdAt, updatedAt
```

### 18.4 Collaboratore
Campi attuali buoni per base, ma mancano anagrafica completa, disponibilita e valutazioni.

Campi richiesti:
```
CollaboratoreProfile
  _id
  userId: ref User
  agenziaId: ref Agenzia
  partitaIva
  codiceFiscale
  iban
  intestatarioConto
  indirizzo: { via, citta, provincia, cap, nazione }
  subRoles
  competenze: [String]
  seniority: "junior"|"middle"|"senior"|"lead"
  disponibilitaSettimanaleOre
  costoOrario
  percentualeDefault
  percentuale_hoon
  statoOperativo: "attivo"|"non_attivo"|"in pausa"
  noteAmministratore
  metriche:
    tot_fatturato
    guadagno_da_hoon
    totale_fatture_terzi
  createdBy, updatedBy
  createdAt, updatedAt
```

### 18.5 Collaborazione unificata
Oggi le collaborazioni sono separate per SMM, WebDesign V1/V2 e GoogleAds. In V3 serve una collaboration shell comune.

Campi richiesti:
```
Collaborazione
  _id
  agenziaId: ref Agenzia
  aziendaId: ref Azienda
  titolo
  tipo: "smm"|"web_design"|"seo"|"google_ads"|"meta_ads"|"commerciale"|"mista"
  stato: "bozza"|"attiva"|"in pausa"|"terminata"|"archiviata"
  priorita: "bassa"|"media"|"alta"|"critica"
  dataInizio
  dataFine
  contratto:
    durata
    dataInizio
    dataFine
    rinnovoAutomatico
    valoreMensile
    valoreTotale
  team: [{
    collaboratoreId: ref User
    subRole
    ruoloNelProgetto: "owner"|"operativo"|"supporto"|"reviewer"
    percentuale
    cifraFissa
    dataAssegnazione
    dataFineAssegnazione
    attivo
  }]
  servizi: [{
    tipo
    nome
    stato
    budget
    obiettivi
  }]
  avanzamento:
    percentuale
    statoSintetico
    ultimoAggiornamentoAt
  notebookId: ref Notebook
  calendarioId: ref CalendarioOperativo
  chatId: ref ChatThread
  createdBy, updatedBy
  createdAt, updatedAt
```

Relazione richiesta:
- Un collaboratore puo apparire nel `team` di piu collaborazioni.
- Una azienda puo avere piu collaborazioni e ogni collaborazione puo avere piu collaboratori.
- Per query/report conviene anche una collection `CollaborazioneAssegnazione`.

### 18.6 CollaborazioneAssegnazione
Serve per spostare collaboratori, storico e permessi per singola collaborazione.

Campi richiesti:
```
CollaborazioneAssegnazione
  _id
  collaborazioneId: ref Collaborazione
  aziendaId: ref Azienda
  collaboratoreId: ref User
  subRole
  stato: "attiva"|"sospesa"|"terminata"
  dataInizio
  dataFine
  percentuale
  cifraFissa
  permessiCollaborazione: [
    "read",
    "update_status",
    "manage_posts",
    "manage_calendar",
    "manage_notes",
    "manage_ads",
    "reply_chat",
    "manage_tickets"
  ]
  motivoSpostamento
  assegnatoDa: ref User
  createdAt, updatedAt
```

### 18.7 Notebook
Oggi le note esistono, ma sono divise tra SMM e commerciale. In V3 serve un notebook trasversale.

Campi richiesti:
```
NotebookNote
  _id
  agenziaId
  aziendaId
  collaborazioneId
  autoreId
  visibilita: "interna"|"cliente"|"team"
  tipo: "generale"|"appuntamento"|"problema"|"decisione"|"post_mancante"|"follow_up"
  titolo
  contenuto
  dataAppuntamento
  statoProblema: "aperto"|"in_lavorazione"|"risolto"
  feeling: { emoji, nota }
  allegati: [ref FileAsset]
  mentions: [ref User]
  createdAt, updatedAt
```

### 18.8 Calendario operativo
Necessario soprattutto per web designer, ma utile per tutti.

Campi richiesti:
```
CalendarioOperativo
  _id
  agenziaId
  collaborazioneId
  items: [{
    titolo
    descrizione
    tipo: "task"|"appuntamento"|"scadenza"|"controllo"|"pubblicazione"
    dataInizio
    dataFine
    giornoOperativo
    assegnatoA: [ref User]
    stato: "da_fare"|"in_corso"|"bloccato"|"completato"
    priorita
    note
  }]
```

### 18.9 Social Media Manager
Campi specifici servizio:
```
SmmService
  collaborazioneId
  piattaforme: ["instagram","facebook","tiktok","linkedin"]
  pianoEditoriale:
    postPrevistiMese
    storiesPrevisteMese
    reelPrevistiMese
    appuntamentiPrevistiMese
  contatoriMensili:
    post_ig_fb_fatti
    post_tiktok_fatti
    post_linkedin_fatti
    appuntamenti_fatti
  contatoriTrimestrali:
    instagram_trim_fatti
    instagram_trim_totali
    tiktok_trim_fatti
    tiktok_trim_totali
    linkedin_trim_fatti
    linkedin_trim_totali
    appuntamenti_trimestrale_fatti
    appuntamenti_trimestrale_totali
  storicoReset: [ref ResetLog]
```

### 18.10 Web Designer
Campi specifici servizio:
```
WebDesignService
  collaborazioneId
  tipoProgetto: "starter"|"vetrina"|"e-commerce"|"custom"
  fasi
  controlli
  checklistPubblicazione
  interview
  dominioId
  ambiente:
    cms
    hosting
    stagingUrl
    produzioneUrl
  consegna:
    dataPrevista
    dataEffettiva
    esito
```

### 18.11 Marketing SEO
Ruolo da definire: proposta V3.
```
SeoService
  collaborazioneId
  audit:
    dataAudit
    stato
    fileUrl
  keyword: [{
    parola
    intento
    priorita
    volumeStimato
    posizioneIniziale
    posizioneAttuale
  }]
  pagineOttimizzate: [{
    url
    keywordPrincipale
    stato
    dataOttimizzazione
  }]
  taskMensili
  reportMensili
```

### 18.12 Marketing Google Ads
Campi attuali troppo sintetici.
```
GoogleAdsService
  collaborazioneId
  accountId
  customerId
  budgetMensile
  obiettivo: "lead"|"vendite"|"traffico"|"brand"
  campagne: [{
    nome
    tipo
    budget
    stato
    dataAvvio
    dataFine
    kpi: { impressions, click, costo, conversioni, cpa }
  }]
  statoOperativo: "da_contattare"|"setup"|"attiva"|"in_pausa"|"terminata"
  note
```

### 18.13 Marketing Meta Ads
```
MetaAdsService
  collaborazioneId
  businessManagerId
  adAccountId
  pixelId
  budgetMensile
  obiettivo
  campagne
  creativita: [{
    titolo
    formato
    stato
    fileAssetId
  }]
  statoOperativo
  note
```

### 18.14 Commerciale
Campi lead attuali buoni, ma manca conversione formale in azienda/collaborazione.
```
LeadCommerciale V3
  _id
  agenziaId
  commercialeId
  aziendaId: ref Azienda|null
  nome_attivita
  referente
  contatti: { telefono, secondoTelefono, email }
  indirizzo
  fonte
  stato: "nuovo"|"contattato"|"appuntamento"|"preventivo"|"contratto"|"convertito"|"perso"|"da_richiamare"
  timeline
  dataRichiamo
  valoreStimato
  serviziProposti: ["smm","web_design","seo","google_ads","meta_ads"]
  motivoPerso
  note
  convertitoInAziendaAt
  convertitoInCollaborazioneId
```

### 18.15 Portale azienda
```
AziendaPortal
  aziendaId
  utenti: [ref User]
  collaborazioniVisibili: [ref Collaborazione]
  permessi:
    canOpenTicket
    canUseChat
    canViewProgress
    canViewDocuments
  preferenzeNotifiche
```

Funzioni azienda:
- Accede alla chat con i collaboratori assegnati.
- Vede avanzamento progetti e scadenze principali.
- Apre ticket di assistenza.
- Consulta dispense/FAQ rese visibili ai clienti.

### 18.16 Chat e ticket
```
ChatThread
  _id
  aziendaId
  collaborazioneId
  partecipanti: [ref User]
  visibilita: "cliente_team"|"interna"
  ultimoMessaggioAt

ChatMessage
  threadId
  autoreId
  testo
  allegati
  lettoDa: [{ userId, lettoAt }]

Ticket
  _id
  aziendaId
  collaborazioneId
  apertoDa: ref User
  assegnatoA: [ref User]
  titolo
  descrizione
  categoria: "assistenza"|"bug"|"contenuti"|"dominio"|"pagamento"|"altro"
  priorita: "bassa"|"media"|"alta"|"urgente"
  stato: "aperto"|"in_lavorazione"|"in_attesa_cliente"|"risolto"|"chiuso"
  messaggi: [ref ChatMessage]
  createdAt, updatedAt, closedAt
```

### 18.17 Gestione password
Da aggiungere solo con cifratura forte lato server.
```
CredentialVaultItem
  _id
  agenziaId
  aziendaId
  collaborazioneId
  titolo
  categoria: "dominio"|"hosting"|"wordpress"|"social"|"ads"|"email"|"altro"
  url
  username
  passwordEncrypted
  noteEncrypted
  visibileA: [ref User]
  ultimoAccessoAt
  createdBy
  updatedBy
  createdAt, updatedAt
```

Regole:
- Mai salvare password in chiaro.
- Audit log ogni volta che una credenziale viene visualizzata/modificata.
- Permesso dedicato `credentials.view` e `credentials.manage`.

### 18.18 Valutazioni collaboratori
Richieste per amministrazione su SMM e web designer.
```
ValutazioneCollaboratore
  _id
  agenziaId
  collaboratoreId
  periodo:
    tipo: "mensile"|"trimestrale"
    anno
    trimestre
    mese
    dataInizio
    dataFine
  ruoloValutato: "smm"|"web_designer"|"seo"|"google_ads"|"meta_ads"|"commerciale"
  valutatoreId
  metriche:
    puntualita
    qualita
    comunicazione
    autonomia
    rispettoObiettivi
  kpi:
    previsti
    completati
    percentualeCompletamento
  note
  esito: "ottimo"|"buono"|"sufficiente"|"critico"
  azioniRichieste
  createdAt, updatedAt
```

### 18.19 Reset e storico dati
I reset non devono cancellare informazione senza storico.
```
ResetLog
  _id
  agenziaId
  tipo: "mensile"|"trimestrale"|"valutazione"
  periodo
  target:
    collaborazioneIds
    collaboratoreIds
  snapshotPrima
  snapshotDopo
  eseguitoDa
  eseguitoAt
  note
```

### 18.20 Pagamenti e fatture
Il nuovo sistema pagamenti e la fatturazione collaboratori vanno collegati a collaborazioni/assegnazioni.
Campi da aggiungere a `PagamentoNuovo`:
```
agenziaId
aziendaId
collaborazioneId
assegnazioneId
numeroDocumento
dataCompetenzaDa
dataCompetenzaA
metodoPagamento
scadenzaPagamento
allegati
createdBy, updatedBy
```

Campi da aggiungere a `Fatturazione`:
```
agenziaId
collaborazioneIds
assegnazioneIds
numeroFattura
dataEmissione
dataScadenza
fileUrl
noteAdmin
```

### 18.21 Domini
Normalizzazione richiesta:
```
Dominio
  agenziaId
  aziendaId
  collaborazioneId
  webDesignerId: ref User
  registrar
  urlDominio
  dataAcquisto
  dataScadenza
  rinnovoAutomatico
  stato: "attivo"|"in_scadenza"|"scaduto"|"trasferito"
  credenzialeId
  note
  alertInviati: [{ soglia, dataInvio }]
```

### 18.22 Knowledge base: dispense, FAQ, operations
Campi comuni consigliati:
```
KnowledgeItem
  tipo: "dispensa"|"faq"|"operation"
  titolo
  contenuto
  categoria
  tags
  fileUrl
  visibileA: ["admin","collaboratori","aziende"]
  subRolesVisibili
  stato: "bozza"|"pubblicato"|"archiviato"
  suggeritoDa
  approvatoDa
  ordine
```

Operations V3:
- QR code generator.
- Compressore immagini.
- Google Places no website.
- Social automation.
- Strumenti futuri raggruppati per categoria e permesso.

### 18.23 Notifiche
Campi da aggiungere:
```
Notifica
  agenziaId
  destinatarioIds: [ref User]
  canale: "in_app"|"email"|"whatsapp"
  severita: "info"|"warning"|"critical"
  azioneLabel
  azioneUrl
  lettaDa: [{ userId, lettoAt }]
  scadenzaAt
```

### 18.24 Audit log
Obbligatorio per ruoli admin, reset, export, password e cancellazioni.
```
AuditLog
  agenziaId
  actorId
  azione
  entityType
  entityId
  before
  after
  ip
  userAgent
  createdAt
```

---

## 19. GAP TRA V2 ATTUALE E V3 RICHIESTA

| Area | Stato attuale | Mancanza V3 | Azione consigliata |
|------|---------------|-------------|--------------------|
| Ruoli | `amministratore`, `segretaria`, `collaboratore`, `azienda` | manca `agenzia` owner e permessi granulari | aggiungere RBAC centralizzato |
| SubRoles | array stringhe con spazi | slug non normalizzati | migrazione slug |
| Collaborazioni | collection separate per tipo e 1 collaboratore per record | team molti-a-molti e fascicolo unico | introdurre `Collaborazione` + `CollaborazioneAssegnazione` |
| Azienda | anagrafica minima | referenti, portale, stato cliente, privacy, fatturazione | estendere schema |
| Portale azienda | login azienda presente ma funzioni limitate | chat, ticket, avanzamento | creare moduli customer portal |
| SMM | contatori e note presenti | piano editoriale strutturato e storico reset | estrarre servizio SMM |
| Web design | V2 avanzata presente | calendario operativo comune e dominio normalizzato | collegare a shell collaborazione |
| SEO | solo subRole | modello operativo assente | creare `SeoService` |
| Google Ads | booleani base | budget, campagne, KPI | estendere modello |
| Meta Ads | subRole ma nessun modello dedicato | servizio Meta Ads | creare `MetaAdsService` |
| Commerciale | lead/timeline presenti | conversione lead -> azienda -> collaborazione | aggiungere workflow conversione |
| Pagamenti | sistema nuovo buono | collegamento forte a collaboration/assignment | aggiungere ref e competenze |
| Fatture collaboratori | mensile semplice | file, scadenze, riferimenti collaborazioni | estendere schema |
| Password | assente | vault cifrato | creare modulo dedicato |
| Reset | endpoint presenti | audit e snapshot prima/dopo | creare `ResetLog` |
| Valutazioni | init trimestrale presente | modello valutazione completo | creare `ValutazioneCollaboratore` |
| Sidebar | header orizzontale | WordPress shell | creare `AppShell` |
| Audit | assente | log amministrativo | creare `AuditLog` |

---

## 20. ROADMAP IMPLEMENTATIVA V3

### Fase 1 — Fondamenta
- Creare `Agenzia`.
- Creare RBAC centralizzato (`roles`, `permissions`, helper `can()`).
- Normalizzare subRoles con migrazione.
- Introdurre `AppShell` con sidebar WordPress-style.
- Proteggere API debug/manutenzione.

### Fase 2 — Collaborazioni molti-a-molti
- Creare `Collaborazione` shell.
- Creare `CollaborazioneAssegnazione`.
- Collegare SMM, WebDesign V2 e GoogleAds alla shell tramite migrazione soft.
- Aggiungere spostamento collaboratori con storico.

### Fase 3 — Portale azienda
- Dashboard azienda.
- Avanzamento progetti.
- Chat cliente-team.
- Ticket assistenza.
- Permessi cliente per collaborazione.

### Fase 4 — Operativita reparti
- SMM: piano editoriale + notebook unificato.
- Web designer: calendario operativo per giorni.
- SEO: audit, keyword, pagine ottimizzate.
- Google Ads: campagne e KPI.
- Meta Ads: account, campagne, creativita e KPI.
- Commerciale: conversione lead in azienda/collaborazione.

### Fase 5 — Amministrazione
- Pagamenti collegati a collaborazioni e assegnazioni.
- Fatture collaboratori complete.
- Valutazioni mensili/trimestrali.
- Reset con snapshot e audit log.
- Export dati per periodo, ruolo, azienda, collaborazione.

### Fase 6 — Operations
- QR code generator consolidato.
- Compressore immagini consolidato.
- Gestione notifiche multi-canale.
- Knowledge base unificata per dispense, FAQ e operation.
- Password vault cifrato con audit.

---

## 21. MODELLI DA CREARE O MODIFICARE

### Nuovi modelli
- `Agenzia.js`
- `UserUnified.js` oppure evoluzione graduale di `User.js`
- `CollaborazioneV3.js`
- `CollaborazioneAssegnazione.js`
- `NotebookNote.js`
- `CalendarioOperativo.js`
- `SeoService.js`
- `MetaAdsService.js`
- `ChatThread.js`
- `ChatMessage.js`
- `Ticket.js`
- `CredentialVaultItem.js`
- `ValutazioneCollaboratore.js`
- `ResetLog.js`
- `AuditLog.js`
- `FileAsset.js`
- `KnowledgeItem.js`

### Modelli da estendere
- `models/User.js`: aggiungere profili completi, permessi, normalizzazione ruoli.
- `models/Collaborazioni.js`: collegare a `CollaborazioneV3` o migrare a servizio SMM.
- `models/CollaborazioniWebDesignV2.js`: collegare a `CollaborazioneV3`, dominio ref, calendario ref.
- `models/GoogleAds.js`: sostituire booleani con stato operativo, campagne, budget e KPI.
- `models/PagamentiNuovi.js`: aggiungere riferimenti ad azienda/collaborazione/assegnazione.
- `models/Fatturazione.js`: aggiungere documento, scadenza, allegato e refs.
- `models/Dominio.js`: sostituire `webDesigner` stringa con `webDesignerId`.
- `models/Notifica.js`: destinatari multipli, severita, canale e letture per utente.

### Endpoint V3 consigliati
```
/api/v3/agency
/api/v3/users
/api/v3/roles
/api/v3/permissions
/api/v3/companies
/api/v3/collaborations
/api/v3/collaborations/[id]/assignments
/api/v3/notebook
/api/v3/calendar
/api/v3/services/smm
/api/v3/services/web-design
/api/v3/services/seo
/api/v3/services/google-ads
/api/v3/services/meta-ads
/api/v3/leads/convert
/api/v3/tickets
/api/v3/chat
/api/v3/domains
/api/v3/payments
/api/v3/invoices
/api/v3/evaluations
/api/v3/resets
/api/v3/export
/api/v3/knowledge
/api/v3/operations
/api/v3/notifications
/api/v3/audit-log
```

### Regola di migrazione consigliata
Non eliminare subito le collection V2. Creare V3 in parallelo con campi `legacyRef`:
```
legacyRef: {
  model: "Collaborazione"|"CollaborazioneWebDesignV2"|"GoogleAds",
  id: ObjectId
}
```
Quando dashboard e API V3 sono stabili, migrare i dati e congelare gli endpoint V2 in sola lettura.
