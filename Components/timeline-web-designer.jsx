import React, { useEffect, useState } from 'react';

const TimelineWebDesigner = ({ userId }) => {
  const [collaborazioni, setCollaborazioni] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchCollaborazioni = async () => {
      try {
        const response = await fetch(`/api/collaborazioni-webdesign/${userId}`);
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

  const handleUpdateCollaboration = async (collaborazioneId, field, value) => {
    try {
      const response = await fetch(`/api/collaborazioni-webdesign/${collaborazioneId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: value }),
      });

      if (!response.ok) {
        throw new Error('Errore durante l\'aggiornamento della collaborazione');
      }

      // Aggiorna lo stato locale
      setCollaborazioni((prev) =>
        prev.map((collaborazione) =>
          collaborazione._id === collaborazioneId
            ? { ...collaborazione, [field]: value }
            : collaborazione
        )
      );
    } catch (err) {
      console.error(err);
      setError('Non è stato possibile aggiornare la collaborazione.');
    }
  };

  const handleUpdateTask = async (collaborazioneId, taskIndex, field, value) => {
    try {
      const updatedTasks = collaborazioni.find((c) => c._id === collaborazioneId).tasks.map((task, index) => {
        if (index === taskIndex) {
          const updatedTask = { ...task, [field]: value };

          // Logica per determinare lo stato del task
          if (updatedTask.dataInizio && updatedTask.dataFine) {
            updatedTask.completata = true; // Completato
          } else if (updatedTask.dataInizio && !updatedTask.dataFine) {
            updatedTask.completata = false; // In Lavorazione
          } else {
            updatedTask.completata = false; // Incompleto
          }

          return updatedTask;
        }
        return task;
      });

      const response = await fetch(`/api/collaborazioni-webdesign/${collaborazioneId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tasks: updatedTasks }),
      });

      if (!response.ok) {
        throw new Error('Errore durante l\'aggiornamento del task');
      }

      // Aggiorna lo stato locale
      setCollaborazioni((prev) =>
        prev.map((collaborazione) =>
          collaborazione._id === collaborazioneId
            ? { ...collaborazione, tasks: updatedTasks }
            : collaborazione
        )
      );
    } catch (err) {
      console.error(err);
      setError('Non è stato possibile aggiornare il task.');
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
          {/* Dettagli del progetto */}
          <div className="mb-4 flex flex-row space-x-10">
            <p className="text-lg ">Cliente: <b>{collaborazione.cliente.etichetta}</b></p>
            <p className="text-lg">
              Data Inizio Progetto: <b>{new Date(collaborazione.dataInizioContratto).toLocaleDateString()}</b>
            </p>
            <p className="text-lg">
              Data Fine Progetto: <b>{new Date(collaborazione.dataFineContratto).toLocaleDateString()}</b>
            </p>
          </div>

          

          {/* Tabella dei task */}
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 p-2">Task</th>
                  <th className="border border-gray-300 p-2">Data Inizio Task</th>
                  <th className="border border-gray-300 p-2">Data Fine Task</th>
                  <th className="border border-gray-300 p-2">Tempistica</th>
                  <th className="border border-gray-300 p-2">Stato</th>
                </tr>
              </thead>
              <tbody>
                {collaborazione.tasks.map((task, index) => (
                  <tr key={`${collaborazione._id}-${index}`}>
                    <td className="border border-gray-300 p-2">{task.nome}</td>
                    <td className="border border-gray-300 p-2">
                      <input
                        type="date"
                        value={task.dataInizio ? task.dataInizio.split('T')[0] : ''} // Mostra una data solo se presente
                        onChange={(e) =>
                          handleUpdateTask(collaborazione._id, index, 'dataInizio', e.target.value)
                        }
                        className="w-full p-1 border rounded"
                      />
                    </td>
                    <td className="border border-gray-300 p-2">
                      <input
                        type="date"
                        value={task.dataFine ? task.dataFine.split('T')[0] : ''} // Mostra una data solo se presente
                        onChange={(e) =>
                          handleUpdateTask(collaborazione._id, index, 'dataFine', e.target.value)
                        }
                        className="w-full p-1 border rounded"
                      />
                    </td>
                    <td className="border border-gray-300 p-2">{task.tempistica || ''}</td>
                    <td className="border border-gray-300 p-2 text-center">
                      <span
                        className={`px-2 py-1 rounded ${
                          task.dataInizio && task.dataFine
                            ? 'bg-green-500 text-white' // Completato
                            : task.dataInizio && !task.dataFine
                            ? 'bg-orange-500 text-white' // In Lavorazione
                            : 'bg-gray-300 text-black' // Incompleto
                        }`}
                      >
                        {task.dataInizio && task.dataFine
                          ? 'Completato'
                          : task.dataInizio && !task.dataFine
                          ? 'In Lavorazione'
                          : 'Incompleto'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Campi Note e Problemi */}
          <div className="mt-4 flex flex-row space-x-10">
            <div className="mb-2 w-full">
              <label className="block text-sm font-medium">Note Generiche:</label>
              <textarea
                value={collaborazione.note || ''}
                onChange={(e) =>
                  handleUpdateCollaboration(collaborazione._id, 'note', e.target.value)
                }
                className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
              />
            </div>
            <div className="mb-2 w-full">
              <label className="block text-sm font-medium">Problemi:</label>
              <textarea
                value={collaborazione.problemi || ''}
                onChange={(e) =>
                  handleUpdateCollaboration(collaborazione._id, 'problemi', e.target.value)
                }
                className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default TimelineWebDesigner;