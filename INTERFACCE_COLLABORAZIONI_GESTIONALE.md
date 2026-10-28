# Interfacce Collaborazioni per Nuovo Gestionale

Analisi statica del gestionale attuale, generata il 2026-08-13.

Questo documento spiega per filo e per segno le interfacce operative legate a:

- Web Designer
- Google Ads / Ads
- Social Media Manager

L'obiettivo e poterle riproporre nel nuovo gestionale senza perdere il senso operativo delle collaborazioni. Non e solo una lista di campi: descrive cosa fa ogni collaborazione, a cosa serve, quali schermate esistono, quali azioni compie l'utente e quale logica va preservata.

## Concetto Base: Cosa Significa "Collaborazione"

Nel gestionale attuale una collaborazione e un incarico operativo che collega:

- un cliente/azienda;
- un collaboratore interno o esterno;
- un servizio da svolgere;
- uno stato di avanzamento;
- dati quantitativi o checklist per misurare cosa e stato fatto.

La collaborazione serve a trasformare un contratto o un servizio venduto in lavoro gestibile giorno per giorno. In pratica risponde a queste domande:

- Chi sta seguendo questo cliente?
- Che servizio deve svolgere?
- Quali obiettivi o consegne sono previste?
- Cosa e gia stato fatto?
- Cosa manca?
- Dove si lasciano note, problemi e aggiornamenti?
- Cosa deve vedere il collaboratore rispetto all'amministrazione?

Nel nuovo gestionale conviene mantenere questa distinzione:

- `Collaborazione`: contenitore principale, comune a tutti i servizi.
- `Servizio operativo`: dettaglio specifico per SMM, Web Design, Google Ads, Meta Ads ecc.
- `Assegnazione`: chi lavora su quella collaborazione e con quale ruolo.
- `Notebook/Feed`: storico note, problemi, appuntamenti e aggiornamenti.
- `Contatori/Checklist`: misurazione concreta dell'avanzamento.

## Pagine e Componenti Principali Attuali

| Area | Pagina/Componente | Ruolo |
| --- | --- | --- |
| Creazione collaborazioni | `app/AddCollab/page.jsx` | Pagina con tre form: SMM, Web Design V2, Google Ads |
| SMM creazione | `Components/add-collab.jsx` | Crea collaborazione standard/SMM |
| SMM lista cliente | `Components/Lista-clienti.jsx` | Vista collaboratore SMM con contatori post e feed |
| SMM gestione admin/collab | `Components/edit-collab.jsx` | Gestione collaborazioni, obiettivi, contratto, cancellazione admin |
| SMM feed | `app/Feed-2/[collaboratoreId]/page.jsx` | Feed note stile chat per cliente/collaborazione |
| SMM nuova nota | `app/AddNota/[collaborazioneId]/page.jsx`, `Components/add-nota.jsx` | Inserimento nota, appuntamento, problema, post mancante |
| Web Designer lista | `app/Lista_webdesigner/page.jsx` | Lista web designer e accesso ai progetti |
| Web Designer progetti | `app/Lista_clienti_webdesigner/[id]/page.jsx` | Progetti di un web designer |
| Web Designer dashboard | `Components/timeline-web-designer-v2.jsx` | Workflow operativo V2 |
| Web Designer intervista | `app/Lista_clienti_webdesigner/[id]/interview/page.jsx` | Raccolta briefing cliente ed export |
| Google Ads creazione | `Components/add-googleads-collab.jsx` | Crea campagna Google Ads |
| Google Ads admin | `Components/TabellaGoogleAdsAdmin.jsx` | Vista admin globale campagne |
| Google Ads collaboratore | `Components/VistaGoogleAdsCollaboratore.jsx` | Vista collaboratore sulle sue campagne |
| Google Ads riepilogo user | `Components/ListaGoogleAdsCollaboratore.jsx` | Riepilogo campagne nella scheda utente |
| Meta Ads | `app/Lista-Marketing/meta-ads/page.jsx` | Pagina placeholder, sezione in sviluppo |

## Accesso per Ruolo

Nella pagina utente `app/User/[id]/page.jsx` la dashboard collaborazioni renderizza sezioni diverse in base ai ruoli:

- `web designer`: vede bottone "Nuova intervista" e `TimelineWebDesignerV2`.
- `smm`: vede `AdminCollaborationsList`, cioe gestione collaborazioni SMM.
- `commerciale`: vede feed commerciale, fuori scope rispetto a questo documento.
- azienda/cliente: vede collaborazioni aziendali.

Nella dashboard generale `Components/Dashboard.jsx` ci sono scorciatoie per ruoli e sezioni marketing:

- Web Design: "I tuoi progetti Web Design" + "Nuova intervista".
- Google Ads: pagina `/Lista-Marketing/google-ads`.
- Meta Ads: pagina placeholder.

# 1. Social Media Manager

## A Cosa Serve la Collaborazione SMM

La collaborazione SMM serve a gestire un cliente per attivita social ricorrenti. Misura soprattutto:

- quanti post sono previsti ogni mese per Instagram/Facebook;
- quanti post sono previsti ogni mese per TikTok;
- quanti post sono previsti ogni mese per LinkedIn;
- quanti appuntamenti sono previsti;
- quanti contenuti sono stati completati;
- quanti appuntamenti sono stati fatti;
- se ci sono problemi o post mancanti;
- avanzamento mensile, trimestrale e totale da contratto.

Nel gestionale attuale la collaborazione SMM e un ibrido tra:

- piano operativo mensile;
- registro produzione contenuti;
- storico note cliente;
- controllo contrattuale;
- base per reset mensili/trimestrali;
- base per pagamenti/fatturazione.

Nel nuovo gestionale va trattata come un servizio ricorrente con contatori e storico.

## Creazione Collaborazione SMM

File: `Components/add-collab.jsx`

La creazione e dentro `app/AddCollab/page.jsx`, nel box "Collaborazione Standard", descritto come "Per social media manager e commerciali".

### Campi di Creazione

Campi selezione:

- Azienda: searchable dropdown da `/api/lista_aziende`.
- Collaboratore: searchable dropdown da `/api/lista_collaboratori`.

Campi quantitativi mensili:

- Numero appuntamenti mensili.
- Post Instagram & Facebook.
- Post TikTok.
- Post LinkedIn.

Campi contratto:

- Post totali previsti.
- Appuntamenti totali previsti.
- Durata contratto: `1 mese`, `3 mesi`, `6 mesi`, `1 anno`.
- Data inizio contratto.
- Data fine contratto.
- Flag "Escludi dal reset trimestrale".

Campo libero:

- Note.

### Logica di Creazione

La form invia `POST /api/crea_collaborazioni`.

La collaborazione creata si basa sul modello `Collaborazione` in `models/Collaborazioni.js`.

Il nuovo gestionale deve preservare il fatto che esistono tre livelli di misurazione:

- mensile: cosa va fatto nel mese corrente;
- trimestrale: valutazione/reset periodico;
- totale contratto: avanzamento cumulativo sul contratto.

## Vista Collaboratore SMM: Lista Clienti e Contatori

File: `Components/Lista-clienti.jsx`

Questa e la vista operativa compatta del collaboratore. Mostra ogni collaborazione del SMM come riga tabellare desktop o card mobile.

### Dati Recuperati

La vista chiama:

- `GET /api/collaborazioni/[collaboratoreId]`
- `GET /api/appuntamenti_fatti/[collaborazioneId]`
- `GET /api/problemi/[collaborazioneId]`
- `GET /api/post-mancanti/[collaborazioneId]`

Per ogni collaborazione arrivano:

- cliente;
- id cliente;
- appuntamenti previsti;
- post previsti per IG/FB, TikTok, LinkedIn;
- post fatti per IG/FB, TikTok, LinkedIn;
- contatori trimestrali per piattaforma;
- appuntamenti trimestrali;
- post totali fatti/previsti;
- appuntamenti totali fatti/previsti;
- id feed.

### Colonne Desktop

La tabella desktop contiene:

- Cliente.
- Link "Apri feed".
- Post Instagram/Facebook fatti su previsti.
- Trimestrale Instagram.
- Post TikTok fatti su previsti.
- Trimestrale TikTok.
- Post LinkedIn fatti su previsti.
- Trimestrale LinkedIn.
- Numero problemi.
- Numero post mancanti.
- Appuntamenti fatti su previsti.
- Appuntamenti trimestrali fatti su previsti.
- Post totali generali fatti su previsti.
- Appuntamenti totali generali fatti su previsti.
- Azione modifica/salva.

### Comportamento Modifica

Il collaboratore puo modificare solo i contatori dei post fatti:

- `post_ig_fb_fatti`
- `post_tiktok_fatti`
- `post_linkedin_fatti`

L'interfaccia usa pulsanti `+` e `-`, con valore minimo 0.

Al salvataggio chiama:

- `PATCH /api/collaborazioni/edit/[collaborazioneId]`

### Logica Importante dei Contatori

Quando si aggiornano i post fatti, la route calcola la differenza rispetto al valore precedente e aggiorna anche:

- `valutazione_trimestrale_fatti`
- `post_totali`
- `instagram_trim_fatti`
- `tiktok_trim_fatti`
- `linkedin_trim_fatti`

Questa logica e fondamentale. Nel nuovo gestionale non basta salvare il numero visibile: bisogna aggiornare i contatori derivati in modo coerente.

Esempio:

- prima IG/FB fatti = 3;
- dopo IG/FB fatti = 5;
- differenza = +2;
- incremento di +2 su trimestrale Instagram e post totali.

Se il valore scende da 5 a 4, la differenza e -1 e i cumulativi vengono decrementati.

## Vista Gestione Collaborazioni SMM

File: `Components/edit-collab.jsx`

Questa vista e usata nella dashboard del collaboratore SMM e, con permessi, anche in contesti amministrativi.

### Struttura Card

Ogni collaborazione e una card con:

- intestazione cliente;
- link alla scheda cliente;
- badge durata contratto;
- pulsanti azione.

Azioni:

- Modifica.
- Salva.
- Annulla.
- Azzera generali.
- Elimina, solo amministratore.

### Sezione "Totali Generali"

Mostra o modifica:

- Post previsti dal contratto.
- Appuntamenti previsti dal contratto.
- Data inizio.
- Data fine.
- Durata contratto.

Questi campi descrivono l'impegno contrattuale, non solo il mese corrente.

### Sezione "Dati Mensili"

Mostra o modifica:

- Appuntamenti mensili previsti.
- Post IG/FB previsti.
- Post TikTok previsti.
- Post LinkedIn previsti.

Questi valori rappresentano la base del lavoro periodico.

### Aggiornamento Admin

Il salvataggio usa:

- `PATCH /api/collaborazioni/adminedit/[collaborazioneId]`

Campi aggiornabili:

- `numero_appuntamenti`
- `post_ig_fb`
- `post_tiktok`
- `post_linkedin`
- `post_totali_previsti`
- `appuntamenti_totali_previsti`
- `durata_contratto`
- `data_inizio_contratto`
- `data_fine_contratto`

Questa route usa `$set`, quindi imposta direttamente i nuovi valori.

### Azzeramento Totali Generali

Il pulsante "Azzera Generali" chiama:

- `PATCH /api/collaborazioni/azzera-totali/[collaborazioneId]`

Serve a riportare a zero:

- `post_totali`
- `appuntamenti_totali`

Va protetto con conferma, perche cancella il progresso cumulativo.

### Eliminazione

Solo amministratore.

Chiama:

- `DELETE /api/collaborazioni/delete/[collaborazioneId]`

Richiede conferma esplicita perche elimina la collaborazione.

## Feed SMM

File: `app/Feed-2/[collaboratoreId]/page.jsx`

Il feed e una schermata stile chat. Serve a documentare tutto cio che succede con un cliente.

### Layout

Desktop:

- barra ricerca in alto;
- sidebar sinistra con clienti/collaborazioni;
- area principale con note;
- bottone nuova nota.

Mobile:

- lista clienti in popup;
- header compatto con cliente selezionato;
- bottone per aprire filtri;
- bottone nuova nota;
- feed verticale a messaggi.

### Selezione Cliente

La pagina carica tutte le collaborazioni del collaboratore:

- `GET /api/collaborazioni/[collaboratoreId]`

Poi seleziona:

- collaborazione da query `?collaborazioneId=...`, se presente;
- altrimenti la prima collaborazione.

### Note

Quando una collaborazione e selezionata, carica:

- `GET /api/feed_note/[collaborazioneId]`

Le note vengono filtrate lato frontend per:

- testo contenuto nella nota;
- tipo nota.

Tipi nota disponibili:

- `generico`
- `appuntamento`
- `problema`
- `post_mancante`

### Visualizzazione Note

Le note appaiono come messaggi:

- proprie a destra;
- altrui a sinistra;
- problema con stile rosso;
- post mancante con stile arancio;
- appuntamento con data appuntamento;
- generico con stile normale.

Ogni nota mostra:

- autore;
- icona/tipo;
- contenuto;
- eventuale data appuntamento;
- eventuale Feeling Report;
- timestamp.

### Modifica Nota

Ogni nota puo essere modificata tramite modal:

- tipo nota;
- testo nota;
- data appuntamento, se tipo appuntamento;
- feeling emoji e feeling note, se utente abilitato.

La modifica chiama:

- `PUT /api/edit_note`

### Eliminazione Nota

Solo amministratore.

Chiama:

- `DELETE /api/delete_note`

## Nuova Nota SMM

File: `Components/add-nota.jsx`

La pagina `app/AddNota/[collaborazioneId]/page.jsx` mostra il form nuova nota per una collaborazione.

### Campi

- Tipo:
  - Generico.
  - Appuntamento.
  - Problema.
  - Post Mancante.
- Data appuntamento, solo se tipo appuntamento.
- Nota testuale.
- Feeling Report, solo per alcuni utenti SMM abilitati.

### Feeling Report

Per utenti abilitati, quando il tipo e `appuntamento`, il form richiede una emoji di feeling.

Valori usati:

- molto positivo/carico;
- buono/sereno;
- neutro;
- qualcosa non ha convinto;
- teso/frustrante;
- confuso;
- energia alta;
- freddo/distaccato.

Puo avere anche una nota libera "Perche?".

### Logica Nota

Il form chiama:

- `POST /api/note`

Se il tipo e `problema`:

- viene creata una notifica admin `nota_problema`.

Se il tipo e `appuntamento`:

- incrementa `appuntamenti_fatti`;
- incrementa `appuntamenti_totali`;
- incrementa `appuntamenti_trimestrale_fatti`.

Questa logica va assolutamente preservata nel nuovo gestionale.

## Vista Admin "Tabella Collaborazioni"

File: `app/Tabella-collaborazioni/page.jsx`

Questa pagina e per amministratore/segretaria.

### Scopo

Mostra tutti i Social Media Manager e le loro collaborazioni in una tabella riepilogativa.

### Funzioni

- Carica dati da `/api/tabella-collaborazioni`.
- Filtra solo collaboratori SMM.
- Esclude il collaboratore "Hoon Web".
- Ricarica dati al focus finestra.
- Esporta CSV.

### CSV

Le colonne esportate sono:

- Collaboratore.
- Email.
- Ruolo.
- Cliente.
- Email cliente.
- Appuntamenti.
- Post IG/FB.
- Post TikTok.
- Post LinkedIn.
- Post totali.
- Appuntamenti totali.
- Note.

## Requisiti per Riproporre SMM nel Nuovo Gestionale

Schermate minime:

1. Creazione servizio SMM.
2. Lista collaborazioni per SMM.
3. Dashboard dettaglio collaborazione SMM.
4. Feed cliente/collaborazione.
5. Nuova nota/modifica nota.
6. Vista admin globale SMM.

Dati minimi:

- cliente;
- collaboratore;
- stato collaborazione;
- post mensili previsti per piattaforma;
- post fatti per piattaforma;
- appuntamenti previsti/fatti;
- contatori trimestrali;
- contatori totali;
- durata e date contratto;
- note feed;
- problemi e post mancanti.

Logiche obbligatorie:

- aggiornare cumulativi quando cambiano post fatti;
- incrementare appuntamenti quando viene creata nota appuntamento;
- creare notifica quando viene creata nota problema;
- separare modifica operativa collaboratore da modifica contrattuale/admin;
- proteggere reset ed eliminazioni con conferma.

# 2. Web Designer

## A Cosa Serve la Collaborazione Web Design

La collaborazione Web Design serve a gestire la realizzazione di un sito per un cliente.

Non e solo una lista di task: e un workflow guidato con:

- tipo progetto;
- data inizio/fine;
- fasi operative;
- calendario su giorni lavorativi;
- checklist giornaliera;
- controlli progetto;
- checklist pubblicazione;
- gestione dominio;
- note per fase;
- note generali;
- intervista/briefing cliente.

Nel gestionale attuale esistono piu versioni storiche, ma l'interfaccia da riproporre e chiaramente la V2:

- modello: `CollaborazioneWebDesignV2`;
- form creazione: `Components/add-webdesign-v2.jsx`;
- dashboard: `Components/timeline-web-designer-v2.jsx`.

## Lista Web Designer

File: `app/Lista_webdesigner/page.jsx`

### Scopo

Permette ad admin/utente autorizzato di vedere tutti i collaboratori con ruolo `web designer` e aprire i loro progetti.

### Dati

Chiama:

- `GET /api/lista_collaboratori`

Filtra:

- `subRoles` contiene `web designer`.

### Card Web Designer

Ogni card mostra:

- nome e cognome;
- ruolo "Web Designer";
- data registrazione;
- email;
- bottone "Vedi Progetti".

Il bottone porta a:

- `/Lista_clienti_webdesigner/[designerId]`

## Creazione Progetto Web Design V2

File: `Components/add-webdesign-v2.jsx`

La creazione si trova in `app/AddCollab/page.jsx`, nel box "Nuovo Workflow Web Design V2".

### Campi di Creazione

- Azienda: searchable dropdown.
- Web Designer: searchable dropdown filtrato per ruolo `web designer`.
- Tipo progetto:
  - `vetrina`
  - `e-commerce`
- Data inizio contratto.
- Data fine contratto.
- Note generali.

### Calcolo Date

Quando l'utente imposta la data inizio:

- la data fine viene calcolata automaticamente;
- il calcolo usa giorni lavorativi;
- salta sabato e domenica;
- la UI dice "21 giorni lavorativi dal kickoff".

### Submit

Chiama:

- `POST /api/collaborazioni-webdesign-v2/crea`

### Cosa Genera Automaticamente

La route crea:

- collaborazione `CollaborazioneWebDesignV2`;
- fasi `struttura`, `design`, `consegna`;
- task precompilati in base a `tipoProgetto`;
- controlli progetto;
- checklist pubblicazione;
- note iniziali;
- riferimenti cliente/web designer.

## Task Template Sito Vetrina

### Fase Struttura

- Giorno 1: Intervista cliente con Google Moduli o modulo gestionale.
- Giorno 1: Richiesta contenuti inviata, foto, video, testi.
- Giorno 1: Prossimo appuntamento organizzato.
- Giorno 2-3: Analisi introduttiva preparata con ChatGPT dal risultato dell'intervista.
- Giorno 2-3: Sitemap preparata con ChatGPT.
- Giorno 2-3: Cliente aggiornato sulle fasi fatte e appuntamento ricordato.
- Giorno 4: Analisi introduttiva e sitemap presentate al cliente.
- Giorno 4: Modifiche alla sitemap completate se necessarie.
- Giorno 4: Richiesta contenuti rinnovata.
- Giorno 4: Messaggio di conferma dell'accettazione inviato.
- Giorno 4: Prossimo appuntamento organizzato.

### Fase Design

- Giorno 2-3: Style direction preparata con ChatGPT.
- Giorno 4: Style direction presentata al cliente.
- Giorno 4: Modifiche alla style direction completate se necessarie.
- Giorno 5-7: Immagini default selezionate se mancano quelle del cliente.
- Giorno 5-7: 4-5 reference per la home create con ChatGPT.
- Giorno 5-7: Reference validate come immagini o siti veri navigabili.
- Giorno 5-7: Messaggio di aggiornamento sull'avanzamento inviato al cliente.
- Giorno 8: Reference spiegate al cliente online o in appuntamento.
- Giorno 8: Reference scelta dal cliente.
- Giorno 8: Prossimo appuntamento organizzato.
- Giorno 8: Richiesta contenuti rinnovata.
- Giorno 9-11: Design scelto trasposto su Elementor o Figma.
- Giorno 9-11: Adattamenti e modifiche applicati rispetto all'appuntamento.
- Giorno 9-11: Messaggio di aggiornamento sull'avanzamento inviato al cliente.
- Giorno 12: Design su Elementor o Figma presentato al cliente.
- Giorno 12: Modifiche al design completate se necessarie.
- Giorno 12: Accettazione del design ricevuta dal cliente.
- Giorno 12: Richiesta contenuti rinnovata.
- Giorno 12: Prossimo appuntamento organizzato.
- Giorno 13-17: Resto del sito creato.
- Giorno 13-17: Messaggio di aggiornamento sull'avanzamento inviato al cliente.

### Fase Consegna

- Giorno 18: Conferma grafica del sito ricevuta.
- Giorno 18: Test link completato.
- Giorno 18: Test responsive completato.
- Giorno 18: Bug fix e ottimizzazione completati per valutazione.
- Giorno 19: Sito consegnato con o senza contenuti.
- Giorno 21+: Sito pubblicato online.
- Giorno 21+: Contenuti mancanti pianificati prima della pubblicazione o nel mese gratuito.
- Giorno 21+: Mese di manutenzione gratuito attivato se i contenuti erano mancanti.

## Differenze Task E-commerce

L'e-commerce mantiene la stessa struttura, ma aggiunge enfasi su catalogo, shop, pagine prodotto e checkout.

Differenze principali:

- richiesta iniziale include catalogo prodotti;
- sitemap include struttura catalogo;
- presentazione giorno 4 include struttura catalogo;
- reference riguardano home/shop;
- richiesta contenuti include catalogo;
- giorno 13-17: resto del sito, shop e pagine prodotto create;
- consegna include test carrello, checkout e acquisto;
- controlli progetto includono un controllo extra a 30 giorni.

## Dashboard Web Designer V2

File: `Components/timeline-web-designer-v2.jsx`

### Accesso

La dashboard viene usata in:

- pagina utente per ruolo `web designer`;
- pagina lista progetti web designer;
- dashboard generale sezione Web Design.

Carica i progetti con:

- `GET /api/collaborazioni-webdesign-v2/[userId]`

### Quando Non Ci Sono Progetti

Mostra:

- "Nessun progetto V2 assegnato";
- testo: "I nuovi progetti con Struttura, Design e Consegna appariranno qui."

### Card Progetto

Ogni progetto e una card collassabile.

Header card:

- icona diversa per vetrina/e-commerce;
- nome cliente;
- badge tipo progetto;
- data inizio -> data fine;
- barra avanzamento globale;
- select stato.

Stati:

- `in corso`
- `in pausa`
- `terminata`

L'avanzamento globale e calcolato come:

- task completati / task totali di tutte le fasi.

### Dettagli Progetto

Dentro la card aperta esiste una sezione "Dettagli progetto".

Campi:

- Data inizio.
- Data fine.
- Tipo progetto.
- URL dominio.
- Data acquisto dominio.
- Data scadenza dominio.

Permessi:

- solo amministratore puo modificare data inizio/fine;
- solo amministratore puo modificare data acquisto/scadenza dominio;
- URL dominio e tipo progetto sono editabili dalla UI.

Logica dominio:

- se viene inserita data acquisto dominio, la scadenza viene impostata automaticamente a un anno dopo.

### Stepper Visivo

Mostra le tre macro fasi:

- Struttura.
- Design.
- Consegna.

Per ogni fase:

- icona;
- numero task completati su totale;
- stato completato quando percentuale = 100.

### Cosa Va Fatto Oggi

La dashboard calcola il giorno operativo corrente in base alla data inizio e ai giorni lavorativi.

Mostra:

- giorno o intervallo corrente;
- range date;
- numero task aperti;
- elenco task da fare oggi.

Se non ci sono task aperti:

- "Nessuna attivita aperta per oggi."

Questa funzione e molto importante per il nuovo gestionale: traduce un workflow lungo in azioni immediate.

### Calendario Operativo

Il calendario raggruppa task per giorno operativo:

- Giorno 1.
- Giorno 2-3.
- Giorno 4.
- Giorno 5-7.
- Giorno 8.
- Giorno 9-11.
- Giorno 12.
- Giorno 13-17.
- Giorno 18.
- Giorno 19.
- Giorno 21+.

Ogni blocco giorno mostra:

- nome giorno;
- range data calcolato;
- badge "Oggi" se applicabile;
- badge appuntamento se ci sono task di appuntamento;
- badge "Confermato" se l'appuntamento e stato confermato nel gruppo;
- task completati su totale;
- barra progresso giorno.

Al click su un giorno:

- si apre il dettaglio task di quel giorno;
- ogni task puo essere segnato completato/non completato;
- ogni task puo avere note;
- i task riconosciuti come appuntamento hanno campi extra.

### Task Appuntamento

Per task collegati ad appuntamenti, la UI aggiunge:

- tipo appuntamento:
  - da definire;
  - appuntamento fisico;
  - appuntamento online;
- checkbox "Sentito sul gruppo per conferme".

Questa informazione serve a capire se la presentazione al cliente e stata pianificata e confermata.

### Note Task

Ogni task ha textarea "Note su questa attivita".

Comportamento:

- scrittura aggiorna stato locale;
- blur salva verso API con `PATCH /api/collaborazioni-webdesign-v2/[collabId]`.

### Controlli Progetto

La dashboard contiene una sezione "Controlli progetto".

Scopo:

- tracciare verifiche intermedie e finali;
- permettere ad admin/segretaria di lasciare note e spunti;
- rendere visibile al web designer il risultato dei controlli.

Controlli per sito vetrina:

- Controllo 7 giorni.
- Controllo 14 giorni.
- Controllo 20 giorni - Test.
- Controllo 21 giorni - Consegna.

Controlli per e-commerce:

- Controllo 7 giorni.
- Controllo 14 giorni.
- Controllo 20 giorni - Test.
- Controllo 21 giorni - Consegna.
- Controllo 30 giorni - E-commerce.

Ogni controllo ha:

- tipo;
- giorno previsto;
- data prevista calcolata;
- data effettiva "quando fatto";
- stato;
- note controllo;
- spunti di miglioramento;
- completata.

Stati controllo:

- Da valutare.
- Da fare.
- In corso.
- OK.
- Attenzione.
- Critico.

Permessi:

- admin/segretaria possono modificare controllo, data, stato, note e spunti;
- web designer vede il risultato ma non ha la stessa vista di editing admin.

### Checklist Pubblicazione

File sorgente: `lib/webdesign-v2-publication-checklist.js`

La dashboard include una checklist pre-lancio collassabile.

Categorie:

- Sicurezza & Infrastruttura.
- Tecnica & Configurazione.
- Performance & Velocita.
- SEO & Visibilita.
- UX, Accessibilita & Esperienza.
- Test, Controlli Finali & Qualita.

Ogni gruppo mostra:

- titolo categoria;
- contatore item completati;
- item con checkbox;
- descrizione item.

### Voci Checklist Pubblicazione

Sicurezza & Infrastruttura:

- SSL attivo e redirect forzato su HTTPS.
- Aggiornamenti completi e licenze attive.
- Sistema di backup professionale configurato.
- Sicurezza base e hardening minimo.
- Sistema antispam e protezione moduli.

Tecnica & Configurazione:

- Struttura permalink definitiva.
- Time zone, lingua e formato data.
- Rimozione contenuti demo e pagine inutili.
- Configurazione plugin SEO completa.
- Robots.txt coerente.

Performance & Velocita:

- Core Web Vitals sotto controllo.
- Ottimizzazione immagini reale.
- Cache e compressione attive.
- Nessun plugin inutile o ridondante.

SEO & Visibilita:

- Sitemap inviata in Search Console.
- Meta title e description ottimizzati.
- Struttura H1-H6 coerente.
- Schema markup minimo presente.

UX, Accessibilita & Esperienza:

- Mobile-first reale.
- Navigazione chiara e logica.
- Accessibilita base rispettata.
- Test moduli completo.
- Pagina 404 personalizzata e utile.

Test, Controlli Finali & Qualita:

- Test completo su 3 browser.
- Controllo ortografico e micro-copy.
- Test flusso completo utente reale.
- Analytics e tracciamenti attivi.
- Verifica blocco motori di ricerca.
- Controllo finale professionista.

### Note Macro Fasi

La dashboard ha tre textarea distinte:

- Note Struttura.
- Note Design.
- Note Consegna.

Servono per lasciare osservazioni generali sulla fase, separate dalle note dei singoli task.

### Note Generali Progetto

Textarea finale:

- "Note Generali Progetto"

Salva su:

- `collab.note`

Serve per appunti trasversali non legati a una singola fase.

## Intervista Web Designer

File: `app/Lista_clienti_webdesigner/[id]/interview/page.jsx`

### Scopo

L'intervista serve a raccogliere briefing e materiali dal cliente prima o durante il progetto. Produce:

- testo TXT pronto da copiare/scaricare;
- JSON dell'intervista;
- storico delle interviste salvate per web designer.

E una parte fondamentale per il nuovo gestionale, perche trasforma domande commerciali/creative in input operativo per la costruzione del sito.

### Step

La UI e divisa in quattro step:

1. Business: chi e cosa vende.
2. Obiettivi: cosa deve ottenere il sito.
3. Struttura: pagine, stile e materiali.
4. Export: risultato pronto.

### Step Business

Campi:

- Nome azienda.
- Servizio/prodotto principale.
- Cosa fa l'azienda.
- Cosa vogliamo spingere.
- Cliente ideale.
- Da dove arrivano oggi i clienti.

### Step Obiettivi

Opzioni obiettivi multiple:

- Ricevere contatti.
- Vendere.
- Prenotazioni.
- Mostrare portfolio.
- Farsi trovare su Google.

Campi:

- Cosa deve fare l'utente appena entra.
- CTA principale.

Tipologia sito:

- One Page.
- Sito vetrina.
- Landing page.
- E-commerce.
- Blog.

### Step Struttura, Stile e Materiali

Sezioni/pagine:

- Home.
- Chi siamo.
- Servizi.
- Gallery.
- Portfolio.
- Recensioni.
- FAQ.
- Contatti.
- Altre sezioni.

Stile desiderato:

- Minimal.
- Moderno.
- Creativo.
- Elegante.
- Professionale.
- Ricco di animazioni.
- Altro stile.

Animazioni:

- Pulito e statico.
- Micro animazioni.
- Ricco di animazioni.

Altri campi:

- Video in homepage: No/Si.
- Linee guida brand: No/Si.
- Colori preferiti o da evitare.
- Font o riferimenti tipografici.

Materiali disponibili:

- Materiali brand: logo PNG, logo vettoriale, palette colori, font/linee guida.
- Media disponibili: foto HQ, video, foto team, foto sede/prodotti.
- Testi disponibili: descrizione azienda, servizi, recensioni, FAQ, testi pagine.

### Step Export: Dominio e Risultato

Campi dominio:

- Dominio esistente: No/Si.
- Dominio / URL.
- Provider dominio/hosting.
- Email collegate.
- Scadenza dominio.
- Accessi dominio/hosting.

Campi finali:

- Note finali.
- Risultato TXT.

Azioni:

- Copia testo.
- Scarica TXT.
- Scarica JSON.
- Storico interviste.
- Scarica TXT da storico.

### Salvataggio Interviste

Usa:

- `POST /api/webdesign-interviste`
- `GET /api/webdesign-interviste?webDesignerId=...`

Il salvataggio include:

- webDesignerId;
- azienda;
- interview JSON;
- risultatoTxt;
- autore.

## Requisiti per Riproporre Web Designer nel Nuovo Gestionale

Schermate minime:

1. Lista web designer.
2. Creazione progetto web design.
3. Dashboard progetto web design.
4. Calendario operativo.
5. Task giornalieri con note.
6. Controlli progetto admin/segretaria.
7. Checklist pubblicazione.
8. Gestione dominio.
9. Intervista cliente con export e storico.

Dati minimi:

- cliente;
- web designer;
- tipo progetto;
- stato;
- data inizio/fine;
- dominio;
- fasi;
- task;
- note task;
- note fase;
- controlli progetto;
- checklist pubblicazione;
- intervista;
- note generali.

Logiche obbligatorie:

- creare task automaticamente in base al tipo progetto;
- calcolare giorni operativi su giorni lavorativi;
- evidenziare cosa va fatto oggi;
- calcolare avanzamento globale, per fase, per giorno e checklist;
- distinguere permessi admin/segretaria/web designer;
- salvare note task su blur;
- gestire appuntamento fisico/online e conferma gruppo;
- mantenere controlli progetto visibili al web designer;
- mantenere storico interviste.

# 3. Ads / Google Ads / Meta Ads

## A Cosa Serve la Collaborazione Ads

La collaborazione Ads serve ad assegnare a un collaboratore una campagna pubblicitaria per un cliente e tracciarne lo stato operativo.

Nel gestionale attuale l'unica parte Ads davvero implementata e Google Ads. Meta Ads esiste come pagina futura ma non ha ancora gestione campagne.

La collaborazione Google Ads e molto piu semplice rispetto a SMM e Web Design:

- collega cliente e collaboratore Google Ads;
- evita duplicati cliente/collaboratore;
- traccia tre stati;
- registra note.

## Creazione Campagna Google Ads

File: `Components/add-googleads-collab.jsx`

La creazione si trova in `app/AddCollab/page.jsx`, nel box "Campagna Google ADS".

### Campi

- Cliente: searchable dropdown da `/api/lista_aziende`.
- Collaboratore Google Ads: searchable dropdown da `/api/lista_collaboratori`, filtrato su ruolo `google ads`.
- Stato campagna:
  - Contattato.
  - Campagna Avviata.
  - Campagna Terminata.
- Note.

### Caso Nessun Collaboratore Google Ads

Se non esistono collaboratori con ruolo `google ads`, la UI mostra un avviso:

- non ci sono collaboratori con ruolo Google Ads;
- assegnare il ruolo prima di creare una campagna.

### Submit

Chiama:

- `POST /api/google-ads`

### Logica Backend

La route:

- verifica cliente e collaboratore obbligatori;
- carica dati cliente e collaboratore;
- controlla duplicato su coppia cliente/collaboratore;
- crea `GoogleAds`.

Se esiste gia una campagna per cliente e collaboratore:

- ritorna errore 409.

## Vista Collaboratore Google Ads

File: `Components/VistaGoogleAdsCollaboratore.jsx`

Pagina:

- `/Lista-Marketing/google-ads`

Se utente non admin ma ha ruolo `google ads`, vede solo questa vista.

### Dati

Chiama:

- `GET /api/google-ads?collaboratoreId=[session.user.id]`

### Empty State

Se non ci sono campagne:

- "Nessuna campagna Google Ads assegnata";
- invita a contattare amministratore.

### Header

Mostra:

- titolo "Le Mie Campagne Google Ads";
- bottone aggiorna.

### Statistiche Personali

Tre box:

- Contattati: conteggio campagne con `contattato = true`.
- Attive: `campagnaAvviata = true` e `campagnaTerminata = false`.
- Terminate: `campagnaTerminata = true`.

### Card Campagna

Ogni campagna mostra:

- nome cliente;
- link alla scheda cliente, se disponibile;
- indicatore "Salvato" durante update;
- toggle Contattato;
- toggle Campagna Avviata;
- toggle Terminata;
- textarea Note.

### Azioni

Toggle:

- `PATCH /api/google-ads/[id]`
- body con campo boolean invertito.

Note:

- aggiornate localmente mentre si scrive;
- salvate su blur con `PATCH /api/google-ads/[id]`.

Campi aggiornabili backend:

- `contattato`
- `campagnaAvviata`
- `campagnaTerminata`
- `note`

## Vista Admin Google Ads

File: `Components/TabellaGoogleAdsAdmin.jsx`

Se utente e amministratore, `/Lista-Marketing/google-ads` mostra la tabella admin.

### Header

Mostra:

- titolo "Google Ads - Amministrazione";
- bottone aggiorna.

### Statistiche

Quattro box:

- Totale campagne.
- Contattati.
- Attive.
- Terminate.

### Filtri

- Ricerca per cliente o collaboratore.
- Filtro stato:
  - tutti;
  - contattati;
  - campagne avviate;
  - campagne attive;
  - campagne terminate.

### Tabella

Colonne:

- Collaboratore.
- Cliente.
- Contattato.
- Campagna Avviata.
- Terminata.
- Note.
- Azioni.

### Azioni Admin

Admin puo:

- cambiare stato Contattato;
- cambiare stato Campagna Avviata;
- cambiare stato Terminata;
- eliminare campagna.

Eliminazione:

- conferma browser;
- `DELETE /api/google-ads/[id]`.

## Riepilogo Google Ads nella Scheda Utente

File: `Components/ListaGoogleAdsCollaboratore.jsx`

Questa vista mostra le collaborazioni Google Ads di un utente.

### Contenuto

Per ogni campagna:

- cliente;
- stato visuale Contattato;
- stato visuale Campagna Avviata;
- stato visuale Terminata;
- note, se presenti.

In fondo:

- totale collaborazioni.

## Meta Ads

File: `app/Lista-Marketing/meta-ads/page.jsx`

La pagina Meta Ads attuale e solo placeholder.

Mostra:

- titolo "Servizio Meta ADS";
- messaggio "Sezione in sviluppo";
- nota che la gestione campagne Meta Ads sara disponibile prossimamente;
- suggerisce per ora Google Ads.

Nel nuovo gestionale non va considerata come interfaccia completa. Va progettata da zero o derivata dalla struttura Google Ads, ma non esiste una logica operativa attuale da migrare.

## Requisiti per Riproporre Ads nel Nuovo Gestionale

Schermate minime per Google Ads:

1. Creazione campagna.
2. Vista collaboratore.
3. Vista admin globale.
4. Riepilogo nella scheda collaboratore/utente.

Dati minimi:

- cliente;
- collaboratore;
- contattato;
- campagna avviata;
- campagna terminata;
- note;
- timestamps.

Logiche obbligatorie:

- filtrare collaboratori con ruolo `google ads`;
- impedire duplicati cliente/collaboratore;
- distinguere vista admin da vista collaboratore;
- permettere update rapido dei tre stati;
- salvare note su blur;
- permettere eliminazione solo admin.

Per Meta Ads:

- indicare come modulo futuro;
- eventualmente replicare struttura Google Ads ma con campi piu specifici: business manager, ad account, pixel, budget, obiettivo, campagne, creativita.

# 4. Mappatura Consigliata sul Nuovo Gestionale V3

Nel repo esistono gia modelli V3 che sembrano pensati per assorbire queste interfacce.

## SMM

Modelli consigliati:

- `CollaborazioneV3`
- `CollaborazioneAssegnazioneV3`
- `SmmServiceV3`
- `NotebookNoteV3`
- `PagamentoV3`, se collegato ai pagamenti
- `ResetLogV3`

Mapping:

- `Collaborazione` legacy -> `CollaborazioneV3`
- contatori mensili/trimestrali -> `SmmServiceV3`
- note feed -> `NotebookNoteV3`
- collaboratore SMM -> `CollaborazioneAssegnazioneV3`

## Web Design

Modelli consigliati:

- `CollaborazioneV3`
- `WebDesignServiceV3`
- `CalendarioOperativoV3`
- `DominioV3`
- `NotebookNoteV3`
- `FileAssetV3`
- `CredentialVaultItemV3`

Mapping:

- `CollaborazioneWebDesignV2` -> `CollaborazioneV3` + `WebDesignServiceV3`
- task calendario -> `CalendarioOperativoV3.items` o task interni a `WebDesignServiceV3`
- dominio -> `DominioV3`
- checklist pubblicazione -> `WebDesignServiceV3.checklistPubblicazione`
- intervista -> `WebDesignServiceV3.interview` o modello dedicato se serve storico

Nota: nel V3 attuale `CollaborazioneV3.notebookId` punta a `NotebookV3`, ma nel repo esiste `NotebookNoteV3`. Va chiarito se serve un contenitore notebook o se basta indicizzare le note per collaborazione.

## Google Ads

Modelli consigliati:

- `CollaborazioneV3`
- `GoogleAdsServiceV3`
- `CollaborazioneAssegnazioneV3`
- `NotebookNoteV3`, se si vuole aggiungere storico operativo

Mapping:

- `GoogleAds` legacy -> `CollaborazioneV3` + `GoogleAdsServiceV3`
- `contattato/campagnaAvviata/campagnaTerminata` -> `GoogleAdsServiceV3.statoOperativo`
- note -> campo `note` o `NotebookNoteV3`

Attenzione: il modello `GoogleAdsServiceV3` ha gia campi piu evoluti:

- `accountId`
- `customerId`
- `budgetMensile`
- `obiettivo`
- `campagne`
- `statoOperativo`
- `note`

Nel nuovo gestionale conviene non limitarsi ai tre boolean legacy, ma mantenere compatibilita visuale con:

- Da contattare.
- Setup.
- Attiva.
- In pausa.
- Terminata.

# 5. Principi UX da Preservare

## Per SMM

- Vista rapida e densa: il collaboratore deve vedere subito cosa manca.
- Contatori modificabili con `+` e `-`.
- Feed separato per cliente.
- Problemi e post mancanti devono essere evidenti.
- Appuntamenti devono incrementare contatori automaticamente.
- Admin deve poter correggere obiettivi e contratto.

## Per Web Designer

- Workflow guidato, non lista generica.
- "Cosa fare oggi" sempre visibile quando il progetto e aperto.
- Calendario operativo a giorni lavorativi.
- Task con checkbox e note rapide.
- Distinzione tra task, controlli admin, checklist pubblicazione e note.
- Intervista cliente integrata e storicizzata.
- Stato progetto e progresso visibili nel header.

## Per Ads

- Interfaccia essenziale.
- Tre stati immediatamente modificabili.
- Admin vede tutto, collaboratore vede solo assegnazioni proprie.
- Note rapide.
- Evitare duplicati.

# 6. Checklist di Ricostruzione nel Nuovo Gestionale

## SMM

- [ ] Creazione collaborazione SMM con cliente, collaboratore, volumi mensili e contratto.
- [ ] Vista collaboratore con contatori post per piattaforma.
- [ ] Aggiornamento contatori con propagazione a trimestrali e totali.
- [ ] Feed note per collaborazione.
- [ ] Tipi nota: generico, appuntamento, problema, post mancante.
- [ ] Nota appuntamento incrementa appuntamenti.
- [ ] Nota problema genera notifica admin.
- [ ] Vista admin con tutti gli SMM e export.
- [ ] Reset mensile/trimestrale protetto.

## Web Designer

- [ ] Creazione progetto V2.
- [ ] Generazione automatica task per vetrina/e-commerce.
- [ ] Dashboard con card collassabili.
- [ ] Progresso globale.
- [ ] Stato progetto.
- [ ] Dettagli date/dominio.
- [ ] Stepper fasi.
- [ ] Cosa fare oggi.
- [ ] Calendario operativo.
- [ ] Task con checkbox, note, appuntamento fisico/online e conferma gruppo.
- [ ] Controlli progetto admin/segretaria.
- [ ] Checklist pubblicazione.
- [ ] Note fase e note generali.
- [ ] Intervista cliente con export TXT/JSON e storico.

## Ads

- [ ] Creazione campagna Google Ads.
- [ ] Filtra collaboratori `google ads`.
- [ ] Blocca duplicati cliente/collaboratore.
- [ ] Vista collaboratore con card e toggle.
- [ ] Vista admin con stats, filtri, tabella.
- [ ] Note su blur.
- [ ] Eliminazione solo admin.
- [ ] Definire se Meta Ads rimane placeholder o diventa modulo reale.

