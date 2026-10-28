# Resoconto Schemi MongoDB

Generato da analisi statica dei file in `models/` il 2026-08-13.

Questo file documenta gli schemi Mongoose applicativi presenti nel progetto. Non e una lettura live del database MongoDB, quindi non include collezioni create manualmente o documenti presenti in produzione ma non modellati nel codice.

## Sommario

- File modello analizzati: 42
- Modelli Mongoose esportati: 69
- Area legacy: `models/*.js`
- Area nuova architettura: `models/v3/*.js`
- Schemi duplicati o locali negli script: documentati in fondo, non conteggiati tra i modelli applicativi principali.

## Inventario Rapido

| Area | Modello | File |
| --- | --- | --- |
| Auth e utenti legacy | `Azienda` | `models/User.js` |
| Auth e utenti legacy | `Collaboratore` | `models/User.js` |
| Auth e utenti legacy | `Amministratore` | `models/User.js` |
| Auth e utenti legacy | `Contatto` | `models/User.js` |
| Collaborazioni legacy | `Collaborazione` | `models/Collaborazioni.js` |
| Collaborazioni legacy | `CollaborazioneWebDesign` | `models/Collaborazioniwebdesign.js` |
| Collaborazioni legacy | `CollaborazioneWebDesignV2` | `models/CollaborazioniWebDesignV2.js` |
| Collaborazioni legacy | `GoogleAds` | `models/GoogleAds.js` |
| Note e commerciale | `Nota` | `models/Note.js` |
| Note e commerciale | `NotaComm` | `models/Note-comm.js` |
| Note e commerciale | `LeadCommerciale` | `models/LeadCommerciale.js` |
| Pagamenti legacy | `Pagamenti` | `models/Pagamenti.js` |
| Pagamenti legacy | `Fatturazione` | `models/Fatturazione.js` |
| Pagamenti legacy | `Servizio` | `models/PagamentiNuovi.js` |
| Pagamenti legacy | `PagamentoNuovo` | `models/PagamentiNuovi.js` |
| Knowledge base | `Faq` | `models/Faq.js` |
| Knowledge base | `FaqSuggerite` | `models/FaqSuggerite.js` |
| Knowledge base | `Dispensa` | `models/Dispensa.js` |
| Knowledge base | `DispensaSuggerita` | `models/DispensaSuggerita.js` |
| Operations | `Dominio` | `models/Dominio.js` |
| Operations | `Notifica` | `models/Notifica.js` |
| Operations | `QrCode` | `models/QrCode.js` |
| Operations | `ImageCompression` | `models/ImageCompression.js` |
| Operations | `GooglePlacesUsage` | `models/GooglePlacesUsage.js` |
| Social | `SocialAccount` | `models/SocialAccount.js` |
| Social | `SocialAutomation` | `models/SocialAutomation.js` |
| Social | `AutomationRule` | `models/AutomationRule.js` |
| Social | `SocialInteraction` | `models/SocialInteraction.js` |
| Social | `SocialLead` | `models/SocialLead.js` |
| Social | `ScheduledPost` | `models/ScheduledPost.js` |
| Snapshot e config | `SnapshotCollaborazioni` | `models/SnapshotCollaborazioni.js` |
| Snapshot e config | `ConfigurazioneRagazzi` | `models/ConfigurazioneRagazzi.js` |
| Web design interview | `WebDesignInterview` | `models/WebDesignInterview.js` |
| Hoon Lab | `HoonLabCustomer` | `models/HoonLab.js` |
| Hoon Lab | `HoonLabProduct` | `models/HoonLab.js` |
| Hoon Lab | `HoonLabPriceList` | `models/HoonLab.js` |
| Hoon Lab | `HoonLabPriceListItem` | `models/HoonLab.js` |
| Hoon Lab | `HoonLabQuote` | `models/HoonLab.js` |
| Hoon Lab | `HoonLabOrderConfirmation` | `models/HoonLab.js` |
| Hoon Lab | `HoonLabDeliveryNote` | `models/HoonLab.js` |
| Hoon Lab | `HoonLabPdfTemplate` | `models/HoonLab.js` |
| Hoon Lab | `HoonLabDocumentSequence` | `models/HoonLab.js` |
| Hoon Lab | `HoonLabTodo` | `models/HoonLab.js` |
| Hoon Lab | `HoonLabSettings` | `models/HoonLab.js` |
| V3 core | `AgenziaV3` | `models/v3/Agenzia.js` |
| V3 core | `UserV3` | `models/v3/UserV3.js` |
| V3 core | `AziendaV3` | `models/v3/AziendaV3.js` |
| V3 core | `CollaboratoreProfileV3` | `models/v3/CollaboratoreProfile.js` |
| V3 core | `CollaborazioneV3` | `models/v3/CollaborazioneV3.js` |
| V3 core | `CollaborazioneAssegnazioneV3` | `models/v3/CollaborazioneAssegnazione.js` |
| V3 operations | `NotebookNoteV3` | `models/v3/NotebookNote.js` |
| V3 operations | `CalendarioOperativoV3` | `models/v3/CalendarioOperativo.js` |
| V3 services | `SmmServiceV3` | `models/v3/ServiziOperativi.js` |
| V3 services | `WebDesignServiceV3` | `models/v3/ServiziOperativi.js` |
| V3 services | `SeoServiceV3` | `models/v3/ServiziOperativi.js` |
| V3 services | `GoogleAdsServiceV3` | `models/v3/ServiziOperativi.js` |
| V3 services | `MetaAdsServiceV3` | `models/v3/ServiziOperativi.js` |
| V3 supporto | `ChatThreadV3` | `models/v3/SupportoCliente.js` |
| V3 supporto | `ChatMessageV3` | `models/v3/SupportoCliente.js` |
| V3 supporto | `TicketV3` | `models/v3/SupportoCliente.js` |
| V3 admin | `FileAssetV3` | `models/v3/AdminV3.js` |
| V3 admin | `CredentialVaultItemV3` | `models/v3/AdminV3.js` |
| V3 admin | `DominioV3` | `models/v3/AdminV3.js` |
| V3 admin | `ValutazioneCollaboratoreV3` | `models/v3/AdminV3.js` |
| V3 admin | `ResetLogV3` | `models/v3/AdminV3.js` |
| V3 admin | `KnowledgeItemV3` | `models/v3/AdminV3.js` |
| V3 admin | `AuditLogV3` | `models/v3/AdminV3.js` |
| V3 pagamenti | `PagamentoV3` | `models/v3/PagamentiFattureV3.js` |
| V3 pagamenti | `FatturaCollaboratoreV3` | `models/v3/PagamentiFattureV3.js` |

## Schemi Legacy

### User, Aziende e Collaboratori

#### `Azienda` - `models/User.js`

Cliente/azienda legacy.

- Campi principali: `nome`, `cognome`, `email`, `password`, `partitaIva`, `ragioneSociale`, `etichetta`, `indirizzo`, `pagamento`, `status`, `livelloAccesso`.
- Enum: `status` = `attivo`, `non_attivo`.
- Vincoli: `email` unica, ma non richiesta.
- Timestamp: si.

#### `Collaboratore` - `models/User.js`

Utente operativo legacy.

- Campi principali: `nome`, `cognome`, `email`, `password`, `partitaIva`, `subRoles`, `status`, `noteAmministratore`, `percentuale_hoon`, `tot_fatturato`, `guadagno_da_hoon`, `totale_fatture_terzi`, `livelloAccesso`.
- Enum: `subRoles` = `commerciale`, `smm`, `web designer`, `seo`, `google ads`, `meta ads`.
- Enum: `status` = `attivo`, `non_attivo`.
- Enum: `percentuale_hoon` = `50`, `55`, `60`, `70`.
- Vincoli: `email` unica e richiesta.
- Timestamp: si.

#### `Amministratore` - `models/User.js`

Utente amministrativo legacy.

- Campi principali: `nome`, `cognome`, `email`, `password`, `ruolo`.
- Enum: `ruolo` = `amministratore`, `segretaria`.
- Vincoli: `email` unica e richiesta.
- Timestamp: si.

#### `Contatto` - `models/User.js`

Contatto commerciale generico.

- Campi principali: `referente`, `numero`, `email`, `ragioneSociale`, `indirizzo`, `notes`, `livelloAccesso`.
- Vincoli: `email` unica e richiesta.
- Timestamp: si.

### Collaborazioni e Produzione

#### `Collaborazione` - `models/Collaborazioni.js`

Collaborazione SMM legacy tra azienda e collaboratore.

- Relazioni: `azienda` -> `Azienda`, `collaboratore` -> `Collaboratore`.
- Campi anagrafici duplicati: `aziendaRagioneSociale`, `collaboratoreNome`, `collaboratoreCognome`.
- Campi stato/contratto: `dataInizio`, `dataFine`, `stato`, `note`, `pagato`, `durata_contratto`, `data_inizio_contratto`, `data_fine_contratto`.
- Contatori mensili: `numero_appuntamenti`, `appuntamenti_fatti`, `post_ig_fb`, `post_tiktok`, `post_linkedin`, `post_ig_fb_fatti`, `post_tiktok_fatti`, `post_linkedin_fatti`.
- Contatori totali: `post_totali`, `appuntamenti_totali`, `post_totali_previsti`, `appuntamenti_totali_previsti`.
- Contatori trimestrali: `valutazione_trimestrale_fatti`, `valutazione_trimestrale_totali`, `instagram_trim_fatti`, `instagram_trim_totali`, `tiktok_trim_fatti`, `tiktok_trim_totali`, `linkedin_trim_fatti`, `linkedin_trim_totali`, `appuntamenti_trimestrale_fatti`, `appuntamenti_trimestrale_totali`.
- Flag: `escludi_reset_trimestrale`.
- Enum: `stato` = `attiva`, `terminata`, `in sospeso`; `pagato` = `si`, `no`; `durata_contratto` = `1 mese`, `3 mesi`, `6 mesi`, `1 anno`.
- Timestamp: si.

#### `CollaborazioneWebDesign` - `models/Collaborazioniwebdesign.js`

Collaborazione web design legacy.

- Relazioni: `cliente` -> `Azienda`, `webDesigner` -> `Collaboratore`.
- Campi principali: `tipoProgetto`, `aziendaRagioneSociale`, `collaboratoreNome`, `collaboratoreCognome`, `tasks`, `note`, `problemi`, `stato`, `dataInizioContratto`, `dataFineContratto`, `dominio`.
- `tasks`: `nome`, `dataInizio`, `dataFine`, `tempistica`, `completata`.
- `dominio`: `dataAcquisto`, `dataScadenza`, `urlDominio`, `alertInviato`, `novaAlertData`.
- Enum: `tipoProgetto` = `e-commerce`, `sito vetrina`, `sito starter`.
- Enum: `stato` = `in corso`, `in pausa`, `terminata`.
- Timestamp: si.

#### `CollaborazioneWebDesignV2` - `models/CollaborazioniWebDesignV2.js`

Collaborazione web design legacy evoluta, con fasi, controlli, checklist e intervista.

- Relazioni: `cliente` -> `Azienda`, `webDesigner` -> `Collaboratore`.
- Campi principali: `tipoProgetto`, `aziendaRagioneSociale`, `collaboratoreNome`, `collaboratoreCognome`, `fasi`, `controlli`, `fasiControllo`, `checklistPubblicazione`, `interview`, `interviewPrompt`, `note`, `stato`, `dataInizioContratto`, `dataFineContratto`, `dominio`.
- Sotto-schemi: `TaskV2`, `FaseV2`, `ControlloV2`, `FaseControlloV2`, `ChecklistPubblicazioneV2`, `InterviewV2`.
- Enum: `tipoProgetto` = `vetrina`, `e-commerce`.
- Enum: `stato` = `in corso`, `in pausa`, `terminata`.
- Enum fasi: `struttura`, `stile`, `design`, `consegna`.
- Enum task `appuntamentoTipo` = vuoto, `fisico`, `online`.
- Enum controllo `stato` = vuoto, `da fare`, `in corso`, `ok`, `attenzione`, `critico`.
- Timestamp: si.

#### `GoogleAds` - `models/GoogleAds.js`

Assegnazione/gestione cliente Google Ads legacy.

- Relazioni: `cliente` -> `Azienda`, `collaboratore` -> `Collaboratore`.
- Campi principali: `clienteEtichetta`, `collaboratoreNome`, `collaboratoreCognome`, `contattato`, `campagnaAvviata`, `campagnaTerminata`, `note`.
- Indice unico: `{ cliente: 1, collaboratore: 1 }`.
- Timestamp: si.

### Note e Commerciale

#### `Nota` - `models/Note.js`

Nota collegata a una collaborazione legacy.

- Relazioni: `autoreId` -> `Utenti`, `collaborazione` -> `Collaborazioni`.
- Campi principali: `data`, `nota`, `autore`, `tipo`, `data_appuntamento`, `feeling_emoji`, `feeling_note`.
- Enum: `tipo` = `generico`, `appuntamento`, `problema`, `post_mancante`.
- Enum: `feeling_emoji` = valori emoji piu stringa vuota.
- Regola condizionale: `data_appuntamento` richiesta se `tipo` e `appuntamento`.

#### `NotaComm` - `models/Note-comm.js`

Nota commerciale per appuntamenti e contatti.

- Relazioni: `autoreId` -> `Utenti`.
- Campi principali: `data`, `mainCategoria`, `tipoContatto`, `comeArrivato`, `referal`, `nomeAzienda`, `luogo`, `indirizzo`, `numeroTelefono`, `referente`, `nota`, `autore`, `data_appuntamento`, `luogo_appuntamento`.
- Enum: `mainCategoria` = `appuntamento`, `contatto`.
- Enum: `tipoContatto` = `visita`, `chiamata`.
- Enum: `comeArrivato` = `in azienda`, `chiamata`, `referal`, `ricerca`.
- Regole condizionali: campi contatto richiesti solo se `mainCategoria` e `contatto`; campi appuntamento richiesti solo se `mainCategoria` e `appuntamento`.

#### `LeadCommerciale` - `models/LeadCommerciale.js`

Lead commerciale con timeline operativa.

- Relazioni: `commerciale` -> `Collaboratore`.
- Campi obbligatori: `nome_attivita`, `numero_telefono`, `commerciale`.
- Campi opzionali: `referente`, `indirizzo`, `citta`, `email`, `secondo_numero`, `nota_generale`.
- Timeline: `contatto`, `appuntamento`, `preventivo`, `contratto`, ognuno con `completato` e `data_completamento`.
- Stati speciali: `non_interessato`, `da_ricontattare`.
- Stato globale: `stato_attuale`, `data_cambio_stato`, `data_richiamo`, `archiviato`, `data_archiviazione`.
- Enum: `stato_attuale` = `in_lavorazione`, `non_interessato`, `da_richiamare`, `completato`.
- Indici: `{ commerciale: 1, stato_attuale: 1 }`, `{ commerciale: 1, archiviato: 1 }`, `{ "da_ricontattare.data_ricontatto": 1 }`.
- Timestamp: si.

### Pagamenti Legacy

#### `Pagamenti` - `models/Pagamenti.js`

Pagamento cliente legacy.

- Relazioni: `cliente` -> `Azienda`.
- Campi principali: `data_fattura`, `data_pagato`, `stato`.
- Enum: `stato` = `si`, `no`, `ragazzi`.
- Timestamp: si.

#### `Fatturazione` - `models/Fatturazione.js`

Fattura mensile per collaboratore.

- Relazioni: `collaboratore` -> `Collaboratore`.
- Campi principali: `data`, `mese`, `totale`, `statoCollaboratore`, `statoAmministratore`.
- Enum: `statoCollaboratore` = `non emessa`, `emessa`.
- Enum: `statoAmministratore` = `non pagata`, `pagata`.
- Indice unico: `{ collaboratore: 1, mese: 1 }`.
- Timestamp: si.

#### `Servizio` - `models/PagamentiNuovi.js`

Catalogo servizi personalizzabili.

- Campi principali: `nome`, `attivo`.
- Timestamp: si.

#### `PagamentoNuovo` - `models/PagamentiNuovi.js`

Pagamento unificato entrata/uscita.

- Campi comuni: `tipo`, `importo`, `stato_pagamento`, `data_pagamento`, `mese`, `anno`, `note`, `ricorrente`.
- Campi entrata: `chi_paga`, `destinatario_entrata`, `servizio`, `collaboratori`, `uscite_generate_ids`.
- Campi uscita: `destinatario_tipo`, `destinatario_id`, `nome_destinatario`, `generata_da_entrata`, `entrata_riferimento_id`.
- Sotto-schema collaboratori: `collaboratore_id`, `nome_collaboratore`, `usa_percentuale`, `percentuale`, `cifra_fissa`, `importo_calcolato`.
- Enum: `tipo` = `entrata`, `uscita`.
- Enum: `stato_pagamento` = `pagato`, `non_pagato`, `ragazzi`.
- Enum: `destinatario_entrata` = `hoon`, `collaboratori`.
- Enum: `destinatario_tipo` = `collaboratore`, `azienda_esterna`, `servizio_esterno`.
- Relazioni: `collaboratori.collaboratore_id` -> `Collaboratore`; `uscite_generate_ids` e `entrata_riferimento_id` -> `PagamentoNuovo`.
- Timestamp: si.

### Knowledge Base Legacy

#### `Faq` - `models/Faq.js`

- Campi principali: `categoria`, `titolo`, `testo`, `ordine`, `createdAt`, `updatedAt`.
- Hook: `pre("save")` aggiorna `updatedAt`.

#### `FaqSuggerite` - `models/FaqSuggerite.js`

- Campi principali: `domanda`, `suggeritaDa`, `stato`, `createdAt`.
- `suggeritaDa`: `nome`, `email`, `userId`.
- Enum: `stato` = `in_attesa`, `pubblicata`.

#### `Dispensa` - `models/Dispensa.js`

- Campi principali: `categoria`, `icona`, `item`, `ordine`, `createdAt`, `updatedAt`.
- Hook: `pre("save")` aggiorna `updatedAt`.

#### `DispensaSuggerita` - `models/DispensaSuggerita.js`

- Campi principali: `categoria`, `argomento`, `suggeritaDa`, `stato`, `createdAt`.
- `suggeritaDa`: `nome`, `email`, `userId`.
- Enum: `stato` = `in_attesa`, `pubblicata`.

### Operations Legacy

#### `Dominio` - `models/Dominio.js`

- Campi principali: `urlDominio`, `dataScadenza`, `webDesigner`, `isEsterno`, `note`, `alertInviato`.
- Timestamp: si.

#### `Notifica` - `models/Notifica.js`

- Campi principali: `tipo`, `titolo`, `messaggio`, `letta`, `link`, `refId`.
- Enum: `tipo` = `nota_problema`, `dominio_scadenza`, `fine_mese`.
- Timestamp: si.

#### `QrCode` - `models/QrCode.js`

- Relazioni: `userId` -> `User`.
- Campi principali: `name`, `type`, `value`, `wifiConfig`, `scans`, `lastScan`, `shortUrl`, `createdAt`.
- Enum: `type` = `url`, `text`, `email`, `phone`, `wifi`.
- Enum: `wifiConfig.encryption` = `WPA`, `WEP`, `nopass`.

#### `ImageCompression` - `models/ImageCompression.js`

- Relazioni: `userId` -> `User`.
- Campi principali: `originalName`, `originalSize`, `compressedSize`, `quality`, `savings`, `format`, `createdAt`.
- Enum: `format` = `jpeg`, `png`, `webp`.

#### `GooglePlacesUsage` - `models/GooglePlacesUsage.js`

- Campi principali: `month`, `calls`, `updatedAt`.
- Vincoli: `month` richiesto, unico e indicizzato.
- Hook: `pre("save")` aggiorna `updatedAt`.

#### `ConfigurazioneRagazzi` - `models/ConfigurazioneRagazzi.js`

- Campi principali: `aziende_ragazzi`.
- Relazioni: `aziende_ragazzi[]` -> `Azienda`.
- Timestamp: si.

#### `SnapshotCollaborazioni` - `models/SnapshotCollaborazioni.js`

- Campi principali: `mese`, `anno`, `meseNome`, `data_creazione`, `data_ultimo_aggiornamento`, `collaborazioni_snapshot`, `stato`, `data_export`, `data_completamento`.
- `collaborazioni_snapshot`: `collaborazione_id`, `collaboratore`, `cliente`, contatori appuntamenti/post, `ultimo_aggiornamento`.
- Enum: `stato` = `attivo`, `completato`, `esportato`, `archiviato`.
- Indice: `{ anno: 1, mese: 1 }`.
- Timestamp: si.

#### `WebDesignInterview` - `models/WebDesignInterview.js`

- Relazioni: `webDesigner` -> `Collaboratore`.
- Campi principali: `azienda`, `interview`, `risultatoTxt`, `autoreId`, `autoreNome`, `autoreEmail`, `autoreRuolo`.
- Indici: `webDesigner` indicizzato sul campo; `{ webDesigner: 1, createdAt: -1 }`.
- Timestamp: si.

### Social Legacy

#### `SocialAccount` - `models/SocialAccount.js`

- Relazioni: `userId` -> `User`.
- Campi principali: `platform`, `accountId`, `username`, `displayName`, `profilePicture`, `accessToken`, `tokenExpiry`, `status`, `permissions`, `stats`, `metadata`.
- Enum: `platform` = `instagram`, `facebook`.
- Enum: `status` = `active`, `expired`, `error`.
- Vincoli: `accountId` unico.
- Indici: `{ userId: 1, platform: 1 }`, `{ status: 1 }`.
- Timestamp: si.

#### `SocialAutomation` - `models/SocialAutomation.js`

- Relazioni: `userId` -> `User`, `accountId` -> `SocialAccount`.
- Campi principali: `name`, `platform`, `type`, `trigger`, `action`, `n8nWorkflowId`, `status`, `stats`, `lastTriggered`, `createdAt`.
- Enum: `platform` = `instagram`, `facebook`, `linkedin`, `twitter`, `tiktok`.
- Enum: `type` = `comment_reply`, `dm_auto`, `post_schedule`, `lead_capture`.
- Enum: `status` = `active`, `paused`, `draft`.
- Indici: `{ userId: 1, accountId: 1 }`, `{ accountId: 1, status: 1 }`.

#### `AutomationRule` - `models/AutomationRule.js`

- Relazioni: `accountId` -> `SocialAccount`, `userId` -> `User`.
- Campi principali: `type`, `name`, `enabled`, `trigger`, `action`, `welcomeMessage`, `delay`, `stats`, `settings`.
- Enum: `type` = `comment`, `follow`, `dm`, `mention`.
- Enum: `trigger.matchType` = `any`, `all`, `exact`.
- Enum: `action.type` = `reply_comment`, `send_dm`, `both`.
- Indici: `{ accountId: 1, enabled: 1 }`, `{ userId: 1 }`, `{ type: 1 }`.
- Timestamp: si.

#### `SocialInteraction` - `models/SocialInteraction.js`

- Relazioni: `accountId` -> `SocialAccount`, `userId` -> `User`, `ruleId` -> `AutomationRule`, `leadId` -> `SocialLead`, `scheduledPostId` -> `ScheduledPost`, `automationId` -> `SocialAutomation`.
- Campi principali: `type`, `platform`, `source`, `action`, `metadata`, `commentId`, `data`, `processedAt`.
- Enum: `type` = `comment_reply`, `dm_sent`, `post_published`, `follow_back`, `story_reply`, `comment`.
- Enum: `platform` = `instagram`, `facebook`.
- Enum: `source.type` = `comment`, `follow`, `dm`, `scheduled`, `mention`, `story`.
- Indici: `{ accountId: 1, createdAt: -1 }`, `{ userId: 1, type: 1 }`, `{ "action.success": 1 }`, `{ createdAt: -1 }`, `{ commentId: 1 }` unico sparse.
- Timestamp: si.

#### `SocialLead` - `models/SocialLead.js`

- Relazioni: `userId` -> `User`, `automationId` -> `SocialAutomation`.
- Campi principali: `platform`, `leadInfo`, `interaction`, `response`, `status`, `tags`, `notes`, `createdAt`.
- Enum: `platform` = `instagram`, `facebook`, `linkedin`, `twitter`, `tiktok`.
- Enum: `status` = `new`, `replied`, `converted`, `ignored`.

#### `ScheduledPost` - `models/ScheduledPost.js`

- Relazioni: `accountId` -> `SocialAccount`, `userId` -> `User`.
- Campi principali: `scheduledFor`, `status`, `content`, `publishedAt`, `publishedPostId`, `publishedUrl`, `error`, `retryCount`, `maxRetries`, `analytics`.
- Enum: `status` = `pending`, `processing`, `published`, `failed`, `cancelled`.
- Enum: `content.type` = `image`, `video`, `carousel`, `text`.
- Enum: `content.media.type` = `image`, `video`.
- Indici: `scheduledFor`, `status`, `{ status: 1, scheduledFor: 1 }`, `{ accountId: 1, status: 1 }`, `{ userId: 1, scheduledFor: -1 }`.
- Timestamp: si.

## Hoon Lab

Tutti i modelli Hoon Lab sono definiti in `models/HoonLab.js`.

#### `HoonLabCustomer`

- Campi principali: `name`, `type`, `email`, `phone`, `vatNumber`, `taxCode`, `billingAddress`, `shippingAddress`, `defaultPriceList`, `notes`, `active`.
- Relazioni: `defaultPriceList` -> `HoonLabPriceList`.
- Enum: `type` = `privato`, `team`, `azienda`.
- Timestamp: si.

#### `HoonLabProduct`

- Campi principali: `sku`, `name`, `description`, `basePrice`, `unit`, `category`, `active`.
- Timestamp: si.

#### `HoonLabPriceList`

- Campi principali: `name`, `customerType`, `currency`, `active`.
- Enum: `customerType` = `privato`, `team`, `azienda`, `custom`.
- Timestamp: si.

#### `HoonLabPriceListItem`

- Relazioni: `priceList` -> `HoonLabPriceList`, `product` -> `HoonLabProduct`.
- Campi principali: `price`, `validFrom`, `validTo`, `notes`.
- Indici: `{ priceList: 1, product: 1, validFrom: -1 }`, `{ priceList: 1, product: 1, validTo: 1 }`.
- Timestamp: si.

#### `HoonLabQuote`

- Relazioni: `customer` -> `HoonLabCustomer`, `priceList` -> `HoonLabPriceList`, `convertedOrder` -> `HoonLabOrderConfirmation`.
- Campi principali: `number`, `customerSnapshot`, `priceListSnapshot`, `status`, `issueDate`, `validUntil`, `lines`, sconti/totali, `notes`, `pdfUrl`, `rejectionReason`, `rejectedAt`, `acceptedAt`.
- Enum: `status` = `bozza`, `inviato`, `accettato`, `rifiutato`, `scaduto`, `convertito`.
- Vincoli: `number` unico.
- Indici: `{ customer: 1, status: 1 }`, `{ issueDate: -1 }`.
- Timestamp: si.

#### `HoonLabOrderConfirmation`

- Relazioni: `quote` -> `HoonLabQuote`, `customer` -> `HoonLabCustomer`.
- Campi principali: `number`, `customerSnapshot`, `status`, `issueDate`, `lines`, sconti/totali, `notes`, `pdfUrl`.
- Enum: `status` = `bozza`, `confermato`, `ddt_generato`, `annullato`.
- Vincoli: `number` unico.
- Indici: `{ customer: 1, status: 1 }`, `{ issueDate: -1 }`.
- Timestamp: si.

#### `HoonLabDeliveryNote`

- Relazioni: `quote` -> `HoonLabQuote`, `orderConfirmation` -> `HoonLabOrderConfirmation`, `customer` -> `HoonLabCustomer`.
- Campi principali: `number`, `customerSnapshot`, `shippingAddressSnapshot`, `reason`, `status`, `issueDate`, `lines`, `notes`, `pdfUrl`.
- Enum: `status` = `bozza`, `emesso`, `annullato`.
- Vincoli: `number` unico.
- Indici: `{ customer: 1, status: 1 }`, `{ issueDate: -1 }`.
- Timestamp: si.

#### `HoonLabPdfTemplate`

- Campi principali: `type`, `name`, `html`, `css`, `active`.
- Enum: `type` = `quote`, `order_confirmation`, `delivery_note`.
- Timestamp: si.

#### `HoonLabDocumentSequence`

- Campi principali: `documentType`, `year`, `prefix`, `nextNumber`.
- Enum: `documentType` = `quote`, `order_confirmation`, `delivery_note`.
- Indice unico: `{ documentType: 1, year: 1 }`.
- Timestamp: si.

#### `HoonLabTodo`

- Campi principali: `note`, `dueDate`, `status`, `statusChangedAt`, `statusHistory`, `active`.
- Enum: `status` = `da_fare`, `in_lavorazione`, `fatta`.
- Indici: `{ status: 1, dueDate: 1 }`, `{ active: 1, createdAt: -1 }`.
- Timestamp: si.

#### `HoonLabSettings`

- Campi principali: `key`, `companyName`, `companyHeader`, `quoteNoteTitle`, `quoteNote`.
- Vincoli: `key` unico.
- Timestamp: si.

## Schemi V3

I modelli V3 sono pensati per una struttura multi-agenzia. Quasi tutti hanno `agenziaId` e riferimenti espliciti a `UserV3`, `AziendaV3`, `CollaborazioneV3`.

### Costanti V3

Definite in `models/v3/constants.js`.

- `USER_TYPES`: `agenzia`, `amministrazione`, `segretaria`, `collaboratore`, `azienda`.
- `COLLABORATOR_SUB_ROLES`: `smm`, `web_designer`, `seo`, `google_ads`, `meta_ads`, `commerciale`.
- `COLLABORATION_TYPES`: `smm`, `web_design`, `seo`, `google_ads`, `meta_ads`, `commerciale`, `mista`.
- `PERMISSIONS`: permessi granulari per agenzia, utenti, collaborazioni, pagamenti, domini, credenziali, ticket, chat, knowledge e operations.
- `ROLE_PERMISSION_PRESETS`: preset permessi per tipo utente.

### Core V3

#### `AgenziaV3` - `models/v3/Agenzia.js`

- Campi principali: `nome`, `ragioneSociale`, `partitaIva`, `codiceFiscale`, `codiceUnivoco`, `pec`, `email`, `telefono`, `sitoWeb`, `indirizzo`, `logoUrl`, `impostazioni`, `billing`, `createdBy`, `updatedBy`.
- Indice unico: `{ email: 1 }`.
- Timestamp: si.

#### `UserV3` - `models/v3/UserV3.js`

- Relazioni: `agenziaId` -> `AgenziaV3`, `createdBy`/`updatedBy` -> `UserV3`.
- Campi principali: `tipo`, `nome`, `cognome`, `displayName`, `email`, `telefono`, `passwordHash`, `avatarUrl`, `stato`, `subRoles`, `permissions`, `ultimoAccessoAt`, `preferenze`, `sicurezza`.
- Enum: `tipo` = `USER_TYPES`.
- Enum: `subRoles` = `COLLABORATOR_SUB_ROLES`.
- Enum: `permissions` = `PERMISSIONS`.
- Enum: `stato` = `attivo`, `sospeso`, `disattivato`.
- Indice unico: `{ agenziaId: 1, email: 1 }`.
- Indice: `{ agenziaId: 1, tipo: 1, stato: 1 }`.
- Timestamp: si.

#### `AziendaV3` - `models/v3/AziendaV3.js`

- Relazioni: `agenziaId` -> `AgenziaV3`, `utentiPortale[]` -> `UserV3`, `commercialeOwner` -> `UserV3`, `createdBy`/`updatedBy` -> `UserV3`.
- Campi principali: `ragioneSociale`, `etichetta`, `partitaIva`, `codiceFiscale`, `codiceUnivoco`, `pec`, `email`, `telefono`, `sitoWeb`, `settore`, `descrizioneAttivita`, `indirizzoLegale`, `indirizzoOperativo`, `referenti`, `statoCliente`, `origine`, `tags`, `noteInterne`, `privacy`.
- Enum: `statoCliente` = `lead`, `attivo`, `in pausa`, `ex_cliente`.
- Enum: `origine` = `commerciale`, `referal`, `chiamata`, `ricerca`, `social`, `altro`.
- Indici: `{ agenziaId: 1, ragioneSociale: 1 }`, `{ agenziaId: 1, partitaIva: 1 }`.
- Timestamp: si.

#### `CollaboratoreProfileV3` - `models/v3/CollaboratoreProfile.js`

- Relazioni: `userId` -> `UserV3`, `agenziaId` -> `AgenziaV3`, `createdBy`/`updatedBy` -> `UserV3`.
- Campi principali: `partitaIva`, `codiceFiscale`, `iban`, `intestatarioConto`, `indirizzo`, `subRoles`, `competenze`, `seniority`, `disponibilitaSettimanaleOre`, `costoOrario`, `percentualeDefault`, `percentuale_hoon`, `statoOperativo`, `noteAmministratore`, `metriche`.
- Enum: `seniority` = `junior`, `middle`, `senior`, `lead`.
- Enum: `percentuale_hoon` = `50`, `55`, `60`, `70`.
- Enum: `statoOperativo` = `attivo`, `non_attivo`, `in pausa`.
- Vincoli: `userId` unico.
- Timestamp: si.

#### `CollaborazioneV3` - `models/v3/CollaborazioneV3.js`

- Relazioni: `agenziaId` -> `AgenziaV3`, `aziendaId` -> `AziendaV3`, `team.collaboratoreId` -> `UserV3`, `notebookId` -> `NotebookV3`, `calendarioId` -> `CalendarioOperativoV3`, `chatId` -> `ChatThreadV3`, `createdBy`/`updatedBy` -> `UserV3`.
- Campi principali: `titolo`, `tipo`, `stato`, `priorita`, `dataInizio`, `dataFine`, `contratto`, `team`, `servizi`, `avanzamento`, `legacyRef`.
- Enum: `tipo` = `COLLABORATION_TYPES`.
- Enum: `stato` = `bozza`, `attiva`, `in pausa`, `terminata`, `archiviata`.
- Enum: `priorita` = `bassa`, `media`, `alta`, `critica`.
- Enum: `team.ruoloNelProgetto` = `owner`, `operativo`, `supporto`, `reviewer`.
- Enum: `legacyRef.model` = `Collaborazione`, `CollaborazioneWebDesignV2`, `GoogleAds`, stringa vuota.
- Indici: `{ agenziaId: 1, aziendaId: 1, stato: 1 }`, `{ "team.collaboratoreId": 1, stato: 1 }`.
- Timestamp: si.

#### `CollaborazioneAssegnazioneV3` - `models/v3/CollaborazioneAssegnazione.js`

- Relazioni: `collaborazioneId` -> `CollaborazioneV3`, `aziendaId` -> `AziendaV3`, `collaboratoreId` -> `UserV3`, `assegnatoDa` -> `UserV3`.
- Campi principali: `subRole`, `stato`, `dataInizio`, `dataFine`, `percentuale`, `cifraFissa`, `permessiCollaborazione`, `motivoSpostamento`.
- Enum: `subRole` = `COLLABORATOR_SUB_ROLES`.
- Enum: `stato` = `attiva`, `sospesa`, `terminata`.
- Enum: `permessiCollaborazione` = `read`, `update_status`, `manage_posts`, `manage_calendar`, `manage_notes`, `manage_ads`, `reply_chat`, `manage_tickets`.
- Indice: `{ collaborazioneId: 1, collaboratoreId: 1, subRole: 1, stato: 1 }`.
- Timestamp: si.

### Operations V3

#### `NotebookNoteV3` - `models/v3/NotebookNote.js`

- Relazioni: `agenziaId` -> `AgenziaV3`, `aziendaId` -> `AziendaV3`, `collaborazioneId` -> `CollaborazioneV3`, `autoreId` -> `UserV3`, `allegati[]` -> `FileAssetV3`, `mentions[]` -> `UserV3`.
- Campi principali: `visibilita`, `tipo`, `titolo`, `contenuto`, `dataAppuntamento`, `statoProblema`, `feeling`.
- Enum: `visibilita` = `interna`, `cliente`, `team`.
- Enum: `tipo` = `generale`, `appuntamento`, `problema`, `decisione`, `post_mancante`, `follow_up`.
- Enum: `statoProblema` = stringa vuota, `aperto`, `in_lavorazione`, `risolto`.
- Indici: `{ agenziaId: 1, aziendaId: 1, createdAt: -1 }`, `{ collaborazioneId: 1, tipo: 1, createdAt: -1 }`.
- Timestamp: si.

#### `CalendarioOperativoV3` - `models/v3/CalendarioOperativo.js`

- Relazioni: `agenziaId` -> `AgenziaV3`, `collaborazioneId` -> `CollaborazioneV3`, `aziendaId` -> `AziendaV3`, `items.assegnatoA[]` -> `UserV3`.
- Campi principali: `items`.
- `items`: `titolo`, `descrizione`, `tipo`, `dataInizio`, `dataFine`, `giornoOperativo`, `assegnatoA`, `stato`, `priorita`, `note`.
- Enum: `items.tipo` = `task`, `appuntamento`, `scadenza`, `controllo`, `pubblicazione`.
- Enum: `items.stato` = `da_fare`, `in_corso`, `bloccato`, `completato`.
- Enum: `items.priorita` = `bassa`, `media`, `alta`, `critica`.
- Indice unico: `{ collaborazioneId: 1 }`.
- Timestamp: si.

### Servizi Operativi V3

Tutti definiti in `models/v3/ServiziOperativi.js`.

#### `SmmServiceV3`

- Relazioni: `collaborazioneId` -> `CollaborazioneV3`, `agenziaId` -> `AgenziaV3`, `aziendaId` -> `AziendaV3`, `storicoReset[]` -> `ResetLogV3`.
- Campi principali: `piattaforme`, `pianoEditoriale`, `contatoriMensili`, `contatoriTrimestrali`.
- Enum: `piattaforme` = `instagram`, `facebook`, `tiktok`, `linkedin`.
- Vincoli: `collaborazioneId` unico.
- Timestamp: si.

#### `WebDesignServiceV3`

- Relazioni: `collaborazioneId` -> `CollaborazioneV3`, `agenziaId` -> `AgenziaV3`, `aziendaId` -> `AziendaV3`, `dominioId` -> `DominioV3`.
- Campi principali: `tipoProgetto`, `fasi`, `controlli`, `checklistPubblicazione`, `interview`, `ambiente`, `consegna`.
- Enum: `tipoProgetto` = `starter`, `vetrina`, `e-commerce`, `custom`.
- Vincoli: `collaborazioneId` unico.
- Timestamp: si.

#### `SeoServiceV3`

- Relazioni: `collaborazioneId` -> `CollaborazioneV3`, `agenziaId` -> `AgenziaV3`, `aziendaId` -> `AziendaV3`.
- Campi principali: `audit`, `keyword`, `pagineOttimizzate`, `taskMensili`, `reportMensili`.
- Enum: `audit.stato` = `non_avviato`, `in_corso`, `completato`.
- Enum: `keyword.priorita` = `bassa`, `media`, `alta`.
- Enum: `pagineOttimizzate.stato` = `da_fare`, `in_corso`, `completata`.
- Vincoli: `collaborazioneId` unico.
- Timestamp: si.

#### `GoogleAdsServiceV3`

- Relazioni: `collaborazioneId` -> `CollaborazioneV3`, `agenziaId` -> `AgenziaV3`, `aziendaId` -> `AziendaV3`.
- Campi principali: `accountId`, `customerId`, `budgetMensile`, `obiettivo`, `campagne`, `statoOperativo`, `note`.
- Enum: `obiettivo` = `lead`, `vendite`, `traffico`, `brand`.
- Enum: `statoOperativo` = `da_contattare`, `setup`, `attiva`, `in_pausa`, `terminata`.
- Vincoli: `collaborazioneId` unico.
- Timestamp: si.

#### `MetaAdsServiceV3`

- Relazioni: `collaborazioneId` -> `CollaborazioneV3`, `agenziaId` -> `AgenziaV3`, `aziendaId` -> `AziendaV3`, `creativita.fileAssetId` -> `FileAssetV3`.
- Campi principali: `businessManagerId`, `adAccountId`, `pixelId`, `budgetMensile`, `obiettivo`, `campagne`, `creativita`, `statoOperativo`, `note`.
- Enum: `creativita.stato` = `bozza`, `approvata`, `pubblicata`, `archiviata`.
- Enum: `statoOperativo` = `da_contattare`, `setup`, `attiva`, `in_pausa`, `terminata`.
- Vincoli: `collaborazioneId` unico.
- Timestamp: si.

### Supporto Cliente V3

#### `ChatThreadV3` - `models/v3/SupportoCliente.js`

- Relazioni: `agenziaId` -> `AgenziaV3`, `aziendaId` -> `AziendaV3`, `collaborazioneId` -> `CollaborazioneV3`, `partecipanti[]` -> `UserV3`.
- Campi principali: `visibilita`, `ultimoMessaggioAt`.
- Enum: `visibilita` = `cliente_team`, `interna`.
- Timestamp: si.

#### `ChatMessageV3` - `models/v3/SupportoCliente.js`

- Relazioni: `threadId` -> `ChatThreadV3`, `autoreId` -> `UserV3`, `allegati[]` -> `FileAssetV3`, `lettoDa.userId` -> `UserV3`.
- Campi principali: `testo`, `lettoDa`.
- Indice: `{ threadId: 1, createdAt: 1 }`.
- Timestamp: si.

#### `TicketV3` - `models/v3/SupportoCliente.js`

- Relazioni: `agenziaId` -> `AgenziaV3`, `aziendaId` -> `AziendaV3`, `collaborazioneId` -> `CollaborazioneV3`, `apertoDa` -> `UserV3`, `assegnatoA[]` -> `UserV3`, `messaggi[]` -> `ChatMessageV3`.
- Campi principali: `titolo`, `descrizione`, `categoria`, `priorita`, `stato`, `closedAt`.
- Enum: `categoria` = `assistenza`, `bug`, `contenuti`, `dominio`, `pagamento`, `altro`.
- Enum: `priorita` = `bassa`, `media`, `alta`, `urgente`.
- Enum: `stato` = `aperto`, `in_lavorazione`, `in_attesa_cliente`, `risolto`, `chiuso`.
- Indice: `{ agenziaId: 1, stato: 1, priorita: 1 }`.
- Timestamp: si.

### Admin V3

Tutti definiti in `models/v3/AdminV3.js`.

#### `FileAssetV3`

- Relazioni: `agenziaId` -> `AgenziaV3`, `ownerId` -> `UserV3`, `aziendaId` -> `AziendaV3`, `collaborazioneId` -> `CollaborazioneV3`.
- Campi principali: `nome`, `mimeType`, `size`, `url`, `categoria`.
- Timestamp: si.

#### `CredentialVaultItemV3`

- Relazioni: `agenziaId` -> `AgenziaV3`, `aziendaId` -> `AziendaV3`, `collaborazioneId` -> `CollaborazioneV3`, `visibileA[]` -> `UserV3`, `createdBy`/`updatedBy` -> `UserV3`.
- Campi principali: `titolo`, `categoria`, `url`, `username`, `passwordEncrypted`, `noteEncrypted`, `ultimoAccessoAt`.
- Enum: `categoria` = `dominio`, `hosting`, `wordpress`, `social`, `ads`, `email`, `altro`.
- Timestamp: si.

#### `DominioV3`

- Relazioni: `agenziaId` -> `AgenziaV3`, `aziendaId` -> `AziendaV3`, `collaborazioneId` -> `CollaborazioneV3`, `webDesignerId` -> `UserV3`, `credenzialeId` -> `CredentialVaultItemV3`.
- Campi principali: `registrar`, `urlDominio`, `dataAcquisto`, `dataScadenza`, `rinnovoAutomatico`, `stato`, `note`, `alertInviati`.
- Enum: `stato` = `attivo`, `in_scadenza`, `scaduto`, `trasferito`.
- Indice unico: `{ agenziaId: 1, urlDominio: 1 }`.
- Timestamp: si.

#### `ValutazioneCollaboratoreV3`

- Relazioni: `agenziaId` -> `AgenziaV3`, `collaboratoreId` -> `UserV3`, `valutatoreId` -> `UserV3`.
- Campi principali: `periodo`, `ruoloValutato`, `metriche`, `kpi`, `note`, `esito`, `azioniRichieste`.
- Enum: `periodo.tipo` = `mensile`, `trimestrale`.
- Enum: `ruoloValutato` = `COLLABORATOR_SUB_ROLES`.
- Enum: `esito` = `ottimo`, `buono`, `sufficiente`, `critico`.
- Indice unico: `{ collaboratoreId: 1, "periodo.tipo": 1, "periodo.anno": 1, "periodo.trimestre": 1, "periodo.mese": 1, ruoloValutato: 1 }`.
- Timestamp: si.

#### `ResetLogV3`

- Relazioni: `agenziaId` -> `AgenziaV3`, `target.collaborazioneIds[]` -> `CollaborazioneV3`, `target.collaboratoreIds[]` -> `UserV3`, `eseguitoDa` -> `UserV3`.
- Campi principali: `tipo`, `periodo`, `target`, `snapshotPrima`, `snapshotDopo`, `eseguitoAt`, `note`.
- Enum: `tipo` = `mensile`, `trimestrale`, `valutazione`.
- Timestamp: si.

#### `KnowledgeItemV3`

- Relazioni: `agenziaId` -> `AgenziaV3`, `suggeritoDa` -> `UserV3`, `approvatoDa` -> `UserV3`.
- Campi principali: `tipo`, `titolo`, `contenuto`, `categoria`, `tags`, `fileUrl`, `visibileA`, `subRolesVisibili`, `stato`, `ordine`.
- Enum: `tipo` = `dispensa`, `faq`, `operation`.
- Enum: `visibileA` = `admin`, `collaboratori`, `aziende`.
- Enum: `subRolesVisibili` = `COLLABORATOR_SUB_ROLES`.
- Enum: `stato` = `bozza`, `pubblicato`, `archiviato`.
- Timestamp: si.

#### `AuditLogV3`

- Relazioni: `agenziaId` -> `AgenziaV3`, `actorId` -> `UserV3`.
- Campi principali: `azione`, `entityType`, `entityId`, `before`, `after`, `ip`, `userAgent`.
- Timestamp: solo `createdAt`, senza `updatedAt`.

### Pagamenti e Fatture V3

#### `PagamentoV3` - `models/v3/PagamentiFattureV3.js`

- Relazioni: `agenziaId` -> `AgenziaV3`, `aziendaId` -> `AziendaV3`, `collaborazioneId` -> `CollaborazioneV3`, `assegnazioneId` -> `CollaborazioneAssegnazioneV3`, `allegati[]` -> `FileAssetV3`, `createdBy`/`updatedBy` -> `UserV3`.
- Campi principali: `tipo`, `importo`, `stato_pagamento`, `servizio`, `numeroDocumento`, `dataCompetenzaDa`, `dataCompetenzaA`, `data_pagamento`, `scadenzaPagamento`, `mese`, `anno`, `metodoPagamento`, `note`.
- Enum: `tipo` = `entrata`, `uscita`.
- Enum: `stato_pagamento` = `pagato`, `non_pagato`, `ragazzi`.
- Indice: `{ agenziaId: 1, tipo: 1, anno: 1, mese: 1 }`.
- Timestamp: si.

#### `FatturaCollaboratoreV3` - `models/v3/PagamentiFattureV3.js`

- Relazioni: `agenziaId` -> `AgenziaV3`, `collaboratoreId` -> `UserV3`, `collaborazioneIds[]` -> `CollaborazioneV3`, `assegnazioneIds[]` -> `CollaborazioneAssegnazioneV3`.
- Campi principali: `mese`, `totale`, `numeroFattura`, `dataEmissione`, `dataScadenza`, `statoCollaboratore`, `statoAmministratore`, `fileUrl`, `noteAdmin`.
- Enum: `statoCollaboratore` = `non emessa`, `emessa`.
- Enum: `statoAmministratore` = `non pagata`, `pagata`.
- Indice unico: `{ collaboratoreId: 1, mese: 1 }`.
- Timestamp: si.

## Sotto-Schemi Importanti

Questi non sono modelli esportati come collezioni autonome, ma strutture annidate usate dai modelli.

- `AddressSchema`: usato in Hoon Lab, `AgenziaV3`, `AziendaV3`, `CollaboratoreProfileV3`.
- `ReferenteSchema`: usato in `AziendaV3.referenti`.
- `TeamMemberSchema`: usato in `CollaborazioneV3.team`.
- `ServizioCollaborazioneSchema`: usato in `CollaborazioneV3.servizi`.
- `TaskSchema`, `KpiSchema`, `CampagnaAdsSchema`: usati nei servizi operativi V3.
- `CalendarioItemSchema`: usato in `CalendarioOperativoV3.items`.
- `StatoTimelineSchema`: usato in `LeadCommerciale.timeline`.
- `TaskV2Schema`, `FaseV2Schema`, `ControlloV2Schema`, `FaseControlloV2Schema`, `ChecklistPubblicazioneV2Schema`, `InterviewV2Schema`: usati in `CollaborazioneWebDesignV2`.
- `CommercialLineSchema`, `DeliveryNoteLineSchema`, `TodoStatusHistorySchema`: usati in Hoon Lab.
- `CollaboratorePagamentoSchema`: usato in `PagamentoNuovo`.

## Relazioni Principali

- Legacy:
  - `Azienda` e `Collaboratore` sono i nodi centrali per `Collaborazione`, `CollaborazioneWebDesign`, `CollaborazioneWebDesignV2`, `GoogleAds`, `Pagamenti`, `Fatturazione`, `LeadCommerciale`.
  - I modelli social ruotano attorno a `User`, `SocialAccount`, `AutomationRule`, `SocialAutomation`, `ScheduledPost`, `SocialLead`, `SocialInteraction`.
  - Hoon Lab ha un sottodominio quasi autonomo: clienti, prodotti, listini, preventivi, ordini, DDT, template PDF, sequenze e todo.
- V3:
  - `AgenziaV3` e il tenant principale.
  - `UserV3`, `AziendaV3`, `CollaborazioneV3` sono il nucleo.
  - I servizi V3 sono documenti separati per area operativa e puntano a una `CollaborazioneV3`.
  - `FileAssetV3`, `CredentialVaultItemV3`, `DominioV3`, `NotebookNoteV3`, `CalendarioOperativoV3`, `ChatThreadV3`, `TicketV3`, `PagamentoV3` aggiungono funzioni operative attorno al nucleo.

## Indici e Vincoli Notevoli

- `Azienda.email`, `Collaboratore.email`, `Amministratore.email`, `Contatto.email`: unici nei modelli legacy dove dichiarato.
- `GoogleAds`: unico su coppia `{ cliente, collaboratore }`.
- `Fatturazione`: unico su `{ collaboratore, mese }`.
- `GooglePlacesUsage.month`: unico e indicizzato.
- `SocialAccount.accountId`: unico.
- `SocialInteraction.commentId`: unico sparse.
- Hoon Lab:
  - `HoonLabQuote.number`, `HoonLabOrderConfirmation.number`, `HoonLabDeliveryNote.number`, `HoonLabSettings.key`: unici.
  - `HoonLabDocumentSequence`: unico su `{ documentType, year }`.
- V3:
  - `AgenziaV3.email`: unico.
  - `UserV3`: unico su `{ agenziaId, email }`.
  - `CollaboratoreProfileV3.userId`: unico.
  - Servizi operativi V3: `collaborazioneId` unico per ogni servizio.
  - `CalendarioOperativoV3`: unico su `collaborazioneId`.
  - `DominioV3`: unico su `{ agenziaId, urlDominio }`.
  - `ValutazioneCollaboratoreV3`: unico per collaboratore, periodo e ruolo.
  - `FatturaCollaboratoreV3`: unico su `{ collaboratoreId, mese }`.

## Schemi Locali Dentro Script

Questi file dichiarano schemi Mongoose locali per operazioni puntuali. Non sono considerati modelli applicativi canonici perche vivono in `scripts/`.

- `scripts/test-gestione-domini.js`: schema locale `CollaborazioneWebDesign`.
- `scripts/cron-domini-scadenza.js`: schemi locali `CollaborazioneWebDesign` e `Collaboratore`.
- `scripts/fix-ig-account-ids.js`: schema locale `SocialAccount`.
- `scripts/init-valutazione-trimestrale.js`: schema locale `CollaborazioneInit`.
- `scripts/import-domini.js`: schema locale `Dominio`.

## Note di Coerenza Da Verificare

- In `models/Note.js`, `autoreId` usa `ref: "Utenti"` e `collaborazione` usa `ref: "Collaborazioni"`. Nei modelli principali i nomi esportati sono `Azienda`, `Collaboratore`, `Amministratore`, `Contatto` e `Collaborazione`; se `Utenti`/`Collaborazioni` non esistono come modelli altrove, queste ref potrebbero non popolarsi correttamente.
- In `models/Note-comm.js`, `autoreId` usa `ref: "Utenti"`, con la stessa nota di coerenza.
- In `models/v3/CollaborazioneV3.js`, `notebookId` usa `ref: "NotebookV3"`, ma il modello presente e `NotebookNoteV3`; potrebbe mancare un modello notebook contenitore oppure il ref potrebbe essere storico/anticipato.
- Coesistono tre varianti per il web design: `CollaborazioneWebDesign`, `CollaborazioneWebDesignV2`, `WebDesignServiceV3`. Prima di migrare dati, conviene definire chiaramente quale resta fonte autoritativa.
- Coesistono piu sistemi pagamenti: `Pagamenti`, `Fatturazione`, `PagamentoNuovo`, `PagamentoV3`, `FatturaCollaboratoreV3`. Anche qui serve una regola di ownership dati per evitare doppio conteggio.
- Alcuni modelli usano `createdAt`/`updatedAt` manuali, altri `timestamps: true`; questa differenza puo incidere su query ordinate per aggiornamento.

