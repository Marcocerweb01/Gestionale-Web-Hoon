"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCollaboratoriWithGlobalRefresh } from "@/hooks/useCollaboratori"; // ✨ Usa il nuovo hook

const ListaCollaboratori = () => {
  const [showInactive, setShowInactive] = useState(false); // ✨ Stato per mostrare inattivi
  const router = useRouter();
  
  // ✨ Usa il nuovo hook con refresh automatico
  const { collaboratori, loading, error, refreshCollaboratori } = useCollaboratoriWithGlobalRefresh();

  if (loading) return (
    <div className="flex items-center justify-center p-12">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      <span className="ml-3 text-gray-600">Caricamento collaboratori...</span>
    </div>
  );
  
  if (error) return (
    <div className="bg-red-50 border border-red-200 rounded-xl p-4 m-4">
      <div className="flex items-center">
        <div className="w-5 h-5 text-red-500">⚠️</div>
        <p className="ml-2 text-red-700">{error}</p>
      </div>
    </div>
  );

  // Ordina per nome e cognome E filtra in base al toggle
  const sorted = [...collaboratori]
    .filter(collab => showInactive ? true : collab.status === "attivo") // ✨ Filtra in base al toggle
    .sort((a, b) =>
      (a.nome + " " + a.cognome).localeCompare(b.nome + " " + b.cognome)
    );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold">👥</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Lista Collaboratori {showInactive ? "" : "Attivi"}
              </h1>
              <p className="text-sm text-gray-600">
                Gestisci e visualizza {showInactive ? "tutti i collaboratori" : "i collaboratori attivi"}
              </p>
            </div>
          </div>
          <div className="flex space-x-3">
            <button
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                showInactive 
                  ? 'bg-gray-600 hover:bg-gray-700 text-white' 
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
              onClick={() => setShowInactive(!showInactive)}
            >
              {showInactive ? '👁️ Mostra Solo Attivi' : '👀 Mostra Tutti'}
            </button>
            <button
              className="btn-secondary"
              onClick={refreshCollaboratori}
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Aggiorna
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {sorted.length === 0 ? (
          <div className="text-center p-12">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <span className="text-2xl">👥</span>
            </div>
            <p className="text-gray-500 text-lg">Nessun collaboratore trovato.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Nome</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Cognome</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Ruolo</th>
                  {showInactive && (
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Status</th>
                  )}
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Email</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Azioni</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {sorted.map((collab) => (
                  <tr
                    key={collab.id}
                    className="hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => router.push(`/User/${collab.id}`)}
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ")
                        router.push(`/User/${collab.id}`);
                    }}
                  >
                    <td className="px-6 py-4 text-gray-900 font-medium">{collab.nome}</td>
                    <td className="px-6 py-4 text-gray-900 font-medium">{collab.cognome}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary-100 text-primary-800 capitalize">
                        {collab.subRole}
                      </span>
                    </td>
                    {showInactive && (
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                          collab.status === 'attivo' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {collab.status === 'attivo' ? '🟢 Attivo' : '🔴 Non Attivo'}
                        </span>
                      </td>
                    )}
                    <td className="px-6 py-4 text-gray-600">{collab.email}</td>
                    <td className="px-6 py-4">
                      <button 
                        className="inline-flex items-center px-3 py-1.5 bg-white text-gray-600 hover:bg-gray-100 border border-gray-200 rounded-lg"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/User/${collab.id}`);
                        }}
                      >
                        Visualizza
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ListaCollaboratori;
