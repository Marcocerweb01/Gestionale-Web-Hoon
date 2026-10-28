# Piano di migrazione database V3

Audit eseguito in sola lettura il 2026-10-19 sul database MongoDB `Webarea`.

## Esito sintetico

- 51 collezioni live, 5.551 documenti complessivi.
- Nessuna collezione ha un validator MongoDB server-side: oggi i vincoli esistono solo nei modelli Mongoose.
- 50 modelli legacy sono documentati campo per campo in `SCHEMA_DATI_LEGACY_COMPLETO.md`.
- 32 entità target sono documentate campo per campo in `SCHEMA_DATI_V3_CANONICO.md`.
- Il dry-run finale del migratore è terminato con exit code `0`, senza scritture, senza record scartati e senza warning.
- 137 note SMM puntano a collaborazioni non più presenti: vengono conservate come note orfane, non eliminate.
- Un record nota senza contenuto viene conservato con un marcatore esplicito.
- Le 132 aziende legacy restano 132 aziende V3. Non vengono fuse automaticamente per nome o partita IVA.
- Tre email cliente sono condivise: diventano tre account riutilizzati e collegati a più aziende tramite `UserV3.aziendaIds`.
- Gli 801 pagamenti legacy non contengono l'importo: vengono migrati con `importo: null` e `importoConfermato: false`; è obbligatoria la riconciliazione prima del cut-over contabile.
- 49 fatture collaboratore su 50 non contengono il totale: sono migrate senza inventare importi e marcate per riconciliazione.

## Inventario live e destinazione

### Identità, aziende e collaborazioni

| Collezione sorgente | Documenti | Destinazione / decisione |
| --- | ---: | --- |
| `amministratores` | 7 | `UserV3` (`amministrazione` o `segretaria`) |
| `aziendas` | 132 | `AziendaV3` uno-a-uno; eventuale account in `UserV3` |
| `collaboratores` | 23 | `UserV3` + `CollaboratoreProfileV3` |
| `contattos` | 0 | Nessun dato; modello dismesso |
| `users` | 0 | Collezione storica vuota; modello dismesso |
| `collaboraziones` | 105 | `CollaborazioneV3` + `CollaborazioneAssegnazioneV3` + `SmmServiceV3` |
| `collaborazionewebdesignv2` | 6 | `CollaborazioneV3` + assegnazione + `WebDesignServiceV3` |
| `googleads` | 2 | `CollaborazioneV3` + assegnazione + `GoogleAdsServiceV3` |
| `collaborazioneseos` | 2 | Da aggiungere al migratore: `CollaborazioneV3` + `SeoServiceV3` |
| `collaborazionewebdesigns` | 4 | Da aggiungere al migratore o archiviare dopo confronto con V2 |
| `webdesigninterviews` | 3 | Da collegare a `WebDesignServiceV3.interview` mantenendo lo storico |
| `removedwebdesignprojects` | 17 | Archivio storico non modellato; esportare JSON firmato, non importare nel dominio attivo |

### CRM, note e knowledge base

| Collezione sorgente | Documenti | Destinazione / decisione |
| --- | ---: | --- |
| `leadcommerciales` | 253 | `AziendaV3` + `LeadCommercialeV3`; timeline preservata |
| `notas` | 1.650 | `NotebookNoteV3`; incluse 137 note orfane |
| `notacomms` | 1.294 | `NotebookNoteV3`; aziende/lead risolti per chiave naturale |
| `dispensas` | 225 | Da aggiungere: `KnowledgeItemV3` tipo `dispensa` |
| `dispensasuggeritas` | 1 | Da aggiungere: `KnowledgeItemV3` in stato bozza |
| `faqs` | 10 | Da aggiungere: `KnowledgeItemV3` tipo `faq` |
| `faqsuggerites` | 1 | Da aggiungere: `KnowledgeItemV3` in stato bozza |

### Eventi, notifiche e operations

| Collezione sorgente | Documenti | Destinazione / decisione |
| --- | ---: | --- |
| `eventos` | 1 | `EventoV3` |
| `disponibilitaeventos` | 3 | `DisponibilitaEventoV3`, risposte per giornata preservate |
| `assegnazioneeventos` | 0 | `AssegnazioneEventoV3`; nessun dato da copiare |
| `configurazioneragazzis` | 1 | `AziendaV3.gestioneEconomica.incassoDestinatoA` per 6 aziende |
| `dominios` | 32 | `DominioV3` |
| `notificas` | 224 | `NotificaV3` |
| `notificationdeliveries` | 2 | `NotificationDeliveryV3` |
| `qrcodes` | 14 | Seconda fase: aggiungere tenant e sostituire i ref `User` non esistenti |
| `imagecompressions` | 207 | Seconda fase: aggiungere tenant e sostituire i ref `User` non esistenti |
| `googleplacesusages` | 1 | Mantenere come metrica tecnica di agenzia o migrare in una collection usage V3 |
| `snapshotcollaborazionis` | 5 | Archivio audit; convertibile in `ResetLogV3`, non fonte operativa |

### Economico

| Collezione sorgente | Documenti | Destinazione / decisione |
| --- | ---: | --- |
| `pagamentis` | 801 | `PagamentoV3`, importo sconosciuto da riconciliare |
| `fatturaziones` | 50 | `FatturaCollaboratoreV3`, anno/mese separati |
| `servizios` | 9 | `CatalogoServizioV3` |
| `pagamentonuovos` | 0 | Nessun dato; modello sostituito da `PagamentoV3` |
| `pagamentos` | 0 | Collezione vuota; verificare origine prima di eliminarla |

### Social automation

| Collezione sorgente | Documenti | Destinazione / decisione |
| --- | ---: | --- |
| `socialaccounts` | 6 | Mantenere temporaneamente; aggiungere `agenziaId` e correggere `userId -> UserV3` |
| `socialautomations` | 7 | Mantenere temporaneamente; aggiungere tenant |
| `socialinteractions` | 0 | Nessun dato; schema corretto rimuovendo l'indice duplicato `commentId` |
| `socialleads` | 0 | Nessun dato |

Le collection previste dai model `AutomationRule` e `ScheduledPost` non sono presenti nel database live.

### Hoon Lab

| Collezione sorgente | Documenti | Decisione |
| --- | ---: | --- |
| `hoonlabcustomers` | 16 | Conservare nel bounded context Hoon Lab |
| `hoonlabproducts` | 80 | Conservare |
| `hoonlabpricelists` | 5 | Conservare |
| `hoonlabpricelistitems` | 315 | Conservare |
| `hoonlabquotes` | 16 | Conservare |
| `hoonlaborderconfirmations` | 12 | Conservare |
| `hoonlabdeliverynotes` | 4 | Conservare |
| `hoonlabpdftemplates` | 1 | Conservare |
| `hoonlabdocumentsequences` | 3 | Conservare |
| `hoonlabsettings` | 1 | Conservare |
| `hoonlabfinanceentries` | 0 | Conservare schema, nessun dato |
| `hoonlabtodos` | 0 | Conservare schema, nessun dato |

Hoon Lab è già un sottodominio coerente. Non deve essere forzato dentro `CollaborazioneV3`: va solo reso tenant-aware in una fase successiva se più agenzie lo useranno.

## Relazioni target autorevoli

1. `AgenziaV3` è il tenant.
2. `UserV3` contiene identità e autorizzazioni; un account cliente può avere più `aziendaIds`.
3. `AziendaV3` contiene anagrafica e utenti portale, ma non workflow operativi.
4. `CollaborazioneV3` contiene contratto e stato generale.
5. `CollaborazioneAssegnazioneV3` è la relazione autorevole collaboratore-collaborazione. Il campo embedded `team` resta una proiezione compatibile e non deve essere aggiornato indipendentemente.
6. I documenti `SmmServiceV3`, `WebDesignServiceV3`, `SeoServiceV3`, `GoogleAdsServiceV3` e `MetaAdsServiceV3` contengono lo stato specifico del servizio.
7. `NotebookNoteV3` è la fonte unica per note e feed.
8. `PagamentoV3` e `FatturaCollaboratoreV3` sono le fonti economiche V3; nessun importo mancante deve essere inventato.
9. `legacyRef`/`legacyKeys` e `migrationmaps` rendono il processo idempotente e tracciabile.

## Anomalie da non ignorare

- Ref Mongoose legacy non risolvibili: `User`, `Utenti`, `Collaborazioni` non corrispondono ai model realmente registrati.
- `Nota.autore` contiene 1.648 stringhe e 2 ObjectId; il target usa sempre `autoreId: ObjectId` e mantiene il testo autore nel titolo.
- `Collaboratore` usa sia `subRole` legacy sia `subRoles[]`; il normalizzatore accetta entrambe le forme.
- Solo 16 aziende su 132 hanno `status`; assenza viene interpretata come attiva, senza modificare la sorgente.
- SMM contiene valori `null` in alcuni obiettivi TikTok/LinkedIn; il target li normalizza a zero.
- Web Design V2 aveva molti campi che il primo V3 perdeva. Il modello e il migratore ora conservano fasi, task, criticità, controlli, eccezioni, appuntamenti, approvazioni, consegna, pubblicazione, timeline e prompt intervista.
- Non esistono validator MongoDB: prima del cut-over vanno creati indici e, se desiderato, `$jsonSchema` validator dopo la bonifica, non prima.

## Dry-run finale

Il comando eseguito è stato:

```bash
node scripts/migrate-new-web-area-to-v3-hoonweb.mjs
```

Risultato principale:

| Gruppo | Sorgente | Target simulato | Scartati |
| --- | ---: | ---: | ---: |
| Aziende | 132 | 132 | 0 |
| Utenti azienda | 132 | 129 nuovi + 3 riusati | 0 |
| Collaborazioni SMM | 105 | 105 | 0 |
| Web Design V2 | 6 | 6 | 0 |
| Google Ads | 2 | 2 | 0 |
| Lead commerciali | 253 | 253 | 0 |
| Note unificate | 2.944 note sorgenti + note lead | 3.196 | 0 |
| Pagamenti | 801 | 801 | 0 |
| Fatture collaboratore | 50 | 50 | 0 |
| Notifiche/consegne | 226 | 226 | 0 |
| Eventi/disponibilità | 4 | 4 | 0 |

## Sequenza consigliata

1. Congelare le scritture legacy o introdurre una finestra di manutenzione.
2. Esportare backup Atlas e dump logico delle 51 collezioni.
3. Completare i mapper ancora mancanti: SEO, Web Design V1, interviste, knowledge base.
4. Produrre un report di riconciliazione per gli 801 pagamenti e le 49 fatture senza totale.
5. Eseguire nuovamente il dry-run e pretendere `skipped = 0`.
6. Eseguire `--apply` solo su un database clone/staging.
7. Verificare conteggi, riferimenti orfani, unicità, somme economiche e campioni funzionali.
8. Solo dopo la verifica, ripetere su produzione e spostare il traffico applicativo.

Non eseguire ancora `--apply` sul database di produzione: la parte core è pronta, ma i mapper elencati al punto 3 devono essere completati oppure esplicitamente esclusi e archiviati.
