'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  ArrowLeft,
  Check,
  ChevronLeft,
  ChevronRight,
  Download,
  FileJson,
  FileText,
} from 'lucide-react';

const STEPS = [
  { title: 'Business', subtitle: 'Chi e cosa vende' },
  { title: 'Obiettivi', subtitle: 'Cosa deve ottenere il sito' },
  { title: 'Struttura', subtitle: 'Pagine, stile e materiali' },
  { title: 'Export', subtitle: 'Risultato pronto' },
];

const OPTIONS = {
  obiettivi: [
    'Ricevere contatti',
    'Vendere',
    'Prenotazioni',
    'Mostrare portfolio',
    'Farsi trovare su Google',
  ],
  tipoSito: ['One Page', 'Sito vetrina', 'Landing page', 'E-commerce', 'Blog'],
  sezioni: ['Home', 'Chi siamo', 'Servizi', 'Gallery', 'Portfolio', 'Recensioni', 'FAQ', 'Contatti'],
  stile: ['Minimal', 'Moderno', 'Creativo', 'Elegante', 'Professionale', 'Ricco di animazioni'],
  animazioni: ['Pulito e statico', 'Micro animazioni', 'Ricco di animazioni'],
  brandAssets: ['Logo PNG', 'Logo vettoriale AI/SVG/PDF', 'Palette colori', 'Font/linee guida'],
  mediaAssets: ['Foto HQ', 'Video', 'Foto team', 'Foto sede/prodotti'],
  textAssets: ['Descrizione azienda', 'Servizi', 'Recensioni', 'FAQ', 'Testi pagine'],
};

const DEFAULT_INTERVIEW = {
  azienda: '',
  descrizioneAzienda: '',
  servizioPrincipale: '',
  servizioFocus: '',
  clienteIdeale: '',
  provenienzaClienti: '',
  obiettivi: [],
  azioneUtente: '',
  ctaPrincipale: '',
  tipoSito: '',
  sezioni: [],
  sezioniAltro: '',
  stile: [],
  stileAltro: '',
  animazioni: '',
  animazioniAltro: '',
  videoHomepage: 'No',
  lineeGuidaBrand: 'No',
  colori: '',
  font: '',
  dominioEsistente: 'No',
  dominio: '',
  providerDominio: '',
  emailCollegate: '',
  scadenzaDominio: '',
  accessiDominio: '',
  brandAssets: [],
  mediaAssets: [],
  textAssets: [],
  noteFinali: '',
};

const joinValue = (value) => {
  if (!value) return '-';
  if (Array.isArray(value)) return value.length ? value.join(', ') : '-';
  return String(value).trim() || '-';
};

const withOther = (values, other) => {
  const list = Array.isArray(values) ? [...values] : [];
  if (other?.trim()) list.push(`Altro: ${other.trim()}`);
  return list;
};

const sanitizeFilename = (value) =>
  (value || 'intervista-web-design')
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'intervista-web-design';

const buildInterviewText = (interview) => {
  const sezioni = withOther(interview.sezioni, interview.sezioniAltro);
  const stile = withOther(interview.stile, interview.stileAltro);
  const animazioni = interview.animazioniAltro?.trim()
    ? `${joinValue(interview.animazioni)}; Altro: ${interview.animazioniAltro.trim()}`
    : joinValue(interview.animazioni);

  return `INTERVISTA WEB DESIGN

1. BUSINESS
- Azienda: ${joinValue(interview.azienda)}
- Cosa fa/vende: ${joinValue(interview.descrizioneAzienda)}
- Servizio o prodotto principale: ${joinValue(interview.servizioPrincipale)}
- Servizio/prodotto da spingere: ${joinValue(interview.servizioFocus)}
- Cliente ideale: ${joinValue(interview.clienteIdeale)}
- Da dove arrivano oggi i clienti: ${joinValue(interview.provenienzaClienti)}

2. OBIETTIVI DEL SITO
- Obiettivi: ${joinValue(interview.obiettivi)}
- Cosa deve fare l'utente appena entra: ${joinValue(interview.azioneUtente)}
- CTA principale: ${joinValue(interview.ctaPrincipale)}

3. STRUTTURA E STILE
- Tipologia sito: ${joinValue(interview.tipoSito)}
- Sezioni richieste: ${joinValue(sezioni)}
- Stile desiderato: ${joinValue(stile)}
- Animazioni: ${animazioni}
- Video in homepage: ${joinValue(interview.videoHomepage)}
- Linee guida brand: ${joinValue(interview.lineeGuidaBrand)}
- Colori preferiti/da evitare: ${joinValue(interview.colori)}
- Font o riferimenti tipografici: ${joinValue(interview.font)}

4. DOMINIO E ACCESSI
- Dominio esistente: ${joinValue(interview.dominioEsistente)}
- Dominio/URL: ${joinValue(interview.dominio)}
- Provider dominio/hosting: ${joinValue(interview.providerDominio)}
- Email collegate: ${joinValue(interview.emailCollegate)}
- Scadenza dominio: ${joinValue(interview.scadenzaDominio)}
- Accessi dominio/hosting: ${joinValue(interview.accessiDominio)}

5. MATERIALI DISPONIBILI
- Brand: ${joinValue(interview.brandAssets)}
- Media: ${joinValue(interview.mediaAssets)}
- Testi: ${joinValue(interview.textAssets)}
- Note finali: ${joinValue(interview.noteFinali)}`;
};

const Field = ({ label, value, onChange, placeholder = '', type = 'text' }) => (
  <label className="block">
    <span className="text-sm font-semibold text-gray-800">{label}</span>
    <input
      type={type}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
      placeholder={placeholder}
    />
  </label>
);

const TextArea = ({ label, value, onChange, placeholder = '', rows = 4 }) => (
  <label className="block">
    <span className="text-sm font-semibold text-gray-800">{label}</span>
    <textarea
      value={value}
      onChange={(event) => onChange(event.target.value)}
      rows={rows}
      className="mt-2 w-full resize-none rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
      placeholder={placeholder}
    />
  </label>
);

const OptionGrid = ({ label, options, value, onChange, multiple = false }) => {
  const selected = multiple && Array.isArray(value) ? value : [];

  const toggleValue = (option) => {
    if (!multiple) {
      onChange(option);
      return;
    }

    onChange(
      selected.includes(option)
        ? selected.filter((item) => item !== option)
        : [...selected, option]
    );
  };

  return (
    <div>
      <p className="text-sm font-semibold text-gray-800">{label}</p>
      <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {options.map((option) => {
          const active = multiple ? selected.includes(option) : value === option;
          return (
            <button
              key={option}
              type="button"
              onClick={() => toggleValue(option)}
              className={`flex min-h-11 items-center justify-between rounded-lg border px-3 py-2 text-left text-sm font-medium transition ${
                active
                  ? 'border-orange-500 bg-orange-50 text-orange-800'
                  : 'border-gray-200 bg-white text-gray-700 hover:border-orange-300'
              }`}
            >
              <span>{option}</span>
              {active && <Check className="h-4 w-4 flex-shrink-0" />}
            </button>
          );
        })}
      </div>
    </div>
  );
};

const InterviewPage = () => {
  const { id } = useParams();
  const [interview, setInterview] = useState(DEFAULT_INTERVIEW);
  const [currentStep, setCurrentStep] = useState(0);
  const [message, setMessage] = useState('');

  const updateField = (field, value) => {
    setInterview((prev) => ({ ...prev, [field]: value }));
    setMessage('');
  };

  const resultText = useMemo(() => buildInterviewText(interview), [interview]);
  const resultJson = useMemo(
    () => ({
      tipo: 'intervista-web-design',
      generatoIl: new Date().toISOString(),
      webDesignerId: id,
      risultatoTxt: resultText,
      intervista: {
        ...interview,
        sezioniComplete: withOther(interview.sezioni, interview.sezioniAltro),
        stileCompleto: withOther(interview.stile, interview.stileAltro),
      },
    }),
    [id, interview, resultText]
  );

  const downloadFile = (content, filename, type) => {
    const blob = new Blob([content], { type });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
    setMessage(`Scaricato ${filename}`);
  };

  const filenameBase = sanitizeFilename(interview.azienda);
  const downloadTxt = () => downloadFile(resultText, `${filenameBase}.txt`, 'text/plain;charset=utf-8');
  const downloadJson = () =>
    downloadFile(
      JSON.stringify(resultJson, null, 2),
      `${filenameBase}.json`,
      'application/json;charset=utf-8'
    );

  const goBack = () => setCurrentStep((step) => Math.max(step - 1, 0));
  const goNext = () => setCurrentStep((step) => Math.min(step + 1, STEPS.length - 1));

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-medium text-orange-700">Web Design</p>
          <h1 className="mt-1 text-2xl font-bold text-gray-950">Nuova intervista cliente</h1>
        </div>
        <Link
          href={`/Lista_clienti_webdesigner/${id}`}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
        >
          <ArrowLeft className="h-4 w-4" />
          Torna ai clienti
        </Link>
      </div>

      <div className="mb-6 grid gap-2 sm:grid-cols-4">
        {STEPS.map((step, index) => (
          <button
            key={step.title}
            type="button"
            onClick={() => setCurrentStep(index)}
            className={`rounded-lg border p-3 text-left transition ${
              currentStep === index
                ? 'border-orange-500 bg-orange-50'
                : 'border-gray-200 bg-white hover:border-orange-200'
            }`}
          >
            <span className="block text-xs font-bold uppercase text-gray-500">Step {index + 1}</span>
            <span className="block text-sm font-bold text-gray-950">{step.title}</span>
            <span className="block text-xs text-gray-500">{step.subtitle}</span>
          </button>
        ))}
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
        {currentStep === 0 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-lg font-bold text-gray-950">Business</h2>
            </div>
            <div className="grid gap-4 lg:grid-cols-2">
              <Field
                label="Nome azienda"
                value={interview.azienda}
                onChange={(value) => updateField('azienda', value)}
                placeholder="Es. Studio Rossi"
              />
              <Field
                label="Servizio/prodotto principale"
                value={interview.servizioPrincipale}
                onChange={(value) => updateField('servizioPrincipale', value)}
                placeholder="Es. consulenza di vendita"
              />
            </div>
            <TextArea
              label="Cosa fa l'azienda"
              value={interview.descrizioneAzienda}
              onChange={(value) => updateField('descrizioneAzienda', value)}
              placeholder="Descrizione breve e concreta dell'attività"
            />
            <div className="grid gap-4 lg:grid-cols-2">
              <Field
                label="Cosa vogliamo spingere"
                value={interview.servizioFocus}
                onChange={(value) => updateField('servizioFocus', value)}
                placeholder="Servizio, prodotto o categoria prioritaria"
              />
              <Field
                label="Cliente ideale"
                value={interview.clienteIdeale}
                onChange={(value) => updateField('clienteIdeale', value)}
                placeholder="Es. giovani imprenditori, famiglie, aziende locali"
              />
            </div>
            <TextArea
              label="Da dove arrivano oggi i clienti"
              value={interview.provenienzaClienti}
              onChange={(value) => updateField('provenienzaClienti', value)}
              placeholder="Passaparola, Google, social, ads, partnership..."
              rows={3}
            />
          </div>
        )}

        {currentStep === 1 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-lg font-bold text-gray-950">Obiettivi</h2>
            </div>
            <OptionGrid
              label="Cosa deve ottenere il sito"
              options={OPTIONS.obiettivi}
              value={interview.obiettivi}
              onChange={(value) => updateField('obiettivi', value)}
              multiple
            />
            <div className="grid gap-4 lg:grid-cols-2">
              <Field
                label="Cosa deve fare l'utente appena entra"
                value={interview.azioneUtente}
                onChange={(value) => updateField('azioneUtente', value)}
                placeholder="Es. vedere i contatti, prenotare, acquistare"
              />
              <Field
                label="CTA principale"
                value={interview.ctaPrincipale}
                onChange={(value) => updateField('ctaPrincipale', value)}
                placeholder="Es. Contattaci, Prenota, Acquista ora"
              />
            </div>
            <OptionGrid
              label="Tipologia sito"
              options={OPTIONS.tipoSito}
              value={interview.tipoSito}
              onChange={(value) => updateField('tipoSito', value)}
            />
          </div>
        )}

        {currentStep === 2 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-lg font-bold text-gray-950">Struttura, stile e materiali</h2>
            </div>
            <OptionGrid
              label="Sezioni/pagine da includere"
              options={OPTIONS.sezioni}
              value={interview.sezioni}
              onChange={(value) => updateField('sezioni', value)}
              multiple
            />
            <Field
              label="Altre sezioni"
              value={interview.sezioniAltro}
              onChange={(value) => updateField('sezioniAltro', value)}
              placeholder="Aggiungi sezioni non presenti sopra"
            />
            <OptionGrid
              label="Stile desiderato"
              options={OPTIONS.stile}
              value={interview.stile}
              onChange={(value) => updateField('stile', value)}
              multiple
            />
            <Field
              label="Altro stile"
              value={interview.stileAltro}
              onChange={(value) => updateField('stileAltro', value)}
              placeholder="Mood, siti simili, dettagli particolari"
            />
            <div className="grid gap-4 lg:grid-cols-2">
              <OptionGrid
                label="Animazioni"
                options={OPTIONS.animazioni}
                value={interview.animazioni}
                onChange={(value) => updateField('animazioni', value)}
              />
              <div className="space-y-4">
                <OptionGrid
                  label="Video in homepage"
                  options={['No', 'Si']}
                  value={interview.videoHomepage}
                  onChange={(value) => updateField('videoHomepage', value)}
                />
                <OptionGrid
                  label="Linee guida brand"
                  options={['No', 'Si']}
                  value={interview.lineeGuidaBrand}
                  onChange={(value) => updateField('lineeGuidaBrand', value)}
                />
              </div>
            </div>
            <div className="grid gap-4 lg:grid-cols-2">
              <Field
                label="Colori preferiti o da evitare"
                value={interview.colori}
                onChange={(value) => updateField('colori', value)}
                placeholder="Es. blu, marrone, evitare rosso..."
              />
              <Field
                label="Font o riferimenti tipografici"
                value={interview.font}
                onChange={(value) => updateField('font', value)}
                placeholder="Font specifici o riferimento stile"
              />
            </div>
            <div className="grid gap-4 lg:grid-cols-3">
              <OptionGrid
                label="Materiali brand"
                options={OPTIONS.brandAssets}
                value={interview.brandAssets}
                onChange={(value) => updateField('brandAssets', value)}
                multiple
              />
              <OptionGrid
                label="Media disponibili"
                options={OPTIONS.mediaAssets}
                value={interview.mediaAssets}
                onChange={(value) => updateField('mediaAssets', value)}
                multiple
              />
              <OptionGrid
                label="Testi disponibili"
                options={OPTIONS.textAssets}
                value={interview.textAssets}
                onChange={(value) => updateField('textAssets', value)}
                multiple
              />
            </div>
          </div>
        )}

        {currentStep === 3 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-lg font-bold text-gray-950">Dominio e risultato</h2>
            </div>
            <div className="grid gap-4 lg:grid-cols-2">
              <OptionGrid
                label="Dominio esistente"
                options={['No', 'Si']}
                value={interview.dominioEsistente}
                onChange={(value) => updateField('dominioEsistente', value)}
              />
              <Field
                label="Dominio / URL"
                value={interview.dominio}
                onChange={(value) => updateField('dominio', value)}
                placeholder="azienda.it"
              />
            </div>
            <div className="grid gap-4 lg:grid-cols-3">
              <Field
                label="Provider dominio/hosting"
                value={interview.providerDominio}
                onChange={(value) => updateField('providerDominio', value)}
                placeholder="Aruba, OVH, SiteGround..."
              />
              <Field
                label="Email collegate"
                value={interview.emailCollegate}
                onChange={(value) => updateField('emailCollegate', value)}
                placeholder="info@azienda.it, amministrazione..."
              />
              <Field
                label="Scadenza dominio"
                value={interview.scadenzaDominio}
                onChange={(value) => updateField('scadenzaDominio', value)}
                placeholder="Data o mese/anno"
              />
            </div>
            <TextArea
              label="Accessi dominio/hosting"
              value={interview.accessiDominio}
              onChange={(value) => updateField('accessiDominio', value)}
              placeholder="Credenziali o note operative"
              rows={3}
            />
            <TextArea
              label="Note finali"
              value={interview.noteFinali}
              onChange={(value) => updateField('noteFinali', value)}
              placeholder="Vincoli, cose da evitare, richieste particolari"
              rows={3}
            />
            <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h3 className="text-sm font-bold text-gray-950">Risultato TXT</h3>
                  {message && <span className="text-xs font-semibold text-emerald-700">{message}</span>}
                </div>
                <pre className="max-h-[460px] overflow-auto whitespace-pre-wrap text-sm leading-6 text-gray-800">
                  {resultText}
                </pre>
              </div>
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                <h3 className="text-sm font-bold text-gray-950">Download</h3>
                <div className="mt-4 space-y-3">
                  <button
                    type="button"
                    onClick={downloadTxt}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-orange-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-orange-700"
                  >
                    <FileText className="h-4 w-4" />
                    Scarica TXT
                  </button>
                  <button
                    type="button"
                    onClick={downloadJson}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-gray-950 px-4 py-3 text-sm font-bold text-white transition hover:bg-gray-800"
                  >
                    <FileJson className="h-4 w-4" />
                    Scarica JSON
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={goBack}
          disabled={currentStep === 0}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <ChevronLeft className="h-4 w-4" />
          Indietro
        </button>
        {currentStep === STEPS.length - 1 ? (
          <button
            type="button"
            onClick={downloadTxt}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-orange-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-orange-700"
          >
            <Download className="h-4 w-4" />
            Scarica TXT
          </button>
        ) : (
          <button
            type="button"
            onClick={goNext}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-orange-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-orange-700"
          >
            Avanti
            <ChevronRight className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
};

export default InterviewPage;
