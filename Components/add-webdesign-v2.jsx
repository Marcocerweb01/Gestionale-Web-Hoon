'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

const isWeekend = (date) => date.getDay() === 0 || date.getDay() === 6;

const nextWorkingDay = (date) => {
  const next = new Date(date);
  while (isWeekend(next)) next.setDate(next.getDate() + 1);
  return next;
};

const addWorkingDays = (date, days) => {
  let next = nextWorkingDay(date);
  let remaining = days;

  while (remaining > 0) {
    next.setDate(next.getDate() + 1);
    if (!isWeekend(next)) remaining -= 1;
  }

  return next;
};

const formatDateInput = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getDefaultEndDate = (startValue) => {
  if (!startValue) return '';
  const start = new Date(`${startValue}T00:00:00`);
  if (Number.isNaN(start.getTime())) return '';
  return formatDateInput(addWorkingDays(start, 14));
};

const AddWebDesignV2Form = () => {
  const router = useRouter();
  const [formData, setFormData] = useState({
    clienteId: '',
    webDesignerId: '',
    designCollaboratoreId: '',
    tipoProgetto: '',
    note: '',
    dataInizioContratto: '',
    dataFineContratto: '',
  });
  const [designSvoltoDalReferente, setDesignSvoltoDalReferente] = useState(true);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [aziende, setAziende] = useState([]);
  const [collaboratori, setCollaboratori] = useState([]);

  const [aziendaSearch, setAziendaSearch] = useState('');
  const [collaboratoreSearch, setCollaboratoreSearch] = useState('');

  const [showAziendeDropdown, setShowAziendeDropdown] = useState(false);
  const [showCollaboratoriDropdown, setShowCollaboratoriDropdown] = useState(false);

  const aziendaDropdownRef = useRef(null);
  const collaboratoreDropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (aziendaDropdownRef.current && !aziendaDropdownRef.current.contains(event.target)) {
        setShowAziendeDropdown(false);
      }
      if (collaboratoreDropdownRef.current && !collaboratoreDropdownRef.current.contains(event.target)) {
        setShowCollaboratoriDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [aziendeRes, collaboratoriRes] = await Promise.all([
          fetch('/api/lista_aziende'),
          fetch('/api/lista_collaboratori'),
        ]);
        setAziende(await aziendeRes.json());
        setCollaboratori(await collaboratoriRes.json());
      } catch (err) {
        setError('Errore nel caricamento dei dati');
      }
    };
    fetchData();
  }, []);

  const filteredAziende = aziende.filter((a) =>
    (a.etichetta || a.ragioneSociale || a.nome || "")
      .toLowerCase()
      .includes(aziendaSearch.toLowerCase())
  );

  const webDesigners = collaboratori.filter(
    (c) => c.subRoles?.includes('web designer') || c.subRole === 'web designer'
  );
  const filteredCollaboratori = webDesigners.filter((c) =>
    `${c.nome} ${c.cognome}`.toLowerCase().includes(collaboratoreSearch.toLowerCase())
  );
  const altriWebDesigner = webDesigners.filter((c) => c.id !== formData.webDesignerId);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/collaborazioni-webdesign-v2/crea', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          designCollaboratoreId: designSvoltoDalReferente
            ? formData.webDesignerId
            : formData.designCollaboratoreId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Errore durante la creazione');
      }

      setSuccess('Collaborazione creata. Apro lo Step 1 dell’intervista...');
      router.push(
        `/Lista_clienti_webdesigner/${formData.webDesignerId}/interview/${data._id}`
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const selectAzienda = (azienda) => {
    setFormData((prev) => ({ ...prev, clienteId: azienda.id }));
    setAziendaSearch(azienda.etichetta || azienda.ragioneSociale || azienda.nome || "");
    setShowAziendeDropdown(false);
  };

  const selectCollaboratore = (collaboratore) => {
    setFormData((prev) => ({
      ...prev,
      webDesignerId: collaboratore.id,
      designCollaboratoreId:
        prev.designCollaboratoreId === collaboratore.id ? '' : prev.designCollaboratoreId,
    }));
    setCollaboratoreSearch(`${collaboratore.nome} ${collaboratore.cognome}`);
    setShowCollaboratoriDropdown(false);
  };

  const handleStartDateChange = (value) => {
    setFormData((prev) => ({
      ...prev,
      dataInizioContratto: value,
      dataFineContratto: getDefaultEndDate(value),
    }));
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-violet-50 to-purple-50 border-b border-gray-200 p-6">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-violet-100 rounded-lg flex items-center justify-center">
              <span className="text-violet-600 text-xl">🚀</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-bold text-gray-900">Nuovo Workflow Web Design</h2>
                <span className="px-2 py-0.5 bg-violet-600 text-white text-xs font-bold rounded-full">
                  V2
                </span>
              </div>
              <p className="text-gray-600 mt-1">
                15 giorni lavorativi: Struttura · Design e Sviluppo · Collaudo e Consegna
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Azienda */}
            <div className="relative" ref={aziendaDropdownRef}>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                🏢 Azienda <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={aziendaSearch}
                onChange={(e) => { setAziendaSearch(e.target.value); setShowAziendeDropdown(true); }}
                onFocus={() => setShowAziendeDropdown(true)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-colors"
                placeholder="Cerca e seleziona azienda..."
                required
              />
              {showAziendeDropdown && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto">
                  {filteredAziende.length > 0 ? (
                    filteredAziende.map((azienda) => (
                      <div
                        key={azienda.id}
                        className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors"
                        onClick={() => selectAzienda(azienda)}
                      >
                        <span className="font-medium text-gray-900">
                          {azienda.etichetta || azienda.ragioneSociale || azienda.nome}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="p-3 text-gray-500 text-center">Nessuna azienda trovata</div>
                  )}
                </div>
              )}
            </div>

            {/* Web Designer */}
            <div className="relative" ref={collaboratoreDropdownRef}>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                👨‍💻 Web Designer <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={collaboratoreSearch}
                onChange={(e) => { setCollaboratoreSearch(e.target.value); setShowCollaboratoriDropdown(true); }}
                onFocus={() => setShowCollaboratoriDropdown(true)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-colors"
                placeholder="Cerca e seleziona web designer..."
                required
              />
              {showCollaboratoriDropdown && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto">
                  {filteredCollaboratori.length > 0 ? (
                    filteredCollaboratori.map((collaboratore) => (
                      <div
                        key={collaboratore.id}
                        className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors"
                        onClick={() => selectCollaboratore(collaboratore)}
                      >
                        <span className="font-medium text-gray-900">
                          {`${collaboratore.nome} ${collaboratore.cognome}`}
                        </span>
                        <span className="text-sm text-gray-500 ml-2">
                          ({(collaboratore.subRoles || [collaboratore.subRole]).filter(Boolean).join(', ')})
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="p-3 text-gray-500 text-center">Nessun collaboratore trovato</div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <label className="flex min-h-10 cursor-pointer items-center gap-3 text-sm font-semibold text-gray-900">
              <input
                type="checkbox"
                checked={designSvoltoDalReferente}
                onChange={(e) => setDesignSvoltoDalReferente(e.target.checked)}
                className="h-4 w-4 shrink-0 accent-violet-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600"
              />
              Design svolto dal referente
            </label>
            {!designSvoltoDalReferente && (
              <div>
                <label htmlFor="design-collaboratore" className="mb-2 block text-sm font-semibold text-gray-900">
                  Design svolto da <span className="text-red-500">*</span>
                </label>
                <select
                  id="design-collaboratore"
                  value={formData.designCollaboratoreId}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, designCollaboratoreId: e.target.value }))
                  }
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500"
                  required
                >
                  <option value="">
                    {altriWebDesigner.length ? 'Seleziona un Web Designer' : 'Nessun altro Web Designer disponibile'}
                  </option>
                  {altriWebDesigner.map((collaboratore) => (
                    <option key={collaboratore.id} value={collaboratore.id}>
                      {collaboratore.nome} {collaboratore.cognome}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Tipo Progetto */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              🚀 Tipo di Progetto <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setFormData((prev) => ({ ...prev, tipoProgetto: 'vetrina' }))}
                className={`p-4 rounded-xl border-2 text-left transition-all ${
                  formData.tipoProgetto === 'vetrina'
                    ? 'border-violet-500 bg-violet-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="text-2xl mb-1">🏪</div>
                <div className="font-semibold text-gray-900">Sito Vetrina</div>
                <div className="text-xs text-gray-500 mt-1">Timeline Vetrina standard di 15 giorni lavorativi</div>
              </button>
              <button
                type="button"
                onClick={() => setFormData((prev) => ({ ...prev, tipoProgetto: 'e-commerce' }))}
                className={`p-4 rounded-xl border-2 text-left transition-all ${
                  formData.tipoProgetto === 'e-commerce'
                    ? 'border-violet-500 bg-violet-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="text-2xl mb-1">🛒</div>
                <div className="font-semibold text-gray-900">E-commerce</div>
                <div className="text-xs text-gray-500 mt-1">Timeline E-commerce standard di 15 giorni lavorativi</div>
              </button>
            </div>
          </div>

          {/* Date */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                📅 Avvio collaborazione (firma contratto) <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={formData.dataInizioContratto}
                onChange={(e) => handleStartDateChange(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-colors"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                🏁 Consegna prevista calcolata automaticamente
              </label>
              <input
                type="date"
                value={formData.dataFineContratto}
                readOnly
                className="w-full cursor-not-allowed rounded-lg border border-gray-300 bg-gray-100 px-4 py-3 text-gray-600"
              />
              <p className="text-xs text-gray-500 mt-1">
                È il giorno lavorativo 15. Sabato e domenica non vengono conteggiati.
              </p>
            </div>
          </div>

          {/* Note */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              📝 Note generali (opzionale)
            </label>
            <textarea
              value={formData.note}
              onChange={(e) => setFormData((prev) => ({ ...prev, note: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-colors resize-none"
              rows={3}
              placeholder="Inserisci eventuali note o dettagli aggiuntivi..."
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center">
                <span className="text-red-500 text-lg mr-2">⚠️</span>
                <p className="text-red-700">{error}</p>
              </div>
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center">
                <span className="text-green-500 text-lg mr-2">✅</span>
                <p className="text-green-700">{success}</p>
              </div>
            </div>
          )}

          <div className="flex justify-end pt-4 border-t border-gray-200">
            <button
              type="submit"
              disabled={
                loading ||
                !formData.clienteId ||
                !formData.webDesignerId ||
                (!designSvoltoDalReferente && !formData.designCollaboratoreId) ||
                !formData.tipoProgetto ||
                !formData.dataInizioContratto ||
                !formData.dataFineContratto
              }
              className="inline-flex items-center px-6 py-3 bg-violet-600 hover:bg-violet-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors shadow-sm"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creazione in corso...
                </>
              ) : (
                <>
                  <span className="mr-2">🚀</span>
                  Crea collaborazione e apri intervista
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddWebDesignV2Form;
