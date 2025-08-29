"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, RefreshCw, Building2, Users, ExternalLink } from "lucide-react";

const ListaClienti = () => {
  const [clienti, setClienti] = useState([]);
  const [filteredClienti, setFilteredClienti] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState("");
  const [loadingClienti, setLoadingClienti] = useState(true);
  const router = useRouter();

  // Funzione di fetch
  const fetchClienti = async () => {
    setLoadingClienti(true);
    setError("");

    try {
      const response = await fetch("/api/lista_aziende", {
        method: "GET",
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache",
        },
      });
      if (!response.ok) {
        throw new Error("Errore nel recupero delle aziende");
      }
      const result = await response.json();
      setClienti(result);
      setFilteredClienti(result);
    } catch (err) {
      console.error("Errore:", err);
      setError("Non è stato possibile recuperare i clienti");
    } finally {
      setLoadingClienti(false);
    }
  };

  // Effetto per la ricerca
  useEffect(() => {
    const filtered = clienti.filter(cliente =>
      cliente.etichetta?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredClienti(filtered);
  }, [searchTerm, clienti]);

  useEffect(() => {
    fetchClienti();
  }, []);

  if (loadingClienti) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Caricamento clienti...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <div className="text-red-800 text-center">{error}</div>
        </div>
      </div>
    );
  }

  const sortedClienti = [...filteredClienti].sort((a, b) =>
    (a.etichetta ?? "").localeCompare(b.etichetta ?? "")
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Lista Clienti</h1>
              <p className="text-sm text-gray-600">
                {sortedClienti.length} {sortedClienti.length === 1 ? 'cliente' : 'clienti'} totali
              </p>
            </div>
          </div>

          <button
            onClick={fetchClienti}
            disabled={loadingClienti}
            className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`w-4 h-4 ${loadingClienti ? 'animate-spin' : ''}`} />
            <span>Aggiorna</span>
          </button>
        </div>

        {/* Search */}
        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Cerca cliente per nome..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm placeholder-gray-400 transition-all duration-200"
            />
          </div>
        </div>
      </div>

      {/* Clients List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {sortedClienti.length === 0 ? (
          <div className="p-12 text-center">
            <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm ? 'Nessun cliente trovato' : 'Nessun cliente presente'}
            </h3>
            <p className="text-gray-500">
              {searchTerm 
                ? `Prova a modificare il termine di ricerca "${searchTerm}"`
                : 'I clienti aggiunti appariranno qui.'
              }
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {sortedClienti.map((cliente, index) => (
              <div
                key={cliente.id}
                className="p-4 hover:bg-gray-50 transition-colors duration-150 cursor-pointer group"
                onClick={() => router.push(`/User/${cliente.id}`)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg flex items-center justify-center">
                      <span className="text-blue-600 font-semibold text-sm">
                        {cliente.etichetta?.charAt(0)?.toUpperCase() || 'C'}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-900 group-hover:text-blue-600 transition-colors duration-150">
                        {cliente.etichetta}
                      </h3>
                      <p className="text-xs text-gray-500">
                        Cliente #{index + 1}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-blue-600 transition-colors duration-150" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Stats */}
      {sortedClienti.length > 0 && (
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-100 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Users className="w-6 h-6 text-blue-600" />
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Statistiche Rapide
                </h3>
                <p className="text-sm text-gray-600">
                  Panoramica dei tuoi clienti
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-blue-600">
                {sortedClienti.length}
              </div>
              <div className="text-sm text-gray-600">
                Clienti attivi
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ListaClienti;
