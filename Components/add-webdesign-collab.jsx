'use client';

import { useState, useEffect, useRef } from 'react';

const AddWebDesignCollabForm = () => {
  const [formData, setFormData] = useState({
    clienteId: '', // Cambiato da aziendaId a clienteId
    webDesignerId: '', // Cambiato da collaboratoreId a webDesignerId
    tipoProgetto: '',
    note: '',
    dataInizioContratto: '',
    dataFineContratto: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [aziende, setAziende] = useState([]);
  const [collaboratori, setCollaboratori] = useState([]);

  const [aziendaSearch, setAziendaSearch] = useState('');
  const [collaboratoreSearch, setCollaboratoreSearch] = useState('');

  const [showAziendeDropdown, setShowAziendeDropdown] = useState(false);
  const [showCollaboratoriDropdown, setShowCollaboratoriDropdown] = useState(false);

  // Refs per i dropdown
  const aziendaDropdownRef = useRef(null);
  const collaboratoreDropdownRef = useRef(null);

  // Gestione click fuori dai dropdown
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

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [aziendeRes, collaboratoriRes] = await Promise.all([
          fetch('/api/lista_aziende'),
          fetch('/api/lista_collaboratori'),
        ]);

        const aziendeData = await aziendeRes.json();
        const collaboratoriData = await collaboratoriRes.json();

        setAziende(aziendeData);
        setCollaboratori(collaboratoriData);
      } catch (err) {
        setError('Errore nel caricamento dei dati');
      }
    };

    fetchData();
  }, []);

  const filteredAziende = aziende.filter((azienda) =>
    azienda.etichetta.toLowerCase().includes(aziendaSearch.toLowerCase())
  );

  const filteredCollaboratori = collaboratori.filter((collab) =>
    `${collab.nome} ${collab.cognome}`.toLowerCase().includes(collaboratoreSearch.toLowerCase())
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    console.log("Dati inviati al backend:", formData); // Verifica i dati inviati

    try {
      const response = await fetch('/api/collaborazioni-webdesign/crea', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Errore durante la creazione della collaborazione');
      }

      setSuccess('Collaborazione creata con successo!');
      setFormData({
        clienteId: '', // Cambiato da aziendaId a clienteId
        webDesignerId: '', // Cambiato da collaboratoreId a webDesignerId
        tipoProgetto: '',
        note: '',
        dataInizioContratto: '',
        dataFineContratto: '',
      });
      setAziendaSearch('');
      setCollaboratoreSearch('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const selectAzienda = (azienda) => {
    setFormData((prev) => ({ ...prev, clienteId: azienda.id })); // Cambiato da aziendaId a clienteId
    setAziendaSearch(azienda.etichetta);
    setShowAziendeDropdown(false);
  };

  const selectCollaboratore = (collaboratore) => {
    setFormData((prev) => ({ ...prev, webDesignerId: collaboratore.id })); // Cambiato da collaboratoreId a webDesignerId
    setCollaboratoreSearch(`${collaboratore.nome} ${collaboratore.cognome}`);
    setShowCollaboratoriDropdown(false);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200 p-6">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <span className="text-blue-600 text-xl">🎨</span>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Nuova Collaborazione Web Design</h2>
              <p className="text-gray-600 mt-1">Crea una nuova collaborazione per progetti web</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Griglia principale */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Azienda Searchable Dropdown */}
            <div className="relative" ref={aziendaDropdownRef}>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                🏢 Azienda <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={aziendaSearch}
                onChange={(e) => {
                  setAziendaSearch(e.target.value);
                  setShowAziendeDropdown(true);
                }}
                onFocus={() => setShowAziendeDropdown(true)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
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
                        <span className="font-medium text-gray-900">{azienda.etichetta}</span>
                      </div>
                    ))
                  ) : (
                    <div className="p-3 text-gray-500 text-center">Nessuna azienda trovata</div>
                  )}
                </div>
              )}
            </div>

            {/* Collaboratore Searchable Dropdown */}
            <div className="relative" ref={collaboratoreDropdownRef}>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                👨‍💻 Web Designer <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={collaboratoreSearch}
                onChange={(e) => {
                  setCollaboratoreSearch(e.target.value);
                  setShowCollaboratoriDropdown(true);
                }}
                onFocus={() => setShowCollaboratoriDropdown(true)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
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
                        <span className="text-sm text-gray-500 ml-2">({collaboratore.subRole})</span>
                      </div>
                    ))
                  ) : (
                    <div className="p-3 text-gray-500 text-center">Nessun collaboratore trovato</div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Tipo di Progetto */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              🚀 Tipo di Progetto <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.tipoProgetto}
              onChange={(e) => setFormData((prev) => ({ ...prev, tipoProgetto: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
              required
            >
              <option value="">Seleziona il tipo di progetto</option>
              <option value="e-commerce">🛒 E-commerce</option>
              <option value="sito vetrina">🏪 Sito Vetrina</option>
              <option value="sito starter">⚡ Sito Starter</option>
            </select>
          </div>

          {/* Date */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                📅 Data Inizio Contratto <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={formData.dataInizioContratto}
                onChange={(e) => setFormData((prev) => ({ ...prev, dataInizioContratto: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                🏁 Data Fine Contratto <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={formData.dataFineContratto}
                onChange={(e) => setFormData((prev) => ({ ...prev, dataFineContratto: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                required
              />
            </div>
          </div>

          {/* Note */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              📝 Note (opzionale)
            </label>
            <textarea
              value={formData.note}
              onChange={(e) => setFormData((prev) => ({ ...prev, note: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors resize-none"
              rows={4}
              placeholder="Inserisci eventuali note o dettagli aggiuntivi..."
            />
          </div>

          {/* Messaggi di errore e successo */}
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

          {/* Pulsante di submit */}
          <div className="flex justify-end pt-4 border-t border-gray-200">
            <button
              type="submit"
              disabled={loading || !formData.clienteId || !formData.webDesignerId || !formData.tipoProgetto || !formData.dataInizioContratto || !formData.dataFineContratto}
              className="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:hover:bg-gray-300 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors shadow-sm"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creazione in corso...
                </>
              ) : (
                <>
                  <span className="mr-2">🎨</span>
                  Crea Collaborazione
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddWebDesignCollabForm;