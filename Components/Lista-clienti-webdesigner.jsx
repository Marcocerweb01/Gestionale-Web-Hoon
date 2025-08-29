'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Monitor, ExternalLink, Calendar, User } from 'lucide-react';

const ListaClientiWebDesigner = ({ userId, showWebDesignerLink = false }) => {
  const [collaborazioni, setCollaborazioni] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCollaborazioni = async () => {
      try {
        const response = await fetch(`/api/collaborazioni-webdesign/${userId}`);
        if (!response.ok) {
          throw new Error('Errore nel recupero delle collaborazioni');
        }
        const data = await response.json();
        setCollaborazioni(data);
      } catch (error) {
        console.error('Errore:', error);
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchCollaborazioni();
    }
  }, [userId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <span className="ml-3 text-gray-600">Caricamento progetti...</span>
      </div>
    );
  }

  if (collaborazioni.length === 0) {
    return (
      <div className="text-center p-8 bg-gray-50 rounded-lg">
        <Monitor className="w-12 h-12 mx-auto text-gray-400 mb-4" />
        <h3 className="text-lg font-semibold text-gray-600 mb-2">Nessun progetto assegnato</h3>
        <p className="text-gray-500">Non ci sono progetti web design al momento.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">I tuoi progetti web design</h3>
        <span className="bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full">
          {collaborazioni.length} {collaborazioni.length === 1 ? 'progetto' : 'progetti'}
        </span>
      </div>
      
      <div className="grid gap-4">
        {collaborazioni.map((collab) => (
          <div key={collab._id} className="group">
            <div 
              className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md hover:border-blue-300 transition-all duration-200 cursor-pointer"
              onClick={() => window.location.href = `/User/${collab.webDesigner._id}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center mb-3">
                    <Monitor className="w-5 h-5 text-blue-500 mr-3" />
                    <Link 
                      href={`/User/${collab.cliente._id}`}
                      className="text-lg font-semibold text-gray-900 hover:text-blue-600 transition-colors underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {collab.cliente.etichetta}
                    </Link>
                    <ExternalLink className="w-4 h-4 text-gray-400 ml-2 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center text-gray-600">
                      <Monitor className="w-4 h-4 mr-2" />
                      <span>Tipo: {collab.tipoProgetto}</span>
                    </div>
                    <div className="flex items-center text-gray-600">
                      <Calendar className="w-4 h-4 mr-2" />
                      <span>
                        Inizio: {collab.dataInizioContratto 
                          ? new Date(collab.dataInizioContratto).toLocaleDateString('it-IT') 
                          : 'Non specificato'
                        }
                      </span>
                    </div>
                  </div>
                </div>

                {/* Stato centrato verticalmente */}
                <div className="ml-6 flex items-center">
                  <div className={`inline-flex items-center px-4 py-2 rounded-lg text-base font-semibold shadow-sm border ${
                    collab.stato === 'in corso' || (!collab.stato) 
                      ? 'bg-green-50 text-green-700 border-green-200' 
                      : collab.stato === 'terminata'
                      ? 'bg-blue-50 text-blue-700 border-blue-200'
                      : collab.stato === 'in pausa'
                      ? 'bg-yellow-50 text-yellow-700 border-yellow-200'
                      : 'bg-gray-50 text-gray-700 border-gray-200'
                  }`}>
                    {collab.stato === 'in corso' || (!collab.stato) ? '🟢 In Corso' : 
                     collab.stato === 'terminata' ? '✅ Terminato' : 
                     collab.stato === 'in pausa' ? '⏸️ In Pausa' : 
                     '❓ Sconosciuto'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ListaClientiWebDesigner;
