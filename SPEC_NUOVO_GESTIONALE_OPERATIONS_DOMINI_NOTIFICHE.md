# Specifica Nuovo Gestionale: Operations, Domini, Notifiche, Collaborazioni e Interviste

Documento operativo per riproporre nel nuovo gestionale le funzioni gia presenti nel gestionale attuale.

Obiettivo: non copiare solo le schermate, ma conservare il senso dei flussi: cosa viene salvato, chi puo usarlo, quali dati vengono tracciati e quali output devono essere disponibili.

## 1. Gestione Domini

La gestione domini oggi vive in due forme:

- dominio collegato a una collaborazione web design;
- dominio standalone, gestito dalla dashboard `/Gestione-Domini`.

Nel nuovo gestionale conviene unificarli in un modello dominio unico, collegabile opzionalmente a cliente, progetto web design e web designer. La dashboard deve comunque continuare a mostrare entrambe le casistiche.

### Fonti attuali

- `models/Collaborazioniwebdesign.js`
- `models/CollaborazioniWebDesignV2.js`
- `models/Dominio.js`
- `Components/GestioneDomini.jsx`
- `Components/timeline-web-designer-v2.jsx`
- `app/Gestione-Domini/page.jsx`
- `app/api/domini/route.js`
- `app/api/domini/[id]/route.js`
- `app/api/domini/scadenze/route.js`
- `app/api/domini/webdesigners/route.js`
- `app/api/notifiche/check-domini/route.js`

### Dati da preservare

Per i domini collegati alle collaborazioni web design:

```js
dominio: {
  dataAcquisto: Date,
  dataScadenza: Date,
  urlDominio: String,
  alertInviato: Boolean,
  novaAlertData: Date
}
```

Per i domini standalone:

```js
{
  urlDominio: String,
  dataScadenza: Date,
  webDesigner: String,
  isEsterno: Boolean,
  note: String,
  alertInviato: Boolean
}
```

Nel nuovo gestionale il modello consigliato e:

```js
DominioV3 {
  urlDominio,
  clienteId,
  collaborazioneId,
  progettoWebDesignId,
  webDesignerId,
  webDesignerNome,
  dataAcquisto,
  dataScadenza,
  isEsterno,
  note,
  statoCalcolato, // ok | in_scadenza | scaduto
  alert: {
    ultimoInvio,
    soglieInviate: [30, 20, 10, 5, 3, 2, 1],
    alertInviatoLegacy
  }
}
```

### Comportamento operativo

Nella timeline web designer il dominio e una parte del progetto. Deve permettere:

- inserimento URL dominio;
- inserimento data acquisto;
- calcolo automatico data scadenza a +1 anno quando si valorizza la data acquisto;
- modifica manuale della scadenza solo per admin/segretaria;
- reset degli alert quando cambia data acquisto o data scadenza;
- stato visivo: scaduto, in scadenza, ok.

Nel gestionale attuale la V2 blocca i collaboratori non admin sulle date dominio: possono vedere e gestire il progetto, ma data acquisto/scadenza sono protette lato API.

La dashboard `/Gestione-Domini` deve mostrare:

- statistiche: totali, in scadenza, scaduti, ok;
- filtri per stato;
- filtri per web designer;
- tabella con dominio, web designer, data scadenza, stato, note, azioni;
- apertura link dominio in nuova scheda;
- link al cliente se il dominio deriva da collaborazione;
- link al web designer/progetto se il dominio deriva da collaborazione;
- aggiunta dominio standalone;
- modifica dominio standalone;
- rinnovo dominio standalone;
- eliminazione dominio standalone solo admin.

### Rinnovo

Il rinnovo deve:

- proporre come default una nuova scadenza a +1 anno dalla scadenza attuale;
- salvare la nuova data;
- riportare `alertInviato` a `false`;
- azzerare eventuale storico soglie future;
- ricalcolare immediatamente lo stato visivo.

### Alert dominio

Esistono due logiche da preservare o razionalizzare:

- `/api/domini/scadenze`: controlla i domini dentro collaborazioni web design entro 30 giorni, prepara destinatari, invia riepilogo email e marca `dominio.alertInviato`.
- `/api/notifiche/check-domini`: controlla i domini standalone entro soglie progressive `30, 20, 10, 5, 3, 2, 1` giorni e genera notifiche interne admin.

Nel nuovo gestionale la soluzione migliore e una sola pipeline:

1. Prendere tutti i domini, sia collegati a progetto sia standalone.
2. Calcolare `giorniMancanti`.
3. Se `giorniMancanti < 0`, creare una notifica "dominio scaduto".
4. Se `giorniMancanti` rientra in una soglia non ancora notificata, creare una notifica "dominio in scadenza".
5. Salvare la soglia inviata per evitare spam.
6. Opzionalmente inviare email riepilogo ad admin/segretaria e web designer assegnato.

## 2. Operations Attuali

La pagina `/Operations` e un hub di strumenti interni. Oggi mostra:

- QR Code Generator;
- Compressione Immagini;
- Aziende senza sito da Google Places, solo admin;
- Social Automation, ancora coming soon;
- Analytics Dashboard, ancora coming soon.

Le statistiche rapide leggono:

- totale scansioni QR dai QR salvati;
- totale immagini compresse dalle statistiche compressione;
- chiamate Google Places del mese per admin;
- automazioni attive, attualmente placeholder a 0.

Nel nuovo gestionale questa sezione va trattata come area strumenti, non come area collaborazioni. Ogni tool deve avere:

- permessi chiari;
- storico utente o admin;
- metriche rapide;
- download/output se previsto;
- separazione tra strumenti attivi e placeholder.

## 3. QR Code con Salvataggio e Tracking

### Fonti attuali

- `app/Operations/QrCode/page.jsx`
- `Components/QrCodeGenerator.jsx`
- `models/QrCode.js`
- `app/api/qrcode/save/route.js`
- `app/api/qrcode/scan/[id]/route.js`
- `app/api/qrcode/redirect/[id]/route.js`

### Dati salvati

```js
QrCode {
  userId,
  name,
  type, // url | text | email | phone | wifi
  value,
  wifiConfig: {
    ssid,
    password,
    encryption // WPA | WEP | nopass
  },
  scans,
  lastScan,
  shortUrl,
  createdAt
}
```

### Flusso utente

La pagina permette di:

- scegliere tipo QR: URL, testo, email, telefono, WiFi;
- inserire nome identificativo;
- inserire contenuto;
- generare anteprima su canvas;
- salvare il QR nel database;
- scaricare PNG;
- copiare immagine negli appunti;
- vedere lista QR salvati;
- eliminare un QR;
- ricaricare un QR salvato nella preview;
- simulare una scansione per test.

### Tracking URL

Il tracking completo esiste per QR di tipo `url`.

Quando un QR URL viene salvato:

1. la API `POST /api/qrcode/save` crea il record;
2. il frontend riceve `qrCodeId`;
3. il QR viene rigenerato con URL:

```txt
/api/qrcode/redirect/{qrCodeId}
```

4. quando qualcuno scansiona, la route `GET /api/qrcode/redirect/[id]`:
   - cerca il record;
   - incrementa `scans`;
   - aggiorna `lastScan`;
   - redirige al valore originale.

Esiste anche `POST /api/qrcode/scan/[id]`, usato per simulare o tracciare manualmente una scansione senza redirect.

### Da migliorare nel nuovo gestionale

- usare davvero `shortUrl` o rinominarlo se resta derivato dal redirect;
- rendere funzionante e persistente la configurazione WiFi nel form;
- aggiungere dettaglio analytics: scansioni per giorno, ultima scansione, QR piu usati;
- validare URL prima del salvataggio;
- impedire redirect verso URL non valido;
- gestire permessi: utente vede i propri QR, admin puo eventualmente vedere tutto.

## 4. Compressione Immagini

### Fonti attuali

- `app/Operations/ImageCompression/page.jsx`
- `app/api/compress-image/route.js`
- `models/ImageCompression.js`

### Dati salvati

```js
ImageCompression {
  userId,
  originalName,
  originalSize,
  compressedSize,
  quality,
  savings,
  format, // jpeg | png | webp
  createdAt
}
```

### Flusso utente

La pagina permette di:

- caricare immagini con drag and drop;
- selezionare piu file;
- vedere anteprima di ogni immagine;
- scegliere formato output: WebP, JPEG, PNG;
- regolare qualita da 10 a 100;
- regolare larghezza massima da 800 a 4000 px;
- comprimere tutte le immagini non ancora compresse;
- vedere peso originale, peso compresso e risparmio;
- scaricare ogni immagine compressa;
- rimuovere immagini dalla lista.

### Logica server

La route `POST /api/compress-image`:

1. richiede sessione;
2. riceve `multipart/form-data`;
3. converte il file in buffer;
4. legge metadata con Sharp;
5. applica auto-rotazione EXIF;
6. rimuove metadata;
7. ridimensiona se larghezza originale supera `maxWidth`;
8. comprime in WebP, JPEG o PNG;
9. calcola percentuale di risparmio;
10. salva statistiche nel database;
11. restituisce direttamente il file compresso.

Gli header restituiti includono:

- `Content-Type`;
- `Content-Disposition` con filename;
- `X-Original-Size`;
- `X-Compressed-Size`;
- `X-Savings`;
- `X-Original-Dimensions`.

La route `GET /api/compress-image` restituisce statistiche aggregate per utente:

- numero totale immagini compresse;
- peso originale totale;
- peso compresso totale;
- risparmio medio.

### Da preservare

La compressione e uno strumento operativo, quindi deve restare veloce:

- nessun obbligo di creare un progetto;
- download immediato;
- tracking statistiche invisibile all'utente;
- output pronto per usare immagini nei siti.

## 5. Sistema Notifiche Completo

### Fonti attuali

- `models/Notifica.js`
- `utils/createNotifica.js`
- `Components/NotificheDropdown.jsx`
- `app/Notifiche/page.jsx`
- `app/api/notifiche/route.js`
- `app/api/notifiche/[id]/route.js`
- `app/api/notifiche/check-domini/route.js`
- `app/api/notifiche/check-fine-mese/route.js`
- `app/api/note/route.js`

### Modello dati

```js
Notifica {
  tipo, // nota_problema | dominio_scadenza | fine_mese
  titolo,
  messaggio,
  letta,
  link,
  refId,
  createdAt,
  updatedAt
}
```

### Deduplica

La funzione `createNotifica` evita duplicati usando `tipo + refId`.

Se esiste gia una notifica con lo stesso tipo e refId, non crea nulla. Questo e fondamentale per:

- non creare piu volte la stessa notifica problema;
- non ripetere la stessa soglia dominio;
- non ripetere la notifica fine mese per lo stesso mese.

### Tipi notifica attuali

`nota_problema`

- Trigger: creazione nota SMM con `tipo === "problema"`.
- Fonte: `app/api/note/route.js`.
- Messaggio: autore + cliente + anteprima nota.
- Link: feed del collaboratore.
- RefId: id della nota.

`dominio_scadenza`

- Trigger: check domini standalone.
- Soglie: 30, 20, 10, 5, 3, 2, 1 giorni.
- Gestisce anche dominio gia scaduto.
- Link: `/Gestione-Domini`.
- RefId: dominio + soglia.

`fine_mese`

- Trigger: ultimi 5 giorni del mese.
- Link: `/Fatturazione`.
- RefId: mese + anno.
- Serve a ricordare agli admin di scaricare i dati di fatturazione.

### Dropdown notifiche

La campanella in header:

- chiama `/api/notifiche?limit=5`;
- mostra contatore non lette;
- mostra le ultime 5 notifiche;
- segna una notifica come letta al click;
- porta al link della notifica se presente;
- ricarica ogni 60 secondi;
- esegue una volta al giorno per sessione i check automatici:
  - `/api/notifiche/check-domini`;
  - `/api/notifiche/check-fine-mese`.

L'uso di `sessionStorage` evita check ripetuti nello stesso giorno e nella stessa sessione browser.

### Centro notifiche

La pagina `/Notifiche`:

- e accessibile solo ad amministratori;
- mostra notifiche non lette, lette o tutte;
- permette refresh manuale;
- permette "segna tutte lette";
- permette eliminazione singola;
- permette eliminazione di tutte le notifiche gia lette;
- mostra label per tipo, messaggio, data e link.

### API e permessi

`GET /api/notifiche`

- solo admin;
- ritorna notifiche ordinate per data decrescente;
- accetta `?limit=5`;
- ritorna anche `nonLette`.

`DELETE /api/notifiche`

- solo admin;
- elimina tutte le notifiche lette.

`PATCH /api/notifiche/[id]`

- solo admin;
- segna una notifica come letta.

`DELETE /api/notifiche/[id]`

- solo admin;
- elimina una notifica.

Nel nuovo gestionale si puo estendere il sistema con destinatari espliciti:

```js
destinatari: [{
  userId,
  role,
  letta,
  lettaAt
}]
```

Oggi invece le notifiche sono globali per admin.

## 6. Pagina Tabella Collaborazioni

### Fonti attuali

- `app/Tabella-collaborazioni/page.jsx`
- `app/api/tabella-collaborazioni/route.js`
- `models/Collaborazioni.js`

### Scopo

La pagina `/Tabella-collaborazioni` e una vista compatta per amministratore/segretaria dedicata ai Social Media Manager.

Non e la vista operativa completa del collaboratore. Serve a dare una fotografia veloce:

- quanti SMM sono attivi;
- quanti clienti ha ogni SMM;
- quali clienti sono sotto ogni SMM;
- stato produzione post per piattaforma;
- totali generali non azzerabili.

### Permessi

La pagina:

- richiede login;
- consente accesso solo ad `amministratore` e `segretaria`;
- manda gli altri utenti su `/unauthorized`.

### Recupero dati

La pagina chiama:

```txt
GET /api/tabella-collaborazioni
```

La API:

- recupera collaboratori attivi o senza status;
- ordina per nome/cognome;
- per ogni collaboratore recupera le collaborazioni dal modello `Collaborazione`;
- popola azienda con `etichetta`, `ragioneSociale`, `email`;
- formatta i dati per il frontend;
- disabilita cache con `force-dynamic`, `revalidate = 0`, header no-store.

Il frontend poi filtra:

- solo `subRole === "smm"`;
- esclude il collaboratore fittizio `Hoon Web`.

### Layout da riproporre

La pagina deve mantenere una struttura a colonne orizzontali:

- ogni colonna rappresenta un SMM;
- intestazione colonna con nome SMM e numero clienti;
- sotto, card compatte cliente per cliente;
- scroll orizzontale quando gli SMM sono tanti.

Per ogni cliente mostra:

- nome cliente con link alla scheda azienda;
- blocco totali generali:
  - `post_totali`;
  - `appuntamenti_totali`;
- blocco post mensili:
  - `post_ig_fb_fatti / post_ig_fb`;
  - `post_tiktok_fatti / post_tiktok`;
  - `post_linkedin_fatti / post_linkedin`.

Statistiche pagina:

- SMM attivi;
- clienti totali;
- media clienti per SMM;
- top SMM;
- collaboratori totali;
- collaborazioni attive;
- clienti unici.

### Export CSV

La pagina genera CSV client-side.

Ogni riga rappresenta una combinazione collaboratore-cliente e contiene:

- collaboratore;
- email collaboratore;
- ruolo;
- cliente;
- email cliente;
- appuntamenti;
- post IG/FB;
- post TikTok;
- post LinkedIn;
- post totali;
- appuntamenti totali;
- note.

Nome file:

```txt
tabella-collaborazioni-YYYY-MM-DD.csv
```

### Da preservare nel nuovo gestionale

- vista velocissima, non troppo dettagliata;
- refresh manuale;
- refresh automatico quando la finestra torna in focus;
- export CSV;
- link veloci a SMM e cliente;
- nessuna modifica dati in questa pagina: e una dashboard di controllo.

## 7. Download Dati

### Fonti attuali

- `Components/Dashboard.jsx`
- `app/api/export_complete/route.js`
- `app/api/export_json/route.js`
- `app/api/download-excel/route.js`

### Pulsante principale

In dashboard, sezione "Funzioni", il pulsante "Download Dati" esegue due download:

1. `GET /api/export_complete?format=json`
2. `GET /api/export_complete?format=excel`

Tra i due download c'e un piccolo delay per evitare sovrapposizioni browser.

### Export completo

La route `/api/export_complete` lavora sulle collaborazioni attive e produce sia JSON sia Excel.

Campi esportati:

- collaboratore;
- cliente;
- appuntamenti mensili;
- appuntamenti fatti;
- post IG/FB mensili;
- post IG/FB fatti;
- post TikTok mensili;
- post TikTok fatti;
- post LinkedIn mensili;
- post LinkedIn fatti;
- post totali;
- post totali previsti;
- appuntamenti totali;
- appuntamenti totali previsti;
- durata contratto;
- data inizio contratto;
- data fine contratto;
- trimestrali Instagram fatti/totali;
- trimestrali TikTok fatti/totali;
- trimestrali LinkedIn fatti/totali;
- appuntamenti trimestrali fatti/totali;
- flag esclusione reset trimestrale.

Filtri:

- solo `stato: "attiva"`;
- esclusione `Hoon Web`.

Ordinamento:

- per collaboratore.

Formato Excel:

- foglio `Collaborazioni`;
- titolo con mese e anno corrente;
- colonne larghe e leggibili;
- colori condizionali su avanzamento appuntamenti e post:
  - verde completato/superato;
  - arancione parziale;
  - rosso non iniziato quando previsto;
- colonne totali/previsti evidenziate;
- bordo spesso quando cambia collaboratore.

Formato JSON:

- array formattato;
- nome file con timestamp.

### Export JSON semplificato

`/api/export_json` genera un JSON piu corto con:

- collaboratore;
- cliente;
- appuntamenti totali;
- appuntamenti fatti;
- post totali/fatti per IG/FB, TikTok, LinkedIn.

### Download Excel legacy

`/api/download-excel` genera un Excel piu semplice:

- collaboratore;
- cliente;
- appuntamenti totali;
- appuntamenti fatti;
- post IG;
- post TikTok;
- post LinkedIn.

Particolarita: gli appuntamenti fatti vengono contati dalle note di tipo `appuntamento` nel mese precedente, non solo dal contatore salvato.

### Da riproporre nel nuovo gestionale

Nel nuovo gestionale conviene avere un'area export con tre livelli:

- export rapido dashboard: JSON + Excel completo;
- export tabella SMM: CSV compatto;
- export tecnico/backup: JSON completo filtrabile per periodo, collaboratore, servizio.

I dati esportati devono mantenere separati:

- mensile;
- trimestrale;
- totale contratto.

Questa separazione e critica per pagamenti, controllo lavoro e reset.

## 8. Intervista Web Designer Completa

### Fonti attuali

- `app/Lista_clienti_webdesigner/[id]/interview/page.jsx`
- `app/Lista_clienti_webdesigner/[id]/interview/[collabId]/page.jsx`
- `app/Storico-Interviste-Webdesigner/page.jsx`
- `app/api/webdesign-interviste/route.js`
- `models/WebDesignInterview.js`
- `models/CollaborazioniWebDesignV2.js`

### Scopo

L'intervista web designer serve a trasformare una chiamata o briefing cliente in un documento operativo pronto per:

- progettare struttura sito;
- definire stile e priorita;
- raccogliere dominio/accessi;
- capire materiali disponibili;
- generare un TXT leggibile;
- generare un JSON riutilizzabile;
- salvare storico per web designer e admin.

### Accesso

La pagina principale e:

```txt
/Lista_clienti_webdesigner/[id]/interview
```

Dove `[id]` e l'id del web designer.

La vecchia route con `collabId` redirige alla nuova pagina senza usare `collabId`:

```txt
/Lista_clienti_webdesigner/[id]/interview/[collabId]
```

### Permessi API

La API consente:

- admin e segretaria: accesso a interviste di qualsiasi web designer;
- web designer: accesso solo alle proprie interviste;
- admin senza `webDesignerId`: accesso allo storico completo.

### Modello dati

```js
WebDesignInterview {
  webDesigner,
  azienda,
  interview,
  risultatoTxt,
  autoreId,
  autoreNome,
  autoreEmail,
  autoreRuolo,
  createdAt,
  updatedAt
}
```

### Step intervista

L'intervista attuale e divisa in 4 step:

1. Business
2. Obiettivi
3. Struttura
4. Export

#### Step 1: Business

Campi:

- nome azienda;
- cosa fa/vende l'azienda;
- servizio/prodotto principale;
- servizio/prodotto da spingere;
- cliente ideale;
- provenienza clienti attuale.

Scopo: capire identita commerciale e priorita.

#### Step 2: Obiettivi

Campi:

- obiettivi sito, multipli:
  - ricevere contatti;
  - vendere;
  - prenotazioni;
  - mostrare portfolio;
  - farsi trovare su Google;
- cosa deve fare l'utente appena entra;
- CTA principale;
- tipologia sito:
  - One Page;
  - sito vetrina;
  - landing page;
  - e-commerce;
  - blog.

Scopo: chiarire conversione primaria e formato del sito.

#### Step 3: Struttura, stile e materiali

Campi struttura:

- sezioni/pagine richieste, multiple:
  - Home;
  - Chi siamo;
  - Servizi;
  - Gallery;
  - Portfolio;
  - Recensioni;
  - FAQ;
  - Contatti;
- altre sezioni.

Campi stile:

- stile desiderato, multiplo:
  - Minimal;
  - Moderno;
  - Creativo;
  - Elegante;
  - Professionale;
  - Ricco di animazioni;
- altro stile;
- animazioni:
  - pulito e statico;
  - micro animazioni;
  - ricco di animazioni;
- video in homepage;
- linee guida brand;
- colori preferiti o da evitare;
- font o riferimenti tipografici.

Materiali disponibili:

- materiali brand:
  - logo PNG;
  - logo vettoriale AI/SVG/PDF;
  - palette colori;
  - font/linee guida;
- media:
  - foto HQ;
  - video;
  - foto team;
  - foto sede/prodotti;
- testi:
  - descrizione azienda;
  - servizi;
  - recensioni;
  - FAQ;
  - testi pagine.

Scopo: ridurre ambiguita prima di iniziare design e contenuti.

#### Step 4: Dominio e risultato

Campi:

- dominio esistente: si/no;
- dominio/URL;
- provider dominio/hosting;
- email collegate;
- scadenza dominio;
- accessi dominio/hosting;
- note finali.

Output:

- anteprima TXT;
- copia testo;
- scarica TXT;
- scarica JSON;
- storico interviste del web designer;
- download TXT da storico.

### Salvataggio automatico

Quando l'utente copia o scarica, la pagina chiama:

```txt
POST /api/webdesign-interviste
```

La firma del contenuto evita salvataggi duplicati nella stessa sessione se l'intervista non e cambiata.

Il salvataggio include:

- webDesignerId;
- azienda;
- oggetto interview;
- risultatoTxt;
- autore preso dalla sessione.

### Storico

Nella pagina intervista, lo storico laterale mostra le interviste del web designer corrente.

La pagina admin `/Storico-Interviste-Webdesigner` mostra tutte le interviste e permette:

- ricerca per azienda;
- ricerca per web designer;
- ricerca per autore;
- ricerca per email;
- download TXT;
- download JSON.

### Da rendere ancora piu completa nel nuovo gestionale

L'intervista nuova dovrebbe aggiungere sezioni operative mancanti o solo parziali:

1. Riferimenti e competitor
   - siti che piacciono;
   - siti che non piacciono;
   - competitor principali;
   - elementi da evitare.

2. SEO e geografia
   - citta/zone servite;
   - parole chiave principali;
   - servizi da indicizzare;
   - pagine locali necessarie;
   - Google Business Profile esistente.

3. Contatti e conversioni
   - telefono;
   - email;
   - WhatsApp;
   - form richiesti;
   - calendari/prenotazioni;
   - pixel/tracking richiesti.

4. E-commerce, se applicabile
   - piattaforma preferita;
   - numero prodotti;
   - categorie;
   - pagamenti;
   - spedizioni;
   - condizioni vendita/resi;
   - gestione stock.

5. Privacy e aspetti legali
   - privacy policy;
   - cookie policy;
   - termini vendita;
   - checkbox consenso;
   - cookie banner;
   - titolare trattamento.

6. Accessi e asset
   - dominio;
   - hosting;
   - WordPress/CMS;
   - Google Analytics;
   - Search Console;
   - Meta Pixel;
   - Google Tag Manager;
   - cartella materiali;
   - stato credenziali: richieste, ricevute, mancanti.

7. Decisioni finali
   - priorita assolute;
   - cose non negoziabili;
   - deadline;
   - referente approvazioni;
   - canale comunicazione;
   - prossima azione.

### Collegamento al progetto web design

Nel nuovo gestionale l'intervista dovrebbe poter essere:

- standalone, come oggi;
- collegata a una collaborazione web design;
- usata per precompilare campi progetto:
  - azienda;
  - tipo sito;
  - dominio;
  - scadenza dominio;
  - materiali;
  - note finali;
  - checklist pubblicazione.

Quando l'intervista contiene un dominio con scadenza, il nuovo gestionale dovrebbe proporre la creazione o aggiornamento di `DominioV3`.

## 9. Mappa Implementativa Consigliata V3

### Modelli

- `OperationToolUsageV3` per metriche generiche Operations, se si vuole unificare analytics.
- `QrCodeV3` per QR salvati e tracking.
- `ImageCompressionV3` per storico compressioni.
- `DominioV3` come modello unico domini.
- `NotificaV3` con destinatari, letture per utente e ref deduplicato.
- `WebDesignInterviewV3` collegabile a web designer, azienda e collaborazione.
- `CollaborazioneV3` + servizio specifico SMM/WebDesign/Ads.

### API minime

Operations:

- `GET /api/v3/operations/stats`
- `GET/POST/DELETE /api/v3/operations/qrcodes`
- `GET /api/v3/operations/qrcodes/:id/redirect`
- `POST /api/v3/operations/qrcodes/:id/scan`
- `POST /api/v3/operations/images/compress`
- `GET /api/v3/operations/images/stats`

Domini:

- `GET/POST /api/v3/domini`
- `PATCH/DELETE /api/v3/domini/:id`
- `POST /api/v3/domini/:id/rinnova`
- `POST /api/v3/domini/check-scadenze`

Notifiche:

- `GET /api/v3/notifiche`
- `POST /api/v3/notifiche/check`
- `PATCH /api/v3/notifiche/:id/read`
- `PATCH /api/v3/notifiche/read-all`
- `DELETE /api/v3/notifiche/:id`
- `DELETE /api/v3/notifiche/read`

Collaborazioni/export:

- `GET /api/v3/collaborazioni/tabella-smm`
- `GET /api/v3/export/collaborazioni?format=json|excel|csv`

Interviste:

- `GET/POST /api/v3/webdesign/interviste`
- `GET /api/v3/webdesign/interviste/:id`
- `PATCH /api/v3/webdesign/interviste/:id`
- `POST /api/v3/webdesign/interviste/:id/collega-progetto`
- `GET /api/v3/webdesign/interviste/:id/export?format=txt|json`

### Regole da non perdere

- Domini: ogni cambio data resetta gli alert futuri.
- QR: il tracking URL deve essere il contenuto finale stampato nel QR per i link.
- Immagini: compressione e download devono restare immediati.
- Notifiche: deduplica obbligatoria con riferimento stabile.
- Tabella collaborazioni: vista read-only e compatta.
- Download dati: mantenere separazione mensile, trimestrale e totale contratto.
- Intervista web designer: export e salvataggio storico devono avvenire insieme.

