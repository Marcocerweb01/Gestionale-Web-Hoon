import React, { useEffect, useState } from 'react';

const TimelineWebDesigner = ({ id }) => {
  const [collaborazioni, setCollaborazioni] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchCollaborazioni = async () => {
      try {
        const response = await fetch(`/api/collaborazioni-webdesign?userId=${userId}`);
        if (!response.ok) {
          throw new Error('Errore nel recupero delle collaborazioni');
        }
        const data = await response.json();
        setCollaborazioni(data);
      } catch (err) {
        console.error(err);
        setError('Non è stato possibile recuperare le collaborazioni.');
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchCollaborazioni();
    }
  }, [userId]);

  const handleUpdateFase = async (collaborazioneId, faseIndex, completata) => {
    try {
      const response = await fetch(`/api/collaborazioni-webdesign/${collaborazioneId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ faseIndex, completata }),
      });

      if (!response.ok) {
        throw new Error('Errore durante l\'aggiornamento della fase');
      }

      // Aggiorna lo stato locale
      setCollaborazioni((prev) =>
        prev.map((collaborazione) =>
          collaborazione._id === collaborazioneId
            ? {
                ...collaborazione,
                fasiProgetto: collaborazione.fasiProgetto.map((fase, index) =>
                  index === faseIndex ? { ...fase, completata } : fase
                ),
              }
            : collaborazione
        )
      );
    } catch (err) {
      console.error(err);
      setError('Non è stato possibile aggiornare la fase.');
    }
  };

  if (loading) {
    return <div>Caricamento in corso...</div>;
  }

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  return (
    <div className="space-y-6">
      {collaborazioni.map((collaborazione) => (
        <div key={collaborazione._id} className="border rounded-lg p-4 shadow-md bg-white">
          <h2 className="text-xl font-bold mb-2">
            Progetto: {collaborazione.tipoProgetto} - Cliente: {collaborazione.cliente.etichetta}
          </h2>
          <div>
            {collaborazione.fasiProgetto.map((fase, index) => (
              <div key={index} className="flex items-center space-x-4 mb-2">
                <span
                  className={`w-4 h-4 rounded-full ${
                    fase.completata ? 'bg-green-500' : 'bg-gray-300'
                  }`}
                ></span>
                <span>{fase.nome}</span>
                <button
                  className="ml-auto text-sm text-blue-500 hover:underline"
                  onClick={() => handleUpdateFase(collaborazione._id, index, !fase.completata)}
                >
                  {fase.completata ? 'Annulla' : 'Completa'}
                </button>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default TimelineWebDesigner;