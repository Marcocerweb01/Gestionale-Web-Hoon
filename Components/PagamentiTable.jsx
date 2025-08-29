'use client';
import React, { useEffect, useState } from "react";

const PagamentiTable = () => {
  const [pagamenti, setPagamenti] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [checkedPagamenti, setCheckedPagamenti] = useState({});
  const [initialCheckedPagamenti, setInitialCheckedPagamenti] = useState({});
  const [filtro, setFiltro] = useState("alfabetico"); // nuovo stato filtro

  useEffect(() => {
    fetch("/api/pagamenti")
      .then((res) => res.json())
      .then((data) => {
        // Rimuovi duplicati mantenendo solo il record più recente per cliente
        const pagamentiUnivoci = {};
        
        data.forEach((pagamento) => {
          const cliente = pagamento.cliente;
          const id = pagamento.id || pagamento._id;
          
          if (!pagamentiUnivoci[cliente]) {
            pagamentiUnivoci[cliente] = pagamento;
          } else {
            // Se esiste già, mantieni quello con ID più recente (stringa più grande)
            if (id > (pagamentiUnivoci[cliente].id || pagamentiUnivoci[cliente]._id)) {
              pagamentiUnivoci[cliente] = pagamento;
            }
          }
        });
        
        // Converti l'oggetto in array
        const pagamentiFiltrati = Object.values(pagamentiUnivoci);
        
        console.log(`Ridotti da ${data.length} a ${pagamentiFiltrati.length} pagamenti`);
        
        setPagamenti(pagamentiFiltrati);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleStatusChange = (id, status) => {
    setCheckedPagamenti((prev) => ({ ...prev, [id]: status }));
  };

  // Ordinamento in base al filtro selezionato
  let pagamentiOrdinati = [...pagamenti];
  if (filtro === "alfabetico") {
    pagamentiOrdinati.sort((a, b) => {
      if ((a.cliente || "") < (b.cliente || "")) return -1;
      if ((a.cliente || "") > (b.cliente || "")) return 1;
      return 0;
    });
  } else if (filtro === "pagati") {
    pagamentiOrdinati.sort((a, b) => {
      if (a.stato === "si" && b.stato !== "si") return -1;
      if (a.stato !== "si" && b.stato === "si") return 1;
      // Se uguale, ordina alfabeticamente
      if ((a.cliente || "") < (b.cliente || "")) return -1;
      if ((a.cliente || "") > (b.cliente || "")) return 1;
      return 0;
    });
  } else if (filtro === "nonpagati") {
    pagamentiOrdinati.sort((a, b) => {
      if (a.stato !== "si" && b.stato === "si") return -1;
      if (a.stato === "si" && b.stato !== "si") return 1;
      // Se uguale, ordina alfabeticamente
      if ((a.cliente || "") < (b.cliente || "")) return -1;
      if ((a.cliente || "") > (b.cliente || "")) return 1;
      return 0;
    });
  } else if (filtro === "ragazzi") {
    pagamentiOrdinati.sort((a, b) => {
      if (a.stato === "ragazzi" && b.stato !== "ragazzi") return -1;
      if (a.stato !== "ragazzi" && b.stato === "ragazzi") return 1;
      // Se uguale, ordina alfabeticamente
      if ((a.cliente || "") < (b.cliente || "")) return -1;
      if ((a.cliente || "") > (b.cliente || "")) return 1;
      return 0;
    });
  }

  if (loading) return (
    <div className="flex items-center justify-center p-12">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      <span className="ml-3 text-gray-600">Caricamento pagamenti...</span>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Filtri */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Ordina per:</h3>
        <div className="flex flex-wrap gap-3">
          <button
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              filtro === "alfabetico" 
                ? "bg-cyan-500 text-white shadow-md" 
                : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
            }`}
            onClick={() => setFiltro("alfabetico")}
          >
            📝 Alfabetico
          </button>
          <button
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              filtro === "pagati" 
                ? "bg-green-500 text-white shadow-md" 
                : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
            }`}
            onClick={() => setFiltro("pagati")}
          >
            ✅ Pagati Prima
          </button>
          <button
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              filtro === "nonpagati" 
                ? "bg-red-500 text-white shadow-md" 
                : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
            }`}
            onClick={() => setFiltro("nonpagati")}
          >
            ❌ Non Pagati Prima
          </button>
          <button
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              filtro === "ragazzi" 
                ? "bg-purple-500 text-white shadow-md" 
                : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
            }`}
            onClick={() => setFiltro("ragazzi")}
          >
            👥 Ragazzi Prima
          </button>
        </div>
      </div>

      {/* Azioni */}
      <div className="flex justify-end gap-3">
        {!editMode ? (
          <button
            className="btn-primary mr-4"
            onClick={() => {
              const initialChecked = {};
              // Usa l'array originale NON ordinato per evitare inconsistenze
              pagamenti.forEach((p) => {
                // Assicurati che ogni pagamento abbia un valore definito
                const id = p.id || p._id;
                initialChecked[id] = p.stato || "no";
              });
              setCheckedPagamenti(initialChecked);
              setInitialCheckedPagamenti(initialChecked);
              setEditMode(true);
            }}
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Modifica Pagamenti
          </button>
        ) : (
          <div className="flex gap-3">
            <button
              className="btn-success"
              onClick={async () => {
                setLoading(true);
                const today = new Date().toISOString().slice(0, 10);
                const updates = pagamenti
                  .filter((p) => {
                    const id = p.id || p._id;
                    const currentStatus = checkedPagamenti[id];
                    const originalStatus = initialCheckedPagamenti[id];
                    
                    // Solo se entrambi sono definiti e diversi
                    return currentStatus !== undefined && 
                           originalStatus !== undefined && 
                           currentStatus !== originalStatus;
                  })
                  .map((p) => {
                    const id = p.id || p._id;
                    const newStatus = checkedPagamenti[id];
                    let updateData = { stato: newStatus };
                    
                    if (newStatus === "si") {
                      updateData.data_pagato = today;
                    } else {
                      updateData.data_pagato = null;
                    }
                    
                    return fetch(`/api/pagamenti/${id}`, {
                      method: "PATCH",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify(updateData),
                    });
                  });
                await Promise.all(updates);
                setEditMode(false);
                setCheckedPagamenti({});
                setInitialCheckedPagamenti({});
                fetch("/api/pagamenti")
                  .then((res) => res.json())
                  .then((data) => {
                    setPagamenti(data);
                    setLoading(false);
                  });
              }}
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Salva Modifiche
            </button>
            <button
              className="btn-secondary"
              onClick={() => {
                setEditMode(false);
                setCheckedPagamenti({});
                setInitialCheckedPagamenti({});
              }}
            >
              Annulla
            </button>
          </div>
        )}
      </div>

      {/* Tabella */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Cliente</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Data Fattura</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Data Pagamento</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Stato</th>
                {editMode && <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">Stato</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {pagamentiOrdinati.map((p) => (
                <tr key={p.id || p._id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 text-gray-900 font-medium">
                    {p.cliente || "N/A"}
                    {p.data_fattura && (
                      <div className="text-xs text-gray-500 mt-1">
                        Fattura: {new Date(p.data_fattura).toLocaleDateString('it-IT')}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    {p.data_fattura ? new Date(p.data_fattura).toLocaleDateString('it-IT') : "-"}
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    {p.data_pagato ? new Date(p.data_pagato).toLocaleDateString('it-IT') : "-"}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                      p.stato === "si" 
                        ? "bg-green-100 text-green-800" 
                        : p.stato === "ragazzi"
                        ? "bg-purple-100 text-purple-800"
                        : "bg-red-100 text-red-800"
                    }`}>
                      {p.stato === "si" ? "✅ Pagato" : 
                       p.stato === "ragazzi" ? "👥 Ragazzi" : 
                       "❌ Non pagato"}
                    </span>
                  </td>
                  {editMode && (
                    <td className="px-6 py-4 text-center">
                      <select
                        value={checkedPagamenti[p.id || p._id] !== undefined ? checkedPagamenti[p.id || p._id] : (p.stato || "no")}
                        onChange={(e) => handleStatusChange(p.id || p._id, e.target.value)}
                        className="px-3 py-1 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="no">❌ Non pagato</option>
                        <option value="si">✅ Pagato</option>
                        <option value="ragazzi">👥 Ragazzi</option>
                      </select>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PagamentiTable;