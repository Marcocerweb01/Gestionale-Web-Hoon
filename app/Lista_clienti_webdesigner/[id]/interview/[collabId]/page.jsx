'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

const STEP_TITLES = [
  'Dati business',
  'Sito e contenuti',
  'Dettagli tecnici',
  'Riepilogo & Salvataggio',
];

const checkboxOptions = {
  serviziSpingere: [
    'Branding',
    'Lead generation',
    'Vendite online',
    'Servizi professionali',
    'Portfolio',
  ],
  provenienzaClienti: ['Instagram', 'Google', 'Ads', 'Passaparola', 'Email marketing'],
  sezioni: ['Home', 'Chi siamo', 'Servizi', 'Contatti', 'Blog', 'Shop'],
  pagine: ['Landing', 'Shop', 'Portfolio', 'FAQ', 'Eventi', 'Prenotazione'],
  stilePreferito: ['Minimal', 'Moderno', 'Elegante', 'Vivace', 'Professionale'],
  tipoSito: ['Vetrina', 'E-commerce', 'Landing page', 'One page', 'Blog'],
  animazioni: ['Micro-interazioni', 'Scroll animato', 'Hover effects', 'Nessuna animazione'],
};

const defaultInterview = {
  azienda: '',
  descrizioneAzienda: '',
  servizioPrincipale: '',
  serviziSpingere: [],
  clienteIdeale: '',
  provenienzaClienti: [],
  obiettivoSito: '',
  utenteCosaFare: '',
  callToAction: '',
  tipoSito: [],
  sezioni: [],
  pagine: [],
  serviziEvidenza: '',
  recensioniClienti: 'no',
  recensioniClientiDettagli: '',
  lavoriProgetti: 'no',
  lavoriProgettiDettagli: '',
  sitiRiferimento: '',
  sitiNonPiacciono: '',
  stilePreferito: [],
  animazioni: [],
  videoHomepage: 'no',
  videoHomepageDettagli: '',
  preferenzeColori: '',
  preferenzeFont: '',
  haLineeGuidaBrand: 'no',
  lineeGuidaBrand: '',
  haDominio: 'no',
  dominio: '',
  servizioDominio: '',
  mailCollegate: '',
  accessiDominio: '',
  noteAccessi: '',
  scadenzaDominio: '',
  branding: '',
  media: '',
  testi: '',
  noteMateriali: '',
  fileUtili: '',
};

const joinList = (value) => {
  if (!value) return '-';
  if (Array.isArray(value)) return value.length ? value.join(', ') : '-';
  return String(value).trim() || '-';
};

const buildInterviewPrompt = (interview) => {
  return `Intervista web design per la creazione del sito:
- Azienda: ${joinList(interview.azienda)}
- Descrizione azienda: ${joinList(interview.descrizioneAzienda)}
- Servizio/prodotto principale: ${joinList(interview.servizioPrincipale)}
- Servizi da spingere: ${joinList(interview.serviziSpingere)}
- Cliente ideale: ${joinList(interview.clienteIdeale)}
- Provenienza clienti: ${joinList(interview.provenienzaClienti)}
- Obiettivo principale del sito: ${joinList(interview.obiettivoSito)}
- Azione utente all'ingresso: ${joinList(interview.utenteCosaFare)}
- Call to action principale: ${joinList(interview.callToAction)}
- Tipologia sito: ${joinList(interview.tipoSito)}
- Sezioni richieste: ${joinList(interview.sezioni)}
- Pagine richieste: ${joinList(interview.pagine)}
- Servizi da mettere in evidenza: ${joinList(interview.serviziEvidenza)}
- Recensioni clienti: ${joinList(interview.recensioniClienti)}
- Dettagli recensioni: ${joinList(interview.recensioniClientiDettagli)}
- Lavori/progetti da mostrare: ${joinList(interview.lavoriProgetti)}
- Dettagli lavori/progetti: ${joinList(interview.lavoriProgettiDettagli)}
- Siti di riferimento: ${joinList(interview.sitiRiferimento)}
- Siti da evitare: ${joinList(interview.sitiNonPiacciono)}
- Stile preferito: ${joinList(interview.stilePreferito)}
- Animazioni richieste: ${joinList(interview.animazioni)}
- Video in homepage: ${joinList(interview.videoHomepage)}
- Note video: ${joinList(interview.videoHomepageDettagli)}
- Preferenze colori: ${joinList(interview.preferenzeColori)}
- Preferenze font: ${joinList(interview.preferenzeFont)}
- Linee guida brand: ${joinList(interview.haLineeGuidaBrand)}
- Dettagli linee guida: ${joinList(interview.lineeGuidaBrand)}
- Dominio esistente: ${joinList(interview.haDominio)}
- Dominio: ${joinList(interview.dominio)}
- Servizio dominio: ${joinList(interview.servizioDominio)}
- Mail collegate: ${joinList(interview.mailCollegate)}
- Accessi dominio: ${joinList(interview.accessiDominio)}
- Note accessi: ${joinList(interview.noteAccessi)}
- Scadenza dominio: ${joinList(interview.scadenzaDominio)}
- Branding: ${joinList(interview.branding)}
- Media: ${joinList(interview.media)}
- Testi: ${joinList(interview.testi)}
- Note materiali: ${joinList(interview.noteMateriali)}
- File utili: ${joinList(interview.fileUtili)}`;
};

const InterviewPage = () => {
  const { id, collabId } = useParams();
  const router = useRouter();
  const [collab, setCollab] = useState(null);
  const [interview, setInterview] = useState(defaultInterview);
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchCollaborazione = async () => {
      if (!collabId) return;
      try {
        const res = await fetch(`/api/collaborazioni-webdesign-v2/${collabId}`);
        if (!res.ok) throw new Error('Errore nel recupero');
        const data = await res.json();
        setCollab(data);
        setInterview({
          ...defaultInterview,
          ...(data.interview || {}),
          serviziSpingere: Array.isArray(data.interview?.serviziSpingere)
            ? data.interview.serviziSpingere
            : data.interview?.serviziSpingere
            ? [data.interview.serviziSpingere]
            : [],
          provenienzaClienti: Array.isArray(data.interview?.provenienzaClienti)
            ? data.interview.provenienzaClienti
            : data.interview?.provenienzaClienti
            ? [data.interview.provenienzaClienti]
            : [],
          sezioni: Array.isArray(data.interview?.sezioni)
            ? data.interview.sezioni
            : data.interview?.sezioni
            ? [data.interview.sezioni]
            : [],
          pagine: Array.isArray(data.interview?.pagine)
            ? data.interview.pagine
            : data.interview?.pagine
            ? [data.interview.pagine]
            : [],
          stilePreferito: Array.isArray(data.interview?.stilePreferito)
            ? data.interview.stilePreferito
            : data.interview?.stilePreferito
            ? [data.interview.stilePreferito]
            : [],
          tipoSito: Array.isArray(data.interview?.tipoSito)
            ? data.interview.tipoSito
            : data.interview?.tipoSito
            ? [data.interview.tipoSito]
            : [],
          animazioni: Array.isArray(data.interview?.animazioni)
            ? data.interview.animazioni
            : data.interview?.animazioni
            ? [data.interview.animazioni]
            : [],
        });
      } catch (err) {
        console.error(err);
        setError('Non è stato possibile caricare l\'intervista.');
      } finally {
        setLoading(false);
      }
    };

    fetchCollaborazione();
  }, [collabId]);

  const handleChange = (field, value) => {
    setInterview((prev) => ({ ...prev, [field]: value }));
  };

  const handleToggle = (field, value) => {
    setInterview((prev) => {
      const current = Array.isArray(prev[field]) ? prev[field] : [];
      const hasValue = current.includes(value);
      return {
        ...prev,
        [field]: hasValue ? current.filter((item) => item !== value) : [...current, value],
      };
    });
  };

  const handleOption = (field, value) => {
    setInterview((prev) => ({ ...prev, [field]: value }));
  };

  const goBack = () => setCurrentStep((step) => Math.max(step - 1, 0));
  const goNext = () => setCurrentStep((step) => Math.min(step + 1, STEP_TITLES.length - 1));

  const promptText = useMemo(() => buildInterviewPrompt(interview), [interview]);

  const saveInterview = async () => {
    if (!collabId) return;
    setSaving(true);
    setError('');
    setMessage('');
    try {
      const payload = { interview, interviewPrompt: promptText };
      const res = await fetch(`/api/collaborazioni-webdesign-v2/${collabId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Errore aggiornamento');
      setMessage('Intervista salvata con successo.');
    } catch (err) {
      console.error(err);
      setError('Errore durante il salvataggio dell\'intervista.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-12">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-violet-600"></div>
        <span className="ml-3 text-gray-700">Caricamento intervista...</span>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-gray-500">Intervista Web Design / {collab?.cliente?.etichetta || collab?.aziendaRagioneSociale || 'Cliente'}</p>
          <h1 className="text-2xl font-semibold text-gray-900">Intervista strutturata</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/Lista_clienti_webdesigner/${id}`}
            className="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            Torna indietro
          </Link>
        </div>
      </div>

      <div className="mb-8 rounded-3xl border border-violet-200 bg-violet-50 p-4 text-sm text-violet-800">
        <p className="font-semibold">Passaggi</p>
        <div className="mt-3 grid gap-2 sm:grid-cols-4">
          {STEP_TITLES.map((title, index) => (
            <div
              key={title}
              className={`rounded-2xl border px-3 py-2 text-center ${
                currentStep === index
                  ? 'border-violet-500 bg-white text-violet-700'
                  : 'border-transparent bg-violet-100 text-violet-900/70'
              }`}
            >
              <span className="block text-xs font-semibold uppercase">Step {index + 1}</span>
              <span className="block text-sm">{title}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-8">
        {currentStep === 0 && (
          <section className="space-y-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Dati business</h2>
              <p className="mt-2 text-sm text-gray-600">Informazioni principali per definire obiettivi e posizionamento.</p>
            </div>
            <div className="grid gap-4 lg:grid-cols-2">
              <label className="block">
                <span className="text-sm font-semibold text-gray-700">Azienda</span>
                <input
                  type="text"
                  value={interview.azienda}
                  onChange={(e) => handleChange('azienda', e.target.value)}
                  className="mt-2 w-full rounded-2xl border border-gray-300 bg-gray-50 px-4 py-3 text-sm focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-100"
                  placeholder="Nome o ragione sociale"
                />
              </label>
              <label className="block">
                <span className="text-sm font-semibold text-gray-700">Descrizione azienda</span>
                <textarea
                  value={interview.descrizioneAzienda}
                  onChange={(e) => handleChange('descrizioneAzienda', e.target.value)}
                  className="mt-2 h-28 w-full rounded-2xl border border-gray-300 bg-gray-50 px-4 py-3 text-sm focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-100 resize-none"
                  placeholder="In una frase, qual è la vostra attività?"
                />
              </label>
            </div>
            <div className="grid gap-4 lg:grid-cols-2">
              <label className="block">
                <span className="text-sm font-semibold text-gray-700">Servizio/prodotto principale</span>
                <input
                  type="text"
                  value={interview.servizioPrincipale}
                  onChange={(e) => handleChange('servizioPrincipale', e.target.value)}
                  className="mt-2 w-full rounded-2xl border border-gray-300 bg-gray-50 px-4 py-3 text-sm focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-100"
                  placeholder="Cosa offrite principalmente?"
                />
              </label>
              <label className="block">
                <span className="text-sm font-semibold text-gray-700">Cliente ideale</span>
                <input
                  type="text"
                  value={interview.clienteIdeale}
                  onChange={(e) => handleChange('clienteIdeale', e.target.value)}
                  className="mt-2 w-full rounded-2xl border border-gray-300 bg-gray-50 px-4 py-3 text-sm focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-100"
                  placeholder="A chi vi rivolgete?"
                />
              </label>
            </div>
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="space-y-2">
                <p className="text-sm font-semibold text-gray-700">Provenienza clienti</p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {checkboxOptions.provenienzaClienti.map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => handleToggle('provenienzaClienti', option)}
                      className={`rounded-2xl border px-4 py-3 text-left text-sm ${
                        interview.provenienzaClienti.includes(option)
                          ? 'border-violet-500 bg-violet-100 text-violet-800'
                          : 'border-gray-200 bg-white text-gray-700 hover:border-violet-300'
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <label className="block">
                  <span className="text-sm font-semibold text-gray-700">Obiettivo del sito</span>
                  <textarea
                    value={interview.obiettivoSito}
                    onChange={(e) => handleChange('obiettivoSito', e.target.value)}
                    className="mt-2 h-28 w-full rounded-2xl border border-gray-300 bg-gray-50 px-4 py-3 text-sm focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-100 resize-none"
                    placeholder="Esempio: acquisire lead, vendere, presentare team"
                  />
                </label>
              </div>
            </div>
          </section>
        )}

        {currentStep === 1 && (
          <section className="space-y-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Sito e contenuti</h2>
              <p className="mt-2 text-sm text-gray-600">Scegli quali pagine, sezioni e funzioni devono esserci.</p>
            </div>
            <div className="grid gap-4 lg:grid-cols-2">
              <label className="block">
                <span className="text-sm font-semibold text-gray-700">Sezioni richieste</span>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {checkboxOptions.sezioni.map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => handleToggle('sezioni', option)}
                      className={`rounded-2xl border px-4 py-3 text-left text-sm ${
                        interview.sezioni.includes(option)
                          ? 'border-violet-500 bg-violet-100 text-violet-800'
                          : 'border-gray-200 bg-white text-gray-700 hover:border-violet-300'
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </label>
              <label className="block">
                <span className="text-sm font-semibold text-gray-700">Pagine richieste</span>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {checkboxOptions.pagine.map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => handleToggle('pagine', option)}
                      className={`rounded-2xl border px-4 py-3 text-left text-sm ${
                        interview.pagine.includes(option)
                          ? 'border-violet-500 bg-violet-100 text-violet-800'
                          : 'border-gray-200 bg-white text-gray-700 hover:border-violet-300'
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </label>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <label className="block">
                <span className="text-sm font-semibold text-gray-700">Tipologia sito</span>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {checkboxOptions.tipoSito.map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => handleToggle('tipoSito', option)}
                      className={`rounded-2xl border px-4 py-3 text-left text-sm ${
                        interview.tipoSito.includes(option)
                          ? 'border-violet-500 bg-violet-100 text-violet-800'
                          : 'border-gray-200 bg-white text-gray-700 hover:border-violet-300'
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </label>
              <label className="block">
                <span className="text-sm font-semibold text-gray-700">Servizi da mettere in evidenza</span>
                <textarea
                  value={interview.serviziEvidenza}
                  onChange={(e) => handleChange('serviziEvidenza', e.target.value)}
                  className="mt-2 h-28 w-full rounded-2xl border border-gray-300 bg-gray-50 px-4 py-3 text-sm focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-100 resize-none"
                  placeholder="Cosa deve essere subito visibile?"
                />
              </label>
            </div>

            <div className="space-y-4">
              <label className="block">
                <span className="text-sm font-semibold text-gray-700">Stile preferito</span>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {checkboxOptions.stilePreferito.map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => handleToggle('stilePreferito', option)}
                      className={`rounded-2xl border px-4 py-3 text-left text-sm ${
                        interview.stilePreferito.includes(option)
                          ? 'border-violet-500 bg-violet-100 text-violet-800'
                          : 'border-gray-200 bg-white text-gray-700 hover:border-violet-300'
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </label>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <label className="block">
                <span className="text-sm font-semibold text-gray-700">Animazioni</span>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {checkboxOptions.animazioni.map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => handleToggle('animazioni', option)}
                      className={`rounded-2xl border px-4 py-3 text-left text-sm ${
                        interview.animazioni.includes(option)
                          ? 'border-violet-500 bg-violet-100 text-violet-800'
                          : 'border-gray-200 bg-white text-gray-700 hover:border-violet-300'
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </label>
              <label className="block">
                <span className="text-sm font-semibold text-gray-700">Video in homepage</span>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {['no', 'si'].map((value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => handleOption('videoHomepage', value)}
                      className={`rounded-2xl border px-4 py-3 text-left text-sm ${
                        interview.videoHomepage === value
                          ? 'border-violet-500 bg-violet-100 text-violet-800'
                          : 'border-gray-200 bg-white text-gray-700 hover:border-violet-300'
                      }`}
                    >
                      {value === 'si' ? 'Sì' : 'No'}
                    </button>
                  ))}
                </div>
              </label>
            </div>

            {interview.videoHomepage === 'si' && (
              <label className="block">
                <span className="text-sm font-semibold text-gray-700">Dettagli video in homepage</span>
                <textarea
                  value={interview.videoHomepageDettagli}
                  onChange={(e) => handleChange('videoHomepageDettagli', e.target.value)}
                  className="mt-2 h-28 w-full rounded-2xl border border-gray-300 bg-gray-50 px-4 py-3 text-sm focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-100 resize-none"
                  placeholder="Che tipo di video? Che messaggio deve trasmettere?"
                />
              </label>
            )}
          </section>
        )}

        {currentStep === 2 && (
          <section className="space-y-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Dettagli tecnici</h2>
              <p className="mt-2 text-sm text-gray-600">Informazioni necessarie per dominio, accessi e linee guida.</p>
            </div>
            <div className="grid gap-4 lg:grid-cols-2">
              <label className="block">
                <span className="text-sm font-semibold text-gray-700">Linee guida brand disponibili?</span>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {['no', 'si'].map((value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => handleOption('haLineeGuidaBrand', value)}
                      className={`rounded-2xl border px-4 py-3 text-left text-sm ${
                        interview.haLineeGuidaBrand === value
                          ? 'border-violet-500 bg-violet-100 text-violet-800'
                          : 'border-gray-200 bg-white text-gray-700 hover:border-violet-300'
                      }`}
                    >
                      {value === 'si' ? 'Sì' : 'No'}
                    </button>
                  ))}
                </div>
              </label>

              {interview.haLineeGuidaBrand === 'si' && (
                <label className="block">
                  <span className="text-sm font-semibold text-gray-700">Dettagli linee guida brand</span>
                  <textarea
                    value={interview.lineeGuidaBrand}
                    onChange={(e) => handleChange('lineeGuidaBrand', e.target.value)}
                    className="mt-2 h-28 w-full rounded-2xl border border-gray-300 bg-gray-50 px-4 py-3 text-sm focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-100 resize-none"
                    placeholder="Palette, mood, immagini, tono di voce"
                  />
                </label>
              )}
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <label className="block">
                <span className="text-sm font-semibold text-gray-700">Dominio esistente?</span>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {['no', 'si'].map((value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => handleOption('haDominio', value)}
                      className={`rounded-2xl border px-4 py-3 text-left text-sm ${
                        interview.haDominio === value
                          ? 'border-violet-500 bg-violet-100 text-violet-800'
                          : 'border-gray-200 bg-white text-gray-700 hover:border-violet-300'
                      }`}
                    >
                      {value === 'si' ? 'Sì' : 'No'}
                    </button>
                  ))}
                </div>
              </label>

              {interview.haDominio === 'si' && (
                <label className="block">
                  <span className="text-sm font-semibold text-gray-700">Dominio / URL</span>
                  <input
                    type="text"
                    value={interview.dominio}
                    onChange={(e) => handleChange('dominio', e.target.value)}
                    className="mt-2 w-full rounded-2xl border border-gray-300 bg-gray-50 px-4 py-3 text-sm focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-100"
                    placeholder="esempio: azienda.it"
                  />
                </label>
              )}
            </div>

            {interview.haDominio === 'si' && (
              <div className="grid gap-4 lg:grid-cols-3">
                <label className="block">
                  <span className="text-sm font-semibold text-gray-700">Servizio dominio</span>
                  <input
                    type="text"
                    value={interview.servizioDominio}
                    onChange={(e) => handleChange('servizioDominio', e.target.value)}
                    className="mt-2 w-full rounded-2xl border border-gray-300 bg-gray-50 px-4 py-3 text-sm focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-100"
                    placeholder="Aruba, OVH, GoDaddy..."
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-semibold text-gray-700">Mail collegate</span>
                  <input
                    type="text"
                    value={interview.mailCollegate}
                    onChange={(e) => handleChange('mailCollegate', e.target.value)}
                    className="mt-2 w-full rounded-2xl border border-gray-300 bg-gray-50 px-4 py-3 text-sm focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-100"
                    placeholder="Email principali collegate"
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-semibold text-gray-700">Data scadenza dominio</span>
                  <input
                    type="text"
                    value={interview.scadenzaDominio}
                    onChange={(e) => handleChange('scadenzaDominio', e.target.value)}
                    className="mt-2 w-full rounded-2xl border border-gray-300 bg-gray-50 px-4 py-3 text-sm focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-100"
                    placeholder="Esempio: 2027-07-01"
                  />
                </label>
              </div>
            )}

            {interview.haDominio === 'si' && (
              <label className="block">
                <span className="text-sm font-semibold text-gray-700">Accessi dominio / hosting</span>
                <textarea
                  value={interview.accessiDominio}
                  onChange={(e) => handleChange('accessiDominio', e.target.value)}
                  className="mt-2 h-28 w-full rounded-2xl border border-gray-300 bg-gray-50 px-4 py-3 text-sm focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-100 resize-none"
                  placeholder="Credenziali o note sugli accessi"
                />
              </label>
            )}

            {interview.haDominio === 'si' && (
              <label className="block">
                <span className="text-sm font-semibold text-gray-700">Note accessi</span>
                <textarea
                  value={interview.noteAccessi}
                  onChange={(e) => handleChange('noteAccessi', e.target.value)}
                  className="mt-2 h-28 w-full rounded-2xl border border-gray-300 bg-gray-50 px-4 py-3 text-sm focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-100 resize-none"
                  placeholder="Note su certificati, redirect, account"
                />
              </label>
            )}
          </section>
        )}

        {currentStep === 3 && (
          <section className="space-y-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Riepilogo</h2>
              <p className="mt-2 text-sm text-gray-600">Controlla le informazioni e salva l'intervista.</p>
            </div>
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-3xl border border-gray-200 bg-slate-50 p-5">
                <h3 className="text-sm font-semibold text-gray-900">Testo strutturato</h3>
                <pre className="mt-4 whitespace-pre-wrap text-sm leading-6 text-slate-800">{promptText}</pre>
              </div>
              <div className="space-y-4 rounded-3xl border border-gray-200 bg-slate-50 p-5">
                <div>
                  <p className="text-sm font-semibold text-gray-700">Salva</p>
                  <p className="mt-2 text-sm text-gray-600">L'intervista verrà salvata nel progetto e sarà pronta per l'uso GPT.</p>
                </div>
                {message && <div className="rounded-2xl bg-emerald-50 p-3 text-sm text-emerald-800">{message}</div>}
                {error && <div className="rounded-2xl bg-red-50 p-3 text-sm text-red-700">{error}</div>}
                <button
                  type="button"
                  onClick={saveInterview}
                  disabled={saving}
                  className="w-full rounded-2xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:bg-gray-300"
                >
                  {saving ? 'Salvataggio...' : 'Salva intervista'}
                </button>
              </div>
            </div>
          </section>
        )}
      </div>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={goBack}
          disabled={currentStep === 0}
          className="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Indietro
        </button>
        <button
          type="button"
          onClick={currentStep === STEP_TITLES.length - 1 ? saveInterview : goNext}
          className="rounded-full bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-700"
        >
          {currentStep === STEP_TITLES.length - 1 ? 'Salva intervista' : 'Avanti'}
        </button>
      </div>
    </div>
  );
};

export default InterviewPage;
