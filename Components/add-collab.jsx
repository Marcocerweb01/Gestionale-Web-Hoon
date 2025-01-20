'use client';

import { useState, useEffect, useRef } from 'react';

const AddCollabForm = () => {
  const [formData, setFormData] = useState({
    aziendaId: '',
    collaboratoreId: '',
    note: '',
    numero_appuntamenti:0,
    post_ig_fb:0,
    post_tiktok:0,
    post_linkedin:0,

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

    // Gestione tasto ESC
    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setShowAziendeDropdown(false);
        setShowCollaboratoriDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [aziendeRes, collaboratoriRes] = await Promise.all([
          fetch('/api/lista_aziende'),
          fetch('/api/lista_collaboratori')
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

  const filteredAziende = aziende.filter(azienda => 
    azienda.etichetta.toLowerCase().includes(aziendaSearch.toLowerCase())
  );

  const filteredCollaboratori = collaboratori.filter(collab => 
    `${collab.nome} ${collab.cognome}`.toLowerCase().includes(collaboratoreSearch.toLowerCase())
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/crea_collaborazioni', {
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
      setFormData({ aziendaId: '', collaboratoreId: '', note: '',  numero_appuntamenti:'',
        post_ig_fb:'',
        post_tiktok:'',
        post_linkedin:''});
      setAziendaSearch('');
      setCollaboratoreSearch('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

// Aggiungi questi console.log dopo selectAzienda e selectCollaboratore
const selectAzienda = (azienda) => {
    setFormData(prev => ({ ...prev, aziendaId: azienda.id }));
    console.log(azienda.id)
    setAziendaSearch(azienda.ragioneSociale);
    setShowAziendeDropdown(false);
    console.log('Dopo select azienda:', formData); // Verifica i valori
};

const selectCollaboratore = (collaboratore) => {
    setFormData(prev => ({ ...prev, collaboratoreId: collaboratore.id }));
    setCollaboratoreSearch(`${collaboratore.nome} ${collaboratore.cognome}`);
    setShowCollaboratoriDropdown(false);
    console.log('Dopo select collaboratore:', formData); // Verifica i valori
};

  return (
    <div className="w-2/3 mx-auto p-6 border rounded-lg shadow-md" style={{ width: "66.6667%"}}>
      <h2 className="text-2xl font-bold mb-6">Nuova Collaborazione</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Azienda Searchable Dropdown */}
        <div className="relative" ref={aziendaDropdownRef}>
          <label className="block text-sm font-medium mb-1">
            Azienda:
          </label>
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
                  {azienda.ragioneSociale}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Collaboratore Searchable Dropdown */}
        <div className="relative" ref={collaboratoreDropdownRef}>
          <label className="block text-sm font-medium mb-1">
            Collaboratore:
          </label>
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
        <div>
          <label className="block text-sm font-medium mb-1">
            Numero Appuntamenti mensili:
          </label>
          <input
          type='number'
            name="appuntamenti"
            value={formData.numero_appuntamenti}
            onChange={(e) => setFormData(prev => ({ ...prev, numero_appuntamenti: e.target.value }))}
            className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={4}
            placeholder="Inserisci numero appuntamenti"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">
           Numero post Instagram & Facebook:
          </label>
          <input
          type='number'
            name="post_if&fb"
            value={formData.post_ig_fb}
            onChange={(e) => setFormData(prev => ({ ...prev, post_ig_fb: e.target.value }))}
            className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={4}
            placeholder="Inserisci numero post"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">
           Numero post Tik Tok:
          </label>
          <input
          type='number'
            name="post_tiktok"
            value={formData.post_tiktok}
            onChange={(e) => setFormData(prev => ({ ...prev, post_tiktok: e.target.value }))}
            className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={4}
            placeholder="Inserisci numero post"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">
           Numero post Linkedin:
          </label>
          <input
          type='number'
            name="post_linkedin"
            value={formData.post_linkedin}
            onChange={(e) => setFormData(prev => ({ ...prev, post_linkedin: e.target.value }))}
            className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={4}
            placeholder="Inserisci numero post"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">
            Note (opzionale):
          </label>
          <textarea
            name="note"
            value={formData.note}
            onChange={(e) => setFormData(prev => ({ ...prev, note: e.target.value }))}
            className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={4}
            placeholder="Inserisci eventuali note"
          />
        </div>
       
        

        {error && (
          <div className="p-3 bg-red-100 text-red-700 rounded">
            {error}
          </div>
        )}

        {success && (
          <div className="p-3 bg-green-100 text-green-700 rounded">
            {success}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !formData.aziendaId || !formData.collaboratoreId}
          className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Creazione in corso...' : 'Crea Collaborazione'}
        </button>
      </form>
    </div>
  );
};

export default AddCollabForm;