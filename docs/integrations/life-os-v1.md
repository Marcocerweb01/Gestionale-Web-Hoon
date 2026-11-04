# Life OS Integration API v1

API server-to-server, versionata e in sola lettura. La sorgente è esclusivamente `CollaborazioneWebDesignV2`; modelli legacy e V3 non sono inclusi.

## Configurazione e autenticazione

Variabili server:

```env
LIFE_OS_INTEGRATION_API_KEY=
LIFE_OS_INTEGRATION_SCOPES=
```

`LIFE_OS_INTEGRATION_API_KEY` è obbligatoria. `LIFE_OS_INTEGRATION_SCOPES` è opzionale e, se vuota/non definita, usa `projects:read,tasks:read`. La chiave deve vivere nel backend Supabase/Edge Function di Life OS e non nell'app Flutter/Mac.

Ogni richiesta invia:

```http
Authorization: Bearer <LIFE_OS_API_KEY>
X-Hoon-Client: life-os
```

Scope iniziali: `projects:read` e `tasks:read`. L'adapter è isolato in `lib/integrations/life-os-v1.mjs`, così potrà essere sostituito con credenziali persistite e ruotabili. La chiave non viene registrata nei log. Per ruotarla: generare una nuova chiave casuale nel secret manager, aggiornare prima Hoon Web e subito dopo Life OS in una finestra coordinata, verificare una richiesta, quindi eliminare la vecchia chiave. Questa versione supporta una sola chiave attiva.

## Endpoint

### `GET /api/integrations/life-os/v1/projects`

Scope: `projects:read`.

Parametri:

- `limit`: predefinito 50, minimo 1, massimo 100;
- `cursor`: cursore opaco restituito dalla pagina precedente;
- `updated_since`: data ISO inclusiva;
- `status`: `in_progress`, `paused` o `completed`.

Ordinamento stabile: `updatedAt`, poi `_id`. Se `cursor` è presente ha precedenza su `updated_since`.

```json
{
  "data": [{
    "id": "690b3f580000000000000001",
    "source": "hoon-web",
    "source_type": "webdesign-v2",
    "name": "Sito web Cliente Demo",
    "project_type": "vetrina",
    "status": "in_progress",
    "progress_percent": 47,
    "current_phase": "design",
    "client": { "id": "690b3f580000000000000002", "name": "Cliente Demo" },
    "assignee": { "id": "690b3f580000000000000003", "name": "Nome Cognome" },
    "site_url": "https://example.invalid",
    "planned_start_at": "2026-10-01T12:00:00.000Z",
    "planned_end_at": "2026-10-21T12:00:00.000Z",
    "created_at": "2026-10-01T09:00:00.000Z",
    "updated_at": "2026-11-04T10:30:00.000Z",
    "version": 8
  }],
  "next_cursor": null,
  "schema_version": "1.0"
}
```

### `GET /api/integrations/life-os/v1/projects/{projectId}`

Scope: `projects:read`. Restituisce il riepilogo precedente più `phase_progress`, `controls_progress_percent`, `publication_checklist_progress_percent`, `delivery` e `publication`.

```json
{
  "data": {
    "id": "690b3f580000000000000001",
    "source": "hoon-web",
    "source_type": "webdesign-v2",
    "name": "Sito web Cliente Demo",
    "status": "in_progress",
    "progress_percent": 47,
    "current_phase": "design",
    "phase_progress": [{ "phase": "struttura", "progress_percent": 100 }, { "phase": "design", "progress_percent": 40 }],
    "controls_progress_percent": 33,
    "publication_checklist_progress_percent": 0,
    "delivery": { "status": "non consegnato", "planned_at": "2026-10-21T12:00:00.000Z", "completed_at": null, "confirmed": false },
    "publication": { "status": "da pianificare", "planned_at": null, "completed_at": null, "url": "https://example.invalid" },
    "version": 8
  },
  "schema_version": "1.0"
}
```

I campi comuni del riepilogo (cliente, assegnatario, URL e date) sono presenti anche nel dettaglio ma omessi nell'esempio per brevità.

### `GET /api/integrations/life-os/v1/projects/{projectId}/tasks`

Scope: `tasks:read`. I gruppi sono distinti da `task_type`: `phase_task`, `control_task`, `publication_checklist_item`.

```json
{
  "data": [{
    "id": "9e72149c-e170-44e8-85ee-7647ac57d984",
    "project_id": "690b3f580000000000000001",
    "task_type": "phase_task",
    "phase": "design",
    "code": "design-03",
    "title": "Homepage realizzata",
    "description": "",
    "status": "in_progress",
    "completed": false,
    "criticality": "regular",
    "delay_reason": "",
    "position": 3,
    "working_day": 8,
    "assignee": { "id": "690b3f580000000000000003", "name": "Nome Cognome" },
    "created_at": null,
    "updated_at": null,
    "version": 1
  }],
  "schema_version": "1.0"
}
```

### `GET /api/integrations/life-os/v1/changes`

Scope: `projects:read`. Richiede `updated_since` oppure `cursor`; supporta `limit` fino a 100.

```json
{
  "data": [{
    "entity_type": "project",
    "entity_id": "690b3f580000000000000001",
    "change_type": "updated",
    "updated_at": "2026-11-04T10:30:00.000Z",
    "version": 8
  }],
  "next_cursor": null,
  "schema_version": "1.0"
}
```

## Mapping

Progetti: `in corso` → `in_progress`, `in pausa` → `paused`, `terminata` → `completed`; altro → `unknown`.

Task: `da fare` → `todo`, `in corso` → `in_progress`, `in attesa` → `waiting`, `completata` → `completed`, `non applicabile` → `not_applicable`; altro → `unknown`.

La percentuale principale usa solo `fasi[].tasks[]`: task completati diviso task totali, arrotondato con `Math.round`. Sono completati `completata`, `non applicabile` e i documenti compatibili senza `stato` ma con `completata: true`. Senza task vale 0. Controlli e checklist hanno percentuali separate.

L'URL usa prima `pubblicazione.urlPubblico`, poi `dominio.urlDominio`. Il nome usa `cliente.ragioneSociale`, `cliente.etichetta`, `cliente.nome`, `aziendaRagioneSociale`, infine `Progetto web`.

## Paginazione e sincronizzazione

Il cursore codifica `updatedAt` e `_id`, evitando perdite quando più record condividono lo stesso timestamp. Per l'import iniziale chiamare `/projects?limit=100`, seguire `next_cursor`, poi memorizzare l'ultimo `updated_at`. Per gli incrementi usare `/changes?updated_since=<ISO>&limit=100` e recuperare i dettagli modificati. Usare `(source, external_id)` come chiave univoca in Life OS.

Una modifica a un task aggiorna il documento progetto e appare in `/changes` come `entity_type: project`: i task non hanno timestamp individuali. Cancellazioni e archiviazioni non sono ancora rappresentate.

## Errori, sicurezza e limiti

Tutte le risposte impostano `Cache-Control: private, no-store` e `X-Request-Id`. È presente un rate limit in memoria per istanza (300 richieste/minuto per IP e scope), non coordinato tra repliche.

```json
{
  "error": {
    "code": "invalid_request",
    "message": "Descrizione sicura",
    "request_id": "f1372442-d613-48f2-8701-9f20d8bb631a"
  }
}
```

Codici: 400 parametri/ID non validi; 401 token assente o errato; 403 client o scope errato; 404 progetto assente; 429 limite superato; 500 errore interno senza stack trace.

La v1 è read-only: nessuna PATCH e nessun webhook/realtime. `version` deriva da MongoDB `__v`. Una futura PATCH dovrà richiedere `expected_version` e rispondere 409 in caso di conflitto, scrivere in modo atomico, registrare `origin`/event ID per evitare loop e supportare idempotency key, retry e dead-letter log. Il versionamento futuro resta sotto `/v2` senza modificare il contratto `/v1`.

## Backfill degli ID task

I nuovi task ricevono un UUID persistente. I documenti esistenti vanno controllati prima del deploy applicativo:

```bash
npm run backfill:life-os-task-ids -- --dry-run
```

Il dry-run non scrive. Dopo revisione esplicita, l'esecuzione reale è:

```bash
npm run backfill:life-os-task-ids -- --apply
```

Lo script è idempotente, non sostituisce ID esistenti, aggiorna solo progetti modificati e stampa conteggi. Non è collegato a build o deploy. Non eseguirlo sulla produzione senza backup, dry-run verificato e approvazione operativa.

## Esempio HTTP

```bash
curl --fail-with-body \
  -H "Authorization: Bearer $LIFE_OS_INTEGRATION_API_KEY" \
  -H "X-Hoon-Client: life-os" \
  "https://hoonwebarea.it/api/integrations/life-os/v1/projects?limit=50"
```
