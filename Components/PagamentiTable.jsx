'use client';
import React, { useEffect, useState } from "react";

const PagamentiTable = () => {
  const [pagamenti, setPagamenti] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editId, setEditId] = useState(null);
  const [editData, setEditData] = useState({});

  useEffect(() => {
    // Sostituisci l'URL con il tuo endpoint API reale
    fetch("/api/pagamenti")
      .then((res) => res.json())
      .then((data) => {
        setPagamenti(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleEdit = (p) => {
    setEditId(p.id || p._id);
    setEditData({
      data_fattura: p.data_fattura ? formatDateForInput(p.data_fattura) : "",
      data_pagato: p.data_pagato ? formatDateForInput(p.data_pagato) : "",
    });
  };

  // Funzione di utilità per formattare la data per l'input date
  function formatDateForInput(dateString) {
    const d = new Date(dateString);
    // Corregge il fuso orario per evitare lo shift
    const off = d.getTimezoneOffset();
    d.setMinutes(d.getMinutes() - off);
    return d.toISOString().slice(0, 10);
  }

  const handleChange = (e) => {
    setEditData({ ...editData, [e.target.name]: e.target.value });
  };

  const handleSave = async (id) => {
    const body = {
      data_fattura: editData.data_fattura,
      data_pagato: editData.data_pagato || null,
      stato: editData.data_pagato ? "si" : "no",
    };
    await fetch(`/api/pagamenti/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    // Aggiorna la tabella dopo il salvataggio
    setLoading(true);
    fetch("/api/pagamenti")
      .then((res) => res.json())
      .then((data) => {
        setPagamenti(data);
        setLoading(false);
        setEditId(null);
      });
  };

  // Ordina alfabeticamente per cliente
  const pagamentiOrdinati = [...pagamenti].sort((a, b) => {
    if ((a.cliente || "") < (b.cliente || "")) return -1;
    if ((a.cliente || "") > (b.cliente || "")) return 1;
    return 0;
  });

  if (loading) return <div>Caricamento...</div>;

  return (
    <section>
      <table>
        <thead>
          <tr>
            <th>Cliente</th>
            <th>Data Fattura</th>
            <th>Data Pagato</th>
            <th>Stato</th>
            <th>Azioni</th>
          </tr>
        </thead>
        <tbody>
          {pagamentiOrdinati.map((p) => (
            <tr key={p.id || p._id}>
              <td>{p.cliente || "N/A"}</td>
              <td>
                {editId === (p.id || p._id) ? (
                  <input
                    type="date"
                    name="data_fattura"
                    value={editData.data_fattura}
                    onChange={handleChange}
                  />
                ) : (
                  p.data_fattura ? new Date(p.data_fattura).toLocaleDateString() : ""
                )}
              </td>
              <td>
                {editId === (p.id || p._id) ? (
                  <input
                    type="date"
                    name="data_pagato"
                    value={editData.data_pagato}
                    onChange={handleChange}
                  />
                ) : (
                  p.data_pagato ? new Date(p.data_pagato).toLocaleDateString() : "-"
                )}
              </td>
              <td>
                {editId === (p.id || p._id)
                  ? (editData.data_pagato ? "Pagato" : "Non pagato")
                  : (p.stato === "si" ? "Pagato" : "Non pagato")}
              </td>
              <td>
                {editId === (p.id || p._id) ? (
                  <button onClick={() => handleSave(p.id || p._id)}>Salva</button>
                ) : (
                  <button onClick={() => handleEdit(p)}>Modifica</button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
};

export default PagamentiTable;