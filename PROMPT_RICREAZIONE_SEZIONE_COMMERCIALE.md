# Prompt Ricreazione Sezione Commerciale nel Nuovo Gestionale

Usa questo prompt per ricreare la sezione commerciale nel nuovo gestionale partendo dal gestionale attuale, senza limitarti a copiare le schermate. L'obiettivo e preservare il flusso operativo: creazione lead, avanzamento, richiamo, note, gestione per commerciale e vista admin.

## Prompt da Usare

Sei un senior full-stack engineer. Devi ricreare nel nuovo gestionale la sezione commerciale esistente nel gestionale attuale.

Prima di implementare, leggi e usa come fonte questi file del gestionale attuale:

- `models/LeadCommerciale.js`
- `Components/CreaLead.jsx`
- `Components/ModificaLead.jsx`
- `Components/TimelineLead.jsx`
- `Components/feed-commerciale.jsx`
- `app/Lead/page.jsx`
- `app/Lead-comm/[id]/page.jsx`
- `app/Feed-comm/[collaboratoreId]/page.jsx`
- `app/api/leads/route.js`
- `app/api/leads/[id]/route.js`
- `app/api/feed_note_comm/[collaboratoreId]/route.js`
- `app/api/note_comm/route.js`
- `app/api/edit_note_comm/route.js`
- `app/api/delete_note_comm/route.js`
- `models/Note-comm.js`

Leggi anche, se presenti nel nuovo gestionale:

- modelli V3 utente/azienda/collaborazione;
- sistema permessi e ruoli;
- layout/dashboard gia creata;
- eventuale design system o component library;
- `STYLE_GUIDE_NUOVO_GESTIONALE.md`.

## Obiettivo

Ricostruire un modulo commerciale completo, coerente con la nuova struttura del gestionale, mantenendo il senso del vecchio flusso:

- ogni commerciale vede e gestisce i propri lead;
- admin e segreteria possono vedere i lead di un commerciale specifico;
- ogni lead ha dati anagrafici minimi, stato operativo, timeline commerciale, note e storico;
- la timeline e progressiva e deve rimanere semplice da aggiornare;
- i richiami devono essere evidenti, ordinabili e filtrabili;
- i lead chiusi, non interessati o completati non devono confondersi con quelli attivi.

Non creare una landing page. La prima schermata deve essere una dashboard operativa.

## Concetto di Lead Commerciale

Un lead commerciale non e solo un contatto in rubrica. E una trattativa in corso.

Deve rispondere velocemente a queste domande:

- chi e il potenziale cliente?
- chi lo sta seguendo?
- a che punto e la trattativa?
- quando bisogna richiamarlo?
- quali step sono gia stati completati?
- quali note o dettagli servono al prossimo contatto?
- il lead e ancora attivo, perso, da richiamare o chiuso?

## Dati da Preservare

Il modello legacy `LeadCommerciale` contiene:

```js
{
  nome_attivita,
  numero_telefono,
  referente,
  indirizzo,
  citta,
  email,
  secondo_numero,
  commerciale,
  timeline: {
    contatto: { completato, data_completamento },
    appuntamento: { completato, data_completamento },
    preventivo: { completato, data_completamento },
    contratto: { completato, data_completamento }
  },
  non_interessato: { completato, data_completamento, nota },
  da_ricontattare: { completato, data_completamento, data_ricontatto, nota },
  nota_generale,
  stato_attuale,
  data_cambio_stato,
  data_richiamo,
  archiviato,
  data_archiviazione,
  createdAt,
  updatedAt
}
```

Nel nuovo gestionale puoi normalizzare i nomi, ma devi preservare tutti i significati.

Modello consigliato:

```js
LeadCommercialeV3 {
  aziendaPotenziale: {
    nomeAttivita,
    referente,
    telefonoPrincipale,
    telefonoSecondario,
    email,
    indirizzo,
    citta
  },
  commercialeId,
  commercialeNome,
  stato: "in_lavorazione" | "da_richiamare" | "non_interessato" | "completato" | "archiviato",
  timeline: {
    contatto: { completato, completatoAt },
    appuntamento: { completato, completatoAt },
    preventivo: { completato, completatoAt },
    contratto: { completato, completatoAt }
  },
  richiamo: {
    data,
    nota,
    completato
  },
  notaGenerale,
  storicoStati: [{
    stato,
    fromStato,
    changedBy,
    changedAt,
    motivo
  }],
  archiviazione: {
    archiviato,
    archiviatoAt,
    archiviatoBy
  },
  createdAt,
  updatedAt
}
```

## Flussi Funzionali da Ricreare

### 1. Dashboard Lead del Commerciale

La vista del commerciale deve mostrare:

- titolo dashboard;
- ricerca per nome attivita, referente, telefono, email;
- pulsante "Nuovo lead";
- filtri stato;
- filtro "con preventivo";
- filtro per data creazione;
- opzione per mostrare richiami passati;
- lista lead ordinata in modo utile;
- statistiche finali o laterali.

Stati minimi:

- tutti;
- in lavorazione;
- da richiamare;
- non interessato;
- completato;
- archiviato, opzionale ma consigliato come vista separata.

Per `da_richiamare`, l'ordinamento e speciale:

- i richiami passati devono emergere;
- i richiami futuri vanno ordinati dal piu vicino;
- i lead senza data vanno in fondo;
- di default i passati possono essere nascosti o mostrati con toggle, ma la scelta deve essere chiara.

### 2. Vista Admin/Segreteria per Commerciale Specifico

Deve esistere una vista equivalente a:

```txt
/Lead-comm/[id]
```

Serve ad aprire i lead di un commerciale specifico.

La vista deve:

- caricare dati del commerciale;
- mostrare nome commerciale nel titolo;
- usare gli stessi filtri della dashboard personale;
- permettere creazione lead assegnato a quel commerciale;
- mantenere coerenza di permessi.

### 3. Creazione Lead

Il form deve essere veloce.

Campi obbligatori:

- nome attivita;
- numero telefono;
- commerciale assegnato.

Campi opzionali:

- referente;
- indirizzo;
- citta;
- email;
- secondo numero;
- nota generale.

Regole:

- validare obbligatori lato client e server;
- normalizzare email in lowercase;
- trim dei campi testuali;
- creare sempre con stato `in_lavorazione`;
- inizializzare timeline vuota;
- salvare `data_cambio_stato` o storico stato iniziale;
- evitare duplicati evidenti se nel nuovo gestionale esiste gia un controllo su telefono/email.

### 4. Modifica Lead

La modifica deve permettere aggiornamento dei dati anagrafici e della nota generale.

Non usare modali enormi se il nuovo gestionale ha drawer o pannelli laterali, ma non cambiare la struttura principale gia impostata.

Campi modificabili:

- nome attivita;
- numero telefono;
- referente;
- indirizzo;
- citta;
- email;
- secondo numero;
- nota generale.

### 5. Timeline Progressiva

La timeline commerciale ha quattro step:

1. contatto;
2. appuntamento;
3. preventivo;
4. contratto.

La logica e progressiva:

- se clicchi uno step non completato, completa quello step e tutti quelli precedenti;
- se togli uno step completato, deseleziona quello step e tutti quelli successivi;
- ogni completamento salva la data;
- ogni deselezione azzera la data;
- completare `contratto` imposta automaticamente stato `completato`;
- togliere `contratto` riporta lo stato a `in_lavorazione`, salvo diversa regola esplicita del nuovo gestionale.

Questa logica e fondamentale e non va persa.

### 6. Cambio Stato Manuale

Il lead deve avere uno stato generale separato dalla timeline.

Stati:

- `in_lavorazione`: lead attivo;
- `da_richiamare`: serve data richiamo obbligatoria;
- `non_interessato`: lead perso/non interessato;
- `completato`: contratto firmato;
- `archiviato`: fuori lista operativa.

Regole:

- quando lo stato cambia, salva `data_cambio_stato`;
- per `da_richiamare`, richiedi sempre una data;
- permetti modifica della data richiamo anche se lo stato e gia `da_richiamare`;
- mostra la data richiamo in evidenza nella card;
- se si imposta `completato`, valuta se segnare anche `contratto` completato per coerenza;
- azioni distruttive con conferma.

### 7. Note Commerciali / Feed

Se nel nuovo gestionale esiste un notebook/feed comune, integra le note commerciali li.

Da preservare:

- feed per commerciale;
- note collegate al commerciale e/o al lead;
- creazione nota;
- modifica nota;
- eliminazione nota;
- ordinamento cronologico;
- autore e data;
- testo libero.

Il feed commerciale deve servire a ricostruire il contesto di lavoro, non solo a salvare appunti.

### 8. Permessi

Regole consigliate:

- commerciale: vede e modifica i propri lead;
- admin: vede e modifica tutti;
- segretaria: vede e modifica tutti, se previsto dal nuovo gestionale;
- altri collaboratori: nessun accesso, salvo permesso esplicito;
- cliente/azienda: nessun accesso alla sezione commerciale.

Eliminazione definitiva:

- solo admin;
- preferire archiviazione rispetto a delete fisico;
- delete fisico solo con conferma.

### 9. API Necessarie

Crea o adatta API equivalenti a:

```txt
GET    /api/leads?commerciale={commercialeId}
POST   /api/leads
GET    /api/leads/{id}
PATCH  /api/leads/{id}
DELETE /api/leads/{id}
```

Nel nuovo gestionale, se le rotte seguono convenzioni diverse, mantieni comunque questi casi d'uso.

Requisiti API:

- autenticazione obbligatoria;
- controllo permessi per commerciale/admin/segretaria;
- filtro `archiviato=false` di default;
- opzione per includere archiviati;
- sort default per `createdAt` decrescente;
- indici su `commercialeId`, `stato`, `archiviato`, `richiamo.data`;
- PATCH parziale sicuro, senza sovrascrivere campi non inviati;
- gestione coerente di timeline e stato.

### 10. Interfaccia

La sezione deve essere operativa, densa e leggibile.

Usa:

- header pagina compatto;
- toolbar con ricerca e azione primaria;
- filtri come segmented/pill controls;
- lista card lead o tabella responsive;
- badge stato;
- step timeline cliccabili;
- nota generale sempre visibile;
- dettagli secondari collassabili;
- drawer/modal per creare e modificare;
- empty state utile;
- loading state professionale;
- error state recuperabile.

Non riempire la pagina di testo descrittivo. Chi usa il gestionale deve lavorare, non leggere una brochure.

### 11. Dati da Migrare o Mappare

Se esistono lead legacy:

- `nome_attivita` -> `aziendaPotenziale.nomeAttivita`;
- `numero_telefono` -> `aziendaPotenziale.telefonoPrincipale`;
- `secondo_numero` -> `aziendaPotenziale.telefonoSecondario`;
- `referente`, `indirizzo`, `citta`, `email` restano nel blocco azienda potenziale;
- `commerciale` -> `commercialeId`;
- `stato_attuale` -> `stato`;
- `data_richiamo` -> `richiamo.data`;
- `nota_generale` -> `notaGenerale`;
- `archiviato` -> `archiviazione.archiviato`;
- `data_archiviazione` -> `archiviazione.archiviatoAt`;
- `timeline.*.data_completamento` -> `timeline.*.completatoAt`.

Mantieni compatibilita temporanea se il nuovo gestionale deve leggere anche dati legacy.

## Output Atteso

Implementa in questo ordine:

1. modello dati o mapping verso modello V3 esistente;
2. API con permessi;
3. componenti UI riutilizzabili;
4. dashboard personale commerciale;
5. vista admin/segretaria per commerciale specifico;
6. feed/note commerciali;
7. test manuali o automatici dei flussi principali.

## Checklist di Verifica

Prima di considerare finito:

- un commerciale crea un lead con soli campi obbligatori;
- un commerciale modifica i dati del lead;
- la ricerca trova per nome, referente, telefono ed email;
- i filtri stato mostrano conteggi corretti;
- lo step `preventivo` completa anche `contatto` e `appuntamento`;
- togliere `appuntamento` toglie anche `preventivo` e `contratto`;
- completare `contratto` imposta `completato`;
- impostare `da_richiamare` richiede data;
- i richiami sono ordinati correttamente;
- admin/segretaria vede i lead di un commerciale specifico;
- un utente non autorizzato non accede;
- archiviazione o eliminazione non rimuove dati per errore;
- mobile e desktop sono usabili senza testo sovrapposto.

## Regole Finali

- Non perdere la logica progressiva della timeline.
- Non mischiare lead commerciali con collaborazioni operative gia vendute.
- Non trasformare la sezione in un CRM complesso se il flusso richiesto e veloce.
- Non cambiare la struttura nuova del gestionale se esiste gia: adatta colori, componenti e naming alle convenzioni nuove.
- Usa lo stile definito in `STYLE_GUIDE_NUOVO_GESTIONALE.md`.
