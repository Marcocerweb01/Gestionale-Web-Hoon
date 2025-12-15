"use client";

import { useState } from "react";
import { Edit, Trash2, TrendingUp, TrendingDown, Eye } from "lucide-react";

export default function TabellaPagamenti({ pagamenti, onPagamentoAggiornato, onPagamentoEliminato }) {
  const [pagamentoSelezionato, setPagamentoSelezionato] = useState(null);
  const [mostraDettagli, setMostraDettagli] = useState(false);

  const handleCambioStato = async (pagamentoId, nuovoStato) => {
    try {
      const response = await fetch(`/api/pagamenti-nuovi/${pagamentoId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stato_pagamento: nuovoStato })
      });

      if (response.ok) {
        onPagamentoAggiornato();
      }
    } catch (error) {
      console.error("Errore aggiornamento stato:", error);
    }
  };

  const handleElimina = async (pagamentoId) => {
    if (!confirm("Sei sicuro di voler eliminare questo pagamento? Se è un'entrata, verranno eliminate anche le uscite collegate.")) {
      return;
    }

    try {
      const response = await fetch(`/api/pagamenti-nuovi/${pagamentoId}`, {
        method: "DELETE"
      });

      if (response.ok) {
        onPagamentoEliminato();
      }
    } catch (error) {
      console.error("Errore eliminazione:", error);
    }
  };

  const mostraDettaglioPagamento = (pagamento) => {
    setPagamentoSelezionato(pagamento);
    setMostraDettagli(true);
  };

  const getStatoBadge = (stato) => {
    switch (stato) {
      case "pagato":
        return "bg-green-100 text-green-800 border-green-200";
      case "non_pagato":
        return "bg-red-100 text-red-800 border-red-200";
      case "ragazzi":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatoText = (stato) => {
    switch (stato) {
      case "pagato":
        return "Pagato";
      case "non_pagato":
        return "Non Pagato";
      case "ragazzi":
        return "Ragazzi";
      default:
        return stato;
    }
  };

  if (pagamenti.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-12 text-center">
        <div className="text-6xl mb-4">💸</div>
        <h3 className="text-xl font-semibold text-gray-700 mb-2">
          Nessun pagamento trovato
        </h3>
        <p className="text-gray-500">
          Inizia inserendo la prima entrata o uscita
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {/* Tabella Desktop */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Descrizione</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Importo</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stato</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Azioni</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {pagamenti.map((pagamento) => (
                <tr key={pagamento._id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {pagamento.tipo === "entrata" ? (
                        <div className="p-2 bg-green-100 rounded-full">
                          <TrendingUp className="w-4 h-4 text-green-600" />
                        </div>
                      ) : (
                        <div className="p-2 bg-red-100 rounded-full">
                          <TrendingDown className="w-4 h-4 text-red-600" />
                        </div>
                      )}
                      <div className="flex flex-col">
                        <span className="font-medium text-sm capitalize">
                          {pagamento.tipo}
                        </span>
                        {pagamento.tipo === "uscita" && pagamento.ricorrente && (
                          <span className="text-xs text-blue-600 font-medium">🔁 Ricorrente</span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {new Date(pagamento.data_pagamento || pagamento.createdAt).toLocaleDateString('it-IT')}
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm">
                      {pagamento.tipo === "entrata" ? (
                        <>
                          <p className="font-medium text-gray-900">
                            {pagamento.chi_paga?.etichetta || pagamento.chi_paga?.ragione_sociale || "Cliente"}
                          </p>
                          <p className="text-gray-500 text-xs">{pagamento.servizio}</p>
                        </>
                      ) : (
                        <>
                          <p className="font-medium text-gray-900">{pagamento.nome_destinatario}</p>
                          <p className="text-gray-500 text-xs capitalize">{pagamento.destinatario_tipo?.replace('_', ' ')}</p>
                        </>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`font-bold ${pagamento.tipo === 'entrata' ? 'text-green-600' : 'text-red-600'}`}>
                      {pagamento.tipo === 'entrata' ? '+' : '-'} € {pagamento.importo.toFixed(2)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={pagamento.stato_pagamento}
                      onChange={(e) => handleCambioStato(pagamento._id, e.target.value)}
                      className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatoBadge(pagamento.stato_pagamento)}`}
                    >
                      <option value="non_pagato">Non Pagato</option>
                      <option value="pagato">Pagato</option>
                      <option value="ragazzi">Ragazzi</option>
                    </select>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => mostraDettaglioPagamento(pagamento)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Dettagli"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleElimina(pagamento._id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Elimina"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Card Mobile */}
        <div className="lg:hidden divide-y divide-gray-200">
          {pagamenti.map((pagamento) => (
            <div key={pagamento._id} className="p-4 hover:bg-gray-50">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  {pagamento.tipo === "entrata" ? (
                    <div className="p-2 bg-green-100 rounded-full">
                      <TrendingUp className="w-5 h-5 text-green-600" />
                    </div>
                  ) : (
                    <div className="p-2 bg-red-100 rounded-full">
                      <TrendingDown className="w-5 h-5 text-red-600" />
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm capitalize">{pagamento.tipo}</p>
                      {pagamento.tipo === "uscita" && pagamento.ricorrente && (
                        <span className="text-xs text-blue-600 font-medium">🔁</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500">
                      {new Date(pagamento.data_pagamento || pagamento.createdAt).toLocaleDateString('it-IT')}
                    </p>
                  </div>
                </div>
                <span className={`font-bold text-lg ${pagamento.tipo === 'entrata' ? 'text-green-600' : 'text-red-600'}`}>
                  {pagamento.tipo === 'entrata' ? '+' : '-'} € {pagamento.importo.toFixed(2)}
                </span>
              </div>

              <div className="mb-3">
                {pagamento.tipo === "entrata" ? (
                  <>
                    <p className="font-medium text-gray-900">
                      {pagamento.chi_paga?.etichetta || pagamento.chi_paga?.ragione_sociale || "Cliente"}
                    </p>
                    <p className="text-gray-500 text-sm">{pagamento.servizio}</p>
                  </>
                ) : (
                  <>
                    <p className="font-medium text-gray-900">{pagamento.nome_destinatario}</p>
                    <p className="text-gray-500 text-sm capitalize">{pagamento.destinatario_tipo?.replace('_', ' ')}</p>
                  </>
                )}
              </div>

              <div className="flex items-center justify-between">
                <select
                  value={pagamento.stato_pagamento}
                  onChange={(e) => handleCambioStato(pagamento._id, e.target.value)}
                  className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatoBadge(pagamento.stato_pagamento)}`}
                >
                  <option value="non_pagato">Non Pagato</option>
                  <option value="pagato">Pagato</option>
                  <option value="ragazzi">Ragazzi</option>
                </select>

                <div className="flex gap-2">
                  <button
                    onClick={() => mostraDettaglioPagamento(pagamento)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                  >
                    <Eye className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleElimina(pagamento._id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal Dettagli */}
      {mostraDettagli && pagamentoSelezionato && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className={`px-6 py-4 ${pagamentoSelezionato.tipo === 'entrata' ? 'bg-green-600' : 'bg-red-600'} text-white flex items-center justify-between`}>
              <h3 className="text-xl font-bold">Dettagli {pagamentoSelezionato.tipo === 'entrata' ? 'Entrata' : 'Uscita'}</h3>
              <button
                onClick={() => setMostraDettagli(false)}
                className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Importo</p>
                  <p className={`text-2xl font-bold ${pagamentoSelezionato.tipo === 'entrata' ? 'text-green-600' : 'text-red-600'}`}>
                    € {pagamentoSelezionato.importo.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Stato</p>
                  <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium border ${getStatoBadge(pagamentoSelezionato.stato_pagamento)}`}>
                    {getStatoText(pagamentoSelezionato.stato_pagamento)}
                  </span>
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-500">Data</p>
                <p className="font-medium">
                  {new Date(pagamentoSelezionato.data_pagamento || pagamentoSelezionato.createdAt).toLocaleDateString('it-IT', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>

              {pagamentoSelezionato.tipo === "entrata" ? (
                <>
                  <div>
                    <p className="text-sm text-gray-500">Cliente</p>
                    <p className="font-medium">{pagamentoSelezionato.chi_paga?.etichetta || pagamentoSelezionato.chi_paga?.ragione_sociale}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Servizio</p>
                    <p className="font-medium">{pagamentoSelezionato.servizio}</p>
                  </div>
                  {pagamentoSelezionato.collaboratori?.length > 0 && (
                    <div>
                      <p className="text-sm text-gray-500 mb-2">Collaboratori</p>
                      <div className="space-y-2">
                        {pagamentoSelezionato.collaboratori.map((collab, idx) => (
                          <div key={idx} className="bg-gray-50 rounded-lg p-3">
                            <p className="font-medium">{collab.nome_collaboratore}</p>
                            <p className="text-sm text-gray-600">
                              {collab.usa_percentuale 
                                ? `${collab.percentuale}% = € ${collab.importo_calcolato?.toFixed(2)}`
                                : `€ ${collab.importo_calcolato?.toFixed(2)}`
                              }
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div>
                    <p className="text-sm text-gray-500">Destinatario</p>
                    <p className="font-medium">{pagamentoSelezionato.nome_destinatario}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Tipo</p>
                    <p className="font-medium capitalize">{pagamentoSelezionato.destinatario_tipo?.replace('_', ' ')}</p>
                  </div>
                  {pagamentoSelezionato.generata_da_entrata && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                      <p className="text-sm text-yellow-800">
                        ⚠️ Uscita generata automaticamente da un'entrata
                      </p>
                    </div>
                  )}
                  {pagamentoSelezionato.ricorrente && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <p className="text-sm text-blue-800">
                        🔁 Uscita ricorrente (mensile)
                      </p>
                    </div>
                  )}
                </>
              )}

              {pagamentoSelezionato.note && (
                <div>
                  <p className="text-sm text-gray-500">Note</p>
                  <p className="text-gray-700">{pagamentoSelezionato.note}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
