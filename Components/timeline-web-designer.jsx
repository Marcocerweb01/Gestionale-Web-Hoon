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
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="ml-3 text-gray-600">Caricamento in corso...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-4 m-4">
        <div className="flex items-center">
          <div className="w-5 h-5 text-red-500">⚠️</div>
          <p className="ml-2 text-red-700">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {collaborazioni.map((collaborazione) => (
        <div key={collaborazione._id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Header del progetto */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200 p-6">
            <div className="grid grid-cols-3 sm:grid-cols-1 gap-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <span className="text-blue-600 font-semibold">🏢</span>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Cliente</p>
                  <p className="text-lg font-semibold text-gray-900">{collaborazione.cliente.etichetta}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <span className="text-green-600 font-semibold">🚀</span>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Inizio Progetto</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {new Date(collaborazione.dataInizioContratto).toLocaleDateString()}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                  <span className="text-red-600 font-semibold">🏁</span>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Fine Progetto</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {new Date(collaborazione.dataFineContratto).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Tabella dei task */}
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Timeline Attività</h3>
            <div className="overflow-x-auto">
              <table className="w-full bg-white rounded-lg overflow-hidden">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Task</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Data Inizio</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Data Fine</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Tempistica</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Stato</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {collaborazione.tasks.map((task, index) => (
                    <tr key={`${collaborazione._id}-${index}`} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <span className="font-medium text-gray-900">{task.nome}</span>
                      </td>
                      <td className="px-6 py-4">
                        <input
                          type="date"
                          value={task.dataInizio ? task.dataInizio.split('T')[0] : ''}
                          onChange={(e) =>
                            handleUpdateTask(collaborazione._id, index, 'dataInizio', e.target.value)
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <input
                          type="date"
                          value={task.dataFine ? task.dataFine.split('T')[0] : ''}
                          onChange={(e) =>
                            handleUpdateTask(collaborazione._id, index, 'dataFine', e.target.value)
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-gray-600">{task.tempistica || '-'}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                            task.dataInizio && task.dataFine
                              ? 'bg-green-100 text-green-800'
                              : task.dataInizio && !task.dataFine
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {task.dataInizio && task.dataFine
                            ? '✅ Completato'
                            : task.dataInizio && !task.dataFine
                            ? '🔄 In Lavorazione'
                            : '⏳ Incompleto'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          {/* Campi Note e Problemi */}
          <div className="px-6 pb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  📝 Note Generiche
                </label>
                <textarea
                  value={collaborazione.note || ''}
                  onChange={(e) =>
                    handleUpdateCollaboration(collaborazione._id, 'note', e.target.value)
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors resize-none"
                  rows={4}
                  placeholder="Inserisci note generiche sul progetto..."
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  ⚠️ Problemi
                </label>
                <textarea
                  value={collaborazione.problemi || ''}
                  onChange={(e) =>
                    handleUpdateCollaboration(collaborazione._id, 'problemi', e.target.value)
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors resize-none"
                  rows={4}
                  placeholder="Descrivi eventuali problemi riscontrati..."
                />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default TimelineWebDesigner;