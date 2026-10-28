# Schema dati legacy completo

Generato dai modelli Mongoose in `models/*.js` il 2026-10-19. Descrive il contratto del codice sorgente, non un validator MongoDB: l'audit live ha confermato che le collezioni non hanno validator server-side e alcuni documenti storici divergono dai modelli.

Ogni documento ha `_id: ObjectId`; i timestamp sono elencati solo quando definiti manualmente, mentre l'opzione Mongoose `timestamps` aggiunge automaticamente `createdAt` e `updatedAt`.

## Entità (50)

### Amministratore

Collezione: `amministratores`.

| Campo | Tipo | Obbligatorio | Default | Enum / vincoli | Ref |
| --- | --- | --- | --- | --- | --- |
| `nome` | String | sì | — | — | — |
| `cognome` | String | no | — | — | — |
| `email` | String | sì | — | — | — |
| `password` | String | sì | — | — | — |
| `ruolo` | String | no | `amministratore` | enum: "amministratore", "segretaria", "hoon_lab" | — |

Indici:

- `{"email":1}` — `{"unique":true,"background":true}`

### AssegnazioneEvento

Collezione: `assegnazioneeventos`.

| Campo | Tipo | Obbligatorio | Default | Enum / vincoli | Ref |
| --- | --- | --- | --- | --- | --- |
| `evento` | ObjectId | sì | — | — | Evento |
| `collaboratore` | ObjectId | sì | — | — | Collaboratore |
| `dataLavoro` | Date | sì | — | — | — |
| `mansione` | String | sì | — | trim | — |
| `noteCollaboratore` | String | no | "" | — | — |
| `createdBy` | String | no | "" | — | — |
| `updatedBy` | String | no | "" | — | — |

Indici:

- `{"evento":1}` — `{"background":true}`
- `{"collaboratore":1}` — `{"background":true}`
- `{"dataLavoro":1}` — `{"background":true}`
- `{"evento":1,"dataLavoro":1,"collaboratore":1}` — `{"background":true}`

### AutomationRule

Collezione: `automationrules`.

| Campo | Tipo | Obbligatorio | Default | Enum / vincoli | Ref |
| --- | --- | --- | --- | --- | --- |
| `accountId` | ObjectId | sì | — | — | SocialAccount |
| `userId` | ObjectId | sì | — | — | User |
| `type` | String | sì | — | enum: "comment", "follow", "dm", "mention" | — |
| `name` | String | sì | — | — | — |
| `enabled` | Boolean | no | `true` | — | — |
| `trigger.keywords` | Array<String> | no | — | — | — |
| `trigger.matchType` | String | no | `any` | enum: "any", "all", "exact" | — |
| `trigger.caseSensitive` | Boolean | no | `false` | — | — |
| `action.type` | String | no | `send_dm` | enum: "reply_comment", "send_dm", "both" | — |
| `action.message` | String | sì | — | — | — |
| `action.variables` | Mixed | no | funzione | — | — |
| `welcomeMessage` | String | no | — | — | — |
| `delay` | Number | no | `0` | — | — |
| `stats.triggered` | Number | no | `0` | — | — |
| `stats.successful` | Number | no | `0` | — | — |
| `stats.failed` | Number | no | `0` | — | — |
| `stats.lastTriggered` | Date | no | — | — | — |
| `settings.maxPerDay` | Number | no | `100` | — | — |
| `settings.maxPerHour` | Number | no | `20` | — | — |
| `settings.excludeKeywords` | Array<String> | no | — | — | — |
| `settings.onlyVerified` | Boolean | no | `false` | — | — |

Indici:

- `{"accountId":1,"enabled":1}` — `{"background":true}`
- `{"userId":1}` — `{"background":true}`
- `{"type":1}` — `{"background":true}`

### Azienda

Collezione: `aziendas`.

| Campo | Tipo | Obbligatorio | Default | Enum / vincoli | Ref |
| --- | --- | --- | --- | --- | --- |
| `nome` | String | no | — | — | — |
| `cognome` | String | no | — | — | — |
| `email` | String | no | — | — | — |
| `password` | String | no | — | — | — |
| `partitaIva` | String | no | — | — | — |
| `ragioneSociale` | String | no | — | — | — |
| `etichetta` | String | no | — | — | — |
| `indirizzo` | String | no | — | — | — |
| `pagamento` | Boolean | no | `false` | — | — |
| `status` | String | sì | `attivo` | enum: "attivo", "non_attivo" | — |
| `livelloAccesso` | Number | no | `3` | — | — |

Indici:

- `{"email":1}` — `{"unique":true,"background":true}`

### Collaboratore

Collezione: `collaboratores`.

| Campo | Tipo | Obbligatorio | Default | Enum / vincoli | Ref |
| --- | --- | --- | --- | --- | --- |
| `nome` | String | sì | — | — | — |
| `cognome` | String | sì | — | — | — |
| `email` | String | sì | — | — | — |
| `telefono` | String | no | "" | trim | — |
| `password` | String | sì | — | — | — |
| `partitaIva` | String | sì | — | — | — |
| `subRoles` | Array<String> | sì | `[]` | enum: "commerciale", "smm", "web designer", "seo", "google ads", "meta ads", "fotografo", "videomaker" | — |
| `isAdmin` | Boolean | no | `false` | — | — |
| `status` | String | sì | `attivo` | enum: "attivo", "non_attivo" | — |
| `noteAmministratore` | String | no | "" | — | — |
| `percentuale_hoon` | Number | sì | `50` | enum: 50, 55, 60, 70 | — |
| `tot_fatturato` | Number | no | `0` | — | — |
| `guadagno_da_hoon` | Number | no | `0` | — | — |
| `totale_fatture_terzi` | Number | no | `0` | — | — |
| `livelloAccesso` | Number | no | `2` | — | — |

Indici:

- `{"email":1}` — `{"unique":true,"background":true}`

### Collaborazione

Collezione: `collaboraziones`.

| Campo | Tipo | Obbligatorio | Default | Enum / vincoli | Ref |
| --- | --- | --- | --- | --- | --- |
| `azienda` | ObjectId | sì | — | — | Azienda |
| `collaboratore` | ObjectId | sì | — | — | Collaboratore |
| `aziendaRagioneSociale` | String | sì | — | — | — |
| `collaboratoreNome` | String | sì | — | — | — |
| `collaboratoreCognome` | String | sì | — | — | — |
| `dataInizio` | Date | no | Date.now | — | — |
| `dataFine` | Date | no | null | — | — |
| `stato` | String | no | `attiva` | enum: "attiva", "terminata", "in sospeso" | — |
| `note` | String | no | "" | — | — |
| `numero_appuntamenti` | Number | no | — | — | — |
| `appuntamenti_fatti` | Number | no | `0` | — | — |
| `post_ig_fb` | Number | no | — | — | — |
| `post_tiktok` | Number | no | — | — | — |
| `post_linkedin` | Number | no | — | — | — |
| `post_ig_fb_fatti` | Number | no | `0` | — | — |
| `post_tiktok_fatti` | Number | no | `0` | — | — |
| `post_linkedin_fatti` | Number | no | `0` | — | — |
| `pagato` | String | no | `no` | enum: "si", "no" | — |
| `post_totali` | Number | no | `0` | — | — |
| `appuntamenti_totali` | Number | no | `0` | — | — |
| `post_totali_previsti` | Number | no | `0` | — | — |
| `appuntamenti_totali_previsti` | Number | no | `0` | — | — |
| `durata_contratto` | String | no | null | enum: "1 mese", "3 mesi", "6 mesi", "1 anno" | — |
| `data_inizio_contratto` | Date | no | null | — | — |
| `data_fine_contratto` | Date | no | null | — | — |
| `valutazione_trimestrale_fatti` | Number | no | `0` | — | — |
| `valutazione_trimestrale_totali` | Number | no | `0` | — | — |
| `instagram_trim_fatti` | Number | no | `0` | — | — |
| `instagram_trim_totali` | Number | no | `0` | — | — |
| `tiktok_trim_fatti` | Number | no | `0` | — | — |
| `tiktok_trim_totali` | Number | no | `0` | — | — |
| `linkedin_trim_fatti` | Number | no | `0` | — | — |
| `linkedin_trim_totali` | Number | no | `0` | — | — |
| `appuntamenti_trimestrale_fatti` | Number | no | `0` | — | — |
| `appuntamenti_trimestrale_totali` | Number | no | `0` | — | — |
| `escludi_reset_trimestrale` | Boolean | no | `false` | — | — |

Indici:

- Solo indice MongoDB predefinito su `_id`.

### CollaborazioneSeo

Collezione: `collaborazioneseos`.

| Campo | Tipo | Obbligatorio | Default | Enum / vincoli | Ref |
| --- | --- | --- | --- | --- | --- |
| `sourceType` | String | sì | — | enum: "webdesign", "webdesign-v2" | — |
| `sourceId` | ObjectId | sì | — | — | — |
| `cliente` | ObjectId | sì | — | — | Azienda |
| `webDesigner` | ObjectId | sì | — | — | Collaboratore |
| `seo` | ObjectId | sì | — | — | Collaboratore |
| `aziendaRagioneSociale` | String | sì | — | — | — |
| `checklist` | Array<Subdocument> | no | `[]` | — | — |
| `checklist[].key` | String | sì | — | — | — |
| `checklist[].label` | String | sì | — | — | — |
| `checklist[].completata` | Boolean | no | `false` | — | — |
| `checklist[].note` | String | no | "" | — | — |
| `archiviata` | Boolean | no | `false` | — | — |
| `archiviataAt` | Date | no | null | — | — |

Indici:

- `{"seo":1}` — `{"background":true}`
- `{"archiviata":1}` — `{"background":true}`
- `{"sourceType":1,"sourceId":1}` — `{"unique":true,"background":true}`

### CollaborazioneWebDesign

Collezione: `collaborazionewebdesigns`.

| Campo | Tipo | Obbligatorio | Default | Enum / vincoli | Ref |
| --- | --- | --- | --- | --- | --- |
| `tipoProgetto` | String | sì | — | enum: "e-commerce", "sito vetrina", "sito starter" | — |
| `cliente` | ObjectId | sì | — | — | Azienda |
| `webDesigner` | ObjectId | sì | — | — | Collaboratore |
| `aziendaRagioneSociale` | String | sì | — | — | — |
| `collaboratoreNome` | String | sì | — | — | — |
| `collaboratoreCognome` | String | sì | — | — | — |
| `tasks` | Array<Subdocument> | no | — | — | — |
| `tasks[].nome` | String | sì | — | — | — |
| `tasks[].dataInizio` | Date | no | null | — | — |
| `tasks[].dataFine` | Date | no | null | — | — |
| `tasks[].tempistica` | String | sì | — | — | — |
| `tasks[].completata` | Boolean | no | `false` | — | — |
| `note` | String | no | "" | — | — |
| `problemi` | String | no | "" | — | — |
| `stato` | String | no | `in corso` | enum: "in corso", "in pausa", "terminata" | — |
| `dataInizioContratto` | Date | sì | — | — | — |
| `dataFineContratto` | Date | sì | — | — | — |
| `dominio.dataAcquisto` | Date | no | null | — | — |
| `dominio.dataScadenza` | Date | no | null | — | — |
| `dominio.urlDominio` | String | no | "" | — | — |
| `dominio.alertInviato` | Boolean | no | `false` | — | — |
| `dominio.novaAlertData` | Date | no | null | — | — |

Indici:

- Solo indice MongoDB predefinito su `_id`.

### CollaborazioneWebDesignV2

Collezione: `collaborazionewebdesignv2`.

| Campo | Tipo | Obbligatorio | Default | Enum / vincoli | Ref |
| --- | --- | --- | --- | --- | --- |
| `workflowVersion` | String | no | null | — | — |
| `workflowTimezone` | String | no | `Europe/Rome` | — | — |
| `dataAvvioOperativo` | Date | no | null | — | — |
| `intervistaRicevutaAt` | Date | no | null | — | — |
| `tipoProgetto` | String | sì | — | enum: "vetrina", "e-commerce" | — |
| `cliente` | ObjectId | sì | — | — | Azienda |
| `webDesigner` | ObjectId | sì | — | — | Collaboratore |
| `aziendaRagioneSociale` | String | sì | — | — | — |
| `collaboratoreNome` | String | sì | — | — | — |
| `collaboratoreCognome` | String | sì | — | — | — |
| `fasi` | Array<Subdocument> | no | — | — | — |
| `fasi[].nome` | String | sì | — | enum: "struttura", "stile", "design", "consegna" | — |
| `fasi[].giornoInizio` | Number | no | null | — | — |
| `fasi[].giornoFine` | Number | no | null | — | — |
| `fasi[].dataInizioPrevista` | Date | no | null | — | — |
| `fasi[].dataFinePrevista` | Date | no | null | — | — |
| `fasi[].controlloTipo` | String | no | "" | — | — |
| `fasi[].stato` | String | no | `da fare` | enum: "da fare", "in corso", "in attesa", "completata", "non applicabile" | — |
| `fasi[].criticita` | String | no | `regolare` | enum: "regolare", "attenzione", "critico" | — |
| `fasi[].tasks` | Array<Subdocument> | no | — | — | — |
| `fasi[].tasks[].codice` | String | no | "" | — | — |
| `fasi[].tasks[].giorno` | String | no | "" | — | — |
| `fasi[].tasks[].giornoLavorativo` | Number | no | null | — | — |
| `fasi[].tasks[].nome` | String | sì | — | — | — |
| `fasi[].tasks[].descrizione` | String | no | "" | — | — |
| `fasi[].tasks[].stato` | String | no | `da fare` | enum: "da fare", "in corso", "in attesa", "completata", "non applicabile" | — |
| `fasi[].tasks[].criticita` | String | no | `regolare` | enum: "regolare", "attenzione", "critico" | — |
| `fasi[].tasks[].motivoRitardo` | String | no | "" | enum: "", "ritardo interno", "attesa cliente", "mancanza contenuti", "attesa approvazione", "problema tecnico", "altro" | — |
| `fasi[].tasks[].tipoControllo` | String | no | "" | enum: "", "obbligatorio", "condizionale", "non applicabile" | — |
| `fasi[].tasks[].faseCollegata` | String | no | "" | enum: "", "struttura", "design", "consegna", "pubblicazione" | — |
| `fasi[].tasks[].completata` | Boolean | no | `false` | — | — |
| `fasi[].tasks[].note` | String | no | "" | — | — |
| `fasi[].tasks[].appuntamentoTipo` | String | no | "" | enum: "", "fisico", "online" | — |
| `fasi[].tasks[].confermaGruppo` | Boolean | no | `false` | — | — |
| `fasi[].note` | String | no | "" | — | — |
| `controlli` | Array<Subdocument> | no | — | — | — |
| `controlli[].nome` | String | sì | — | — | — |
| `controlli[].tasks` | Array<Subdocument> | no | — | — | — |
| `controlli[].tasks[].codice` | String | no | "" | — | — |
| `controlli[].tasks[].giorno` | String | no | "" | — | — |
| `controlli[].tasks[].giornoLavorativo` | Number | no | null | — | — |
| `controlli[].tasks[].nome` | String | sì | — | — | — |
| `controlli[].tasks[].descrizione` | String | no | "" | — | — |
| `controlli[].tasks[].stato` | String | no | `da fare` | enum: "da fare", "in corso", "in attesa", "completata", "non applicabile" | — |
| `controlli[].tasks[].criticita` | String | no | `regolare` | enum: "regolare", "attenzione", "critico" | — |
| `controlli[].tasks[].motivoRitardo` | String | no | "" | enum: "", "ritardo interno", "attesa cliente", "mancanza contenuti", "attesa approvazione", "problema tecnico", "altro" | — |
| `controlli[].tasks[].tipoControllo` | String | no | "" | enum: "", "obbligatorio", "condizionale", "non applicabile" | — |
| `controlli[].tasks[].faseCollegata` | String | no | "" | enum: "", "struttura", "design", "consegna", "pubblicazione" | — |
| `controlli[].tasks[].completata` | Boolean | no | `false` | — | — |
| `controlli[].tasks[].note` | String | no | "" | — | — |
| `controlli[].tasks[].appuntamentoTipo` | String | no | "" | enum: "", "fisico", "online" | — |
| `controlli[].tasks[].confermaGruppo` | Boolean | no | `false` | — | — |
| `controlli[].note` | String | no | "" | — | — |
| `fasiControllo` | Array<Subdocument> | no | — | — | — |
| `fasiControllo[].tipo` | String | sì | — | — | — |
| `fasiControllo[].giornoPrevisto` | Number | no | null | — | — |
| `fasiControllo[].dataPrevista` | Date | no | null | — | — |
| `fasiControllo[].data` | Date | no | null | — | — |
| `fasiControllo[].stato` | String | no | "" | enum: "", "da fare", "in corso", "completato", "ok", "attenzione", "critico", "non applicabile" | — |
| `fasiControllo[].esito` | String | no | "" | enum: "", "superato", "non superato", "con riserva", "non applicabile" | — |
| `fasiControllo[].note` | String | no | "" | — | — |
| `fasiControllo[].spuntiMiglioramento` | String | no | "" | — | — |
| `fasiControllo[].anomalie` | String | no | "" | — | — |
| `fasiControllo[].problemiBloccanti` | String | no | "" | — | — |
| `fasiControllo[].completata` | Boolean | no | `false` | — | — |
| `fasiControllo[].checkboxCompletamento` | Boolean | no | `false` | — | — |
| `fasiControllo[].condizionale` | Boolean | no | `false` | — | — |
| `fasiControllo[].eccezioneAutorizzata` | Boolean | no | `false` | — | — |
| `fasiControllo[].eccezioneAutorizzataDa` | String | no | "" | — | — |
| `fasiControllo[].eccezioneMotivo` | String | no | "" | — | — |
| `fasiControllo[].eccezioneData` | Date | no | null | — | — |
| `checklistPubblicazione` | Array<Subdocument> | no | — | — | — |
| `checklistPubblicazione[].categoria` | String | sì | — | — | — |
| `checklistPubblicazione[].items` | Array<Subdocument> | no | — | — | — |
| `checklistPubblicazione[].items[].codice` | String | no | "" | — | — |
| `checklistPubblicazione[].items[].giorno` | String | no | "" | — | — |
| `checklistPubblicazione[].items[].giornoLavorativo` | Number | no | null | — | — |
| `checklistPubblicazione[].items[].nome` | String | sì | — | — | — |
| `checklistPubblicazione[].items[].descrizione` | String | no | "" | — | — |
| `checklistPubblicazione[].items[].stato` | String | no | `da fare` | enum: "da fare", "in corso", "in attesa", "completata", "non applicabile" | — |
| `checklistPubblicazione[].items[].criticita` | String | no | `regolare` | enum: "regolare", "attenzione", "critico" | — |
| `checklistPubblicazione[].items[].motivoRitardo` | String | no | "" | enum: "", "ritardo interno", "attesa cliente", "mancanza contenuti", "attesa approvazione", "problema tecnico", "altro" | — |
| `checklistPubblicazione[].items[].tipoControllo` | String | no | "" | enum: "", "obbligatorio", "condizionale", "non applicabile" | — |
| `checklistPubblicazione[].items[].faseCollegata` | String | no | "" | enum: "", "struttura", "design", "consegna", "pubblicazione" | — |
| `checklistPubblicazione[].items[].completata` | Boolean | no | `false` | — | — |
| `checklistPubblicazione[].items[].note` | String | no | "" | — | — |
| `checklistPubblicazione[].items[].appuntamentoTipo` | String | no | "" | enum: "", "fisico", "online" | — |
| `checklistPubblicazione[].items[].confermaGruppo` | Boolean | no | `false` | — | — |
| `checklistPubblicazione[].note` | String | no | "" | — | — |
| `appuntamenti` | Array<Subdocument> | no | — | — | — |
| `appuntamenti[].tipo` | String | sì | — | enum: "iniziale", "intermedio", "finale" | — |
| `appuntamenti[].obbligatorio` | Boolean | no | `false` | — | — |
| `appuntamenti[].stato` | String | no | `da pianificare` | enum: "da pianificare", "programmato", "effettuato", "saltato", "facoltativo" | — |
| `appuntamenti[].data` | Date | no | null | — | — |
| `appuntamenti[].modalita` | String | no | "" | enum: "", "presenza", "videocall", "telefono", "altro" | — |
| `appuntamenti[].esito` | String | no | "" | — | — |
| `appuntamenti[].note` | String | no | "" | — | — |
| `approvazioni` | Array<Subdocument> | no | — | — | — |
| `approvazioni[].tipo` | String | sì | — | enum: "struttura", "design", "consegna" | — |
| `approvazioni[].stato` | String | no | `da richiedere` | enum: "da richiedere", "richiesta", "approvata", "respinta", "non applicabile" | — |
| `approvazioni[].modalita` | String | no | "" | enum: "", "asincrona", "presenza", "videocall", "altro" | — |
| `approvazioni[].data` | Date | no | null | — | — |
| `approvazioni[].approvatoDa` | String | no | "" | — | — |
| `approvazioni[].note` | String | no | "" | — | — |
| `consegna` | Subdocument | no | funzione | — | — |
| `consegna.stato` | String | no | `non consegnato` | enum: "non consegnato", "pronta", "bloccata", "consegnato" | — |
| `consegna.dataPrevista` | Date | no | null | — | — |
| `consegna.dataEffettiva` | Date | no | null | — | — |
| `consegna.confermata` | Boolean | no | `false` | — | — |
| `consegna.note` | String | no | "" | — | — |
| `pubblicazione` | Subdocument | no | funzione | — | — |
| `pubblicazione.stato` | String | no | `da pianificare` | enum: "non prevista", "da pianificare", "programmata", "in corso", "pubblicata", "bloccata" | — |
| `pubblicazione.dataPrevista` | Date | no | null | — | — |
| `pubblicazione.dataEffettiva` | Date | no | null | — | — |
| `pubblicazione.urlPubblico` | String | no | "" | — | — |
| `pubblicazione.note` | String | no | "" | — | — |
| `modificheTimeline` | Array<Subdocument> | no | — | — | — |
| `modificheTimeline[].dataPrecedente` | Date | no | null | — | — |
| `modificheTimeline[].dataNuova` | Date | sì | — | — | — |
| `modificheTimeline[].dataFinePrecedente` | Date | no | null | — | — |
| `modificheTimeline[].dataFineNuova` | Date | sì | — | — | — |
| `modificheTimeline[].modificataIl` | Date | sì | — | — | — |
| `modificheTimeline[].modificataDaId` | String | no | "" | — | — |
| `modificheTimeline[].modificataDaNome` | String | no | "" | — | — |
| `modificheTimeline[].motivo` | String | no | "" | — | — |
| `interview` | Subdocument | no | — | — | — |
| `interview.azienda` | String | no | "" | — | — |
| `interview.descrizioneAzienda` | String | no | "" | — | — |
| `interview.servizioPrincipale` | String | no | "" | — | — |
| `interview.serviziSpingere` | String | no | "" | — | — |
| `interview.clienteIdeale` | String | no | "" | — | — |
| `interview.provenienzaClienti` | String | no | "" | — | — |
| `interview.obiettivoSito` | String | no | "" | — | — |
| `interview.utenteCosaFare` | String | no | "" | — | — |
| `interview.callToAction` | String | no | "" | — | — |
| `interview.tipoSito` | String | no | "" | — | — |
| `interview.sezioni` | String | no | "" | — | — |
| `interview.pagine` | String | no | "" | — | — |
| `interview.serviziEvidenza` | String | no | "" | — | — |
| `interview.recensioniClienti` | String | no | "" | — | — |
| `interview.lavoriProgetti` | String | no | "" | — | — |
| `interview.sitiRiferimento` | String | no | "" | — | — |
| `interview.sitiNonPiacciono` | String | no | "" | — | — |
| `interview.stilePreferito` | String | no | "" | — | — |
| `interview.tipologiaSito` | String | no | "" | — | — |
| `interview.animazioni` | String | no | "" | — | — |
| `interview.videoHomepage` | String | no | "" | — | — |
| `interview.preferenzeColori` | String | no | "" | — | — |
| `interview.preferenzeFont` | String | no | "" | — | — |
| `interview.haLineeGuidaBrand` | String | no | `no` | — | — |
| `interview.lineeGuidaBrand` | String | no | "" | — | — |
| `interview.haDominio` | String | no | `no` | — | — |
| `interview.dominio` | String | no | "" | — | — |
| `interview.servizioDominio` | String | no | "" | — | — |
| `interview.mailCollegate` | String | no | "" | — | — |
| `interview.accessiDominio` | String | no | "" | — | — |
| `interview.noteAccessi` | String | no | "" | — | — |
| `interview.scadenzaDominio` | String | no | "" | — | — |
| `interview.branding` | String | no | "" | — | — |
| `interview.media` | String | no | "" | — | — |
| `interview.testi` | String | no | "" | — | — |
| `interview.noteMateriali` | String | no | "" | — | — |
| `interview.fileUtili` | String | no | "" | — | — |
| `interviewPrompt` | String | no | "" | — | — |
| `note` | String | no | "" | — | — |
| `stato` | String | no | `in corso` | enum: "in corso", "in pausa", "terminata" | — |
| `dataInizioContratto` | Date | sì | — | — | — |
| `dataFineContratto` | Date | sì | — | — | — |
| `dominio.dataAcquisto` | Date | no | null | — | — |
| `dominio.dataScadenza` | Date | no | null | — | — |
| `dominio.urlDominio` | String | no | "" | — | — |
| `dominio.alertInviato` | Boolean | no | `false` | — | — |
| `dominio.novaAlertData` | Date | no | null | — | — |

Indici:

- Solo indice MongoDB predefinito su `_id`.

### ConfigurazioneRagazzi

Collezione: `configurazioneragazzis`.

| Campo | Tipo | Obbligatorio | Default | Enum / vincoli | Ref |
| --- | --- | --- | --- | --- | --- |
| `aziende_ragazzi` | Array<ObjectId> | no | — | — | Azienda |

Indici:

- Solo indice MongoDB predefinito su `_id`.

### Contatto

Collezione: `contattos`.

| Campo | Tipo | Obbligatorio | Default | Enum / vincoli | Ref |
| --- | --- | --- | --- | --- | --- |
| `referente` | String | sì | — | — | — |
| `numero` | String | sì | — | — | — |
| `email` | String | sì | — | — | — |
| `ragioneSociale` | String | no | — | — | — |
| `indirizzo` | String | no | — | — | — |
| `notes` | String | no | — | — | — |
| `livelloAccesso` | Number | no | `3` | — | — |

Indici:

- `{"email":1}` — `{"unique":true,"background":true}`

### Dispensa

Collezione: `dispensas`.

| Campo | Tipo | Obbligatorio | Default | Enum / vincoli | Ref |
| --- | --- | --- | --- | --- | --- |
| `categoria` | String | sì | — | trim | — |
| `icona` | String | no | `📄` | trim | — |
| `item` | String | sì | — | trim | — |
| `ordine` | Number | no | `0` | — | — |

Indici:

- Solo indice MongoDB predefinito su `_id`.

### DispensaSuggerita

Collezione: `dispensasuggeritas`.

| Campo | Tipo | Obbligatorio | Default | Enum / vincoli | Ref |
| --- | --- | --- | --- | --- | --- |
| `categoria` | String | sì | — | trim | — |
| `argomento` | String | sì | — | trim | — |
| `suggeritaDa.nome` | String | sì | — | — | — |
| `suggeritaDa.email` | String | sì | — | — | — |
| `suggeritaDa.userId` | String | sì | — | — | — |
| `stato` | String | no | `in_attesa` | enum: "in_attesa", "pubblicata" | — |

Indici:

- Solo indice MongoDB predefinito su `_id`.

### DisponibilitaEvento

Collezione: `disponibilitaeventos`.

| Campo | Tipo | Obbligatorio | Default | Enum / vincoli | Ref |
| --- | --- | --- | --- | --- | --- |
| `evento` | ObjectId | sì | — | — | Evento |
| `collaboratore` | ObjectId | sì | — | — | Collaboratore |
| `stato` | String | sì | — | enum: "si", "no", "forse" | — |
| `nota` | String | no | "" | trim | — |
| `risposteGiornaliere` | Array<Subdocument> | no | `[]` | — | — |
| `risposteGiornaliere[].data` | Date | sì | — | — | — |
| `risposteGiornaliere[].stato` | String | sì | — | enum: "si", "no", "forse" | — |
| `risposteGiornaliere[].nota` | String | no | "" | trim | — |

Indici:

- `{"evento":1}` — `{"background":true}`
- `{"collaboratore":1}` — `{"background":true}`
- `{"evento":1,"collaboratore":1}` — `{"unique":true,"background":true}`

### Dominio

Collezione: `dominios`.

| Campo | Tipo | Obbligatorio | Default | Enum / vincoli | Ref |
| --- | --- | --- | --- | --- | --- |
| `urlDominio` | String | sì | — | trim | — |
| `dataScadenza` | Date | sì | — | — | — |
| `webDesigner` | String | sì | — | trim | — |
| `isEsterno` | Boolean | no | `false` | — | — |
| `note` | String | no | "" | — | — |
| `alertInviato` | Boolean | no | `false` | — | — |

Indici:

- Solo indice MongoDB predefinito su `_id`.

### Evento

Collezione: `eventos`.

| Campo | Tipo | Obbligatorio | Default | Enum / vincoli | Ref |
| --- | --- | --- | --- | --- | --- |
| `tipo` | String | no | `evento` | enum: "evento", "shooting" | — |
| `nome` | String | sì | — | trim | — |
| `azienda` | ObjectId | no | null | — | Azienda |
| `dataInizio` | Date | sì | — | — | — |
| `dataFine` | Date | sì | — | — | — |
| `giornateEvento` | Array<Date> | no | — | — | — |
| `luogo` | String | sì | — | trim | — |
| `responsabile` | ObjectId | sì | — | — | Collaboratore |
| `collaboratori` | Array<ObjectId> | no | — | — | Collaboratore |
| `postTotali` | Number | no | `0` | min: 0 | — |
| `postFatti` | Number | no | `0` | min: 0 | — |
| `appuntamentiTotali` | Number | no | `0` | min: 0 | — |
| `appuntamentiFatti` | Number | no | `0` | min: 0 | — |
| `inizioSocial` | Date | no | null | — | — |
| `fineSocial` | Date | no | null | — | — |
| `socialGestiti` | Array<String> | no | — | enum: "instagram", "facebook", "tiktok", "youtube", "linkedin" | — |
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
| `createdBy` | String | no | "" | — | — |
| `updatedBy` | String | no | "" | — | — |

Indici:

- `{"tipo":1}` — `{"background":true}`
- `{"azienda":1}` — `{"background":true}`
- `{"dataInizio":1}` — `{"background":true}`
- `{"responsabile":1}` — `{"background":true}`
- `{"collaboratori":1,"dataInizio":1}` — `{"background":true}`
- `{"responsabile":1,"dataInizio":1}` — `{"background":true}`
- `{"giornateEvento":1}` — `{"background":true}`

### Faq

Collezione: `faqs`.

| Campo | Tipo | Obbligatorio | Default | Enum / vincoli | Ref |
| --- | --- | --- | --- | --- | --- |
| `categoria` | String | sì | — | trim | — |
| `titolo` | String | sì | — | trim | — |
| `testo` | String | sì | — | — | — |
| `ordine` | Number | no | `0` | — | — |

Indici:

- Solo indice MongoDB predefinito su `_id`.

### FaqSuggerite

Collezione: `faqsuggerites`.

| Campo | Tipo | Obbligatorio | Default | Enum / vincoli | Ref |
| --- | --- | --- | --- | --- | --- |
| `domanda` | String | sì | — | trim | — |
| `suggeritaDa.nome` | String | sì | — | — | — |
| `suggeritaDa.email` | String | sì | — | — | — |
| `suggeritaDa.userId` | String | sì | — | — | — |
| `stato` | String | no | `in_attesa` | enum: "in_attesa", "pubblicata" | — |

Indici:

- Solo indice MongoDB predefinito su `_id`.

### Fatturazione

Collezione: `fatturaziones`.

| Campo | Tipo | Obbligatorio | Default | Enum / vincoli | Ref |
| --- | --- | --- | --- | --- | --- |
| `data` | Date | sì | Date.now | — | — |
| `mese` | String | sì | — | — | — |
| `collaboratore` | ObjectId | sì | — | — | Collaboratore |
| `totale` | Number | no | null | — | — |
| `statoCollaboratore` | String | no | `non emessa` | enum: "non emessa", "emessa" | — |
| `statoAmministratore` | String | no | `non pagata` | enum: "non pagata", "pagata" | — |

Indici:

- `{"collaboratore":1,"mese":1}` — `{"unique":true,"background":true}`

### GoogleAds

Collezione: `googleads`.

| Campo | Tipo | Obbligatorio | Default | Enum / vincoli | Ref |
| --- | --- | --- | --- | --- | --- |
| `cliente` | ObjectId | sì | — | — | Azienda |
| `collaboratore` | ObjectId | sì | — | — | Collaboratore |
| `clienteEtichetta` | String | sì | — | — | — |
| `collaboratoreNome` | String | sì | — | — | — |
| `collaboratoreCognome` | String | sì | — | — | — |
| `contattato` | Boolean | no | `false` | — | — |
| `campagnaAvviata` | Boolean | no | `false` | — | — |
| `campagnaTerminata` | Boolean | no | `false` | — | — |
| `note` | String | no | "" | — | — |

Indici:

- `{"cliente":1,"collaboratore":1}` — `{"unique":true,"background":true}`

### GooglePlacesUsage

Collezione: `googleplacesusages`.

| Campo | Tipo | Obbligatorio | Default | Enum / vincoli | Ref |
| --- | --- | --- | --- | --- | --- |
| `month` | String | sì | — | — | — |
| `calls` | Number | no | `0` | min: 0 | — |

Indici:

- `{"month":1}` — `{"unique":true,"background":true}`

### HoonLabCustomer

Collezione: `hoonlabcustomers`.

| Campo | Tipo | Obbligatorio | Default | Enum / vincoli | Ref |
| --- | --- | --- | --- | --- | --- |
| `name` | String | sì | — | trim | — |
| `type` | String | sì | `privato` | enum: "privato", "team", "azienda" | — |
| `email` | String | no | "" | trim; lowercase | — |
| `phone` | String | no | "" | trim | — |
| `vatNumber` | String | no | "" | trim | — |
| `taxCode` | String | no | "" | trim | — |
| `uniqueCode` | String | no | "" | trim | — |
| `billingAddress` | Subdocument | no | funzione | — | — |
| `billingAddress.address` | String | no | "" | — | — |
| `billingAddress.city` | String | no | "" | — | — |
| `billingAddress.zip` | String | no | "" | — | — |
| `billingAddress.province` | String | no | "" | — | — |
| `billingAddress.country` | String | no | `Italia` | — | — |
| `shippingAddress` | Subdocument | no | funzione | — | — |
| `shippingAddress.address` | String | no | "" | — | — |
| `shippingAddress.city` | String | no | "" | — | — |
| `shippingAddress.zip` | String | no | "" | — | — |
| `shippingAddress.province` | String | no | "" | — | — |
| `shippingAddress.country` | String | no | `Italia` | — | — |
| `defaultPriceList` | ObjectId | no | null | — | HoonLabPriceList |
| `notes` | String | no | "" | — | — |
| `active` | Boolean | no | `true` | — | — |

Indici:

- Solo indice MongoDB predefinito su `_id`.

### HoonLabDeliveryNote

Collezione: `hoonlabdeliverynotes`.

| Campo | Tipo | Obbligatorio | Default | Enum / vincoli | Ref |
| --- | --- | --- | --- | --- | --- |
| `number` | String | sì | — | — | — |
| `quote` | ObjectId | no | null | — | HoonLabQuote |
| `orderConfirmation` | ObjectId | no | null | — | HoonLabOrderConfirmation |
| `customer` | ObjectId | sì | — | — | HoonLabCustomer |
| `customerSnapshot` | Mixed | sì | — | — | — |
| `shippingAddressSnapshot` | Mixed | no | funzione | — | — |
| `reason` | String | no | `Vendita` | — | — |
| `status` | String | no | `bozza` | enum: "bozza", "emesso", "annullato" | — |
| `issueDate` | Date | no | Date.now | — | — |
| `lines` | Array<Subdocument> | no | `[]` | — | — |
| `lines[].product` | ObjectId | no | null | — | HoonLabProduct |
| `lines[].productSnapshot` | Mixed | no | funzione | — | — |
| `lines[].description` | String | sì | — | — | — |
| `lines[].quantity` | Number | no | `1` | min: 0 | — |
| `lines[].unit` | String | no | `pz` | — | — |
| `lines[].notes` | String | no | "" | — | — |
| `lines[].sortOrder` | Number | no | `0` | — | — |
| `notes` | String | no | "" | — | — |
| `pdfUrl` | String | no | "" | — | — |

Indici:

- `{"number":1}` — `{"unique":true,"background":true}`
- `{"customer":1,"status":1}` — `{"background":true}`
- `{"issueDate":-1}` — `{"background":true}`

### HoonLabDocumentSequence

Collezione: `hoonlabdocumentsequences`.

| Campo | Tipo | Obbligatorio | Default | Enum / vincoli | Ref |
| --- | --- | --- | --- | --- | --- |
| `documentType` | String | sì | — | enum: "quote", "order_confirmation", "delivery_note" | — |
| `year` | Number | sì | — | — | — |
| `prefix` | String | sì | — | — | — |
| `nextNumber` | Number | sì | `1` | — | — |

Indici:

- `{"documentType":1,"year":1}` — `{"unique":true,"background":true}`

### HoonLabFinanceEntry

Collezione: `hoonlabfinanceentries`.

| Campo | Tipo | Obbligatorio | Default | Enum / vincoli | Ref |
| --- | --- | --- | --- | --- | --- |
| `type` | String | sì | — | enum: "income", "expense" | — |
| `description` | String | sì | — | trim | — |
| `category` | String | no | "" | trim | — |
| `amount` | Number | sì | — | min: 0 | — |
| `date` | Date | sì | Date.now | — | — |
| `recurring` | Boolean | no | `false` | — | — |
| `recurrence` | String | no | "" | enum: "", "monthly" | — |
| `recurrenceEnd` | Date | no | null | — | — |
| `notes` | String | no | "" | trim | — |
| `active` | Boolean | no | `true` | — | — |

Indici:

- `{"type":1,"date":-1}` — `{"background":true}`
- `{"recurring":1,"active":1}` — `{"background":true}`

### HoonLabOrderConfirmation

Collezione: `hoonlaborderconfirmations`.

| Campo | Tipo | Obbligatorio | Default | Enum / vincoli | Ref |
| --- | --- | --- | --- | --- | --- |
| `number` | String | sì | — | — | — |
| `quote` | ObjectId | no | null | — | HoonLabQuote |
| `customer` | ObjectId | sì | — | — | HoonLabCustomer |
| `customerSnapshot` | Mixed | sì | — | — | — |
| `status` | String | no | `confermato` | enum: "bozza", "confermato", "in_preparazione", "preparato", "ddt_generato", "spedito", "consegnato", "annullato" | — |
| `issueDate` | Date | no | Date.now | — | — |
| `lines` | Array<Subdocument> | no | `[]` | — | — |
| `lines[].product` | ObjectId | no | null | — | HoonLabProduct |
| `lines[].productSnapshot` | Mixed | no | funzione | — | — |
| `lines[].description` | String | sì | — | — | — |
| `lines[].quantity` | Number | no | `1` | min: 0 | — |
| `lines[].unit` | String | no | `pz` | — | — |
| `lines[].unitPrice` | Number | no | `0` | min: 0 | — |
| `lines[].pricePending` | Boolean | no | `false` | — | — |
| `lines[].manualUnitPrice` | Boolean | no | `false` | — | — |
| `lines[].discountType` | String | no | `none` | enum: "none", "percent", "fixed" | — |
| `lines[].discountValue` | Number | no | `0` | min: 0 | — |
| `lines[].increaseType` | String | no | `none` | enum: "none", "percent", "fixed" | — |
| `lines[].increaseValue` | Number | no | `0` | min: 0 | — |
| `lines[].lineSubtotal` | Number | no | `0` | min: 0 | — |
| `lines[].lineDiscount` | Number | no | `0` | min: 0 | — |
| `lines[].lineIncrease` | Number | no | `0` | min: 0 | — |
| `lines[].lineTotal` | Number | no | `0` | min: 0 | — |
| `lines[].notes` | String | no | "" | — | — |
| `lines[].sortOrder` | Number | no | `0` | — | — |
| `quoteDiscountType` | String | no | `none` | enum: "none", "percent", "fixed" | — |
| `quoteDiscountValue` | Number | no | `0` | min: 0 | — |
| `quoteDiscountAmount` | Number | no | `0` | min: 0 | — |
| `subtotal` | Number | no | `0` | min: 0 | — |
| `discountTotal` | Number | no | `0` | min: 0 | — |
| `increaseTotal` | Number | no | `0` | min: 0 | — |
| `taxableAmount` | Number | no | `0` | min: 0 | — |
| `vatRate` | Number | no | null | min: 0; max: 100 | — |
| `vatAmount` | Number | no | `0` | min: 0 | — |
| `total` | Number | no | `0` | min: 0 | — |
| `paymentStatus` | String | no | `non_pagato` | enum: "non_pagato", "acconto", "pagato" | — |
| `paymentMethod` | String | no | "" | enum: "", "contanti", "bonifico", "carta", "paypal", "altro" | — |
| `amountPaid` | Number | no | `0` | min: 0 | — |
| `balanceDue` | Number | no | `0` | min: 0 | — |
| `paymentNotes` | String | no | "" | — | — |
| `paidAt` | Date | no | null | — | — |
| `statusChangedAt` | Date | no | Date.now | — | — |
| `shippedAt` | Date | no | null | — | — |
| `deliveredAt` | Date | no | null | — | — |
| `notes` | String | no | "" | — | — |
| `pdfUrl` | String | no | "" | — | — |

Indici:

- `{"number":1}` — `{"unique":true,"background":true}`
- `{"customer":1,"status":1}` — `{"background":true}`
- `{"issueDate":-1}` — `{"background":true}`

### HoonLabPdfTemplate

Collezione: `hoonlabpdftemplates`.

| Campo | Tipo | Obbligatorio | Default | Enum / vincoli | Ref |
| --- | --- | --- | --- | --- | --- |
| `type` | String | sì | — | enum: "quote", "order_confirmation", "delivery_note" | — |
| `name` | String | sì | — | — | — |
| `html` | String | sì | — | — | — |
| `css` | String | no | "" | — | — |
| `active` | Boolean | no | `true` | — | — |

Indici:

- Solo indice MongoDB predefinito su `_id`.

### HoonLabPriceList

Collezione: `hoonlabpricelists`.

| Campo | Tipo | Obbligatorio | Default | Enum / vincoli | Ref |
| --- | --- | --- | --- | --- | --- |
| `name` | String | sì | — | trim | — |
| `customerType` | String | no | `privato` | enum: "privato", "team", "azienda", "custom" | — |
| `currency` | String | no | `EUR` | — | — |
| `pricesNet` | Boolean | no | `false` | — | — |
| `pricesNetConvertedAt` | Date | no | null | — | — |
| `active` | Boolean | no | `true` | — | — |

Indici:

- Solo indice MongoDB predefinito su `_id`.

### HoonLabPriceListItem

Collezione: `hoonlabpricelistitems`.

| Campo | Tipo | Obbligatorio | Default | Enum / vincoli | Ref |
| --- | --- | --- | --- | --- | --- |
| `priceList` | ObjectId | sì | — | — | HoonLabPriceList |
| `product` | ObjectId | sì | — | — | HoonLabProduct |
| `price` | Number | sì | — | min: 0 | — |
| `validFrom` | Date | sì | Date.now | — | — |
| `validTo` | Date | no | null | — | — |
| `notes` | String | no | "" | — | — |

Indici:

- `{"priceList":1,"product":1,"validFrom":-1}` — `{"background":true}`
- `{"priceList":1,"product":1,"validTo":1}` — `{"background":true}`

### HoonLabProduct

Collezione: `hoonlabproducts`.

| Campo | Tipo | Obbligatorio | Default | Enum / vincoli | Ref |
| --- | --- | --- | --- | --- | --- |
| `sku` | String | no | "" | trim | — |
| `name` | String | sì | — | trim | — |
| `description` | String | no | "" | — | — |
| `basePrice` | Number | no | `0` | min: 0 | — |
| `unit` | String | no | `pz` | — | — |
| `category` | String | no | "" | — | — |
| `active` | Boolean | no | `true` | — | — |

Indici:

- Solo indice MongoDB predefinito su `_id`.

### HoonLabQuote

Collezione: `hoonlabquotes`.

| Campo | Tipo | Obbligatorio | Default | Enum / vincoli | Ref |
| --- | --- | --- | --- | --- | --- |
| `number` | String | sì | — | — | — |
| `customer` | ObjectId | sì | — | — | HoonLabCustomer |
| `customerSnapshot` | Mixed | sì | — | — | — |
| `priceList` | ObjectId | no | null | — | HoonLabPriceList |
| `priceListSnapshot` | Mixed | no | funzione | — | — |
| `status` | String | no | `bozza` | enum: "bozza", "inviato", "accettato", "rifiutato", "scaduto", "convertito" | — |
| `issueDate` | Date | no | Date.now | — | — |
| `validUntil` | Date | no | null | — | — |
| `lines` | Array<Subdocument> | no | `[]` | — | — |
| `lines[].product` | ObjectId | no | null | — | HoonLabProduct |
| `lines[].productSnapshot` | Mixed | no | funzione | — | — |
| `lines[].description` | String | sì | — | — | — |
| `lines[].quantity` | Number | no | `1` | min: 0 | — |
| `lines[].unit` | String | no | `pz` | — | — |
| `lines[].unitPrice` | Number | no | `0` | min: 0 | — |
| `lines[].pricePending` | Boolean | no | `false` | — | — |
| `lines[].manualUnitPrice` | Boolean | no | `false` | — | — |
| `lines[].discountType` | String | no | `none` | enum: "none", "percent", "fixed" | — |
| `lines[].discountValue` | Number | no | `0` | min: 0 | — |
| `lines[].increaseType` | String | no | `none` | enum: "none", "percent", "fixed" | — |
| `lines[].increaseValue` | Number | no | `0` | min: 0 | — |
| `lines[].lineSubtotal` | Number | no | `0` | min: 0 | — |
| `lines[].lineDiscount` | Number | no | `0` | min: 0 | — |
| `lines[].lineIncrease` | Number | no | `0` | min: 0 | — |
| `lines[].lineTotal` | Number | no | `0` | min: 0 | — |
| `lines[].notes` | String | no | "" | — | — |
| `lines[].sortOrder` | Number | no | `0` | — | — |
| `quoteDiscountType` | String | no | `none` | enum: "none", "percent", "fixed" | — |
| `quoteDiscountValue` | Number | no | `0` | min: 0 | — |
| `quoteDiscountAmount` | Number | no | `0` | min: 0 | — |
| `subtotal` | Number | no | `0` | min: 0 | — |
| `discountTotal` | Number | no | `0` | min: 0 | — |
| `increaseTotal` | Number | no | `0` | min: 0 | — |
| `taxableAmount` | Number | no | `0` | min: 0 | — |
| `vatRate` | Number | no | null | min: 0; max: 100 | — |
| `vatAmount` | Number | no | `0` | min: 0 | — |
| `total` | Number | no | `0` | min: 0 | — |
| `notes` | String | no | "" | — | — |
| `pdfUrl` | String | no | "" | — | — |
| `rejectionReason` | String | no | "" | — | — |
| `rejectedAt` | Date | no | null | — | — |
| `acceptedAt` | Date | no | null | — | — |
| `convertedOrder` | ObjectId | no | null | — | HoonLabOrderConfirmation |

Indici:

- `{"number":1}` — `{"unique":true,"background":true}`
- `{"customer":1,"status":1}` — `{"background":true}`
- `{"issueDate":-1}` — `{"background":true}`

### HoonLabSettings

Collezione: `hoonlabsettings`.

| Campo | Tipo | Obbligatorio | Default | Enum / vincoli | Ref |
| --- | --- | --- | --- | --- | --- |
| `key` | String | sì | `default` | — | — |
| `companyName` | String | no | `Hoon Srl` | — | — |
| `companyHeader` | String | no | `Hoon Srl Via Buon Pastore 9 d 01100 Viterbo (VT) Tel. 3760361046 / Fax www.hoonlab.it / info@hoonlab.it P.IVA 02338800564 - Cod. Fiscale 02338800564` | — | — |
| `quoteNoteTitle` | String | no | `NOTA PREVENTIVO` | — | — |
| `quoteNote` | String | no | `Per l’avvio dell’ordine è richiesto un acconto del 50% sul totale IVA inclusa, pari a {{acconto}}. Il restante 50% dovrà essere versato prima della consegna della merce` | — | — |

Indici:

- `{"key":1}` — `{"unique":true,"background":true}`

### HoonLabTodo

Collezione: `hoonlabtodos`.

| Campo | Tipo | Obbligatorio | Default | Enum / vincoli | Ref |
| --- | --- | --- | --- | --- | --- |
| `note` | String | sì | — | trim | — |
| `dueDate` | Date | no | null | — | — |
| `status` | String | no | `da_fare` | enum: "da_fare", "in_lavorazione", "fatta" | — |
| `statusChangedAt` | Date | no | Date.now | — | — |
| `statusHistory` | Array<Subdocument> | no | funzione | — | — |
| `statusHistory[].status` | String | sì | — | enum: "da_fare", "in_lavorazione", "fatta" | — |
| `statusHistory[].at` | Date | no | Date.now | — | — |
| `active` | Boolean | no | `true` | — | — |

Indici:

- `{"status":1,"dueDate":1}` — `{"background":true}`
- `{"active":1,"createdAt":-1}` — `{"background":true}`

### ImageCompression

Collezione: `imagecompressions`.

| Campo | Tipo | Obbligatorio | Default | Enum / vincoli | Ref |
| --- | --- | --- | --- | --- | --- |
| `userId` | ObjectId | sì | — | — | User |
| `originalName` | String | sì | — | — | — |
| `originalSize` | Number | sì | — | — | — |
| `compressedSize` | Number | sì | — | — | — |
| `quality` | Number | sì | — | — | — |
| `savings` | Number | sì | — | — | — |
| `format` | String | sì | — | enum: "jpeg", "png", "webp" | — |

Indici:

- Solo indice MongoDB predefinito su `_id`.

### LeadCommerciale

Collezione: `leadcommerciales`.

| Campo | Tipo | Obbligatorio | Default | Enum / vincoli | Ref |
| --- | --- | --- | --- | --- | --- |
| `nome_attivita` | String | sì | — | trim | — |
| `numero_telefono` | String | sì | — | trim | — |
| `referente` | String | no | "" | trim | — |
| `indirizzo` | String | no | "" | trim | — |
| `citta` | String | no | "" | trim | — |
| `email` | String | no | "" | trim; lowercase | — |
| `secondo_numero` | String | no | "" | trim | — |
| `commerciale` | ObjectId | sì | — | — | Collaboratore |
| `timeline.contatto` | Subdocument | no | funzione | — | — |
| `timeline.contatto.completato` | Boolean | no | `false` | — | — |
| `timeline.contatto.data_completamento` | Date | no | null | — | — |
| `timeline.appuntamento` | Subdocument | no | funzione | — | — |
| `timeline.appuntamento.completato` | Boolean | no | `false` | — | — |
| `timeline.appuntamento.data_completamento` | Date | no | null | — | — |
| `timeline.preventivo` | Subdocument | no | funzione | — | — |
| `timeline.preventivo.completato` | Boolean | no | `false` | — | — |
| `timeline.preventivo.data_completamento` | Date | no | null | — | — |
| `timeline.contratto` | Subdocument | no | funzione | — | — |
| `timeline.contratto.completato` | Boolean | no | `false` | — | — |
| `timeline.contratto.data_completamento` | Date | no | null | — | — |
| `non_interessato.completato` | Boolean | no | `false` | — | — |
| `non_interessato.data_completamento` | Date | no | null | — | — |
| `non_interessato.nota` | String | no | "" | — | — |
| `da_ricontattare.completato` | Boolean | no | `false` | — | — |
| `da_ricontattare.data_completamento` | Date | no | null | — | — |
| `da_ricontattare.data_ricontatto` | Date | no | null | — | — |
| `da_ricontattare.nota` | String | no | "" | — | — |
| `nota_generale` | String | no | "" | — | — |
| `stato_attuale` | String | no | `in_lavorazione` | enum: "in_lavorazione", "non_interessato", "da_richiamare", "completato" | — |
| `data_cambio_stato` | Date | no | null | — | — |
| `data_richiamo` | Date | no | null | — | — |
| `archiviato` | Boolean | no | `false` | — | — |
| `data_archiviazione` | Date | no | null | — | — |

Indici:

- `{"commerciale":1,"stato_attuale":1}` — `{"background":true}`
- `{"commerciale":1,"archiviato":1}` — `{"background":true}`
- `{"da_ricontattare.data_ricontatto":1}` — `{"background":true}`

### Nota

Collezione: `notas`.

| Campo | Tipo | Obbligatorio | Default | Enum / vincoli | Ref |
| --- | --- | --- | --- | --- | --- |
| `data` | Date | sì | Date.now | — | — |
| `nota` | String | sì | — | — | — |
| `autoreId` | ObjectId | sì | — | — | Utenti |
| `autore` | String | sì | — | — | — |
| `collaborazione` | ObjectId | sì | — | — | Collaborazioni |
| `tipo` | String | sì | — | enum: "generico", "appuntamento", "problema", "post_mancante" | — |
| `data_appuntamento` | Date | condizionale | — | — | — |
| `feeling_emoji` | String | no | "" | enum: "😄", "🙂", "😐", "😕", "😤", "😵💫", "🔥", "🧊", "" | — |
| `feeling_note` | String | no | "" | — | — |

Indici:

- Solo indice MongoDB predefinito su `_id`.

### NotaComm

Collezione: `notacomms`.

| Campo | Tipo | Obbligatorio | Default | Enum / vincoli | Ref |
| --- | --- | --- | --- | --- | --- |
| `data` | Date | sì | Date.now | — | — |
| `mainCategoria` | String | sì | — | enum: "appuntamento", "contatto" | — |
| `tipoContatto` | String | condizionale | — | enum: "visita", "chiamata" | — |
| `comeArrivato` | String | condizionale | — | enum: "in azienda", "chiamata", "referal", "ricerca" | — |
| `referal` | String | no | — | — | — |
| `nomeAzienda` | String | condizionale | — | — | — |
| `luogo` | String | condizionale | — | — | — |
| `indirizzo` | String | condizionale | — | — | — |
| `numeroTelefono` | String | condizionale | — | — | — |
| `referente` | String | condizionale | — | — | — |
| `nota` | String | sì | — | — | — |
| `autoreId` | ObjectId | sì | — | — | Utenti |
| `autore` | String | no | — | — | — |
| `data_appuntamento` | Date | condizionale | — | — | — |
| `luogo_appuntamento` | String | condizionale | — | — | — |

Indici:

- Solo indice MongoDB predefinito su `_id`.

### Notifica

Collezione: `notificas`.

| Campo | Tipo | Obbligatorio | Default | Enum / vincoli | Ref |
| --- | --- | --- | --- | --- | --- |
| `tipo` | String | sì | — | enum: "nota_problema", "dominio_scadenza", "fine_mese", "evento_disponibilita", "shooting_disponibilita", "seo_assegnazione" | — |
| `titolo` | String | sì | — | — | — |
| `messaggio` | String | sì | — | — | — |
| `letta` | Boolean | no | `false` | — | — |
| `link` | String | no | "" | — | — |
| `refId` | String | no | "" | — | — |
| `destinatario` | ObjectId | no | null | — | Collaboratore |

Indici:

- `{"destinatario":1}` — `{"background":true}`

### NotificationDelivery

Collezione: `notificationdeliveries`.

| Campo | Tipo | Obbligatorio | Default | Enum / vincoli | Ref |
| --- | --- | --- | --- | --- | --- |
| `destinatario` | ObjectId | sì | — | — | Collaboratore |
| `channel` | String | sì | — | enum: "email", "whatsapp" | — |
| `target` | String | sì | — | — | — |
| `subject` | String | sì | — | — | — |
| `message` | String | sì | — | — | — |
| `link` | String | no | "" | — | — |
| `status` | String | no | `pending` | enum: "pending", "sent", "failed", "skipped" | — |
| `attempts` | Number | no | `0` | — | — |
| `lastError` | String | no | "" | — | — |
| `sentAt` | Date | no | null | — | — |
| `dedupeKey` | String | sì | — | — | — |

Indici:

- `{"destinatario":1}` — `{"background":true}`
- `{"status":1}` — `{"background":true}`
- `{"dedupeKey":1}` — `{"unique":true,"background":true}`

### Pagamenti

Collezione: `pagamentis`.

| Campo | Tipo | Obbligatorio | Default | Enum / vincoli | Ref |
| --- | --- | --- | --- | --- | --- |
| `data_fattura` | Date | sì | — | — | — |
| `data_pagato` | Date | no | null | — | — |
| `stato` | String | sì | — | enum: "si", "no", "ragazzi" | — |
| `cliente` | ObjectId | sì | — | — | Azienda |

Indici:

- Solo indice MongoDB predefinito su `_id`.

### PagamentoNuovo

Collezione: `pagamentonuovos`.

| Campo | Tipo | Obbligatorio | Default | Enum / vincoli | Ref |
| --- | --- | --- | --- | --- | --- |
| `tipo` | String | sì | — | enum: "entrata", "uscita" | — |
| `importo` | Number | sì | — | — | — |
| `stato_pagamento` | String | no | `non_pagato` | enum: "pagato", "non_pagato", "ragazzi" | — |
| `data_pagamento` | Date | no | — | — | — |
| `mese` | Number | no | — | — | — |
| `anno` | Number | no | — | — | — |
| `note` | String | no | — | — | — |
| `chi_paga.cliente_id` | ObjectId | no | — | — | — |
| `chi_paga.nome_cliente` | String | no | — | — | — |
| `chi_paga.etichetta` | String | no | — | — | — |
| `chi_paga.ragione_sociale` | String | no | — | — | — |
| `destinatario_entrata` | String | no | — | enum: "hoon", "collaboratori" | — |
| `servizio` | String | no | — | — | — |
| `collaboratori` | Array<Subdocument> | no | — | — | — |
| `collaboratori[].collaboratore_id` | ObjectId | sì | — | — | Collaboratore |
| `collaboratori[].nome_collaboratore` | String | no | — | — | — |
| `collaboratori[].usa_percentuale` | Boolean | no | `true` | — | — |
| `collaboratori[].percentuale` | Number | no | — | — | — |
| `collaboratori[].cifra_fissa` | Number | no | — | — | — |
| `collaboratori[].importo_calcolato` | Number | no | — | — | — |
| `uscite_generate_ids` | Array<ObjectId> | no | — | — | PagamentoNuovo |
| `destinatario_tipo` | String | no | — | enum: "collaboratore", "azienda_esterna", "servizio_esterno" | — |
| `destinatario_id` | ObjectId | no | — | — | — |
| `nome_destinatario` | String | no | — | — | — |
| `generata_da_entrata` | Boolean | no | `false` | — | — |
| `entrata_riferimento_id` | ObjectId | no | — | — | PagamentoNuovo |
| `ricorrente` | Boolean | no | `false` | — | — |

Indici:

- Solo indice MongoDB predefinito su `_id`.

### QrCode

Collezione: `qrcodes`.

| Campo | Tipo | Obbligatorio | Default | Enum / vincoli | Ref |
| --- | --- | --- | --- | --- | --- |
| `userId` | ObjectId | sì | — | — | User |
| `name` | String | sì | — | — | — |
| `type` | String | sì | — | enum: "url", "text", "email", "phone", "wifi" | — |
| `value` | String | sì | — | — | — |
| `wifiConfig.ssid` | String | no | — | — | — |
| `wifiConfig.password` | String | no | — | — | — |
| `wifiConfig.encryption` | String | no | — | enum: "WPA", "WEP", "nopass" | — |
| `scans` | Number | no | `0` | — | — |
| `lastScan` | Date | no | — | — | — |
| `shortUrl` | String | no | — | — | — |

Indici:

- Solo indice MongoDB predefinito su `_id`.

### ScheduledPost

Collezione: `scheduledposts`.

| Campo | Tipo | Obbligatorio | Default | Enum / vincoli | Ref |
| --- | --- | --- | --- | --- | --- |
| `accountId` | ObjectId | sì | — | — | SocialAccount |
| `userId` | ObjectId | sì | — | — | User |
| `scheduledFor` | Date | sì | — | — | — |
| `status` | String | no | `pending` | enum: "pending", "processing", "published", "failed", "cancelled" | — |
| `content.type` | String | sì | — | enum: "image", "video", "carousel", "text" | — |
| `content.caption` | String | sì | — | — | — |
| `content.media` | Array<Subdocument> | no | — | — | — |
| `content.media[].url` | String | no | — | — | — |
| `content.media[].type` | String | no | — | enum: "image", "video" | — |
| `content.media[].order` | Number | no | — | — | — |
| `content.hashtags` | Array<String> | no | — | — | — |
| `content.location.id` | String | no | — | — | — |
| `content.location.name` | String | no | — | — | — |
| `content.tagUsers` | Array<Subdocument> | no | — | — | — |
| `content.tagUsers[].username` | String | no | — | — | — |
| `content.tagUsers[].userId` | String | no | — | — | — |
| `publishedAt` | Date | no | — | — | — |
| `publishedPostId` | String | no | — | — | — |
| `publishedUrl` | String | no | — | — | — |
| `error.message` | String | no | — | — | — |
| `error.code` | String | no | — | — | — |
| `error.details` | Mixed | no | — | — | — |
| `retryCount` | Number | no | `0` | — | — |
| `maxRetries` | Number | no | `3` | — | — |
| `analytics.likes` | Number | no | `0` | — | — |
| `analytics.comments` | Number | no | `0` | — | — |
| `analytics.shares` | Number | no | `0` | — | — |
| `analytics.reach` | Number | no | `0` | — | — |
| `analytics.lastSynced` | Date | no | — | — | — |

Indici:

- `{"scheduledFor":1}` — `{"background":true}`
- `{"status":1}` — `{"background":true}`
- `{"status":1,"scheduledFor":1}` — `{"background":true}`
- `{"accountId":1,"status":1}` — `{"background":true}`
- `{"userId":1,"scheduledFor":-1}` — `{"background":true}`

### Servizio

Collezione: `servizios`.

| Campo | Tipo | Obbligatorio | Default | Enum / vincoli | Ref |
| --- | --- | --- | --- | --- | --- |
| `nome` | String | sì | — | — | — |
| `attivo` | Boolean | no | `true` | — | — |

Indici:

- Solo indice MongoDB predefinito su `_id`.

### SnapshotCollaborazioni

Collezione: `snapshotcollaborazionis`.

| Campo | Tipo | Obbligatorio | Default | Enum / vincoli | Ref |
| --- | --- | --- | --- | --- | --- |
| `mese` | Number | sì | — | — | — |
| `anno` | Number | sì | — | — | — |
| `meseNome` | String | sì | — | — | — |
| `data_creazione` | Date | no | Date.now | — | — |
| `data_ultimo_aggiornamento` | Date | no | Date.now | — | — |
| `collaborazioni_snapshot` | Array<Subdocument> | no | — | — | — |
| `collaborazioni_snapshot[].collaborazione_id` | ObjectId | sì | — | — | Collaborazione |
| `collaborazioni_snapshot[].collaboratore` | String | sì | — | — | — |
| `collaborazioni_snapshot[].cliente` | String | sì | — | — | — |
| `collaborazioni_snapshot[].appuntamenti_totali` | Number | no | `0` | — | — |
| `collaborazioni_snapshot[].appuntamenti_fatti` | Number | no | `0` | — | — |
| `collaborazioni_snapshot[].post_ig_fb` | String | no | `0 / 0` | — | — |
| `collaborazioni_snapshot[].post_tiktok` | String | no | `0 / 0` | — | — |
| `collaborazioni_snapshot[].post_linkedin` | String | no | `0 / 0` | — | — |
| `collaborazioni_snapshot[].ultimo_aggiornamento` | Date | no | Date.now | — | — |
| `stato` | String | no | `attivo` | enum: "attivo", "completato", "esportato", "archiviato" | — |
| `data_export` | Date | no | null | — | — |
| `data_completamento` | Date | no | null | — | — |

Indici:

- `{"anno":1,"mese":1}` — `{"background":true}`

### SocialAccount

Collezione: `socialaccounts`.

| Campo | Tipo | Obbligatorio | Default | Enum / vincoli | Ref |
| --- | --- | --- | --- | --- | --- |
| `userId` | ObjectId | sì | — | — | User |
| `platform` | String | sì | — | enum: "instagram", "facebook" | — |
| `accountId` | String | sì | — | — | — |
| `username` | String | sì | — | — | — |
| `displayName` | String | no | — | — | — |
| `profilePicture` | String | no | — | — | — |
| `accessToken` | String | sì | — | — | — |
| `tokenExpiry` | Date | sì | — | — | — |
| `status` | String | no | `active` | enum: "active", "expired", "error" | — |
| `permissions` | Array<String> | no | — | — | — |
| `stats.followers` | Number | no | `0` | — | — |
| `stats.following` | Number | no | `0` | — | — |
| `stats.posts` | Number | no | `0` | — | — |
| `stats.lastSync` | Date | no | — | — | — |
| `metadata` | Mixed | no | — | — | — |

Indici:

- `{"accountId":1}` — `{"unique":true,"background":true}`
- `{"userId":1,"platform":1}` — `{"background":true}`
- `{"status":1}` — `{"background":true}`

### SocialAutomation

Collezione: `socialautomations`.

| Campo | Tipo | Obbligatorio | Default | Enum / vincoli | Ref |
| --- | --- | --- | --- | --- | --- |
| `userId` | ObjectId | sì | — | — | User |
| `accountId` | ObjectId | sì | — | — | SocialAccount |
| `name` | String | sì | — | — | — |
| `platform` | String | sì | — | enum: "instagram", "facebook", "linkedin", "twitter", "tiktok" | — |
| `type` | String | sì | — | enum: "comment_reply", "dm_auto", "post_schedule", "lead_capture" | — |
| `trigger.keywords` | Array<String> | no | — | — | — |
| `trigger.conditions` | Mixed | no | — | — | — |
| `action.actionType` | String | no | — | — | — |
| `action.message` | String | no | — | — | — |
| `action.template` | String | no | — | — | — |
| `action.delay` | Number | no | — | — | — |
| `n8nWorkflowId` | String | no | — | — | — |
| `status` | String | no | `draft` | enum: "active", "paused", "draft" | — |
| `stats.triggered` | Number | no | `0` | — | — |
| `stats.successful` | Number | no | `0` | — | — |
| `stats.failed` | Number | no | `0` | — | — |
| `lastTriggered` | Date | no | — | — | — |

Indici:

- `{"userId":1,"accountId":1}` — `{"background":true}`
- `{"accountId":1,"status":1}` — `{"background":true}`

### SocialInteraction

Collezione: `socialinteractions`.

| Campo | Tipo | Obbligatorio | Default | Enum / vincoli | Ref |
| --- | --- | --- | --- | --- | --- |
| `accountId` | ObjectId | sì | — | — | SocialAccount |
| `userId` | ObjectId | no | — | — | User |
| `type` | String | sì | — | enum: "comment_reply", "dm_sent", "post_published", "follow_back", "story_reply", "comment" | — |
| `platform` | String | sì | — | enum: "instagram", "facebook" | — |
| `source.type` | String | no | — | enum: "comment", "follow", "dm", "scheduled", "mention", "story" | — |
| `source.id` | String | no | — | — | — |
| `source.username` | String | no | — | — | — |
| `source.userId` | String | no | — | — | — |
| `source.content` | String | no | — | — | — |
| `source.postUrl` | String | no | — | — | — |
| `action.type` | String | no | — | — | — |
| `action.message` | String | no | — | — | — |
| `action.success` | Boolean | no | `false` | — | — |
| `action.responseId` | String | no | — | — | — |
| `action.error` | String | no | — | — | — |
| `ruleId` | ObjectId | no | — | — | AutomationRule |
| `leadId` | ObjectId | no | — | — | SocialLead |
| `scheduledPostId` | ObjectId | no | — | — | ScheduledPost |
| `metadata` | Mixed | no | — | — | — |
| `commentId` | String | no | — | — | — |
| `automationId` | ObjectId | no | — | — | SocialAutomation |
| `data` | Mixed | no | — | — | — |
| `processedAt` | Date | no | — | — | — |

Indici:

- `{"accountId":1,"createdAt":-1}` — `{"background":true}`
- `{"userId":1,"type":1}` — `{"background":true}`
- `{"action.success":1}` — `{"background":true}`
- `{"createdAt":-1}` — `{"background":true}`
- `{"commentId":1}` — `{"unique":true,"sparse":true,"background":true}`

### SocialLead

Collezione: `socialleads`.

| Campo | Tipo | Obbligatorio | Default | Enum / vincoli | Ref |
| --- | --- | --- | --- | --- | --- |
| `userId` | ObjectId | sì | — | — | User |
| `automationId` | ObjectId | no | — | — | SocialAutomation |
| `platform` | String | sì | — | enum: "instagram", "facebook", "linkedin", "twitter", "tiktok" | — |
| `leadInfo.username` | String | no | — | — | — |
| `leadInfo.userId` | String | no | — | — | — |
| `leadInfo.name` | String | no | — | — | — |
| `leadInfo.profileUrl` | String | no | — | — | — |
| `leadInfo.profilePic` | String | no | — | — | — |
| `interaction` | String | no | — | — | — |
| `response.sent` | Boolean | no | — | — | — |
| `response.message` | String | no | — | — | — |
| `response.sentAt` | Date | no | — | — | — |
| `status` | String | no | `new` | enum: "new", "replied", "converted", "ignored" | — |
| `tags` | Array<String> | no | — | — | — |
| `notes` | String | no | — | — | — |

Indici:

- Solo indice MongoDB predefinito su `_id`.

### WebDesignInterview

Collezione: `webdesigninterviews`.

| Campo | Tipo | Obbligatorio | Default | Enum / vincoli | Ref |
| --- | --- | --- | --- | --- | --- |
| `collaborazione` | ObjectId | no | — | — | CollaborazioneWebDesignV2 |
| `cliente` | ObjectId | no | null | — | Azienda |
| `webDesigner` | ObjectId | sì | — | — | Collaboratore |
| `azienda` | String | no | "" | — | — |
| `interview` | Mixed | no | funzione | — | — |
| `risultatoTxt` | String | no | "" | — | — |
| `aiAnalysis` | Mixed | no | null | — | — |
| `aiRisultatoTxt` | String | no | "" | — | — |
| `aiFollowUpAnswers` | Array<Mixed> | no | `[]` | — | — |
| `aiInputHash` | String | no | "" | — | — |
| `aiPromptVersion` | String | no | "" | — | — |
| `aiModel` | String | no | "" | — | — |
| `aiGeneratedAt` | Date | no | null | — | — |
| `aiInitialAnalysis` | Mixed | no | null | — | — |
| `aiInitialRisultatoTxt` | String | no | "" | — | — |
| `aiInitialInputHash` | String | no | "" | — | — |
| `aiInitialGeneratedAt` | Date | no | null | — | — |
| `aiFinalAnalysis` | Mixed | no | null | — | — |
| `aiFinalRisultatoTxt` | String | no | "" | — | — |
| `aiFinalInputHash` | String | no | "" | — | — |
| `aiFinalGeneratedAt` | Date | no | null | — | — |
| `aiStage` | String | no | `non_generata` | enum: "non_generata", "prima_analisi", "finale" | — |
| `aiInputStale` | Boolean | no | `false` | — | — |
| `aiFinalStale` | Boolean | no | `false` | — | — |
| `autoreId` | String | no | "" | — | — |
| `autoreNome` | String | no | "" | — | — |
| `autoreEmail` | String | no | "" | — | — |
| `autoreRuolo` | String | no | "" | — | — |

Indici:

- `{"cliente":1}` — `{"background":true}`
- `{"webDesigner":1}` — `{"background":true}`
- `{"webDesigner":1,"createdAt":-1}` — `{"background":true}`
- `{"collaborazione":1}` — `{"unique":true,"sparse":true,"background":true}`

