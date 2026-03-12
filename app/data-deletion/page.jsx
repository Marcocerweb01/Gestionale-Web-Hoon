export const metadata = {
  title: "Cancellazione Dati - Webarea",
  description: "Richiesta di cancellazione dati utente",
};

export default function DataDeletion() {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 md:p-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Cancellazione dei Dati Utente
        </h1>
        <p className="text-sm text-gray-500 mb-8">
          Data Deletion Request
        </p>

        <div className="prose prose-gray max-w-none space-y-6 text-gray-700 leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mt-4 mb-3">
              Come richiedere la cancellazione dei tuoi dati
            </h2>
            <p>
              Se desideri cancellare tutti i dati associati al tuo account sulla
              piattaforma Webarea, inclusi i dati ottenuti tramite
              l&apos;integrazione con Meta (Facebook e Instagram), puoi farlo
              in uno dei seguenti modi:
            </p>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mt-4">
              <h3 className="text-lg font-semibold text-blue-900 mb-3">
                Opzione 1: Contatta l&apos;Amministratore
              </h3>
              <p className="text-blue-800">
                Invia una richiesta di cancellazione dati
                all&apos;amministratore della piattaforma tramite i canali
                interni aziendali. La cancellazione verrà completata entro
                <strong> 30 giorni</strong> dalla richiesta.
              </p>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 mt-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Opzione 2: Rimuovi l&apos;app da Facebook/Instagram
              </h3>
              <ol className="list-decimal pl-6 space-y-2 text-gray-700">
                <li>
                  Vai su{" "}
                  <strong>Facebook → Impostazioni → App e siti web</strong>.
                </li>
                <li>Trova &quot;Webarea&quot; nella lista delle app attive.</li>
                <li>
                  Clicca <strong>&quot;Rimuovi&quot;</strong> e seleziona
                  &quot;Elimina tutti i post, le foto e i video su Facebook
                  pubblicati da questa app&quot;.
                </li>
              </ol>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">
              Quali dati vengono cancellati
            </h2>
            <p>
              In seguito alla richiesta di cancellazione, verranno eliminati:
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-3">
              <li>
                Token di accesso agli account Facebook e Instagram collegati.
              </li>
              <li>
                Dati del profilo social memorizzati nella piattaforma.
              </li>
              <li>
                Dati di interazione (commenti, messaggi) elaborati dalle
                automazioni.
              </li>
              <li>
                Lead e contatti generati dalle automazioni social.
              </li>
              <li>
                Regole di automazione e configurazioni associate
                all&apos;account.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">
              Tempi di elaborazione
            </h2>
            <p>
              La cancellazione dei dati viene completata entro{" "}
              <strong>30 giorni lavorativi</strong> dalla ricezione della
              richiesta. Riceverai conferma dell&apos;avvenuta cancellazione.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
