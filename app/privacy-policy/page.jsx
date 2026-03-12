export const metadata = {
  title: "Privacy Policy - Webarea",
  description: "Informativa sulla privacy di Webarea",
};

export default function PrivacyPolicy() {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 md:p-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Privacy Policy
        </h1>
        <p className="text-sm text-gray-500 mb-8">
          Ultimo aggiornamento: 12 marzo 2026
        </p>

        <div className="prose prose-gray max-w-none space-y-6 text-gray-700 leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">
              1. Titolare del Trattamento
            </h2>
            <p>
              Il titolare del trattamento dei dati è <strong>Webarea</strong>{" "}
              (di seguito &quot;Titolare&quot;), raggiungibile tramite la
              piattaforma disponibile al dominio su cui è ospitata la presente
              applicazione.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">
              2. Dati Raccolti
            </h2>
            <p>
              L&apos;applicazione raccoglie e tratta le seguenti categorie di
              dati:
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-3">
              <li>
                <strong>Dati di autenticazione:</strong> indirizzo email e
                password (hash crittografico) per l&apos;accesso alla
                piattaforma.
              </li>
              <li>
                <strong>Dati dei profili social collegati:</strong> nome utente,
                ID account, token di accesso degli account Instagram e Facebook
                collegati tramite autorizzazione OAuth.
              </li>
              <li>
                <strong>Dati di interazione social:</strong> commenti, messaggi
                diretti e interazioni ricevute sugli account social collegati,
                elaborati ai fini dell&apos;automazione delle risposte.
              </li>
              <li>
                <strong>Dati di contatto lead:</strong> nome, cognome, email,
                telefono e altre informazioni fornite volontariamente dai
                potenziali clienti tramite interazioni social.
              </li>
              <li>
                <strong>Dati di navigazione:</strong> log tecnici e dati di
                sessione necessari al funzionamento della piattaforma.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">
              3. Finalità del Trattamento
            </h2>
            <p>I dati raccolti vengono utilizzati per le seguenti finalità:</p>
            <ul className="list-disc pl-6 space-y-2 mt-3">
              <li>
                Autenticazione e gestione degli accessi alla piattaforma.
              </li>
              <li>
                Collegamento e gestione degli account social (Instagram,
                Facebook) tramite le API di Meta.
              </li>
              <li>
                Automazione delle risposte ai commenti e ai messaggi diretti
                ricevuti sugli account collegati.
              </li>
              <li>
                Raccolta e gestione dei lead generati tramite interazioni
                social.
              </li>
              <li>
                Monitoraggio e analisi delle performance delle automazioni
                attive.
              </li>
              <li>
                Gestione delle collaborazioni e dei progetti interni.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">
              4. Base Giuridica del Trattamento
            </h2>
            <p>
              Il trattamento dei dati è fondato sul{" "}
              <strong>consenso dell&apos;utente</strong> (art. 6, par. 1, lett.
              a del GDPR), espresso al momento del collegamento degli account
              social tramite il flusso di autorizzazione OAuth di Meta, e
              sul <strong>legittimo interesse</strong> (art. 6, par. 1, lett. f
              del GDPR) per le finalità di gestione interna della piattaforma.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">
              5. Integrazione con Meta (Facebook e Instagram)
            </h2>
            <p>
              L&apos;applicazione si integra con le API di Meta Platform per
              le seguenti funzionalità:
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-3">
              <li>
                <strong>Lettura dei dati del profilo Instagram/Facebook</strong>{" "}
                per identificare gli account collegati.
              </li>
              <li>
                <strong>Ricezione di commenti e messaggi</strong> tramite
                webhook per attivare automazioni configurate dall&apos;utente.
              </li>
              <li>
                <strong>Invio di messaggi diretti automatici</strong> in
                risposta a commenti o interazioni specifiche, secondo le regole
                di automazione impostate dall&apos;utente.
              </li>
              <li>
                <strong>Gestione delle Pagine Facebook</strong> collegate
                agli account Instagram Business.
              </li>
            </ul>
            <p className="mt-3">
              I dati ottenuti tramite le API di Meta vengono utilizzati
              esclusivamente per le finalità sopra descritte e non vengono
              venduti, ceduti o condivisi con terze parti per scopi pubblicitari
              o di profilazione.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">
              6. Conservazione dei Dati
            </h2>
            <p>
              I dati personali vengono conservati per il tempo strettamente
              necessario alle finalità per cui sono stati raccolti:
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-3">
              <li>
                <strong>Dati di autenticazione:</strong> fino alla
                cancellazione dell&apos;account.
              </li>
              <li>
                <strong>Token di accesso social:</strong> fino alla revoca
                dell&apos;autorizzazione o alla scadenza del token.
              </li>
              <li>
                <strong>Dati di interazione:</strong> conservati per un massimo
                di 24 mesi dalla raccolta.
              </li>
              <li>
                <strong>Dati lead:</strong> conservati fino alla richiesta di
                cancellazione.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">
              7. Sicurezza dei Dati
            </h2>
            <p>
              Adottiamo misure tecniche e organizzative adeguate per proteggere
              i dati personali, tra cui:
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-3">
              <li>Crittografia delle password con algoritmo bcrypt.</li>
              <li>Cifratura dei token di accesso social memorizzati.</li>
              <li>
                Connessioni HTTPS per tutte le comunicazioni client-server.
              </li>
              <li>Autenticazione basata su JWT con sessioni sicure.</li>
              <li>Accesso ai dati limitato per ruolo (amministratore, collaboratore, azienda).</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">
              8. Diritti dell&apos;Utente
            </h2>
            <p>
              In conformità al Regolamento (UE) 2016/679 (GDPR), l&apos;utente
              ha diritto di:
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-3">
              <li>Accedere ai propri dati personali.</li>
              <li>Richiedere la rettifica dei dati inesatti.</li>
              <li>
                Richiedere la cancellazione dei dati (&quot;diritto
                all&apos;oblio&quot;).
              </li>
              <li>Revocare il consenso al trattamento in qualsiasi momento.</li>
              <li>
                Richiedere la portabilità dei dati in formato strutturato.
              </li>
              <li>
                Proporre reclamo all&apos;autorità di controllo (Garante per la
                Protezione dei Dati Personali).
              </li>
            </ul>
            <p className="mt-3">
              Per esercitare i propri diritti, l&apos;utente può contattare il
              Titolare tramite i canali indicati nella piattaforma.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">
              9. Cancellazione dei Dati Utente
            </h2>
            <p>
              L&apos;utente può richiedere in qualsiasi momento la
              cancellazione completa dei propri dati contattando
              l&apos;amministratore della piattaforma. In seguito alla
              richiesta:
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-3">
              <li>
                Tutti i dati personali dell&apos;utente verranno eliminati
                entro 30 giorni.
              </li>
              <li>
                I token di accesso agli account social verranno revocati e
                cancellati.
              </li>
              <li>
                I dati di interazione associati verranno anonimizzati o
                cancellati.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">
              10. Modifiche alla Privacy Policy
            </h2>
            <p>
              Il Titolare si riserva il diritto di modificare la presente
              informativa in qualsiasi momento. Le modifiche saranno pubblicate
              su questa pagina con aggiornamento della data di ultima modifica.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
