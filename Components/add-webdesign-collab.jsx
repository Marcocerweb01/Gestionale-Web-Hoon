'use client';

import { useState, useEffect, useRef } from 'react';

const AddWebDesignCollabForm = () => {
  const [formData, setFormData] = useState({
    aziendaId: '',
    collaboratoreId: '',
    tipoProgetto: '',
    note: '',
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
    console-log("da form", e.target.value, formData.aziendaId, formData.collaboratoreId, formData.tipoProgetto)
    try {
      const response = await fetch('/api/collaborazioni-webdesign', {
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
      setFormData({ aziendaId: '', collaboratoreId: '', tipoProgetto: '', note: '' });
      setAziendaSearch('');
      setCollaboratoreSearch('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const selectAzienda = (azienda) => {
    setFormData((prev) => ({ ...prev, aziendaId: azienda.id }));
    setAziendaSearch(azienda.etichetta);
    setShowAziendeDropdown(false);
  };

  const selectCollaboratore = (collaboratore) => {
    setFormData((prev) => ({ ...prev, collaboratoreId: collaboratore.id }));
    setCollaboratoreSearch(`${collaboratore.nome} ${collaboratore.cognome}`);
    setShowCollaboratoriDropdown(false);
  };

  return (
    <div className="w-2/3 mx-auto p-6 border rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6">Nuova Collaborazione Web Design</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Azienda Searchable Dropdown */}
        <div className="relative" ref={aziendaDropdownRef}>
          <label className="block text-sm font-medium mb-1">Azienda:</label>
          <input
            type="text"
            value={aziendaSearch}
            onChange={(e) => {
              setAziendaSearch(e.target.value);
              setShowAziendeDropdown(true);
            }}
            onFocus={() => setShowAziendeDropdown(true)}
            className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Cerca azienda..."
          />
          {showAziendeDropdown && (
            <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
              {filteredAziende.map((azienda) => (
                <div
                  key={azienda._id}
                  className="p-2 hover:bg-gray-100 cursor-pointer"
                  onClick={() => selectAzienda(azienda)}
                >
                  {azienda.etichetta}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Collaboratore Searchable Dropdown */}
        <div className="relative" ref={collaboratoreDropdownRef}>
          <label className="block text-sm font-medium mb-1">Collaboratore:</label>
          <input
            type="text"
            value={collaboratoreSearch}
            onChange={(e) => {
              setCollaboratoreSearch(e.target.value);
              setShowCollaboratoriDropdown(true);
            }}
            onFocus={() => setShowCollaboratoriDropdown(true)}
            className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Cerca collaboratore..."
          />
          {showCollaboratoriDropdown && (
            <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
              {filteredCollaboratori.map((collaboratore) => (
                <div
                  key={collaboratore._id}
                  className="p-2 hover:bg-gray-100 cursor-pointer"
                  onClick={() => selectCollaboratore(collaboratore)}
                >
                  {`${collaboratore.nome} ${collaboratore.cognome}`}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Tipo di Progetto */}
        <div>
          <label className="block text-sm font-medium mb-1">Tipo di Progetto:</label>
          <select
            value={formData.tipoProgetto}
            onChange={(e) => setFormData((prev) => ({ ...prev, tipoProgetto: e.target.value }))}
            className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Seleziona il tipo di progetto</option>
            <option value="e-commerce">E-commerce</option>
            <option value="sito vetrina">Sito Vetrina</option>
            <option value="web app">Web App</option>
          </select>
        </div>

        {/* Note */}
        <div>
          <label className="block text-sm font-medium mb-1">Note (opzionale):</label>
          <textarea
            value={formData.note}
            onChange={(e) => setFormData((prev) => ({ ...prev, note: e.target.value }))}
            className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={4}
            placeholder="Inserisci eventuali note"
          />
        </div>

        {error && <div className="p-3 bg-red-100 text-red-700 rounded">{error}</div>}
        {success && <div className="p-3 bg-green-100 text-green-700 rounded">{success}</div>}

        <button
          type="submit"
          disabled={loading || !formData.aziendaId || !formData.collaboratoreId || !formData.tipoProgetto}
          className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Creazione in corso...' : 'Crea Collaborazione'}
        </button>
      </form>
    </div>
  );
};

export default AddWebDesignCollabForm;