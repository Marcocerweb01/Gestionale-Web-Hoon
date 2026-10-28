# Schema dati V3 canonico

Generato dai modelli Mongoose in `models/v3` il 2026-10-19. È il contratto tecnico per la migrazione da `Webarea`: tipi, obbligatorietà, default, enum, riferimenti e indici derivano direttamente dal codice.

## Convenzioni

- Ogni documento ha `_id: ObjectId`; salvo `AuditLogV3`, i modelli hanno `createdAt: Date` e `updatedAt: Date`.
- `agenziaId` è la chiave tenant e deve essere sempre inclusa nei filtri applicativi e negli indici univoci multi-tenant.
- Gli importi sono in EUR. `Decimal128` è usato per gli eventi; i modelli economici generali usano `Number` e richiedono arrotondamento applicativo a due decimali.
- I riferimenti Mongoose non sono foreign key MongoDB: l'integrità referenziale va validata nell'applicazione e nel verificatore post-migrazione.
- I segreti con `select: false` non vengono restituiti dalle query normali e devono restare cifrati/hashati.

## Correzioni strutturali già recepite

- Aggiunto il legame molti-a-molti `UserV3.aziendaIds` per gli utenti cliente: lo stesso account può accedere a più aziende senza fondere i record.
- Aggiunto `agenziaId` alle assegnazioni e ai messaggi; gli indici univoci ora rispettano il tenant.
- Rimossa la relazione inesistente `CollaborazioneV3.notebookId -> NotebookV3`: le note puntano direttamente alla collaborazione.
- Bloccate le assegnazioni attive duplicate con indice univoco parziale.
- Corrette le fatture: `mese` numerico, `anno` obbligatorio e unicità per tenant/collaboratore/anno/mese.
- Aggiunte entità mancanti per lead commerciali ed eventi.
- Estesi SMM e Web Design affinché la migrazione non perda contatori, workflow, controlli, appuntamenti, approvazioni e pubblicazione.
- Password, credenziali e note cifrate sono escluse dalle query ordinarie.

## Relazioni cardinali principali

- `AgenziaV3 1—N UserV3/AziendaV3/CollaborazioneV3`.
- `AziendaV3 1—N CollaborazioneV3/LeadCommercialeV3/EventoV3/PagamentoV3`.
- `CollaborazioneV3 1—N CollaborazioneAssegnazioneV3/NotebookNoteV3`; al massimo un documento per ciascun servizio specifico.
- `CollaborazioneV3 1—1 CalendarioOperativoV3`.
- `ChatThreadV3 1—N ChatMessageV3`; `TicketV3 N—0..1 ChatThreadV3`.
- `EventoV3 1—N DisponibilitaEventoV3/AssegnazioneEventoV3`.

## Entità (32)

### AgenziaV3

Tenant principale e configurazione dell'agenzia.

Collezione: `agenziav3`.

| Campo | Tipo | Obbligatorio | Default | Enum / vincoli | Ref |
| --- | --- | --- | --- | --- | --- |
| `nome` | String | sì | — | trim | — |
| `ragioneSociale` | String | no | "" | trim | — |
| `partitaIva` | String | no | "" | trim | — |
| `codiceFiscale` | String | no | "" | trim | — |
| `codiceUnivoco` | String | no | "" | trim | — |
| `pec` | String | no | "" | trim; lowercase | — |
| `email` | String | sì | — | trim; lowercase | — |
| `telefono` | String | no | "" | trim | — |
| `sitoWeb` | String | no | "" | trim | — |
| `indirizzo` | Subdocument | no | — | — | — |
| `indirizzo.via` | String | no | "" | — | — |
| `indirizzo.citta` | String | no | "" | — | — |
| `indirizzo.provincia` | String | no | "" | — | — |
| `indirizzo.cap` | String | no | "" | — | — |
| `indirizzo.nazione` | String | no | `Italia` | — | — |
| `logoUrl` | String | no | "" | — | — |
| `impostazioni.timezone` | String | no | `Europe/Rome` | — | — |
| `impostazioni.valuta` | String | no | `EUR` | — | — |
| `impostazioni.resetMensileAbilitato` | Boolean | no | `true` | — | — |
| `impostazioni.resetTrimestraleAbilitato` | Boolean | no | `true` | — | — |
| `impostazioni.soglieNotificheDomini` | Array<Number> | no | `[30,20,10,5,3,2,1]` | — | — |
| `billing.iban` | String | no | "" | — | — |
| `billing.banca` | String | no | "" | — | — |
| `billing.intestatario` | String | no | "" | — | — |
| `createdBy` | ObjectId | no | null | — | UserV3 |
| `updatedBy` | ObjectId | no | null | — | UserV3 |

Indici:

- `{"email":1}` — `{"unique":true,"background":true}`

### AssegnazioneEventoV3

Assegnazione effettiva del collaboratore a una giornata evento.

Collezione: `assegnazioneeventov3`.

| Campo | Tipo | Obbligatorio | Default | Enum / vincoli | Ref |
| --- | --- | --- | --- | --- | --- |
| `agenziaId` | ObjectId | sì | — | — | AgenziaV3 |
| `eventoId` | ObjectId | sì | — | — | EventoV3 |
| `collaboratoreId` | ObjectId | sì | — | — | UserV3 |
| `dataLavoro` | Date | sì | — | — | — |
| `mansione` | String | sì | — | trim | — |
| `noteCollaboratore` | String | no | "" | — | — |
| `createdBy` | ObjectId | no | null | — | UserV3 |
| `updatedBy` | ObjectId | no | null | — | UserV3 |

Indici:

- `{"agenziaId":1}` — `{"background":true}`
- `{"eventoId":1}` — `{"background":true}`
- `{"collaboratoreId":1}` — `{"background":true}`
- `{"dataLavoro":1}` — `{"background":true}`
- `{"agenziaId":1,"eventoId":1,"dataLavoro":1,"collaboratoreId":1}` — `{"unique":true,"background":true}`

### AuditLogV3

Audit trail delle modifiche applicative.

Collezione: `auditlogv3`.

| Campo | Tipo | Obbligatorio | Default | Enum / vincoli | Ref |
| --- | --- | --- | --- | --- | --- |
| `agenziaId` | ObjectId | sì | — | — | AgenziaV3 |
| `actorId` | ObjectId | sì | — | — | UserV3 |
| `azione` | String | sì | — | — | — |
| `entityType` | String | sì | — | — | — |
| `entityId` | ObjectId | no | null | — | — |
| `before` | Mixed | no | null | — | — |
| `after` | Mixed | no | null | — | — |
| `ip` | String | no | "" | — | — |
| `userAgent` | String | no | "" | — | — |

Indici:

- `{"agenziaId":1}` — `{"background":true}`
- `{"actorId":1}` — `{"background":true}`
- `{"azione":1}` — `{"background":true}`
- `{"entityType":1}` — `{"background":true}`
- `{"entityId":1}` — `{"background":true}`

### AziendaV3

Cliente/azienda gestita dall'agenzia.

Collezione: `aziendav3`.

| Campo | Tipo | Obbligatorio | Default | Enum / vincoli | Ref |
| --- | --- | --- | --- | --- | --- |
| `agenziaId` | ObjectId | sì | — | — | AgenziaV3 |
| `ragioneSociale` | String | sì | — | trim | — |
| `etichetta` | String | no | "" | trim | — |
| `partitaIva` | String | no | "" | trim | — |
| `codiceFiscale` | String | no | "" | trim | — |
| `codiceUnivoco` | String | no | "" | trim | — |
| `pec` | String | no | "" | trim; lowercase | — |
| `email` | String | no | "" | trim; lowercase | — |
| `telefono` | String | no | "" | trim | — |
| `sitoWeb` | String | no | "" | trim | — |
| `settore` | String | no | "" | trim | — |
| `descrizioneAttivita` | String | no | "" | — | — |
| `indirizzoLegale` | Subdocument | no | — | — | — |
| `indirizzoLegale.via` | String | no | "" | — | — |
| `indirizzoLegale.citta` | String | no | "" | — | — |
| `indirizzoLegale.provincia` | String | no | "" | — | — |
| `indirizzoLegale.cap` | String | no | "" | — | — |
| `indirizzoLegale.nazione` | String | no | `Italia` | — | — |
| `indirizzoOperativo` | Subdocument | no | — | — | — |
| `indirizzoOperativo.via` | String | no | "" | — | — |
| `indirizzoOperativo.citta` | String | no | "" | — | — |
| `indirizzoOperativo.provincia` | String | no | "" | — | — |
| `indirizzoOperativo.cap` | String | no | "" | — | — |
| `indirizzoOperativo.nazione` | String | no | `Italia` | — | — |
| `referenti` | Array<Subdocument> | no | — | — | — |
| `referenti[].nome` | String | no | "" | — | — |
| `referenti[].cognome` | String | no | "" | — | — |
| `referenti[].ruolo` | String | no | "" | — | — |
| `referenti[].email` | String | no | "" | trim; lowercase | — |
| `referenti[].telefono` | String | no | "" | — | — |
| `referenti[].principale` | Boolean | no | `false` | — | — |
| `utentiPortale` | Array<ObjectId> | no | — | — | UserV3 |
| `statoCliente` | String | no | `lead` | enum: "lead", "attivo", "in pausa", "ex_cliente" | — |
| `origine` | String | no | `altro` | enum: "commerciale", "referal", "chiamata", "ricerca", "social", "altro" | — |
| `commercialeOwner` | ObjectId | no | null | — | UserV3 |
| `tags` | Array<String> | no | `[]` | — | — |
| `noteInterne` | String | no | "" | — | — |
| `privacy.consensoMarketing` | Boolean | no | `false` | — | — |
| `privacy.consensoTrattamentoDati` | Boolean | no | `false` | — | — |
| `gestioneEconomica.incassoDestinatoA` | String | no | `agenzia` | enum: "agenzia", "collaboratori" | — |
| `legacyKeys` | Array<String> | no | `[]` | — | — |
| `createdBy` | ObjectId | no | null | — | UserV3 |
| `updatedBy` | ObjectId | no | null | — | UserV3 |

Indici:

- `{"agenziaId":1}` — `{"background":true}`
- `{"statoCliente":1}` — `{"background":true}`
- `{"agenziaId":1,"ragioneSociale":1}` — `{"background":true}`
- `{"agenziaId":1,"partitaIva":1}` — `{"background":true}`
- `{"agenziaId":1,"legacyKeys":1}` — `{"unique":true,"partialFilterExpression":{"legacyKeys":{"$type":"string"}},"background":true}`

### CalendarioOperativoV3

Calendario e task operativi di una collaborazione.

Collezione: `calendariooperativov3`.

| Campo | Tipo | Obbligatorio | Default | Enum / vincoli | Ref |
| --- | --- | --- | --- | --- | --- |
| `agenziaId` | ObjectId | sì | — | — | AgenziaV3 |
| `collaborazioneId` | ObjectId | sì | — | — | CollaborazioneV3 |
| `aziendaId` | ObjectId | sì | — | — | AziendaV3 |
| `items` | Array<Subdocument> | no | — | — | — |
| `items[].titolo` | String | sì | — | — | — |
| `items[].descrizione` | String | no | "" | — | — |
| `items[].tipo` | String | no | `task` | enum: "task", "appuntamento", "scadenza", "controllo", "pubblicazione" | — |
| `items[].dataInizio` | Date | no | null | — | — |
| `items[].dataFine` | Date | no | null | — | — |
| `items[].giornoOperativo` | Number | no | null | — | — |
| `items[].assegnatoA` | Array<ObjectId> | no | — | — | UserV3 |
| `items[].stato` | String | no | `da_fare` | enum: "da_fare", "in_corso", "bloccato", "completato" | — |
| `items[].priorita` | String | no | `media` | enum: "bassa", "media", "alta", "critica" | — |
| `items[].note` | String | no | "" | — | — |

Indici:

- `{"agenziaId":1}` — `{"background":true}`
- `{"aziendaId":1}` — `{"background":true}`
- `{"collaborazioneId":1}` — `{"unique":true,"background":true}`

### CatalogoServizioV3

Catalogo dei servizi vendibili dall'agenzia.

Collezione: `catalogoserviziov3`.

| Campo | Tipo | Obbligatorio | Default | Enum / vincoli | Ref |
| --- | --- | --- | --- | --- | --- |
| `agenziaId` | ObjectId | sì | — | — | AgenziaV3 |
| `codice` | String | sì | — | trim; lowercase | — |
| `nome` | String | sì | — | trim | — |
| `tipoCollaborazione` | String | no | `mista` | enum: "smm", "web_design", "seo", "google_ads", "meta_ads", "commerciale", "mista" | — |
| `descrizione` | String | no | "" | — | — |
| `prezzoBase` | Number | no | null | min: 0 | — |
| `valuta` | String | no | `EUR` | enum: "EUR" | — |
| `attivo` | Boolean | no | `true` | — | — |
| `legacyRef.model` | String | no | "" | enum: "Servizio", "" | — |
| `legacyRef.id` | ObjectId | no | null | — | — |

Indici:

- `{"agenziaId":1}` — `{"background":true}`
- `{"attivo":1}` — `{"background":true}`
- `{"agenziaId":1,"codice":1}` — `{"unique":true,"background":true}`
- `{"agenziaId":1,"legacyRef.model":1,"legacyRef.id":1}` — `{"unique":true,"partialFilterExpression":{"legacyRef.id":{"$type":"objectId"}},"background":true}`

### ChatMessageV3

Messaggio appartenente a un thread.

Collezione: `chatmessagev3`.

| Campo | Tipo | Obbligatorio | Default | Enum / vincoli | Ref |
| --- | --- | --- | --- | --- | --- |
| `agenziaId` | ObjectId | sì | — | — | AgenziaV3 |
| `threadId` | ObjectId | sì | — | — | ChatThreadV3 |
| `autoreId` | ObjectId | sì | — | — | UserV3 |
| `testo` | String | sì | — | — | — |
| `allegati` | Array<ObjectId> | no | — | — | FileAssetV3 |
| `lettoDa` | Array<Subdocument> | no | — | — | — |
| `lettoDa[].userId` | ObjectId | sì | — | — | UserV3 |
| `lettoDa[].lettoAt` | Date | no | Date.now | — | — |

Indici:

- `{"agenziaId":1}` — `{"background":true}`
- `{"threadId":1}` — `{"background":true}`
- `{"agenziaId":1,"threadId":1,"createdAt":1}` — `{"background":true}`

### ChatThreadV3

Conversazione cliente/team o interna.

Collezione: `chatthreadv3`.

| Campo | Tipo | Obbligatorio | Default | Enum / vincoli | Ref |
| --- | --- | --- | --- | --- | --- |
| `agenziaId` | ObjectId | sì | — | — | AgenziaV3 |
| `aziendaId` | ObjectId | sì | — | — | AziendaV3 |
| `collaborazioneId` | ObjectId | no | null | — | CollaborazioneV3 |
| `partecipanti` | Array<ObjectId> | no | — | — | UserV3 |
| `visibilita` | String | no | `cliente_team` | enum: "cliente_team", "interna" | — |
| `ultimoMessaggioAt` | Date | no | null | — | — |

Indici:

- `{"agenziaId":1}` — `{"background":true}`
- `{"aziendaId":1}` — `{"background":true}`
- `{"collaborazioneId":1}` — `{"background":true}`

### CollaboratoreProfileV3

Dati professionali ed economici del collaboratore.

Collezione: `collaboratoreprofilev3`.

| Campo | Tipo | Obbligatorio | Default | Enum / vincoli | Ref |
| --- | --- | --- | --- | --- | --- |
| `userId` | ObjectId | sì | — | — | UserV3 |
| `agenziaId` | ObjectId | sì | — | — | AgenziaV3 |
| `partitaIva` | String | no | "" | — | — |
| `codiceFiscale` | String | no | "" | — | — |
| `iban` | String | no | "" | — | — |
| `intestatarioConto` | String | no | "" | — | — |
| `indirizzo` | Subdocument | no | — | — | — |
| `indirizzo.via` | String | no | "" | — | — |
| `indirizzo.citta` | String | no | "" | — | — |
| `indirizzo.provincia` | String | no | "" | — | — |
| `indirizzo.cap` | String | no | "" | — | — |
| `indirizzo.nazione` | String | no | `Italia` | — | — |
| `subRoles` | Array<String> | no | `[]` | enum: "smm", "web_designer", "seo", "google_ads", "meta_ads", "commerciale", "fotografo", "videomaker" | — |
| `competenze` | Array<String> | no | `[]` | — | — |
| `seniority` | String | no | `middle` | enum: "junior", "middle", "senior", "lead" | — |
| `disponibilitaSettimanaleOre` | Number | no | null | — | — |
| `costoOrario` | Number | no | null | — | — |
| `percentualeDefault` | Number | no | null | — | — |
| `percentuale_hoon` | Number | no | `50` | enum: 50, 55, 60, 70 | — |
| `statoOperativo` | String | no | `attivo` | enum: "attivo", "non_attivo", "in pausa" | — |
| `noteAmministratore` | String | no | "" | — | — |
| `metriche.tot_fatturato` | Number | no | `0` | — | — |
| `metriche.guadagno_da_hoon` | Number | no | `0` | — | — |
| `metriche.totale_fatture_terzi` | Number | no | `0` | — | — |
| `createdBy` | ObjectId | no | null | — | UserV3 |
| `updatedBy` | ObjectId | no | null | — | UserV3 |

Indici:

- `{"userId":1}` — `{"unique":true,"background":true}`
- `{"agenziaId":1}` — `{"background":true}`

### CollaborazioneAssegnazioneV3

Relazione storicizzata tra collaborazione e collaboratore.

Collezione: `collaborazioneassegnazionev3`.

| Campo | Tipo | Obbligatorio | Default | Enum / vincoli | Ref |
| --- | --- | --- | --- | --- | --- |
| `agenziaId` | ObjectId | sì | — | — | AgenziaV3 |
| `collaborazioneId` | ObjectId | sì | — | — | CollaborazioneV3 |
| `aziendaId` | ObjectId | sì | — | — | AziendaV3 |
| `collaboratoreId` | ObjectId | sì | — | — | UserV3 |
| `subRole` | String | sì | — | enum: "smm", "web_designer", "seo", "google_ads", "meta_ads", "commerciale", "fotografo", "videomaker" | — |
| `stato` | String | no | `attiva` | enum: "attiva", "sospesa", "terminata" | — |
| `dataInizio` | Date | no | Date.now | — | — |
| `dataFine` | Date | no | null | — | — |
| `percentuale` | Number | no | null | — | — |
| `cifraFissa` | Number | no | null | — | — |
| `permessiCollaborazione` | Array<String> | no | `["read"]` | enum: "read", "update_status", "manage_posts", "manage_calendar", "manage_notes", "manage_ads", "reply_chat", "manage_tickets" | — |
| `motivoSpostamento` | String | no | "" | — | — |
| `assegnatoDa` | ObjectId | no | null | — | UserV3 |

Indici:

- `{"agenziaId":1}` — `{"background":true}`
- `{"collaborazioneId":1}` — `{"background":true}`
- `{"aziendaId":1}` — `{"background":true}`
- `{"collaboratoreId":1}` — `{"background":true}`
- `{"subRole":1}` — `{"background":true}`
- `{"stato":1}` — `{"background":true}`
- `{"agenziaId":1,"collaborazioneId":1,"collaboratoreId":1,"subRole":1}` — `{"unique":true,"partialFilterExpression":{"stato":"attiva"},"background":true}`

### CollaborazioneV3

Contenitore contrattuale e operativo di una collaborazione.

Collezione: `collaborazionev3`.

| Campo | Tipo | Obbligatorio | Default | Enum / vincoli | Ref |
| --- | --- | --- | --- | --- | --- |
| `agenziaId` | ObjectId | sì | — | — | AgenziaV3 |
| `aziendaId` | ObjectId | sì | — | — | AziendaV3 |
| `titolo` | String | sì | — | trim | — |
| `tipo` | String | sì | — | enum: "smm", "web_design", "seo", "google_ads", "meta_ads", "commerciale", "mista" | — |
| `stato` | String | no | `bozza` | enum: "bozza", "attiva", "in pausa", "terminata", "archiviata" | — |
| `priorita` | String | no | `media` | enum: "bassa", "media", "alta", "critica" | — |
| `dataInizio` | Date | no | Date.now | — | — |
| `dataFine` | Date | no | null | — | — |
| `contratto.durata` | String | no | "" | — | — |
| `contratto.dataInizio` | Date | no | null | — | — |
| `contratto.dataFine` | Date | no | null | — | — |
| `contratto.rinnovoAutomatico` | Boolean | no | `false` | — | — |
| `contratto.valoreMensile` | Number | no | `0` | — | — |
| `contratto.valoreTotale` | Number | no | `0` | — | — |
| `team` | Array<Subdocument> | no | — | — | — |
| `team[].collaboratoreId` | ObjectId | sì | — | — | UserV3 |
| `team[].subRole` | String | sì | — | enum: "smm", "web_designer", "seo", "google_ads", "meta_ads", "commerciale", "fotografo", "videomaker" | — |
| `team[].ruoloNelProgetto` | String | no | `operativo` | enum: "owner", "operativo", "supporto", "reviewer" | — |
| `team[].percentuale` | Number | no | null | — | — |
| `team[].cifraFissa` | Number | no | null | — | — |
| `team[].dataAssegnazione` | Date | no | Date.now | — | — |
| `team[].dataFineAssegnazione` | Date | no | null | — | — |
| `team[].attivo` | Boolean | no | `true` | — | — |
| `servizi` | Array<Subdocument> | no | — | — | — |
| `servizi[].tipo` | String | sì | — | enum: "smm", "web_design", "seo", "google_ads", "meta_ads", "commerciale", "mista" | — |
| `servizi[].nome` | String | sì | — | — | — |
| `servizi[].stato` | String | no | `attivo` | enum: "bozza", "attivo", "in pausa", "terminato" | — |
| `servizi[].budget` | Number | no | null | — | — |
| `servizi[].obiettivi` | String | no | "" | — | — |
| `avanzamento.percentuale` | Number | no | `0` | min: 0; max: 100 | — |
| `avanzamento.statoSintetico` | String | no | "" | — | — |
| `avanzamento.ultimoAggiornamentoAt` | Date | no | null | — | — |
| `calendarioId` | ObjectId | no | null | — | CalendarioOperativoV3 |
| `chatId` | ObjectId | no | null | — | ChatThreadV3 |
| `legacyRef.model` | String | no | "" | enum: "Collaborazione", "CollaborazioneWebDesignV2", "GoogleAds", "" | — |
| `legacyRef.id` | ObjectId | no | null | — | — |
| `createdBy` | ObjectId | no | null | — | UserV3 |
| `updatedBy` | ObjectId | no | null | — | UserV3 |

Indici:

- `{"agenziaId":1}` — `{"background":true}`
- `{"aziendaId":1}` — `{"background":true}`
- `{"tipo":1}` — `{"background":true}`
- `{"stato":1}` — `{"background":true}`
- `{"agenziaId":1,"aziendaId":1,"stato":1}` — `{"background":true}`
- `{"team.collaboratoreId":1,"stato":1}` — `{"background":true}`
- `{"agenziaId":1,"legacyRef.model":1,"legacyRef.id":1}` — `{"unique":true,"partialFilterExpression":{"legacyRef.model":{"$type":"string"},"legacyRef.id":{"$type":"objectId"}},"background":true}`

### CredentialVaultItemV3

Credenziale cifrata, esclusa dalle query ordinarie.

Collezione: `credentialvaultitemv3`.

| Campo | Tipo | Obbligatorio | Default | Enum / vincoli | Ref |
| --- | --- | --- | --- | --- | --- |
| `agenziaId` | ObjectId | sì | — | — | AgenziaV3 |
| `aziendaId` | ObjectId | no | null | — | AziendaV3 |
| `collaborazioneId` | ObjectId | no | null | — | CollaborazioneV3 |
| `titolo` | String | sì | — | — | — |
| `categoria` | String | no | `altro` | enum: "dominio", "hosting", "wordpress", "social", "ads", "email", "altro" | — |
| `url` | String | no | "" | — | — |
| `username` | String | no | "" | — | — |
| `passwordEncrypted` | String | sì | — | select: false | — |
| `noteEncrypted` | String | no | "" | select: false | — |
| `visibileA` | Array<ObjectId> | no | — | — | UserV3 |
| `ultimoAccessoAt` | Date | no | null | — | — |
| `createdBy` | ObjectId | sì | — | — | UserV3 |
| `updatedBy` | ObjectId | no | null | — | UserV3 |

Indici:

- `{"agenziaId":1}` — `{"background":true}`
- `{"aziendaId":1}` — `{"background":true}`
- `{"collaborazioneId":1}` — `{"background":true}`

### DisponibilitaEventoV3

Disponibilità del collaboratore per ciascuna giornata evento.

Collezione: `disponibilitaeventov3`.

| Campo | Tipo | Obbligatorio | Default | Enum / vincoli | Ref |
| --- | --- | --- | --- | --- | --- |
| `agenziaId` | ObjectId | sì | — | — | AgenziaV3 |
| `eventoId` | ObjectId | sì | — | — | EventoV3 |
| `collaboratoreId` | ObjectId | sì | — | — | UserV3 |
| `stato` | String | sì | — | enum: "si", "no", "forse" | — |
| `nota` | String | no | "" | trim | — |
| `risposteGiornaliere` | Array<Subdocument> | no | `[]` | — | — |
| `risposteGiornaliere[].data` | Date | sì | — | — | — |
| `risposteGiornaliere[].stato` | String | sì | — | enum: "si", "no", "forse" | — |
| `risposteGiornaliere[].nota` | String | no | "" | trim | — |

Indici:

- `{"agenziaId":1}` — `{"background":true}`
- `{"eventoId":1}` — `{"background":true}`
- `{"collaboratoreId":1}` — `{"background":true}`
- `{"agenziaId":1,"eventoId":1,"collaboratoreId":1}` — `{"unique":true,"background":true}`

### DominioV3

Dominio, scadenza, alert e collegamenti operativi.

Collezione: `dominiov3`.

| Campo | Tipo | Obbligatorio | Default | Enum / vincoli | Ref |
| --- | --- | --- | --- | --- | --- |
| `agenziaId` | ObjectId | sì | — | — | AgenziaV3 |
| `aziendaId` | ObjectId | sì | — | — | AziendaV3 |
| `collaborazioneId` | ObjectId | no | null | — | CollaborazioneV3 |
| `webDesignerId` | ObjectId | no | null | — | UserV3 |
| `registrar` | String | no | "" | — | — |
| `urlDominio` | String | sì | — | trim | — |
| `dataAcquisto` | Date | no | null | — | — |
| `dataScadenza` | Date | sì | — | — | — |
| `rinnovoAutomatico` | Boolean | no | `false` | — | — |
| `stato` | String | no | `attivo` | enum: "attivo", "in_scadenza", "scaduto", "trasferito" | — |
| `credenzialeId` | ObjectId | no | null | — | CredentialVaultItemV3 |
| `note` | String | no | "" | — | — |
| `alertInviati` | Array<Subdocument> | no | — | — | — |
| `alertInviati[].soglia` | Number | sì | — | — | — |
| `alertInviati[].dataInvio` | Date | no | Date.now | — | — |

Indici:

- `{"agenziaId":1}` — `{"background":true}`
- `{"aziendaId":1}` — `{"background":true}`
- `{"collaborazioneId":1}` — `{"background":true}`
- `{"webDesignerId":1}` — `{"background":true}`
- `{"dataScadenza":1}` — `{"background":true}`
- `{"agenziaId":1,"urlDominio":1}` — `{"unique":true,"background":true}`

### EventoV3

Evento o shooting con obiettivi e gestione economica.

Collezione: `eventov3`.

| Campo | Tipo | Obbligatorio | Default | Enum / vincoli | Ref |
| --- | --- | --- | --- | --- | --- |
| `agenziaId` | ObjectId | sì | — | — | AgenziaV3 |
| `aziendaId` | ObjectId | no | null | — | AziendaV3 |
| `tipo` | String | no | `evento` | enum: "evento", "shooting" | — |
| `nome` | String | sì | — | trim | — |
| `dataInizio` | Date | sì | — | — | — |
| `dataFine` | Date | sì | — | — | — |
| `giornate` | Array<Date> | no | — | — | — |
| `luogo` | String | sì | — | trim | — |
| `responsabileId` | ObjectId | sì | — | — | UserV3 |
| `collaboratoriInvitati` | Array<ObjectId> | no | — | — | UserV3 |
| `obiettivi.postPrevisti` | Number | no | `0` | min: 0 | — |
| `obiettivi.postFatti` | Number | no | `0` | min: 0 | — |
| `obiettivi.appuntamentiPrevisti` | Number | no | `0` | min: 0 | — |
| `obiettivi.appuntamentiFatti` | Number | no | `0` | min: 0 | — |
| `finestraSocial.inizio` | Date | no | null | — | — |
| `finestraSocial.fine` | Date | no | null | — | — |
| `finestraSocial.piattaforme` | Array<String> | no | — | enum: "instagram", "facebook", "tiktok", "youtube", "linkedin" | — |
| `noteInterne` | String | no | "" | — | — |
| `noteShooting` | String | no | "" | — | — |
| `pagamentoTotale` | Decimal128 | no | `0.00` | — | — |
| `tranche` | Array<Subdocument> | no | `[]` | — | — |
| `tranche[].descrizione` | String | no | "" | trim | — |
| `tranche[].importo` | Decimal128 | no | `0.00` | — | — |
| `tranche[].scadenza` | Date | no | null | — | — |
| `tranche[].stato` | String | no | `da_pagare` | enum: "da_pagare", "pagata", "scaduta" | — |
| `hardDisk` | Boolean | no | `false` | — | — |
| `report` | Boolean | no | `false` | — | — |
| `legacyRef.model` | String | no | "" | enum: "Evento", "" | — |
| `legacyRef.id` | ObjectId | no | null | — | — |
| `createdBy` | ObjectId | no | null | — | UserV3 |
| `updatedBy` | ObjectId | no | null | — | UserV3 |

Indici:

- `{"agenziaId":1}` — `{"background":true}`
- `{"aziendaId":1}` — `{"background":true}`
- `{"tipo":1}` — `{"background":true}`
- `{"dataInizio":1}` — `{"background":true}`
- `{"responsabileId":1}` — `{"background":true}`
- `{"agenziaId":1,"dataInizio":1,"tipo":1}` — `{"background":true}`
- `{"agenziaId":1,"responsabileId":1,"dataInizio":1}` — `{"background":true}`
- `{"agenziaId":1,"legacyRef.model":1,"legacyRef.id":1}` — `{"unique":true,"partialFilterExpression":{"legacyRef.id":{"$type":"objectId"}},"background":true}`

### FatturaCollaboratoreV3

Fattura mensile emessa da un collaboratore.

Collezione: `fatturacollaboratorev3`.

| Campo | Tipo | Obbligatorio | Default | Enum / vincoli | Ref |
| --- | --- | --- | --- | --- | --- |
| `agenziaId` | ObjectId | sì | — | — | AgenziaV3 |
| `collaboratoreId` | ObjectId | sì | — | — | UserV3 |
| `collaborazioneIds` | Array<ObjectId> | no | — | — | CollaborazioneV3 |
| `assegnazioneIds` | Array<ObjectId> | no | — | — | CollaborazioneAssegnazioneV3 |
| `mese` | Number | sì | — | min: 1; max: 12 | — |
| `anno` | Number | sì | — | min: 2000 | — |
| `totale` | Number | no | null | — | — |
| `numeroFattura` | String | no | "" | — | — |
| `dataEmissione` | Date | no | null | — | — |
| `dataScadenza` | Date | no | null | — | — |
| `statoCollaboratore` | String | no | `non emessa` | enum: "non emessa", "emessa" | — |
| `statoAmministratore` | String | no | `non pagata` | enum: "non pagata", "pagata" | — |
| `fileUrl` | String | no | "" | — | — |
| `noteAdmin` | String | no | "" | — | — |
| `legacyRef.model` | String | no | "" | enum: "Fatturazione", "" | — |
| `legacyRef.id` | ObjectId | no | null | — | — |

Indici:

- `{"agenziaId":1}` — `{"background":true}`
- `{"collaboratoreId":1}` — `{"background":true}`
- `{"agenziaId":1,"collaboratoreId":1,"anno":1,"mese":1}` — `{"unique":true,"background":true}`
- `{"agenziaId":1,"legacyRef.model":1,"legacyRef.id":1}` — `{"unique":true,"partialFilterExpression":{"legacyRef.id":{"$type":"objectId"}},"background":true}`

### FileAssetV3

Metadati dei file archiviati fuori da MongoDB.

Collezione: `fileassetv3`.

| Campo | Tipo | Obbligatorio | Default | Enum / vincoli | Ref |
| --- | --- | --- | --- | --- | --- |
| `agenziaId` | ObjectId | sì | — | — | AgenziaV3 |
| `ownerId` | ObjectId | no | null | — | UserV3 |
| `aziendaId` | ObjectId | no | null | — | AziendaV3 |
| `collaborazioneId` | ObjectId | no | null | — | CollaborazioneV3 |
| `nome` | String | sì | — | — | — |
| `mimeType` | String | no | "" | — | — |
| `size` | Number | no | `0` | — | — |
| `url` | String | sì | — | — | — |
| `categoria` | String | no | "" | — | — |

Indici:

- `{"agenziaId":1}` — `{"background":true}`
- `{"aziendaId":1}` — `{"background":true}`
- `{"collaborazioneId":1}` — `{"background":true}`

### GoogleAdsServiceV3

Stato operativo e campagne Google Ads.

Collezione: `googleadsservicev3`.

| Campo | Tipo | Obbligatorio | Default | Enum / vincoli | Ref |
| --- | --- | --- | --- | --- | --- |
| `collaborazioneId` | ObjectId | sì | — | — | CollaborazioneV3 |
| `agenziaId` | ObjectId | sì | — | — | AgenziaV3 |
| `aziendaId` | ObjectId | sì | — | — | AziendaV3 |
| `accountId` | String | no | "" | — | — |
| `customerId` | String | no | "" | — | — |
| `budgetMensile` | Number | no | `0` | — | — |
| `obiettivo` | String | no | `lead` | enum: "lead", "vendite", "traffico", "brand" | — |
| `campagne` | Array<Subdocument> | no | — | — | — |
| `campagne[].nome` | String | sì | — | — | — |
| `campagne[].tipo` | String | no | "" | — | — |
| `campagne[].budget` | Number | no | `0` | — | — |
| `campagne[].stato` | String | no | `bozza` | enum: "bozza", "attiva", "in pausa", "terminata" | — |
| `campagne[].dataAvvio` | Date | no | null | — | — |
| `campagne[].dataFine` | Date | no | null | — | — |
| `campagne[].kpi` | Subdocument | no | — | — | — |
| `campagne[].kpi.impressions` | Number | no | `0` | — | — |
| `campagne[].kpi.click` | Number | no | `0` | — | — |
| `campagne[].kpi.costo` | Number | no | `0` | — | — |
| `campagne[].kpi.conversioni` | Number | no | `0` | — | — |
| `campagne[].kpi.cpa` | Number | no | `0` | — | — |
| `statoOperativo` | String | no | `da_contattare` | enum: "da_contattare", "setup", "attiva", "in_pausa", "terminata" | — |
| `note` | String | no | "" | — | — |

Indici:

- `{"collaborazioneId":1}` — `{"unique":true,"background":true}`
- `{"agenziaId":1}` — `{"background":true}`
- `{"aziendaId":1}` — `{"background":true}`

### KnowledgeItemV3

FAQ, dispense e contenuti operativi unificati.

Collezione: `knowledgeitemv3`.

| Campo | Tipo | Obbligatorio | Default | Enum / vincoli | Ref |
| --- | --- | --- | --- | --- | --- |
| `agenziaId` | ObjectId | sì | — | — | AgenziaV3 |
| `tipo` | String | sì | — | enum: "dispensa", "faq", "operation" | — |
| `titolo` | String | sì | — | — | — |
| `contenuto` | String | no | "" | — | — |
| `categoria` | String | no | "" | — | — |
| `tags` | Array<String> | no | `[]` | — | — |
| `fileUrl` | String | no | "" | — | — |
| `visibileA` | Array<String> | no | `["collaboratori"]` | enum: "admin", "collaboratori", "aziende" | — |
| `subRolesVisibili` | Array<String> | no | `[]` | enum: "smm", "web_designer", "seo", "google_ads", "meta_ads", "commerciale", "fotografo", "videomaker" | — |
| `stato` | String | no | `bozza` | enum: "bozza", "pubblicato", "archiviato" | — |
| `suggeritoDa` | ObjectId | no | null | — | UserV3 |
| `approvatoDa` | ObjectId | no | null | — | UserV3 |
| `ordine` | Number | no | `0` | — | — |

Indici:

- `{"agenziaId":1}` — `{"background":true}`
- `{"tipo":1}` — `{"background":true}`
- `{"categoria":1}` — `{"background":true}`

### LeadCommercialeV3

Pipeline commerciale senza perdita della timeline legacy.

Collezione: `leadcommercialev3`.

| Campo | Tipo | Obbligatorio | Default | Enum / vincoli | Ref |
| --- | --- | --- | --- | --- | --- |
| `agenziaId` | ObjectId | sì | — | — | AgenziaV3 |
| `aziendaId` | ObjectId | sì | — | — | AziendaV3 |
| `commercialeId` | ObjectId | sì | — | — | UserV3 |
| `referente` | String | no | "" | trim | — |
| `telefonoPrincipale` | String | sì | — | trim | — |
| `telefonoSecondario` | String | no | "" | trim | — |
| `email` | String | no | "" | trim; lowercase | — |
| `indirizzo` | String | no | "" | trim | — |
| `citta` | String | no | "" | trim | — |
| `timeline.contatto` | Subdocument | no | funzione | — | — |
| `timeline.contatto.completato` | Boolean | no | `false` | — | — |
| `timeline.contatto.dataCompletamento` | Date | no | null | — | — |
| `timeline.appuntamento` | Subdocument | no | funzione | — | — |
| `timeline.appuntamento.completato` | Boolean | no | `false` | — | — |
| `timeline.appuntamento.dataCompletamento` | Date | no | null | — | — |
| `timeline.preventivo` | Subdocument | no | funzione | — | — |
| `timeline.preventivo.completato` | Boolean | no | `false` | — | — |
| `timeline.preventivo.dataCompletamento` | Date | no | null | — | — |
| `timeline.contratto` | Subdocument | no | funzione | — | — |
| `timeline.contratto.completato` | Boolean | no | `false` | — | — |
| `timeline.contratto.dataCompletamento` | Date | no | null | — | — |
| `stato` | String | no | `in_lavorazione` | enum: "in_lavorazione", "non_interessato", "da_richiamare", "completato" | — |
| `statoCambiatoAt` | Date | no | null | — | — |
| `richiamoAt` | Date | no | null | — | — |
| `nonInteressato.completato` | Boolean | no | `false` | — | — |
| `nonInteressato.dataCompletamento` | Date | no | null | — | — |
| `nonInteressato.nota` | String | no | "" | — | — |
| `daRicontattare.completato` | Boolean | no | `false` | — | — |
| `daRicontattare.dataCompletamento` | Date | no | null | — | — |
| `daRicontattare.dataRicontatto` | Date | no | null | — | — |
| `daRicontattare.nota` | String | no | "" | — | — |
| `notaGenerale` | String | no | "" | — | — |
| `archiviato` | Boolean | no | `false` | — | — |
| `archiviatoAt` | Date | no | null | — | — |
| `legacyRef.model` | String | no | "" | enum: "LeadCommerciale", "" | — |
| `legacyRef.id` | ObjectId | no | null | — | — |
| `createdBy` | ObjectId | no | null | — | UserV3 |
| `updatedBy` | ObjectId | no | null | — | UserV3 |

Indici:

- `{"agenziaId":1}` — `{"background":true}`
- `{"aziendaId":1}` — `{"background":true}`
- `{"commercialeId":1}` — `{"background":true}`
- `{"stato":1}` — `{"background":true}`
- `{"richiamoAt":1}` — `{"background":true}`
- `{"archiviato":1}` — `{"background":true}`
- `{"agenziaId":1,"commercialeId":1,"stato":1,"archiviato":1}` — `{"background":true}`
- `{"agenziaId":1,"legacyRef.model":1,"legacyRef.id":1}` — `{"unique":true,"partialFilterExpression":{"legacyRef.id":{"$type":"objectId"}},"background":true}`

### MetaAdsServiceV3

Stato operativo, campagne e creatività Meta Ads.

Collezione: `metaadsservicev3`.

| Campo | Tipo | Obbligatorio | Default | Enum / vincoli | Ref |
| --- | --- | --- | --- | --- | --- |
| `collaborazioneId` | ObjectId | sì | — | — | CollaborazioneV3 |
| `agenziaId` | ObjectId | sì | — | — | AgenziaV3 |
| `aziendaId` | ObjectId | sì | — | — | AziendaV3 |
| `businessManagerId` | String | no | "" | — | — |
| `adAccountId` | String | no | "" | — | — |
| `pixelId` | String | no | "" | — | — |
| `budgetMensile` | Number | no | `0` | — | — |
| `obiettivo` | String | no | "" | — | — |
| `campagne` | Array<Subdocument> | no | — | — | — |
| `campagne[].nome` | String | sì | — | — | — |
| `campagne[].tipo` | String | no | "" | — | — |
| `campagne[].budget` | Number | no | `0` | — | — |
| `campagne[].stato` | String | no | `bozza` | enum: "bozza", "attiva", "in pausa", "terminata" | — |
| `campagne[].dataAvvio` | Date | no | null | — | — |
| `campagne[].dataFine` | Date | no | null | — | — |
| `campagne[].kpi` | Subdocument | no | — | — | — |
| `campagne[].kpi.impressions` | Number | no | `0` | — | — |
| `campagne[].kpi.click` | Number | no | `0` | — | — |
| `campagne[].kpi.costo` | Number | no | `0` | — | — |
| `campagne[].kpi.conversioni` | Number | no | `0` | — | — |
| `campagne[].kpi.cpa` | Number | no | `0` | — | — |
| `creativita` | Array<Subdocument> | no | — | — | — |
| `creativita[].titolo` | String | sì | — | — | — |
| `creativita[].formato` | String | no | "" | — | — |
| `creativita[].stato` | String | no | `bozza` | enum: "bozza", "approvata", "pubblicata", "archiviata" | — |
| `creativita[].fileAssetId` | ObjectId | no | null | — | FileAssetV3 |
| `statoOperativo` | String | no | `da_contattare` | enum: "da_contattare", "setup", "attiva", "in_pausa", "terminata" | — |
| `note` | String | no | "" | — | — |

Indici:

- `{"collaborazioneId":1}` — `{"unique":true,"background":true}`
- `{"agenziaId":1}` — `{"background":true}`
- `{"aziendaId":1}` — `{"background":true}`

### NotebookNoteV3

Nota storicizzata collegata ad azienda e, opzionalmente, collaborazione.

Collezione: `notebooknotev3`.

| Campo | Tipo | Obbligatorio | Default | Enum / vincoli | Ref |
| --- | --- | --- | --- | --- | --- |
| `agenziaId` | ObjectId | sì | — | — | AgenziaV3 |
| `aziendaId` | ObjectId | sì | — | — | AziendaV3 |
| `collaborazioneId` | ObjectId | no | null | — | CollaborazioneV3 |
| `autoreId` | ObjectId | sì | — | — | UserV3 |
| `visibilita` | String | no | `team` | enum: "interna", "cliente", "team" | — |
| `tipo` | String | no | `generale` | enum: "generale", "appuntamento", "problema", "decisione", "post_mancante", "follow_up" | — |
| `titolo` | String | no | "" | — | — |
| `contenuto` | String | sì | — | — | — |
| `dataAppuntamento` | Date | no | null | — | — |
| `statoProblema` | String | no | "" | enum: "", "aperto", "in_lavorazione", "risolto" | — |
| `feeling.emoji` | String | no | "" | — | — |
| `feeling.nota` | String | no | "" | — | — |
| `allegati` | Array<ObjectId> | no | — | — | FileAssetV3 |
| `mentions` | Array<ObjectId> | no | — | — | UserV3 |

Indici:

- `{"agenziaId":1}` — `{"background":true}`
- `{"aziendaId":1}` — `{"background":true}`
- `{"collaborazioneId":1}` — `{"background":true}`
- `{"visibilita":1}` — `{"background":true}`
- `{"tipo":1}` — `{"background":true}`
- `{"agenziaId":1,"aziendaId":1,"createdAt":-1}` — `{"background":true}`
- `{"collaborazioneId":1,"tipo":1,"createdAt":-1}` — `{"background":true}`

### NotificationDeliveryV3

Tentativo di consegna multicanale deduplicato.

Collezione: `notificationdeliveryv3`.

| Campo | Tipo | Obbligatorio | Default | Enum / vincoli | Ref |
| --- | --- | --- | --- | --- | --- |
| `agenziaId` | ObjectId | sì | — | — | AgenziaV3 |
| `notificaId` | ObjectId | no | null | — | NotificaV3 |
| `destinatarioId` | ObjectId | sì | — | — | UserV3 |
| `channel` | String | sì | — | enum: "in_app", "email", "whatsapp" | — |
| `target` | String | sì | — | — | — |
| `subject` | String | no | "" | — | — |
| `message` | String | sì | — | — | — |
| `link` | String | no | "" | — | — |
| `status` | String | no | `pending` | enum: "pending", "sent", "delivered", "failed", "skipped" | — |
| `attempts` | Number | no | `0` | min: 0 | — |
| `lastError` | String | no | "" | — | — |
| `sentAt` | Date | no | null | — | — |
| `deliveredAt` | Date | no | null | — | — |
| `dedupeKey` | String | sì | — | — | — |
| `legacyRef.model` | String | no | "" | enum: "NotificationDelivery", "" | — |
| `legacyRef.id` | ObjectId | no | null | — | — |

Indici:

- `{"agenziaId":1}` — `{"background":true}`
- `{"notificaId":1}` — `{"background":true}`
- `{"destinatarioId":1}` — `{"background":true}`
- `{"status":1}` — `{"background":true}`
- `{"agenziaId":1,"dedupeKey":1}` — `{"unique":true,"background":true}`

### NotificaV3

Notifica in-app indirizzata a un utente o broadcast di agenzia.

Collezione: `notificav3`.

| Campo | Tipo | Obbligatorio | Default | Enum / vincoli | Ref |
| --- | --- | --- | --- | --- | --- |
| `agenziaId` | ObjectId | sì | — | — | AgenziaV3 |
| `destinatarioId` | ObjectId | no | null | — | UserV3 |
| `tipo` | String | sì | — | enum: "nota_problema", "dominio_scadenza", "fine_mese", "evento_disponibilita", "shooting_disponibilita", "seo_assegnazione", "sistema" | — |
| `titolo` | String | sì | — | — | — |
| `messaggio` | String | sì | — | — | — |
| `link` | String | no | "" | — | — |
| `lettaAt` | Date | no | null | — | — |
| `entity.type` | String | no | "" | — | — |
| `entity.id` | ObjectId | no | null | — | — |
| `dedupeKey` | String | no | "" | — | — |
| `legacyRef.model` | String | no | "" | enum: "Notifica", "" | — |
| `legacyRef.id` | ObjectId | no | null | — | — |

Indici:

- `{"agenziaId":1}` — `{"background":true}`
- `{"destinatarioId":1}` — `{"background":true}`
- `{"tipo":1}` — `{"background":true}`
- `{"lettaAt":1}` — `{"background":true}`
- `{"agenziaId":1,"destinatarioId":1,"lettaAt":1,"createdAt":-1}` — `{"background":true}`
- `{"agenziaId":1,"destinatarioId":1,"dedupeKey":1}` — `{"unique":true,"partialFilterExpression":{"dedupeKey":{"$type":"string","$gt":""}},"background":true}`

### PagamentoV3

Movimento economico di entrata o uscita.

Collezione: `pagamentov3`.

| Campo | Tipo | Obbligatorio | Default | Enum / vincoli | Ref |
| --- | --- | --- | --- | --- | --- |
| `agenziaId` | ObjectId | sì | — | — | AgenziaV3 |
| `aziendaId` | ObjectId | no | null | — | AziendaV3 |
| `collaborazioneId` | ObjectId | no | null | — | CollaborazioneV3 |
| `assegnazioneId` | ObjectId | no | null | — | CollaborazioneAssegnazioneV3 |
| `tipo` | String | sì | — | enum: "entrata", "uscita" | — |
| `importo` | Number | no | null | min: 0 | — |
| `valuta` | String | no | `EUR` | enum: "EUR" | — |
| `importoConfermato` | Boolean | no | `true` | — | — |
| `stato_pagamento` | String | no | `non_pagato` | enum: "pagato", "non_pagato", "ragazzi" | — |
| `servizio` | String | no | "" | — | — |
| `numeroDocumento` | String | no | "" | — | — |
| `dataCompetenzaDa` | Date | no | null | — | — |
| `dataCompetenzaA` | Date | no | null | — | — |
| `data_pagamento` | Date | no | null | — | — |
| `scadenzaPagamento` | Date | no | null | — | — |
| `mese` | Number | no | null | min: 1; max: 12 | — |
| `anno` | Number | no | null | — | — |
| `metodoPagamento` | String | no | "" | — | — |
| `note` | String | no | "" | — | — |
| `allegati` | Array<ObjectId> | no | — | — | FileAssetV3 |
| `legacyRef.model` | String | no | "" | enum: "Pagamenti", "PagamentoNuovo", "" | — |
| `legacyRef.id` | ObjectId | no | null | — | — |
| `createdBy` | ObjectId | no | null | — | UserV3 |
| `updatedBy` | ObjectId | no | null | — | UserV3 |

Indici:

- `{"agenziaId":1}` — `{"background":true}`
- `{"aziendaId":1}` — `{"background":true}`
- `{"collaborazioneId":1}` — `{"background":true}`
- `{"tipo":1}` — `{"background":true}`
- `{"stato_pagamento":1}` — `{"background":true}`
- `{"agenziaId":1,"tipo":1,"anno":1,"mese":1}` — `{"background":true}`
- `{"agenziaId":1,"legacyRef.model":1,"legacyRef.id":1}` — `{"unique":true,"partialFilterExpression":{"legacyRef.id":{"$type":"objectId"}},"background":true}`

### ResetLogV3

Registro immutabile dei reset e relativi snapshot.

Collezione: `resetlogv3`.

| Campo | Tipo | Obbligatorio | Default | Enum / vincoli | Ref |
| --- | --- | --- | --- | --- | --- |
| `agenziaId` | ObjectId | sì | — | — | AgenziaV3 |
| `tipo` | String | sì | — | enum: "mensile", "trimestrale", "valutazione" | — |
| `periodo.anno` | Number | sì | — | — | — |
| `periodo.mese` | Number | no | null | min: 1; max: 12 | — |
| `periodo.trimestre` | Number | no | null | min: 1; max: 4 | — |
| `periodo.dataInizio` | Date | no | null | — | — |
| `periodo.dataFine` | Date | no | null | — | — |
| `target.collaborazioneIds` | Array<ObjectId> | no | — | — | CollaborazioneV3 |
| `target.collaboratoreIds` | Array<ObjectId> | no | — | — | UserV3 |
| `snapshotPrima` | Mixed | no | funzione | — | — |
| `snapshotDopo` | Mixed | no | funzione | — | — |
| `eseguitoDa` | ObjectId | sì | — | — | UserV3 |
| `eseguitoAt` | Date | no | Date.now | — | — |
| `note` | String | no | "" | — | — |

Indici:

- `{"agenziaId":1}` — `{"background":true}`

### SeoServiceV3

Audit, keyword, pagine, task e report SEO.

Collezione: `seoservicev3`.

| Campo | Tipo | Obbligatorio | Default | Enum / vincoli | Ref |
| --- | --- | --- | --- | --- | --- |
| `collaborazioneId` | ObjectId | sì | — | — | CollaborazioneV3 |
| `agenziaId` | ObjectId | sì | — | — | AgenziaV3 |
| `aziendaId` | ObjectId | sì | — | — | AziendaV3 |
| `audit.dataAudit` | Date | no | null | — | — |
| `audit.stato` | String | no | `non_avviato` | enum: "non_avviato", "in_corso", "completato" | — |
| `audit.fileUrl` | String | no | "" | — | — |
| `keyword` | Array<Subdocument> | no | — | — | — |
| `keyword[].parola` | String | sì | — | — | — |
| `keyword[].intento` | String | no | "" | — | — |
| `keyword[].priorita` | String | no | `media` | enum: "bassa", "media", "alta" | — |
| `keyword[].volumeStimato` | Number | no | null | — | — |
| `keyword[].posizioneIniziale` | Number | no | null | — | — |
| `keyword[].posizioneAttuale` | Number | no | null | — | — |
| `pagineOttimizzate` | Array<Subdocument> | no | — | — | — |
| `pagineOttimizzate[].url` | String | sì | — | — | — |
| `pagineOttimizzate[].keywordPrincipale` | String | no | "" | — | — |
| `pagineOttimizzate[].stato` | String | no | `da_fare` | enum: "da_fare", "in_corso", "completata" | — |
| `pagineOttimizzate[].dataOttimizzazione` | Date | no | null | — | — |
| `taskMensili` | Array<Subdocument> | no | — | — | — |
| `taskMensili[].codice` | String | no | "" | — | — |
| `taskMensili[].titolo` | String | sì | — | — | — |
| `taskMensili[].descrizione` | String | no | "" | — | — |
| `taskMensili[].stato` | String | no | `da_fare` | enum: "da_fare", "in_corso", "in_attesa", "bloccato", "completato", "non_applicabile" | — |
| `taskMensili[].dataPrevista` | Date | no | null | — | — |
| `taskMensili[].dataCompletamento` | Date | no | null | — | — |
| `taskMensili[].giorno` | String | no | "" | — | — |
| `taskMensili[].giornoLavorativo` | Number | no | null | — | — |
| `taskMensili[].criticita` | String | no | `regolare` | enum: "regolare", "attenzione", "critico" | — |
| `taskMensili[].motivoRitardo` | String | no | "" | enum: "", "ritardo_interno", "attesa_cliente", "mancanza_contenuti", "attesa_approvazione", "problema_tecnico", "altro" | — |
| `taskMensili[].tipoControllo` | String | no | "" | enum: "", "obbligatorio", "condizionale", "non_applicabile" | — |
| `taskMensili[].faseCollegata` | String | no | "" | enum: "", "struttura", "stile", "design", "consegna", "pubblicazione" | — |
| `taskMensili[].appuntamentoTipo` | String | no | "" | enum: "", "fisico", "online" | — |
| `taskMensili[].confermaGruppo` | Boolean | no | `false` | — | — |
| `taskMensili[].note` | String | no | "" | — | — |
| `taskMensili[].assegnatoA` | Array<ObjectId> | no | — | — | UserV3 |
| `reportMensili` | Array<Subdocument> | no | — | — | — |
| `reportMensili[].mese` | Number | sì | — | min: 1; max: 12 | — |
| `reportMensili[].anno` | Number | sì | — | — | — |
| `reportMensili[].fileUrl` | String | no | "" | — | — |
| `reportMensili[].note` | String | no | "" | — | — |

Indici:

- `{"collaborazioneId":1}` — `{"unique":true,"background":true}`
- `{"agenziaId":1}` — `{"background":true}`
- `{"aziendaId":1}` — `{"background":true}`

### SmmServiceV3

Configurazione e contatori del servizio social media.

Collezione: `smmservicev3`.

| Campo | Tipo | Obbligatorio | Default | Enum / vincoli | Ref |
| --- | --- | --- | --- | --- | --- |
| `collaborazioneId` | ObjectId | sì | — | — | CollaborazioneV3 |
| `agenziaId` | ObjectId | sì | — | — | AgenziaV3 |
| `aziendaId` | ObjectId | sì | — | — | AziendaV3 |
| `piattaforme` | Array<String> | no | `[]` | enum: "instagram", "facebook", "tiktok", "linkedin" | — |
| `pianoEditoriale.postIgFbPrevistiMese` | Number | no | `0` | min: 0 | — |
| `pianoEditoriale.postTikTokPrevistiMese` | Number | no | `0` | min: 0 | — |
| `pianoEditoriale.postLinkedInPrevistiMese` | Number | no | `0` | min: 0 | — |
| `pianoEditoriale.postPrevistiMese` | Number | no | `0` | — | — |
| `pianoEditoriale.storiesPrevisteMese` | Number | no | `0` | — | — |
| `pianoEditoriale.reelPrevistiMese` | Number | no | `0` | — | — |
| `pianoEditoriale.appuntamentiPrevistiMese` | Number | no | `0` | — | — |
| `contatoriMensili.post_ig_fb_fatti` | Number | no | `0` | — | — |
| `contatoriMensili.post_tiktok_fatti` | Number | no | `0` | — | — |
| `contatoriMensili.post_linkedin_fatti` | Number | no | `0` | — | — |
| `contatoriMensili.appuntamenti_fatti` | Number | no | `0` | — | — |
| `totaliContratto.postFatti` | Number | no | `0` | min: 0 | — |
| `totaliContratto.postPrevisti` | Number | no | `0` | min: 0 | — |
| `totaliContratto.appuntamentiFatti` | Number | no | `0` | min: 0 | — |
| `totaliContratto.appuntamentiPrevisti` | Number | no | `0` | min: 0 | — |
| `contatoriTrimestrali.instagram_trim_fatti` | Number | no | `0` | — | — |
| `contatoriTrimestrali.instagram_trim_totali` | Number | no | `0` | — | — |
| `contatoriTrimestrali.tiktok_trim_fatti` | Number | no | `0` | — | — |
| `contatoriTrimestrali.tiktok_trim_totali` | Number | no | `0` | — | — |
| `contatoriTrimestrali.linkedin_trim_fatti` | Number | no | `0` | — | — |
| `contatoriTrimestrali.linkedin_trim_totali` | Number | no | `0` | — | — |
| `contatoriTrimestrali.appuntamenti_trimestrale_fatti` | Number | no | `0` | — | — |
| `contatoriTrimestrali.appuntamenti_trimestrale_totali` | Number | no | `0` | — | — |
| `valutazioneTrimestrale.fatti` | Number | no | `0` | min: 0 | — |
| `valutazioneTrimestrale.totali` | Number | no | `0` | min: 0 | — |
| `escludiResetTrimestrale` | Boolean | no | `false` | — | — |
| `storicoReset` | Array<ObjectId> | no | — | — | ResetLogV3 |

Indici:

- `{"collaborazioneId":1}` — `{"unique":true,"background":true}`
- `{"agenziaId":1}` — `{"background":true}`
- `{"aziendaId":1}` — `{"background":true}`

### TicketV3

Richiesta di assistenza collegata a un thread.

Collezione: `ticketv3`.

| Campo | Tipo | Obbligatorio | Default | Enum / vincoli | Ref |
| --- | --- | --- | --- | --- | --- |
| `agenziaId` | ObjectId | sì | — | — | AgenziaV3 |
| `aziendaId` | ObjectId | sì | — | — | AziendaV3 |
| `collaborazioneId` | ObjectId | no | null | — | CollaborazioneV3 |
| `apertoDa` | ObjectId | sì | — | — | UserV3 |
| `assegnatoA` | Array<ObjectId> | no | — | — | UserV3 |
| `titolo` | String | sì | — | — | — |
| `descrizione` | String | no | "" | — | — |
| `categoria` | String | no | `assistenza` | enum: "assistenza", "bug", "contenuti", "dominio", "pagamento", "altro" | — |
| `priorita` | String | no | `media` | enum: "bassa", "media", "alta", "urgente" | — |
| `stato` | String | no | `aperto` | enum: "aperto", "in_lavorazione", "in_attesa_cliente", "risolto", "chiuso" | — |
| `threadId` | ObjectId | no | null | — | ChatThreadV3 |
| `closedAt` | Date | no | null | — | — |

Indici:

- `{"agenziaId":1}` — `{"background":true}`
- `{"aziendaId":1}` — `{"background":true}`
- `{"collaborazioneId":1}` — `{"background":true}`
- `{"stato":1}` — `{"background":true}`
- `{"threadId":1}` — `{"background":true}`
- `{"agenziaId":1,"stato":1,"priorita":1}` — `{"background":true}`

### UserV3

Identità autenticabile per amministrazione, collaboratori e utenti cliente.

Collezione: `userv3`.

| Campo | Tipo | Obbligatorio | Default | Enum / vincoli | Ref |
| --- | --- | --- | --- | --- | --- |
| `agenziaId` | ObjectId | sì | — | — | AgenziaV3 |
| `aziendaIds` | Array<ObjectId> | no | `[]` | — | AziendaV3 |
| `tipo` | String | sì | — | enum: "agenzia", "amministrazione", "segretaria", "collaboratore", "azienda" | — |
| `nome` | String | sì | — | trim | — |
| `cognome` | String | no | "" | trim | — |
| `displayName` | String | no | "" | trim | — |
| `email` | String | sì | — | trim; lowercase | — |
| `telefono` | String | no | "" | trim | — |
| `passwordHash` | String | sì | — | select: false | — |
| `avatarUrl` | String | no | "" | — | — |
| `stato` | String | no | `attivo` | enum: "attivo", "sospeso", "disattivato" | — |
| `subRoles` | Array<String> | no | `[]` | enum: "smm", "web_designer", "seo", "google_ads", "meta_ads", "commerciale", "fotografo", "videomaker" | — |
| `permissions` | Array<String> | no | `[]` | enum: "agency.manage", "users.manage", "admins.delete", "companies.manage", "collaborations.manage", "collaborations.assign", "collaborations.export", "collaborations.reset_monthly", "collaborations.reset_quarterly", "evaluations.manage", "payments.manage", "invoices.manage", "domains.manage", "credentials.view", "credentials.manage", "tickets.manage", "chat.use", "knowledge.manage", "operations.use", "notifications.manage" | — |
| `ultimoAccessoAt` | Date | no | null | — | — |
| `preferenze.sidebarCollapsed` | Boolean | no | `false` | — | — |
| `preferenze.dashboardDefaultView` | String | no | `dashboard` | — | — |
| `preferenze.notificheEmail` | Boolean | no | `true` | — | — |
| `preferenze.notificheInApp` | Boolean | no | `true` | — | — |
| `sicurezza.mustChangePassword` | Boolean | no | `false` | — | — |
| `sicurezza.passwordUpdatedAt` | Date | no | null | — | — |
| `sicurezza.twoFactorEnabled` | Boolean | no | `false` | — | — |
| `createdBy` | ObjectId | no | null | — | UserV3 |
| `updatedBy` | ObjectId | no | null | — | UserV3 |

Indici:

- `{"agenziaId":1}` — `{"background":true}`
- `{"tipo":1}` — `{"background":true}`
- `{"stato":1}` — `{"background":true}`
- `{"agenziaId":1,"email":1}` — `{"unique":true,"background":true}`
- `{"agenziaId":1,"tipo":1,"stato":1}` — `{"background":true}`
- `{"agenziaId":1,"aziendaIds":1,"stato":1}` — `{"background":true}`

### ValutazioneCollaboratoreV3

Valutazione periodica del collaboratore.

Collezione: `valutazionecollaboratorev3`.

| Campo | Tipo | Obbligatorio | Default | Enum / vincoli | Ref |
| --- | --- | --- | --- | --- | --- |
| `agenziaId` | ObjectId | sì | — | — | AgenziaV3 |
| `collaboratoreId` | ObjectId | sì | — | — | UserV3 |
| `periodo.tipo` | String | sì | — | enum: "mensile", "trimestrale" | — |
| `periodo.anno` | Number | sì | — | — | — |
| `periodo.trimestre` | Number | no | null | min: 1; max: 4 | — |
| `periodo.mese` | Number | no | null | min: 1; max: 12 | — |
| `periodo.dataInizio` | Date | sì | — | — | — |
| `periodo.dataFine` | Date | sì | — | — | — |
| `ruoloValutato` | String | sì | — | enum: "smm", "web_designer", "seo", "google_ads", "meta_ads", "commerciale", "fotografo", "videomaker" | — |
| `valutatoreId` | ObjectId | sì | — | — | UserV3 |
| `metriche.puntualita` | Number | no | null | min: 1; max: 5 | — |
| `metriche.qualita` | Number | no | null | min: 1; max: 5 | — |
| `metriche.comunicazione` | Number | no | null | min: 1; max: 5 | — |
| `metriche.autonomia` | Number | no | null | min: 1; max: 5 | — |
| `metriche.rispettoObiettivi` | Number | no | null | min: 1; max: 5 | — |
| `kpi.previsti` | Number | no | `0` | — | — |
| `kpi.completati` | Number | no | `0` | — | — |
| `kpi.percentualeCompletamento` | Number | no | `0` | — | — |
| `note` | String | no | "" | — | — |
| `esito` | String | no | `buono` | enum: "ottimo", "buono", "sufficiente", "critico" | — |
| `azioniRichieste` | String | no | "" | — | — |

Indici:

- `{"agenziaId":1}` — `{"background":true}`
- `{"collaboratoreId":1}` — `{"background":true}`
- `{"agenziaId":1,"collaboratoreId":1,"periodo.tipo":1,"periodo.anno":1,"periodo.trimestre":1,"periodo.mese":1,"ruoloValutato":1}` — `{"unique":true,"background":true}`

### WebDesignServiceV3

Workflow completo del progetto web design.

Collezione: `webdesignservicev3`.

| Campo | Tipo | Obbligatorio | Default | Enum / vincoli | Ref |
| --- | --- | --- | --- | --- | --- |
| `collaborazioneId` | ObjectId | sì | — | — | CollaborazioneV3 |
| `agenziaId` | ObjectId | sì | — | — | AgenziaV3 |
| `aziendaId` | ObjectId | sì | — | — | AziendaV3 |
| `tipoProgetto` | String | sì | — | enum: "starter", "vetrina", "e-commerce", "custom" | — |
| `workflowVersion` | String | no | "" | — | — |
| `workflowTimezone` | String | no | `Europe/Rome` | — | — |
| `dataAvvioOperativo` | Date | no | null | — | — |
| `intervistaRicevutaAt` | Date | no | null | — | — |
| `fasi` | Array<Subdocument> | no | — | — | — |
| `fasi[].nome` | String | sì | — | enum: "struttura", "stile", "design", "consegna" | — |
| `fasi[].giornoInizio` | Number | no | null | — | — |
| `fasi[].giornoFine` | Number | no | null | — | — |
| `fasi[].dataInizioPrevista` | Date | no | null | — | — |
| `fasi[].dataFinePrevista` | Date | no | null | — | — |
| `fasi[].controlloTipo` | String | no | "" | — | — |
| `fasi[].stato` | String | no | `da_fare` | enum: "da_fare", "in_corso", "in_attesa", "completato", "non_applicabile" | — |
| `fasi[].criticita` | String | no | `regolare` | enum: "regolare", "attenzione", "critico" | — |
| `fasi[].tasks` | Array<Subdocument> | no | — | — | — |
| `fasi[].tasks[].codice` | String | no | "" | — | — |
| `fasi[].tasks[].titolo` | String | sì | — | — | — |
| `fasi[].tasks[].descrizione` | String | no | "" | — | — |
| `fasi[].tasks[].stato` | String | no | `da_fare` | enum: "da_fare", "in_corso", "in_attesa", "bloccato", "completato", "non_applicabile" | — |
| `fasi[].tasks[].dataPrevista` | Date | no | null | — | — |
| `fasi[].tasks[].dataCompletamento` | Date | no | null | — | — |
| `fasi[].tasks[].giorno` | String | no | "" | — | — |
| `fasi[].tasks[].giornoLavorativo` | Number | no | null | — | — |
| `fasi[].tasks[].criticita` | String | no | `regolare` | enum: "regolare", "attenzione", "critico" | — |
| `fasi[].tasks[].motivoRitardo` | String | no | "" | enum: "", "ritardo_interno", "attesa_cliente", "mancanza_contenuti", "attesa_approvazione", "problema_tecnico", "altro" | — |
| `fasi[].tasks[].tipoControllo` | String | no | "" | enum: "", "obbligatorio", "condizionale", "non_applicabile" | — |
| `fasi[].tasks[].faseCollegata` | String | no | "" | enum: "", "struttura", "stile", "design", "consegna", "pubblicazione" | — |
| `fasi[].tasks[].appuntamentoTipo` | String | no | "" | enum: "", "fisico", "online" | — |
| `fasi[].tasks[].confermaGruppo` | Boolean | no | `false` | — | — |
| `fasi[].tasks[].note` | String | no | "" | — | — |
| `fasi[].tasks[].assegnatoA` | Array<ObjectId> | no | — | — | UserV3 |
| `fasi[].note` | String | no | "" | — | — |
| `controlli` | Array<Subdocument> | no | — | — | — |
| `controlli[].nome` | String | sì | — | — | — |
| `controlli[].tasks` | Array<Subdocument> | no | — | — | — |
| `controlli[].tasks[].codice` | String | no | "" | — | — |
| `controlli[].tasks[].titolo` | String | sì | — | — | — |
| `controlli[].tasks[].descrizione` | String | no | "" | — | — |
| `controlli[].tasks[].stato` | String | no | `da_fare` | enum: "da_fare", "in_corso", "in_attesa", "bloccato", "completato", "non_applicabile" | — |
| `controlli[].tasks[].dataPrevista` | Date | no | null | — | — |
| `controlli[].tasks[].dataCompletamento` | Date | no | null | — | — |
| `controlli[].tasks[].giorno` | String | no | "" | — | — |
| `controlli[].tasks[].giornoLavorativo` | Number | no | null | — | — |
| `controlli[].tasks[].criticita` | String | no | `regolare` | enum: "regolare", "attenzione", "critico" | — |
| `controlli[].tasks[].motivoRitardo` | String | no | "" | enum: "", "ritardo_interno", "attesa_cliente", "mancanza_contenuti", "attesa_approvazione", "problema_tecnico", "altro" | — |
| `controlli[].tasks[].tipoControllo` | String | no | "" | enum: "", "obbligatorio", "condizionale", "non_applicabile" | — |
| `controlli[].tasks[].faseCollegata` | String | no | "" | enum: "", "struttura", "stile", "design", "consegna", "pubblicazione" | — |
| `controlli[].tasks[].appuntamentoTipo` | String | no | "" | enum: "", "fisico", "online" | — |
| `controlli[].tasks[].confermaGruppo` | Boolean | no | `false` | — | — |
| `controlli[].tasks[].note` | String | no | "" | — | — |
| `controlli[].tasks[].assegnatoA` | Array<ObjectId> | no | — | — | UserV3 |
| `controlli[].note` | String | no | "" | — | — |
| `fasiControllo` | Array<Subdocument> | no | — | — | — |
| `fasiControllo[].tipo` | String | sì | — | — | — |
| `fasiControllo[].giornoPrevisto` | Number | no | null | — | — |
| `fasiControllo[].dataPrevista` | Date | no | null | — | — |
| `fasiControllo[].dataEffettiva` | Date | no | null | — | — |
| `fasiControllo[].stato` | String | no | "" | enum: "", "da_fare", "in_corso", "completato", "ok", "attenzione", "critico", "non_applicabile" | — |
| `fasiControllo[].esito` | String | no | "" | enum: "", "superato", "non_superato", "con_riserva", "non_applicabile" | — |
| `fasiControllo[].note` | String | no | "" | — | — |
| `fasiControllo[].spuntiMiglioramento` | String | no | "" | — | — |
| `fasiControllo[].anomalie` | String | no | "" | — | — |
| `fasiControllo[].problemiBloccanti` | String | no | "" | — | — |
| `fasiControllo[].completata` | Boolean | no | `false` | — | — |
| `fasiControllo[].checkboxCompletamento` | Boolean | no | `false` | — | — |
| `fasiControllo[].condizionale` | Boolean | no | `false` | — | — |
| `fasiControllo[].eccezione.autorizzata` | Boolean | no | `false` | — | — |
| `fasiControllo[].eccezione.autorizzataDa` | String | no | "" | — | — |
| `fasiControllo[].eccezione.motivo` | String | no | "" | — | — |
| `fasiControllo[].eccezione.data` | Date | no | null | — | — |
| `checklistPubblicazione` | Array<Subdocument> | no | — | — | — |
| `checklistPubblicazione[].categoria` | String | sì | — | — | — |
| `checklistPubblicazione[].items` | Array<Subdocument> | no | — | — | — |
| `checklistPubblicazione[].items[].codice` | String | no | "" | — | — |
| `checklistPubblicazione[].items[].titolo` | String | sì | — | — | — |
| `checklistPubblicazione[].items[].descrizione` | String | no | "" | — | — |
| `checklistPubblicazione[].items[].stato` | String | no | `da_fare` | enum: "da_fare", "in_corso", "in_attesa", "bloccato", "completato", "non_applicabile" | — |
| `checklistPubblicazione[].items[].dataPrevista` | Date | no | null | — | — |
| `checklistPubblicazione[].items[].dataCompletamento` | Date | no | null | — | — |
| `checklistPubblicazione[].items[].giorno` | String | no | "" | — | — |
| `checklistPubblicazione[].items[].giornoLavorativo` | Number | no | null | — | — |
| `checklistPubblicazione[].items[].criticita` | String | no | `regolare` | enum: "regolare", "attenzione", "critico" | — |
| `checklistPubblicazione[].items[].motivoRitardo` | String | no | "" | enum: "", "ritardo_interno", "attesa_cliente", "mancanza_contenuti", "attesa_approvazione", "problema_tecnico", "altro" | — |
| `checklistPubblicazione[].items[].tipoControllo` | String | no | "" | enum: "", "obbligatorio", "condizionale", "non_applicabile" | — |
| `checklistPubblicazione[].items[].faseCollegata` | String | no | "" | enum: "", "struttura", "stile", "design", "consegna", "pubblicazione" | — |
| `checklistPubblicazione[].items[].appuntamentoTipo` | String | no | "" | enum: "", "fisico", "online" | — |
| `checklistPubblicazione[].items[].confermaGruppo` | Boolean | no | `false` | — | — |
| `checklistPubblicazione[].items[].note` | String | no | "" | — | — |
| `checklistPubblicazione[].items[].assegnatoA` | Array<ObjectId> | no | — | — | UserV3 |
| `checklistPubblicazione[].note` | String | no | "" | — | — |
| `appuntamenti` | Array<Subdocument> | no | — | — | — |
| `appuntamenti[].tipo` | String | sì | — | enum: "iniziale", "intermedio", "finale" | — |
| `appuntamenti[].obbligatorio` | Boolean | no | `false` | — | — |
| `appuntamenti[].stato` | String | no | `da_pianificare` | enum: "da_pianificare", "programmato", "effettuato", "saltato", "facoltativo" | — |
| `appuntamenti[].data` | Date | no | null | — | — |
| `appuntamenti[].modalita` | String | no | "" | enum: "", "presenza", "videocall", "telefono", "altro" | — |
| `appuntamenti[].esito` | String | no | "" | — | — |
| `appuntamenti[].note` | String | no | "" | — | — |
| `approvazioni` | Array<Subdocument> | no | — | — | — |
| `approvazioni[].tipo` | String | sì | — | enum: "struttura", "design", "consegna" | — |
| `approvazioni[].stato` | String | no | `da_richiedere` | enum: "da_richiedere", "richiesta", "approvata", "respinta", "non_applicabile" | — |
| `approvazioni[].modalita` | String | no | "" | enum: "", "asincrona", "presenza", "videocall", "altro" | — |
| `approvazioni[].data` | Date | no | null | — | — |
| `approvazioni[].approvatoDa` | String | no | "" | — | — |
| `approvazioni[].note` | String | no | "" | — | — |
| `modificheTimeline` | Array<Subdocument> | no | — | — | — |
| `modificheTimeline[].dataPrecedente` | Date | no | null | — | — |
| `modificheTimeline[].dataNuova` | Date | sì | — | — | — |
| `modificheTimeline[].dataFinePrecedente` | Date | no | null | — | — |
| `modificheTimeline[].dataFineNuova` | Date | sì | — | — | — |
| `modificheTimeline[].modificataIl` | Date | sì | — | — | — |
| `modificheTimeline[].modificataDaId` | ObjectId | no | null | — | UserV3 |
| `modificheTimeline[].modificataDaLegacyId` | String | no | "" | — | — |
| `modificheTimeline[].modificataDaNome` | String | no | "" | — | — |
| `modificheTimeline[].motivo` | String | no | "" | — | — |
| `interview` | Mixed | no | funzione | — | — |
| `interviewPrompt` | String | no | "" | — | — |
| `dominioId` | ObjectId | no | null | — | DominioV3 |
| `ambiente.cms` | String | no | `WordPress` | — | — |
| `ambiente.hosting` | String | no | "" | — | — |
| `ambiente.stagingUrl` | String | no | "" | — | — |
| `ambiente.produzioneUrl` | String | no | "" | — | — |
| `consegna.stato` | String | no | `non_consegnato` | enum: "non_consegnato", "pronta", "bloccata", "consegnato" | — |
| `consegna.dataPrevista` | Date | no | null | — | — |
| `consegna.dataEffettiva` | Date | no | null | — | — |
| `consegna.confermata` | Boolean | no | `false` | — | — |
| `consegna.note` | String | no | "" | — | — |
| `pubblicazione.stato` | String | no | `da_pianificare` | enum: "non_prevista", "da_pianificare", "programmata", "in_corso", "pubblicata", "bloccata" | — |
| `pubblicazione.dataPrevista` | Date | no | null | — | — |
| `pubblicazione.dataEffettiva` | Date | no | null | — | — |
| `pubblicazione.urlPubblico` | String | no | "" | — | — |
| `pubblicazione.note` | String | no | "" | — | — |
| `note` | String | no | "" | — | — |

Indici:

- `{"collaborazioneId":1}` — `{"unique":true,"background":true}`
- `{"agenziaId":1}` — `{"background":true}`
- `{"aziendaId":1}` — `{"background":true}`

