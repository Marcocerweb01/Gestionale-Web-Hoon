import React, { useEffect, useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

const TimelineWebDesigner = ({ userId }) => {
  const [collaborazioni, setCollaborazioni] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openProjects, setOpenProjects] = useState({});
  const [taskSortOrder, setTaskSortOrder] = useState({});
  const [projectSortOrder, setProjectSortOrder] = useState('default');

  const toggleProject = (projectId) => {
    setOpenProjects(prev => ({
      ...prev,
      [projectId]: !prev[projectId]
    }));
  };

  const toggleTaskSort = (projectId) => {
    setTaskSortOrder(prev => ({
      ...prev,
      [projectId]: prev[projectId] === 'stato' ? 'default' : 'stato'
    }));
  };

  const toggleProjectSort = () => {
    setProjectSortOrder(prev => prev === 'stato' ? 'default' : 'stato');
  };

  const getSortedProjects = (projects) => {
    if (!projects || !Array.isArray(projects)) return [];
    
    if (projectSortOrder === 'stato') {
      return [...projects].sort((a, b) => {
        const getProjectStatus = (project) => {
          if (project.stato === 'terminata') return 1; // Terminato (in fondo)
          if (project.stato === 'in pausa') return 2; // In pausa (nel mezzo)
          return 3; // In corso (in alto)
        };
        return getProjectStatus(b) - getProjectStatus(a);
      });
    }
    return [...projects];
  };

  const getSortedTasks = (tasks, projectId) => {
    if (!tasks || !Array.isArray(tasks)) return [];
    
    if (taskSortOrder[projectId] === 'stato') {
      return [...tasks].sort((a, b) => {
        const getTaskStatus = (task) => {
          if (task.dataInizio && task.dataFine) return 1; // Completato (in fondo)
          if (task.dataInizio && !task.dataFine) return 3; // In Lavorazione (in alto)
          return 2; // Incompleto (nel mezzo)
        };
        return getTaskStatus(b) - getTaskStatus(a);
      });
    }
    return [...tasks]; // Ritorna una copia dell'array originale
  };

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
      const collaborazione = collaborazioni.find((c) => c._id === collaborazioneId);
      const updatedTasks = collaborazione.tasks.map((task, index) => {
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

      // Verifica se tutti i task sono completati
      const allTasksCompleted = updatedTasks.length > 0 && updatedTasks.every(task => task.dataInizio && task.dataFine);
      
      // Prepara i dati da aggiornare
      const updateData = { tasks: updatedTasks };
      
      // Se tutti i task sono completati e il progetto non è già terminato, cambia lo stato
      if (allTasksCompleted && collaborazione.stato !== 'terminata') {
        updateData.stato = 'terminata';
      }

      const response = await fetch(`/api/collaborazioni-webdesign/${collaborazioneId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        throw new Error('Errore durante l\'aggiornamento del task');
      }

      // Aggiorna lo stato locale
      setCollaborazioni((prev) =>
        prev.map((collaborazione) =>
          collaborazione._id === collaborazioneId
            ? { ...collaborazione, ...updateData }
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

  if (collaborazioni.length === 0) {
    return (
      <div className="text-center p-8 bg-gray-50 rounded-lg">
        <div className="w-12 h-12 mx-auto text-gray-400 mb-4">🏢</div>
        <h3 className="text-lg font-semibold text-gray-600 mb-2">Nessun progetto assegnato</h3>
        <p className="text-gray-500">Non ci sono progetti web design al momento.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Controllo ordinamento progetti */}
      <div className="flex justify-end mb-4">
        <button
          onClick={toggleProjectSort}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            projectSortOrder === 'stato'
              ? 'bg-blue-100 text-blue-700 border border-blue-300'
              : 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200'
          }`}
        >
          {projectSortOrder === 'stato' ? '📊 Progetti Ordinati per Stato' : '📋 Ordina Progetti per Stato'}
        </button>
      </div>
      
      {getSortedProjects(collaborazioni).map((collaborazione) => {
        const isOpen = openProjects[collaborazione._id];
        
        return (
          <div key={collaborazione._id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {/* Header collassabile del progetto */}
            <div 
              className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200 cursor-pointer hover:bg-opacity-80 transition-colors"
              onClick={() => toggleProject(collaborazione._id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {isOpen ? (
                    <ChevronDown className="w-5 h-5 text-gray-600" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-gray-600" />
                  )}
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <span className="text-blue-600 font-semibold">🏢</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {collaborazione.cliente.etichetta}
                    </h3>
                    <p className="text-sm text-gray-600">
                      Progetto: {new Date(collaborazione.dataInizioContratto).toLocaleDateString()} → {new Date(collaborazione.dataFineContratto).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  {/* Controllo stato progetto per amministratore */}
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Stato progetto</p>
                    <select
                      value={collaborazione.stato || 'in corso'}
                      onChange={(e) => handleUpdateCollaboration(collaborazione._id, 'stato', e.target.value)}
                      className="px-3 py-1 border border-gray-300 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="in corso">🟢 In Corso</option>
                      <option value="in pausa">⏸️ In Pausa</option>
                      <option value="terminata">✅ Terminato</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Contenuto del progetto (collassabile) */}
            {isOpen && (
              <div className="p-6">
                {/* Info dettagli progetto */}
                <div className="flex justify-center mb-6">
                  <div className="grid grid-cols-3 gap-8 max-w-4xl w-full">
                    <div className="flex items-center space-x-3 justify-center">
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
                    
                    <div className="flex items-center space-x-3 justify-center">
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

                    <div className="flex items-center space-x-3 justify-center">
                      <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                        <span className="text-purple-600 font-semibold">💰</span>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Tipo Progetto</p>
                        <p className="text-lg font-semibold text-gray-900">
                          {collaborazione.tipoProgetto || 'Web Design'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tabella dei task */}
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Timeline Attività</h3>
                  <button
                    onClick={() => toggleTaskSort(collaborazione._id)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      taskSortOrder[collaborazione._id] === 'stato'
                        ? 'bg-blue-100 text-blue-700 border border-blue-300'
                        : 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200'
                    }`}
                  >
                    {taskSortOrder[collaborazione._id] === 'stato' ? '📊 Ordinato per Stato' : '📋 Ordina per Stato'}
                  </button>
                </div>
                <div className="overflow-x-auto mb-6">
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
                      {getSortedTasks(collaborazione.tasks, collaborazione._id)?.map((task, sortedIndex) => {
                        // Trova l'indice originale della task nell'array non ordinato
                        const originalIndex = collaborazione.tasks.findIndex(originalTask => 
                          originalTask.nome === task.nome && 
                          originalTask.dataInizio === task.dataInizio && 
                          originalTask.dataFine === task.dataFine
                        );
                        
                        return (
                          <tr key={`${collaborazione._id}-${originalIndex}-${sortedIndex}`} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4">
                              <span className="font-medium text-gray-900">{task.nome}</span>
                            </td>
                            <td className="px-6 py-4">
                              <input
                                type="date"
                                value={task.dataInizio ? task.dataInizio.split('T')[0] : ''}
                                onChange={(e) =>
                                  handleUpdateTask(collaborazione._id, originalIndex, 'dataInizio', e.target.value)
                                }
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                              />
                            </td>
                            <td className="px-6 py-4">
                              <input
                                type="date"
                                value={task.dataFine ? task.dataFine.split('T')[0] : ''}
                                onChange={(e) =>
                                  handleUpdateTask(collaborazione._id, originalIndex, 'dataFine', e.target.value)
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
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Campi Note e Problemi */}
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
            )}
          </div>
        );
      })}
    </div>
  );
};

export default TimelineWebDesigner;