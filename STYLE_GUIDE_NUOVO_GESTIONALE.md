# Style Guide Nuovo Gestionale

Documento guida per rifinire colori, font, animazioni e stile generale della piattaforma senza toccare la struttura nuova del gestionale.

Questa guida serve per uniformare l'interfaccia. Non va usata come scusa per cambiare modelli dati, routing, flussi, permessi o gerarchia funzionale gia decisi.

## Regola Principale

Puoi intervenire su:

- colori;
- tipografia;
- spaziature;
- radius;
- ombre;
- bordi;
- icone;
- stati hover/focus/active;
- animazioni;
- loading/empty/error states;
- densita visuale;
- classi CSS/Tailwind;
- design tokens.

Non intervenire su:

- struttura delle rotte;
- modelli dati;
- API contract;
- permessi;
- ordine logico dei flussi;
- componenti principali gia stabiliti;
- gerarchia delle pagine;
- business logic.

Se serve aggiungere wrapper solo per sistemare layout/stile, fallo in modo minimo e senza cambiare il comportamento.

## Personalita Visiva

Il gestionale deve sembrare:

- operativo;
- moderno;
- ordinato;
- veloce da scansionare;
- professionale ma non freddo;
- piu dashboard interna che sito marketing.

Non deve sembrare:

- landing page;
- brochure;
- template SaaS generico;
- interfaccia piena di gradienti decorativi;
- pagina con card dentro card;
- layout che sacrifica densita e leggibilita per effetto wow.

## Tipografia

Font principale:

```css
font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
```

Regole:

- usa Inter come font base dell'app;
- Poppins puo essere usato solo per titoli speciali, ma meglio evitarlo nel gestionale operativo;
- niente font-size scalato con viewport width;
- letter spacing a `0`;
- testo sempre leggibile su mobile;
- titoli compatti dentro dashboard, tabelle, card e pannelli;
- hero-scale typography solo se esiste davvero una pagina hero, non per schermate operative.

Scala consigliata:

```txt
xs       12px
sm       14px
base     16px
lg       18px
xl       20px
2xl      24px
3xl      30px
4xl      36px, solo per page title importanti
```

Pesature:

```txt
400 testo normale
500 label e controlli
600 bottoni, tab, badge forti
700 titoli sezione
800 solo page title principali
```

## Palette

La piattaforma attuale usa molto blu. Nel nuovo stile il blu resta il colore primario, ma non deve diventare una UI monocromatica.

Base:

```css
:root {
  --bg-app: #f6f8fb;
  --bg-surface: #ffffff;
  --bg-surface-muted: #f8fafc;

  --text-primary: #111827;
  --text-secondary: #4b5563;
  --text-muted: #6b7280;
  --text-inverse: #ffffff;

  --border-subtle: #e5e7eb;
  --border-strong: #cbd5e1;

  --brand-50: #eff6ff;
  --brand-100: #dbeafe;
  --brand-500: #3b82f6;
  --brand-600: #2563eb;
  --brand-700: #1d4ed8;

  --success-50: #ecfdf5;
  --success-600: #059669;
  --success-700: #047857;

  --warning-50: #fffbeb;
  --warning-600: #d97706;
  --warning-700: #b45309;

  --danger-50: #fef2f2;
  --danger-600: #dc2626;
  --danger-700: #b91c1c;

  --violet-50: #f5f3ff;
  --violet-600: #7c3aed;

  --shadow-soft: 0 1px 2px rgb(15 23 42 / 0.06), 0 8px 24px rgb(15 23 42 / 0.06);
}
```

Uso:

- blu: azioni primarie, focus, link importanti;
- verde: completato, conferma, successo;
- ambra: richiamo, attenzione, scadenza;
- rosso: errore, eliminazione, non interessato;
- viola: filtri o stati secondari, usare poco;
- grigi/slate: struttura, testi, bordi.

Evita:

- UI tutta blu;
- gradienti dominanti viola/blu;
- sfondi decorativi con blob/orb;
- beige/cream come tema dominante;
- ombre pesanti ovunque.

## Background

Regola generale:

- app background: grigio freddo molto chiaro;
- superfici operative: bianco;
- sezioni pagina: non devono sembrare card flottanti enormi;
- card solo per elementi ripetuti, modali, drawer o pannelli funzionali.

Esempi:

```txt
Pagina dashboard: bg #f6f8fb
Toolbar: surface bianca con bordo sottile
Card lead/cliente: surface bianca, bordo #e5e7eb
Footer/admin area: slate scuro se gia previsto
```

## Spaziatura

La UI deve essere densa ma respirare.

Scala:

```txt
4px   micro gap
8px   gap interno compatto
12px  controlli piccoli
16px  padding standard card/toolbar
24px  separazione tra sezioni
32px  separazione page block
```

Regole:

- toolbar e filtri devono stare vicini al contenuto;
- niente sezioni con padding enorme se sono operative;
- su mobile riduci padding prima di ridurre leggibilita;
- usa `gap` coerenti invece di margini casuali.

## Radius

Radius consigliati:

```txt
6px  input, badge, piccoli controlli
8px  card, toolbar, modali
12px solo elementi molto grandi o gia previsti dal design
999px solo pill, avatar, badge circolari
```

Regole:

- card a 8px quando possibile;
- evita tutto troppo arrotondato;
- coerenza prima dell'effetto.

## Ombre e Bordi

Default:

- preferisci bordi sottili a ombre pesanti;
- ombra leggera solo per hover, dropdown, modal, header sticky;
- tabella/card normale: bordo + shadow molto soft.

Classi/Tokens consigliati:

```txt
border: 1px solid #e5e7eb
shadow idle: none o molto soft
shadow hover: --shadow-soft
modal shadow: 0 20px 40px rgb(15 23 42 / 0.18)
```

## Bottoni

Gerarchia:

- primary: azione principale della schermata;
- secondary: azione normale;
- ghost: navigazione/utility;
- danger: delete o azioni irreversibili;
- icon button: azioni compatte.

Regole:

- usa icona + testo per azioni importanti;
- usa solo icona per azioni ripetitive o toolbar, con tooltip/title;
- preferisci icone `lucide-react` se il nuovo gestionale lo consente;
- non usare emoji come icone funzionali;
- altezza minima desktop 36px;
- altezza minima touch 40px;
- stato disabled evidente.

Esempio visivo:

```txt
Primary: blu pieno, testo bianco
Secondary: bianco, bordo grigio, testo scuro
Ghost: trasparente, hover grigio chiaro
Danger: rosso pieno o rosso ghost in base al rischio
```

## Form

Regole:

- label sopra input;
- testo helper solo se serve davvero;
- input con bordo sottile e focus ring blu;
- errori vicini al campo;
- form lunghi divisi in blocchi logici;
- campi obbligatori marcati chiaramente;
- placeholder pratici, non istruzioni lunghe.

Stati:

```txt
focus: bordo brand + ring soft
error: bordo danger + messaggio breve
disabled: bg grigio chiaro + testo muted
loading: disabilita submit + spinner sobrio
```

## Tabelle, Liste e Card Operative

Regole:

- le dashboard devono essere scannerizzabili;
- usa badge stato, contatori e date in posizioni coerenti;
- informazioni primarie sempre visibili;
- dettagli secondari collassabili;
- azioni distruttive lontane dalle azioni frequenti;
- mobile: card compatte;
- desktop: tabella o lista strutturata.

Per card lead/collaborazioni:

- titolo in alto a sinistra;
- stato in alto a destra;
- contatti e data subito sotto;
- timeline o contatori al centro;
- note sempre visibili se operative;
- dettagli extra collassabili;
- azioni in fondo.

## Badge e Stati

Mappa colore consigliata:

```txt
in_lavorazione     blu
da_richiamare      ambra
non_interessato    rosso
completato         verde
archiviato         grigio
in_scadenza        ambra
scaduto            rosso
ok                 verde
placeholder        grigio/violetto soft
```

Regole:

- badge con contrasto leggibile;
- testo breve;
- non affidarti solo al colore: usa label chiara;
- per date urgenti usa posizione e testo, non animazioni aggressive.

## Animazioni

Le animazioni devono dare risposta, non spettacolo.

Durate:

```txt
100ms active press
150ms hover/focus
200ms apertura controlli piccoli
240ms modal/drawer
300ms massimo per transizioni pagina leggere
```

Easing:

```css
cubic-bezier(0.2, 0, 0, 1)
```

Usa animazioni per:

- hover card;
- click button;
- apertura dropdown;
- comparsa modal/drawer;
- espansione dettagli;
- skeleton/loading;
- toast.

Evita:

- animazioni infinite non necessarie;
- bounce eccessivi;
- movimento su contenuti tabellari densi;
- spostamenti layout durante hover;
- effetti che rendono lenta la UI.

Accessibilita:

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

## Icone

Regole:

- preferisci `lucide-react` per nuove interfacce;
- usa icone coerenti per azioni ricorrenti:
  - plus: crea;
  - pencil: modifica;
  - trash: elimina;
  - check: completato;
  - clock/calendar: richiamo o scadenza;
  - search: ricerca;
  - filter: filtri;
  - download: export;
  - bell: notifiche;
- dimensione standard 16px o 18px nei bottoni;
- icone decorative quasi mai.

## Layout Responsive

Breakpoint pratici:

```txt
mobile: 320-767
tablet: 768-1023
desktop: 1024+
wide: 1280+
```

Regole:

- su desktop usa max width coerente con il layout esistente;
- su mobile evita overflow orizzontale;
- filtri devono andare a capo senza sovrapporsi;
- bottoni con testo lungo devono wrappare o abbreviare;
- tabelle complesse diventano card o scroll controllato;
- input e bottoni devono avere dimensioni stabili.

## Loading, Empty, Error

Loading:

- skeleton o spinner sobrio;
- testo breve;
- non usare emoji come spinner.

Empty:

- titolo breve;
- frase utile;
- azione primaria se applicabile;
- nessuna illustrazione enorme nelle pagine operative.

Error:

- messaggio chiaro;
- pulsante riprova se possibile;
- non mostrare stack trace all'utente.

## Toast e Feedback

Regole:

- preferisci toast o inline feedback rispetto ad `alert()`/`confirm()` nelle nuove UI;
- conferma esplicita per delete, reset e azioni irreversibili;
- messaggi brevi:
  - "Lead creato"
  - "Modifiche salvate"
  - "Errore durante il salvataggio"
  - "Permesso insufficiente"

## Accessibilita

Checklist:

- focus visibile su tutti i controlli;
- contrasto testo almeno AA;
- bottoni raggiungibili da tastiera;
- modali con focus trap se la libreria lo consente;
- label collegate agli input;
- `aria-label` per icon button senza testo;
- non usare solo colore per comunicare stato;
- touch target minimo 40px su mobile.

## Cose da Evitare

- cambiare struttura nuova per inseguire un effetto grafico;
- card dentro card;
- sezioni pagina come grosse card decorative;
- testi lunghi per spiegare cosa fa una pagina;
- gradienti decorativi dominanti;
- palette monocromatica;
- emoji come sistema di icone;
- shadow troppo forti;
- animazioni lente;
- hover che cambiano dimensioni;
- bottoni con testo che esce dal contenitore;
- font troppo grandi dentro pannelli operativi;
- modali enormi quando un drawer o form inline sarebbe piu gestibile.

## Applicazione Rapida alle Sezioni

Commerciale:

- dashboard compatta;
- stati evidenti;
- richiamo in ambra;
- completato in verde;
- non interessato in rosso;
- timeline a step con icone;
- nota generale sempre leggibile.

Operations:

- hub strumenti ordinato;
- metriche rapide;
- tool attivi separati dai placeholder;
- output/download ben visibili.

Domini:

- tabella chiara;
- scadenze evidenti;
- stato `ok`, `in_scadenza`, `scaduto`;
- azioni rinnovo/modifica/link dominio immediate.

Notifiche:

- campanella pulita;
- centro notifiche denso;
- badge non lette;
- filtri lette/non lette/tutte.

Collaborazioni:

- contatori e checklist prima delle decorazioni;
- link veloci a cliente/collaboratore;
- nessuna modifica nascosta dietro troppi click.

## Definition of Done Visiva

Una schermata e stilisticamente pronta quando:

- sembra parte della stessa piattaforma delle altre;
- funziona bene a 375px, 768px, 1440px;
- nessun testo si sovrappone;
- i bottoni non cambiano dimensione in hover;
- focus/hover/disabled sono chiari;
- loading/empty/error non sembrano provvisori;
- colori e badge comunicano stato senza confusione;
- non sono stati cambiati struttura o business logic per ragioni estetiche.
