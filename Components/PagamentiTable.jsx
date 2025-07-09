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
        setPagamenti(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleCheckboxChange = (id) => {
    setCheckedPagamenti((prev) => ({ ...prev, [id]: !prev[id] }));
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
  }

  if (loading) return <div>Caricamento...</div>;

  return (
    <section className="bg-white rounded-lg shadow-lg p-6 max-w-4xl mx-auto mt-8">
      {/* Bottoni filtro */}
      <div className="flex justify-center gap-4 mb-6">
        <button
          className={`py-2 px-4 rounded font-bold shadow transition ${filtro === "alfabetico" ? "bg-blue-500 text-white" : "bg-gray-200"}`}
          onClick={() => setFiltro("alfabetico")}
        >
          Ordine Alfabetico
        </button>
        <button
          className={`py-2 px-4 rounded font-bold shadow transition ${filtro === "pagati" ? "bg-green-500 text-white" : "bg-gray-200"}`}
          onClick={() => setFiltro("pagati")}
        >
          Pagati Prima
        </button>
        <button
          className={`py-2 px-4 rounded font-bold shadow transition ${filtro === "nonpagati" ? "bg-red-500 text-white" : "bg-gray-200"}`}
          onClick={() => setFiltro("nonpagati")}
        >
          Non Pagati Prima
        </button>
      </div>
      <div className="flex justify-center gap-4 mb-6">
        {!editMode ? (
          <button
            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-6 rounded shadow transition"
            onClick={() => {
              const initialChecked = {};
              pagamentiOrdinati.forEach((p) => {
                if (p.stato === "si") initialChecked[p.id || p._id] = true;
              });
              setCheckedPagamenti(initialChecked);
              setInitialCheckedPagamenti(initialChecked);
              setEditMode(true);
            }}
          >
            Modifica Pagamenti
          </button>
        ) : (
          <button
            className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-6 rounded shadow transition"
            onClick={async () => {
              setLoading(true);
              const today = new Date().toISOString().slice(0, 10);
              const updates = pagamentiOrdinati
                .filter((p) => checkedPagamenti[p.id || p._id] !== initialCheckedPagamenti[p.id || p._id])
                .map((p) =>
                  fetch(`/api/pagamenti/${p.id || p._id}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(
                      checkedPagamenti[p.id || p._id]
                        ? { data_pagato: today, stato: "si" }
                        : { data_pagato: null, stato: "no" }
                    ),
                  })
                );
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
            Salva Modifiche
          </button>
        )}
        {editMode && (
          <button
            className="bg-gray-400 hover:bg-gray-500 text-white font-bold py-2 px-6 rounded shadow transition"
            onClick={() => {
              setEditMode(false);
              setCheckedPagamenti({});
              setInitialCheckedPagamenti({});
            }}
          >
            Annulla
          </button>
        )}
      </div>
      <table className="w-full border border-gray-300 rounded-lg overflow-hidden">
        <thead className="bg-gray-100">
          <tr>
            <th className="py-2 px-4">Cliente</th>
            <th className="py-2 px-4">Data Fattura</th>
            <th className="py-2 px-4">Data Pagato</th>
            <th className="py-2 px-4">Stato</th>
            {editMode && <th className="py-2 px-4">Seleziona</th>}
          </tr>
        </thead>
        <tbody>
          {pagamentiOrdinati.map((p) => (
            <tr key={p.id || p._id} className="border-t">
              <td className="py-2 px-4">{p.cliente || "N/A"}</td>
              <td className="py-2 px-4">{p.data_fattura ? new Date(p.data_fattura).toLocaleDateString() : ""}</td>
              <td className="py-2 px-4">{p.data_pagato ? new Date(p.data_pagato).toLocaleDateString() : "-"}</td>
              <td className="py-2 px-4">{p.stato === "si" ? "Pagato" : "Non pagato"}</td>
              {editMode && (
                <td className="py-2 px-4 text-center">
                  <input
                    type="checkbox"
                    checked={!!checkedPagamenti[p.id || p._id]}
                    onChange={() => handleCheckboxChange(p.id || p._id)}
                  />
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
};

export default PagamentiTable;