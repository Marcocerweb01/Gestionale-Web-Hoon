"use client";
import React, { useState, useEffect } from "react";

const ListaGoogleAdsCollaboratore = ({ collaboratoreId }) => {
  const [collaborazioni, setCollaborazioni] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!collaboratoreId) return;

    const fetchCollaborazioni = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/google-ads?collaboratoreId=${collaboratoreId}`);
        
        if (!response.ok) {
          throw new Error("Errore nel caricamento delle collaborazioni");
        }

        const data = await response.json();
        console.log("📊 Collaborazioni Google ADS caricate:", data);
        setCollaborazioni(data);
      } catch (err) {
        console.error("Errore caricamento Google ADS:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCollaborazioni();
  }, [collaboratoreId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-700 text-sm">❌ {error}</p>
      </div>
    );
  }

  if (collaborazioni.length === 0) {
    return (
      <div className="p-6 text-center bg-gray-50 rounded-lg border border-gray-200">
        <p className="text-gray-500 text-sm italic">
          Nessuna collaborazione Google ADS per questo utente
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {collaborazioni.map((collab) => (
        <div
          key={collab._id}
          className="bg-white rounded-lg border border-orange-200 p-4 hover:shadow-md transition-shadow"
        >
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h5 className="font-semibold text-gray-900 mb-2">
                {collab.cliente?.etichetta || "Cliente senza nome"}
              </h5>
              
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="flex items-center gap-1">
                  <span className={`inline-block w-2 h-2 rounded-full ${collab.contattato ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                  <span className="text-gray-600">Contattato</span>
                </div>
                
                <div className="flex items-center gap-1">
                  <span className={`inline-block w-2 h-2 rounded-full ${collab.campagnaAvviata ? 'bg-blue-500' : 'bg-gray-300'}`}></span>
                  <span className="text-gray-600">Campagna Avviata</span>
                </div>
                
                <div className="flex items-center gap-1">
                  <span className={`inline-block w-2 h-2 rounded-full ${collab.campagnaTerminata ? 'bg-purple-500' : 'bg-gray-300'}`}></span>
                  <span className="text-gray-600">Terminata</span>
                </div>
              </div>

              {collab.note && (
                <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded text-xs">
                  <span className="font-medium text-amber-800">Note: </span>
                  <span className="text-gray-700">{collab.note}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
      
      <div className="pt-2 border-t border-gray-200">
        <p className="text-xs text-gray-500 text-center">
          Totale collaborazioni: <strong>{collaborazioni.length}</strong>
        </p>
      </div>
    </div>
  );
};

export default ListaGoogleAdsCollaboratore;
