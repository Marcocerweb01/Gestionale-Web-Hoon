# Modulo Commerciale Hoon

## Accesso

La pagina `/Commerciale` e tutte le API amministrative `/api/commerciale/*` sono accessibili soltanto a una sessione con:

- ruolo `amministratore`;
- email normalizzata uguale a `marcocerasaweb@gmail.com`.

Il controllo è duplicato lato pagina server e lato API. Il link di navigazione viene mostrato solo a questo account.

La pagina cliente `/Pagamenti/[token]` è pubblica per necessità operativa, ma usa un token casuale di 256 bit. Nel database viene salvato soltanto l'hash SHA-256; il link è revocabile e ha una scadenza.

## Variabili d'ambiente

```env
# Già usate dal gestionale
MONGODB_URI=
NEXTAUTH_SECRET=
NEXTAUTH_URL=

# Analisi interviste, OCR e proposta template
OPENAI_API_KEY=
COMMERCIAL_AI_MODEL=gpt-6.1-sol

# Stripe - usare sk_test durante sviluppo e collaudo
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# URL pubblico usato nei link e nei redirect Stripe
NEXT_PUBLIC_APP_URL=https://gestionale.hoonweb.it

# Lasciare assente in sviluppo. Consente chiavi live solo se impostato esplicitamente.
STRIPE_ALLOW_LIVE_MODE=false
```

Non inserire chiavi Stripe pubblicabili o segrete nel codice client.

## Configurazione Stripe

1. Configurare un endpoint webhook verso `/api/stripe/webhook`.
2. Ascoltare almeno:
   - `checkout.session.completed`;
   - `setup_intent.succeeded`;
   - `payment_intent.succeeded`;
   - `payment_intent.payment_failed`;
   - `invoice.paid`;
   - `invoice.payment_failed`;
   - `customer.subscription.updated`;
   - `customer.subscription.deleted`;
   - `subscription_schedule.updated`.
3. Copiare il signing secret in `STRIPE_WEBHOOK_SECRET`.
4. Collaudare esclusivamente in Test Mode con carte di test Stripe.

Gli eventi sono deduplicati tramite l'ID Stripe e gli aggiornamenti fuori ordine non sovrascrivono uno stato più recente.

## Modello dati e migrazione

MongoDB crea le nuove collection al primo utilizzo; non serve una migrazione distruttiva. I nuovi modelli sono raccolti in `models/Commerciale.js`:

- organizzazioni e opportunità;
- template/interviste e allegati;
- template/preventivi/versioni;
- contratti manuali;
- piani di pagamento, rate e rinnovi;
- eventi Stripe;
- collaborazioni attivate.

La conversione cerca prima un cliente legacy `Azienda` usando Partita IVA, email e ragione sociale. Se lo trova lo collega; in caso contrario crea una sola anagrafica. L'attivazione della collaborazione è idempotente grazie all'indice univoco sull'opportunità.

I file PDF/immagine sono salvati in MongoDB con limite applicativo di 12 MB, inferiore al limite BSON. Per volumi elevati è consigliata una futura migrazione verso object storage mantenendo gli stessi riferimenti documento.

## Flussi disponibili

- dashboard e metriche commerciali separate dagli incassi;
- contatti con controllo duplicati e più opportunità;
- pipeline Kanban con storico, rifiuto motivato e posticipo;
- interviste digitali, allegati, estrazione OCR/multimodale e analisi AI;
- template preventivo Hoon nativo A4;
- editor visuale con pagine, livelli, drag, proprietà, undo/redo e autosave;
- prezzi strutturati sincronizzati con il PDF;
- versioni e snapshot immutabili alla presentazione/accettazione;
- registrazione e upload del contratto manuale;
- piani Stripe mensili, promozioni iniziali, rate/milestone e rinnovi hosting 11+12 mesi;
- link cliente con consenso esplicito e Stripe Checkout;
- webhook firmati, deduplicati e idempotency key;
- conversione cliente e attivazione idempotente della collaborazione.

Non è presente alcun generatore automatico di contratti, come richiesto.

## Verifica

```bash
node --test tests/commerciale-core.test.mjs tests/hoon-lab-quote-note.test.mjs tests/webdesign-v2-workflow.test.mjs
npm run build
```

