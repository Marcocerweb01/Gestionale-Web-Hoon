# Checklist funzionalita programma Webarea

Documento preparato da scansione del codice della dashboard admin, delle pagine `app/`, dei componenti principali, dei modelli e delle API.

## 1. Ruoli utente rilevati

- [ ] `amministratore`
  - [ ] Accede alla dashboard admin completa.
  - [ ] Vede gestione utenti, notifiche, fatturazione, pagamenti, collaborazioni, funzioni di reset/export, FAQ, Dispense e Operations admin.
  - [ ] Puo' creare/modificare utenti e collaboratori.
  - [ ] Puo' disattivare/riattivare collaboratori e aziende.
  - [ ] Puo' resettare password da Gestione Utenti.
  - [ ] Puo' eliminare domini standalone e collaborazioni in Gestione Collaborazioni.
  - [ ] Puo' creare/modificare/eliminare/pubblicare FAQ e Dispense.
  - [ ] Puo' usare Social Automation e Google Places "aziende senza sito".

- [ ] `segretaria`
  - [ ] Accede a parte del pannello amministratore.
  - [ ] Puo' creare collaborazioni.
  - [ ] Puo' registrare utenti dalla dashboard.
  - [ ] Puo' vedere pagamenti/fatturazione.
  - [ ] Puo' vedere clienti, collaboratori, tabella collaborazioni, gestione collaborazioni, domini e lista web designer.
  - [ ] Non vede Gestione Utenti nel menu header.
  - [ ] Non vede notifiche admin.
  - [ ] Non vede la sezione Funzioni admin della dashboard.
  - [ ] Non ha permessi admin su FAQ/Dispense CRUD.
  - [ ] Su domini puo' leggere/creare/modificare/rinnovare, ma l'eliminazione lato API e' solo admin.

- [ ] `collaboratore`
  - [ ] Accede con uno o piu' sotto-ruoli in `subRoles`.
  - [ ] Vede in dashboard solo le sezioni relative ai propri sotto-ruoli.
  - [ ] Vede il menu "Faq & App" con FAQ, Operations e Dispense.
  - [ ] Se status `non_attivo`, il login viene bloccato.

- [ ] Sotto-ruolo `commerciale`
  - [ ] Vede dashboard Lead Commerciali.
  - [ ] Crea nuovi lead.
  - [ ] Cerca e filtra lead per stato, timeline preventivo, data e testo.
  - [ ] Gestisce timeline lead.
  - [ ] Puo' aggiornare stati, note e avanzamento dei propri lead.

- [ ] Sotto-ruolo `smm`
  - [ ] Vede Lista Clienti Social Media assegnati.
  - [ ] Gestisce contatori post Instagram/Facebook, TikTok, LinkedIn.
  - [ ] Gestisce appuntamenti, problemi e post mancanti associati alle collaborazioni social.
  - [ ] Accede ai feed/note delle collaborazioni social.

- [ ] Sotto-ruolo `web designer`
  - [ ] Vede progetti Web Design V2.
  - [ ] Gestisce timeline web design con macro sezioni, attivita, checkbox e note.
  - [ ] Crea nuove interviste cliente.
  - [ ] Accede a lista progetti/interviste del proprio utente.
  - [ ] Alcuni campi dominio/date sono modificabili solo da admin.

- [ ] Sotto-ruolo `google ads`
  - [ ] Vede le proprie campagne Google ADS.
  - [ ] Aggiorna stati campagna: contattato, campagna avviata, campagna terminata, note.
  - [ ] La pagina marketing Google Ads mostra vista admin o vista collaboratore in base al ruolo.

- [ ] Sotto-ruolo `meta ads`
  - [ ] Ruolo registrabile.
  - [ ] Dashboard mostra sezione "Meta ADS in arrivo".

- [ ] Sotto-ruolo `seo`
  - [ ] Ruolo registrabile.
  - [ ] Dashboard mostra sezione "SEO in arrivo".

- [ ] `azienda`
  - [ ] Puo' fare login se attiva.
  - [ ] Su home vede menu Faq & App.
  - [ ] La pagina dettaglio azienda mostra collaborazioni aziendali quando visitata.
  - [ ] Se status `non_attivo`, il login viene bloccato.

- [ ] `contatto`
  - [ ] E' registrabile dal form.
  - [ ] Attenzione: non e' incluso nei modelli controllati dal login attuale.

## 2. Dashboard admin, dalla prima interfaccia all'ultima

- [ ] Header globale
  - [ ] Bottone indietro.
  - [ ] Logo che torna alla home.
  - [ ] Ricerca globale su clienti, collaboratori e collaborazioni.
  - [ ] Link Fatturazione per admin/segretaria.
  - [ ] Link Gestione Utenti solo admin.
  - [ ] Dropdown notifiche solo admin.
  - [ ] Logout.

- [ ] Box benvenuto
  - [ ] Mostra nome utente.
  - [ ] Mostra ruolo principale.
  - [ ] Mostra sotto-ruoli collaboratore.

- [ ] Pannello Amministratore
  - [ ] Crea Collaborazione.
  - [ ] Registra Utente.
  - [ ] Faq & App solo admin.
  - [ ] Pagamenti.
  - [ ] Clienti e Collaborazioni.
  - [ ] Funzioni solo admin.

- [ ] Sezione Pagamenti
  - [ ] Vai a Pagamenti.
  - [ ] Genera pagamenti mensili.

- [ ] Sezione Clienti e Collaborazioni
  - [ ] Lista Clienti.
  - [ ] Lista Collaboratori.
  - [ ] Tabella Collaborazioni.
  - [ ] Gestione Collaborazioni.
  - [ ] Gestione Domini Web Design.
  - [ ] Lista Web Designer.
  - [ ] Storico Interviste solo admin.

- [ ] Sezione Funzioni solo admin
  - [ ] Download dati JSON.
  - [ ] Download dati Excel.
  - [ ] Reset post.
  - [ ] Reset trimestrali.
  - [ ] Riattiva trimestrali.
  - [ ] Sono presenti anche funzioni codice non renderizzate per fix appuntamenti e migrazione collaboratori.

- [ ] Sezione Faq & App
  - [ ] Operations.
  - [ ] FAQ.
  - [ ] Dispense.

- [ ] Lista Collaboratori in dashboard admin
  - [ ] Raggruppa collaboratori attivi per Web Designer, SMM, Marketing, Commerciali.
  - [ ] Marketing contiene Google ADS, Meta ADS, SEO.
  - [ ] Ogni collaboratore puo' espandere la sua lista/dettaglio operativo.

## 3. Interfacce principali

- [ ] `/Login`
  - [ ] Login con email/password via NextAuth Credentials.
  - [ ] Reindirizza alla dashboard.
  - [ ] Link a `/Register`.

- [ ] `/Register`
  - [ ] Crea `azienda`, `contatto`, `collaboratore`, `amministratore`, `segretaria`.
  - [ ] Per collaboratore seleziona multi-ruolo.
  - [ ] Per azienda richiede dati aziendali.
  - [ ] Attenzione: pagina/API risultano raggiungibili direttamente, da verificare se deve essere solo admin/segretaria.

- [ ] `/`
  - [ ] Dashboard principale.

- [ ] `/Gestione-Utenti`
  - [ ] Solo admin.
  - [ ] Lista admin, collaboratori e aziende.
  - [ ] Filtra per tipo e cerca per nome/email.
  - [ ] Reset password.
  - [ ] Attiva/disattiva collaboratori e aziende.

- [ ] `/User/[id]`
  - [ ] Dettaglio utente.
  - [ ] Modifica nome, cognome, email, ruoli, partita IVA, dati azienda.
  - [ ] Admin puo' gestire status.
  - [ ] Admin puo' vedere/modificare note private collaboratore.
  - [ ] Renderizza dashboard specifica: web design, commerciale, SMM o azienda.

- [ ] `/Edit-Collaboratore/[id]`
  - [ ] Admin/segretaria.
  - [ ] Modifica dati collaboratore e specializzazioni.

- [ ] `/Lista_collaboratori`
  - [ ] Lista collaboratori.
  - [ ] Toggle mostra solo attivi / tutti.
  - [ ] Link al dettaglio utente.

- [ ] `/Lista_clienti`
  - [ ] Lista aziende/clienti.
  - [ ] Ricerca per nome cliente.
  - [ ] Link al dettaglio azienda.

- [ ] `/AddCollab`
  - [ ] Crea collaborazione standard SMM/commerciale.
  - [ ] Crea progetto Web Design V2.
  - [ ] Crea campagna Google ADS.

- [ ] Collaborazione standard
  - [ ] Seleziona azienda.
  - [ ] Seleziona collaboratore.
  - [ ] Imposta appuntamenti mensili.
  - [ ] Imposta post Instagram/Facebook, TikTok, LinkedIn.
  - [ ] Imposta totali previsti.
  - [ ] Imposta contratto e date.
  - [ ] Flag esclusione reset trimestrale.

- [ ] Web Design V2
  - [ ] Seleziona cliente.
  - [ ] Seleziona web designer.
  - [ ] Tipo progetto: vetrina o e-commerce.
  - [ ] Date inizio/fine contratto.
  - [ ] Genera workflow con macro sezioni Struttura, Design, Consegna.

- [ ] Google ADS
  - [ ] Seleziona cliente.
  - [ ] Seleziona solo collaboratori con ruolo Google ADS.
  - [ ] Stato iniziale: contattato, campagna avviata, campagna terminata.
  - [ ] Note campagna.

- [ ] `/Tabella-collaborazioni`
  - [ ] Admin/segretaria.
  - [ ] Tabella riepilogativa collaborazioni.

- [ ] `/Gestione-Collaborazioni-Utente`
  - [ ] Admin/segretaria.
  - [ ] Raggruppa collaborazioni per cliente.
  - [ ] Mostra social, web design, Google Ads.
  - [ ] Delete collaborazioni solo admin.

- [ ] `/Gestione-Domini`
  - [ ] Utente autenticato lato pagina.
  - [ ] API standalone limitate ad admin/segretaria.
  - [ ] Monitora domini da collaborazioni web design e domini standalone.
  - [ ] Filtra per stato e web designer.
  - [ ] Aggiunge/modifica domini standalone.
  - [ ] Rinnova scadenza dominio.
  - [ ] Elimina domini standalone solo admin.

- [ ] `/Lista_webdesigner`
  - [ ] Lista collaboratori con ruolo web designer.
  - [ ] Link a progetti e dettaglio.

- [ ] `/Lista_clienti_webdesigner/[id]`
  - [ ] Vista progetti assegnati a un web designer.

- [ ] `/Lista_clienti_webdesigner/[id]/interview`
  - [ ] Crea intervista web design.
  - [ ] Staff o web designer interessato possono accedere.

- [ ] `/Lista_clienti_webdesigner/[id]/interview/[collabId]`
  - [ ] Intervista legata a collaborazione/progetto.

- [ ] `/Storico-Interviste-Webdesigner`
  - [ ] Solo admin.
  - [ ] Storico globale delle interviste web design.

- [ ] `/Lead`
  - [ ] Dashboard lead del commerciale loggato.
  - [ ] Crea lead.
  - [ ] Filtra per stato, data, preventivo completato, testo.
  - [ ] Gestisce richiamate future/passate.

- [ ] `/Lead-comm/[id]` e `/Feed-comm/[collaboratoreId]`
  - [ ] Vista lead/feed di uno specifico commerciale.
  - [ ] Usata da admin o link diretti.

- [ ] `/Feed-2/[collaboratoreId]`
  - [ ] Feed/collaborazioni social di un collaboratore.
  - [ ] Admin puo' eseguire azioni aggiuntive.

- [ ] `/Lista-Marketing/google-ads`
  - [ ] Admin vede tutte le campagne.
  - [ ] Collaboratore `google ads` vede solo le proprie.

- [ ] `/Lista-Marketing/meta-ads`
  - [ ] Pagina marketing Meta Ads presente.
  - [ ] Funzionalita' operativa da completare.

- [ ] `/Lista-Marketing/seo`
  - [ ] Pagina marketing SEO presente.
  - [ ] Funzionalita' operativa da completare.

- [ ] `/Pagamenti`
  - [ ] Gestione pagamenti collaboratori.
  - [ ] Tabella pagamenti mensili.
  - [ ] Aggiorna stati/importi.

- [ ] `/PagamentiNuovi`
  - [ ] Admin/segretaria.
  - [ ] Nuovo sistema entrate/uscite.
  - [ ] Statistiche totale entrate, uscite e bilancio.
  - [ ] Filtri mese, anno, azienda, servizio, collaboratore, stato.
  - [ ] Form nuova entrata.
  - [ ] Form nuova uscita.
  - [ ] Diagnostica migration.

- [ ] `/Fatturazione`
  - [ ] Admin/segretaria.
  - [ ] Seleziona mese.
  - [ ] Genera fatture mensili.
  - [ ] Modifica totale fattura.
  - [ ] Toggle stato pagamento admin.
  - [ ] Visualizza stato emissione collaboratore.

- [ ] `/Faq`
  - [ ] Tutti gli utenti autenticati leggono FAQ.
  - [ ] Tutti possono suggerire una FAQ.
  - [ ] Admin crea/modifica/elimina FAQ.
  - [ ] Admin gestisce categorie.
  - [ ] Admin pubblica o elimina suggerimenti.

- [ ] `/Dispense`
  - [ ] Tutti gli utenti autenticati leggono dispense.
  - [ ] Tutti possono suggerire argomenti.
  - [ ] Admin crea/modifica/elimina argomenti.
  - [ ] Admin gestisce categorie e icone.
  - [ ] Admin pubblica o elimina suggerimenti.

- [ ] `/Operations`
  - [ ] Hub strumenti operativi.
  - [ ] Mostra statistiche rapide QR, immagini e Google Places admin.
  - [ ] Tool disponibili: QR Code, Compressione Immagini.
  - [ ] Tool admin: Aziende senza sito, Social Automation.
  - [ ] Analytics e alcune automazioni sono segnate coming soon.

- [ ] `/Operations/QrCode`
  - [ ] Genera QR per URL, testo, email, telefono, WiFi.
  - [ ] Salva QR code.
  - [ ] Visualizza QR salvati.
  - [ ] Conta scansioni.
  - [ ] Test scan.
  - [ ] Elimina QR.

- [ ] `/Operations/ImageCompression`
  - [ ] Upload drag and drop immagini.
  - [ ] Compressione in WebP/JPEG/PNG.
  - [ ] Qualita' regolabile.
  - [ ] Larghezza massima regolabile.
  - [ ] Download immagini compresse.

- [ ] `/Operations/GooglePlacesNoWebsite`
  - [ ] Solo admin.
  - [ ] Cerca aziende su Google Places.
  - [ ] Filtra risultati senza `websiteUri`.
  - [ ] Tiene contatore chiamate mensili.
  - [ ] Esporta CSV.

- [ ] `/Operations/SocialAutomation`
  - [ ] Solo admin.
  - [ ] Connette account Facebook/Instagram via OAuth.
  - [ ] Lista account social connessi.
  - [ ] Disconnette account.
  - [ ] Attiva webhook account.
  - [ ] Link a regole automazione.

- [ ] `/Operations/SocialAutomation/[accountId]/rules`
  - [ ] Solo admin.
  - [ ] Gestisce regole di automazione per account.
  - [ ] Crea/modifica/elimina automazioni.

- [ ] `/Hoon-Lab`
  - [ ] Gestionale commerciale Hoon Lab.
  - [ ] Dashboard con statistiche e to do list.
  - [ ] Crea cliente.
  - [ ] Gestisce prodotti.
  - [ ] Importa prodotti.
  - [ ] Gestisce listini e prezzi.
  - [ ] Crea preventivi.
  - [ ] Gestisce stati preventivo: bozza, inviato, accettato, rifiutato, scaduto, convertito.
  - [ ] Converte preventivo in conferma d'ordine.
  - [ ] Gestisce conferme d'ordine.
  - [ ] Genera DDT da ordine.
  - [ ] Scarica PDF preventivo, conferma ordine e DDT.
  - [ ] Esporta dati.
  - [ ] Modifica impostazioni documenti.
  - [ ] Attenzione: non ho trovato guard sessione/ruolo su pagina/API Hoon Lab.

- [ ] `/Notifiche`
  - [ ] Solo admin.
  - [ ] Lista notifiche.
  - [ ] Marca lette/non lette.
  - [ ] Elimina notifiche.

- [ ] `/Manage-snapshots`
  - [ ] Pagina presente per gestione snapshot.

- [ ] `/AddNota/[collaborazioneId]`
  - [ ] Utente autenticato.
  - [ ] Aggiunge nota a una collaborazione.

- [ ] Pagine pubbliche/legal
  - [ ] `/privacy-policy`
  - [ ] `/terms-of-service`
  - [ ] `/data-deletion`
  - [ ] `/unauthorized`
  - [ ] `not-found`

## 4. Moduli dati principali

- [ ] Utenti
  - [ ] `Collaboratore`: nome, cognome, email, password, partita IVA, `subRoles`, status, note admin, percentuali/pagamenti.
  - [ ] `Amministratore`: nome, cognome, email, password, ruolo `amministratore` o `segretaria`.
  - [ ] `Azienda`: dati aziendali, status, pagamento.
  - [ ] `Contatto`: referente, numero, email, ragione sociale, indirizzo, note.

- [ ] Collaborazioni
  - [ ] Collaborazioni social/SMM.
  - [ ] Collaborazioni Web Design legacy.
  - [ ] Collaborazioni Web Design V2.
  - [ ] Google Ads.
  - [ ] Note, feed, problemi, post mancanti, appuntamenti.

- [ ] Commerciale
  - [ ] Lead commerciali.
  - [ ] Note commerciali.
  - [ ] Timeline lead.

- [ ] Finance
  - [ ] Pagamenti legacy.
  - [ ] Pagamenti nuovi entrate/uscite.
  - [ ] Fatturazione collaboratori.

- [ ] Knowledge base
  - [ ] FAQ.
  - [ ] FAQ suggerite.
  - [ ] Dispense.
  - [ ] Dispense suggerite.

- [ ] Operations
  - [ ] QR Code.
  - [ ] Compressione immagini.
  - [ ] Google Places usage.
  - [ ] Social account.
  - [ ] Automation rule.
  - [ ] Social interaction.

- [ ] Web Design
  - [ ] Domini.
  - [ ] WebDesignInterview.
  - [ ] Workflow V2.

- [ ] Hoon Lab
  - [ ] Clienti.
  - [ ] Prodotti.
  - [ ] Listini.
  - [ ] Voci listino.
  - [ ] Preventivi.
  - [ ] Conferme ordine.
  - [ ] DDT.
  - [ ] Template PDF/sequenze documenti.
  - [ ] To do.
  - [ ] Settings documenti.

## 5. API e permessi da controllare

- [ ] API chiaramente solo admin
  - [ ] `/api/gestione-utenti`
  - [ ] `/api/notifiche`
  - [ ] `/api/faq` in scrittura.
  - [ ] `/api/faq-suggerite` in lista/admin publish/delete.
  - [ ] `/api/dispense` in scrittura.
  - [ ] `/api/dispense-suggerite` in lista/admin publish/delete.
  - [ ] `/api/social-accounts`
  - [ ] `/api/automations`
  - [ ] `/api/oauth/meta/callback`
  - [ ] `/api/operations/google-places-no-website`

- [ ] API admin/segretaria
  - [ ] `/api/domini` GET/POST.
  - [ ] `/api/domini/[id]` PUT.
  - [ ] `/api/domini/webdesigners`
  - [ ] `/api/collaborazioni-utente`
  - [ ] `/api/webdesign-interviste` per staff o web designer proprietario.
  - [ ] `/api/collaborazioni-webdesign-v2/[id]` con differenze tra admin e staff.

- [ ] API con accesso da verificare/rinforzare
  - [ ] `/api/register`: non ho visto controllo sessione/ruolo.
  - [ ] `/api/leads`: non ho visto controllo sessione/ownership.
  - [ ] `/api/lista_aziende` e `/api/lista_collaboratori`: da verificare se devono essere pubbliche internamente o protette.
  - [ ] Molte API legacy/debug/migrazione sono raggiungibili in `app/api/debug*`, `migrazione*`, `test*`: valutare blocco admin o rimozione in produzione.
  - [ ] Tutte le API `/api/hoon-lab/*`: non ho trovato controllo sessione/ruolo.
  - [ ] `/Hoon-Lab`: non ho trovato controllo sessione/ruolo lato pagina.

## 6. Checklist test end-to-end per ruolo

- [ ] Test amministratore
  - [ ] Login admin.
  - [ ] Dashboard mostra tutte le sezioni.
  - [ ] Crea utente collaboratore multi-ruolo.
  - [ ] Disattiva collaboratore e verifica blocco login.
  - [ ] Crea collaborazione SMM.
  - [ ] Crea progetto Web Design V2.
  - [ ] Crea campagna Google Ads.
  - [ ] Genera pagamenti.
  - [ ] Genera fatture.
  - [ ] Modifica FAQ/Dispense.
  - [ ] Usa Operations admin.
  - [ ] Verifica notifiche.

- [ ] Test segretaria
  - [ ] Login segretaria.
  - [ ] Verifica assenza Gestione Utenti e notifiche.
  - [ ] Verifica accesso Fatturazione.
  - [ ] Crea collaborazione.
  - [ ] Vede clienti/collaboratori/collaborazioni.
  - [ ] Verifica che azioni solo admin siano bloccate.

- [ ] Test commerciale
  - [ ] Login collaboratore con ruolo commerciale.
  - [ ] Vede solo dashboard lead e Faq & App.
  - [ ] Crea lead.
  - [ ] Aggiorna timeline lead.
  - [ ] Filtra lead.
  - [ ] Non accede a pagine admin.

- [ ] Test SMM
  - [ ] Login collaboratore SMM.
  - [ ] Vede lista clienti social assegnati.
  - [ ] Aggiorna contatori post.
  - [ ] Gestisce problemi/post mancanti/appuntamenti.
  - [ ] Non accede a pagine admin.

- [ ] Test web designer
  - [ ] Login web designer.
  - [ ] Vede progetti Web Design.
  - [ ] Completa attivita workflow.
  - [ ] Aggiunge note.
  - [ ] Crea intervista.
  - [ ] Verifica campi bloccati non admin.

- [ ] Test google ads
  - [ ] Login collaboratore Google ADS.
  - [ ] Vede solo campagne assegnate.
  - [ ] Aggiorna stati campagna.
  - [ ] Non vede campagne di altri collaboratori.

- [ ] Test azienda
  - [ ] Login azienda.
  - [ ] Verifica cosa mostra dashboard home.
  - [ ] Verifica dettaglio azienda/collaborazioni.
  - [ ] Disattiva azienda e verifica blocco login.

- [ ] Test sicurezza generale
  - [ ] Aprire direttamente URL admin da utente non admin.
  - [ ] Chiamare API admin da utente non admin.
  - [ ] Chiamare API senza sessione.
  - [ ] Verificare ownership su lead, collaborazioni e campagne.
  - [ ] Verificare che route debug/migrazione/test non siano esposte in produzione.
  - [ ] Proteggere Hoon Lab se deve essere interno.

## 7. Sintesi programma

- [ ] Il programma e' una piattaforma gestionale interna per Hoon/Webarea.
- [ ] Gestisce utenti, ruoli e collaboratori multi-specializzazione.
- [ ] Gestisce clienti/aziende.
- [ ] Gestisce collaborazioni social, web design e Google Ads.
- [ ] Gestisce lead commerciali e relative timeline.
- [ ] Gestisce pagamenti, fatturazione e bilancio entrate/uscite.
- [ ] Gestisce domini web design e scadenze.
- [ ] Gestisce knowledge base interna con FAQ e Dispense.
- [ ] Offre strumenti operativi: QR code, compressione immagini, ricerca Google Places, automazioni social.
- [ ] Include Hoon Lab per preventivi, ordini, DDT, prodotti, clienti, listini e PDF.
- [ ] Include pagine legali per privacy, termini e data deletion.
