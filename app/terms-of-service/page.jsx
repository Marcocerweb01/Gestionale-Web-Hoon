export const metadata = {
  title: "Termini di Servizio - Webarea",
  description: "Termini e condizioni d'uso di Webarea",
};

export default function TermsOfService() {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 md:p-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Termini di Servizio
        </h1>
        <p className="text-sm text-gray-500 mb-8">
          Ultimo aggiornamento: 12 marzo 2026
        </p>

        <div className="prose prose-gray max-w-none space-y-6 text-gray-700 leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">
              1. Descrizione del Servizio
            </h2>
            <p>
              <strong>Webarea</strong> è una piattaforma gestionale ad uso
              interno che fornisce strumenti per la gestione di collaborazioni,
              clienti, lead, automazioni social media e fatturazione. La
              piattaforma è destinata esclusivamente al personale autorizzato
              dell&apos;organizzazione.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">
              2. Accesso alla Piattaforma
            </h2>
            <ul className="list-disc pl-6 space-y-2 mt-3">
              <li>
                L&apos;accesso è riservato agli utenti dotati di credenziali
                fornite dall&apos;amministratore.
              </li>
              <li>
                Ogni utente è responsabile della custodia delle proprie
                credenziali di accesso.
              </li>
              <li>
                È vietato condividere le proprie credenziali con soggetti non
                autorizzati.
              </li>
              <li>
                L&apos;amministratore si riserva il diritto di disabilitare
                qualsiasi account in qualsiasi momento.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">
              3. Account e Ruoli
            </h2>
            <p>
              La piattaforma prevede diversi livelli di accesso:
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-3">
              <li>
                <strong>Amministratore:</strong> accesso completo a tutte le
                funzionalità, gestione utenti e configurazioni.
              </li>
              <li>
                <strong>Collaboratore:</strong> accesso alle funzionalità
                assegnate in base al proprio ruolo operativo (commerciale, social
                media manager, web designer, SEO, Google Ads, Meta Ads).
              </li>
              <li>
                <strong>Azienda:</strong> accesso alle funzionalità di
                monitoraggio e gestione del proprio account.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">
              4. Funzionalità Social Media
            </h2>
            <p>
              La piattaforma consente il collegamento di account Instagram
              Business e Pagine Facebook tramite autorizzazione OAuth di Meta
              Platform. L&apos;utente che collega un account social:
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-3">
              <li>
                Garantisce di essere il legittimo proprietario o gestore
                autorizzato dell&apos;account collegato.
              </li>
              <li>
                Autorizza la piattaforma a ricevere notifiche di commenti e
                messaggi tramite webhook.
              </li>
              <li>
                Autorizza la piattaforma a inviare messaggi diretti automatici
                secondo le regole di automazione configurate.
              </li>
              <li>
                Può revocare l&apos;autorizzazione in qualsiasi momento
                scollegando l&apos;account dalla piattaforma o revocando i
                permessi dalle impostazioni di Meta.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">
              5. Automazioni e Messaggi Automatici
            </h2>
            <p>
              Le automazioni configurate sulla piattaforma (risposte automatiche
              a commenti, invio di DM) sono di esclusiva responsabilità
              dell&apos;utente che le configura. L&apos;utente si impegna a:
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-3">
              <li>
                Rispettare le policy di Meta Platform relative ai messaggi
                automatici e le interazioni.
              </li>
              <li>
                Non utilizzare le automazioni per inviare contenuti di spam,
                fraudolenti, offensivi o illegali.
              </li>
              <li>
                Monitorare regolarmente il funzionamento delle automazioni
                attive.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">
              6. Proprietà Intellettuale
            </h2>
            <p>
              Tutti i contenuti, il codice sorgente, il design e i materiali
              presenti sulla piattaforma sono di proprietà esclusiva del
              Titolare. È vietata la riproduzione, distribuzione o modifica
              senza autorizzazione scritta.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">
              7. Limitazione di Responsabilità
            </h2>
            <ul className="list-disc pl-6 space-y-2 mt-3">
              <li>
                La piattaforma viene fornita &quot;così com&apos;è&quot; senza
                garanzie di alcun tipo, esplicite o implicite.
              </li>
              <li>
                Il Titolare non è responsabile per interruzioni del servizio,
                perdita di dati o malfunzionamenti derivanti da servizi di terze
                parti (Meta, Instagram, provider hosting).
              </li>
              <li>
                Il Titolare non è responsabile per l&apos;uso improprio delle
                automazioni o per violazioni delle policy di Meta da parte degli
                utenti.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">
              8. Uso dei Dati di Meta Platform
            </h2>
            <p>
              I dati ottenuti tramite le API di Meta Platform (Facebook e
              Instagram) vengono utilizzati esclusivamente per:
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-3">
              <li>
                Gestire gli account social collegati dagli utenti autorizzati.
              </li>
              <li>
                Eseguire le automazioni configurate (risposte a commenti, invio
                DM).
              </li>
              <li>
                Raccogliere lead da interazioni social per finalità di gestione
                clienti.
              </li>
            </ul>
            <p className="mt-3">
              I dati di Meta <strong>non vengono</strong>:
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-3">
              <li>Venduti o ceduti a terze parti.</li>
              <li>Utilizzati per scopi pubblicitari o di profilazione.</li>
              <li>
                Trasferiti a servizi esterni non dichiarati nella presente
                informativa.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">
              9. Cancellazione dei Dati
            </h2>
            <p>
              L&apos;utente può richiedere la cancellazione completa dei propri
              dati in qualsiasi momento contattando l&apos;amministratore della
              piattaforma. Per revocare l&apos;accesso ai dati di Meta, è inoltre
              possibile rimuovere l&apos;app direttamente dalle impostazioni del
              proprio account Facebook/Instagram.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">
              10. Modifiche ai Termini
            </h2>
            <p>
              Il Titolare si riserva il diritto di modificare i presenti Termini
              di Servizio in qualsiasi momento. Le modifiche saranno pubblicate
              su questa pagina con aggiornamento della data di ultima modifica.
              L&apos;utilizzo continuato della piattaforma dopo la pubblicazione
              delle modifiche costituisce accettazione delle stesse.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">
              11. Legge Applicabile
            </h2>
            <p>
              I presenti Termini di Servizio sono regolati dalla legge italiana.
              Per qualsiasi controversia sarà competente il Foro del luogo di
              sede del Titolare.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
