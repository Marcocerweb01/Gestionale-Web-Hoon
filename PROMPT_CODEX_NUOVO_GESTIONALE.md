# Prompt per Codex - Ricostruzione Interfacce Collaborazioni nel Nuovo Gestionale

Devi lavorare al nuovo gestionale riproponendo le interfacce operative del gestionale attuale per:

- Social Media Manager
- Web Designer
- Google Ads / Ads

Prima di implementare, leggi questi file nella root del progetto:

1. `SCHEMI_MONGODB.md`
2. `INTERFACCE_COLLABORAZIONI_GESTIONALE.md`

Il primo file spiega gli schemi MongoDB/Mongoose esistenti. Il secondo spiega le interfacce attuali, cosa fanno, a cosa servono e quali logiche devono essere preservate.

## Obiettivo

Ricostruire nel nuovo gestionale le collaborazioni operative, mantenendo il senso del vecchio gestionale ma usando una struttura piu ordinata.

Una collaborazione non e solo un record: e il modo con cui un servizio venduto diventa lavoro quotidiano. Deve collegare:

- cliente;
- collaboratore;
- servizio;
- stato;
- obiettivi;
- avanzamento;
- note;
- controlli;
- eventuali contatori o checklist.

## Modello Concettuale Consigliato

Usa una struttura simile a questa:

- `CollaborazioneV3`: contenitore principale.
- `CollaborazioneAssegnazioneV3`: chi lavora sulla collaborazione.
- `AziendaV3`: cliente.
- `UserV3`: collaboratore/admin/azienda.
- servizio specifico:
  - `SmmServiceV3`
  - `WebDesignServiceV3`
  - `GoogleAdsServiceV3`
  - `MetaAdsServiceV3`
- `NotebookNoteV3`: feed/note.
- `CalendarioOperativoV3`: calendario operativo se serve.
- `DominioV3`: domini web design.
- `FileAssetV3` e `CredentialVaultItemV3`: allegati/credenziali se utili.

## Priorita di Implementazione

### 1. Social Media Manager

La collaborazione SMM serve a gestire un cliente social ricorrente.

Devi preservare:

- post previsti mensili per Instagram/Facebook, TikTok, LinkedIn;
- post fatti per piattaforma;
- appuntamenti previsti/fatti;
- contatori trimestrali;
- contatori totali contratto;
- feed note per cliente/collaborazione;
- tipi nota: generico, appuntamento, problema, post mancante;
- nota appuntamento incrementa gli appuntamenti;
- nota problema genera notifica/admin alert;
- vista collaboratore con contatori rapidi;
- vista admin con modifica contratto/obiettivi.

Interfacce da ricreare:

- creazione collaborazione SMM;
- dashboard/lista clienti SMM;
- dettaglio collaborazione con contatori;
- feed note stile chat o timeline;
- vista admin globale.

### 2. Web Designer

La collaborazione Web Design V2 e il workflow piu importante.

Devi preservare:

- tipo progetto: vetrina o e-commerce;
- data inizio/fine;
- task generati automaticamente;
- fasi: Struttura, Design, Consegna;
- calendario operativo su giorni lavorativi;
- sezione "Cosa va fatto oggi";
- task con checkbox e note;
- task appuntamento con tipo fisico/online e conferma gruppo;
- controlli progetto a 7, 14, 20, 21 giorni e 30 giorni per e-commerce;
- checklist pubblicazione;
- note per fase;
- note generali;
- gestione dominio;
- intervista cliente con export TXT/JSON e storico.

Interfacce da ricreare:

- lista web designer;
- creazione progetto;
- dashboard progetto collassabile;
- calendario operativo;
- controlli progetto admin/segretaria;
- checklist pubblicazione;
- intervista/briefing cliente.

### 3. Google Ads / Ads

Google Ads e molto piu semplice nel gestionale attuale.

Devi preservare:

- cliente;
- collaboratore Google Ads;
- stato contattato;
- stato campagna avviata;
- stato campagna terminata;
- note;
- blocco duplicati cliente/collaboratore;
- vista admin globale;
- vista collaboratore limitata alle sue campagne.

Nel nuovo gestionale puoi migliorare i tre booleani legacy trasformandoli in uno stato operativo piu pulito:

- da_contattare;
- setup;
- attiva;
- in_pausa;
- terminata.

Ma l'interfaccia deve restare rapida: toggle/stato veloce e note immediate.

Meta Ads nel vecchio gestionale e solo placeholder. Non trattarlo come funzione gia completa.

## File Attuali da Consultare nel Codice

### SMM

- `Components/add-collab.jsx`
- `Components/Lista-clienti.jsx`
- `Components/edit-collab.jsx`
- `app/Feed-2/[collaboratoreId]/page.jsx`
- `Components/add-nota.jsx`
- `app/api/collaborazioni/[collaboratoreId]/route.js`
- `app/api/collaborazioni/edit/[collaborazioneId]/route.js`
- `app/api/collaborazioni/adminedit/[collaborazioneId]/route.js`
- `app/api/note/route.js`

### Web Designer

- `Components/add-webdesign-v2.jsx`
- `Components/timeline-web-designer-v2.jsx`
- `app/api/collaborazioni-webdesign-v2/crea/route.js`
- `app/api/collaborazioni-webdesign-v2/[id]/route.js`
- `lib/webdesign-v2-publication-checklist.js`
- `app/Lista_clienti_webdesigner/[id]/interview/page.jsx`
- `app/api/webdesign-interviste/route.js`

### Google Ads

- `Components/add-googleads-collab.jsx`
- `Components/VistaGoogleAdsCollaboratore.jsx`
- `Components/TabellaGoogleAdsAdmin.jsx`
- `Components/ListaGoogleAdsCollaboratore.jsx`
- `app/api/google-ads/route.js`
- `app/api/google-ads/[id]/route.js`
- `app/Lista-Marketing/google-ads/page.jsx`
- `app/Lista-Marketing/meta-ads/page.jsx`

## Regole Importanti

- Non limitarti a copiare i campi: ricostruisci il flusso operativo.
- SMM lavora per contatori e feed.
- Web Designer lavora per workflow, task, calendario e checklist.
- Google Ads lavora per stati rapidi e note.
- Mantieni separati permessi admin, segretaria, collaboratore e cliente.
- Le azioni distruttive devono avere conferma.
- I contatori derivati non vanno persi.
- Le note devono restare storicizzate e collegate alla collaborazione.
- Se usi i modelli V3, mappa i dati legacy in modo coerente e non mischiare responsabilita diverse nello stesso documento.

## Output Atteso

Quando implementi, procedi per fasi:

1. definisci/valida i modelli dati;
2. crea le API;
3. crea le interfacce;
4. migra o adatta i dati legacy;
5. verifica i flussi principali.

Flussi minimi da testare:

- creare collaborazione SMM;
- aggiornare post fatti e verificare trimestrali/totali;
- creare nota appuntamento e verificare incremento appuntamenti;
- creare nota problema e verificare notifica;
- creare progetto web design V2;
- completare task nel calendario;
- compilare controlli progetto;
- usare checklist pubblicazione;
- salvare/scaricare intervista web design;
- creare campagna Google Ads;
- aggiornare stato campagna come collaboratore;
- vedere tutte le campagne come admin.

