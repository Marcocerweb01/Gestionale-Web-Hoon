"use client";

import React, { useState, useEffect } from "react";
import Link from "@node_modules/next/link";

const ListaClienti = () => {
  const [clienti, setClienti] = useState([]);
  const [error, setError] = useState("");
  const [loadingClienti, setLoadingClienti] = useState(true);

  // 1. Definisco la funzione di fetch
  const fetchClienti = async () => {
    setLoadingClienti(true);   // (ri)mostra lo stato di caricamento
    setError("");

    try {
      const response = await fetch("/api/lista_aziende",{
        method: "GET",
      cache: "no-store", 
      headers: {
        "Cache-Control": "no-cache",
      }

      });
      if (!response.ok) {
        throw new Error("Errore nel recupero delle aziende");
      }
      const result = await response.json();
      setClienti(result);
    } catch (err) {
      console.error("Errore:", err);
      setError("Non è stato possibile recuperare i clienti");
    } finally {
      setLoadingClienti(false);
    }
  };

  // 2. useEffect che chiama fetchClienti al montaggio del componente
  useEffect(() => {
    fetchClienti();
  }, []);

  // 3. Se stiamo ancora caricando, mostriamo il messaggio
  if (loadingClienti) {
    return <div>Caricamento in corso...</div>;
  }

  // Se c’è un errore, lo mostriamo
  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  // 4. Ordiniamo (assicurandoci che "etichetta" esista su tutti gli oggetti)
  const sortedClienti = [...clienti].sort((a, b) =>
    (a.etichetta ?? "").localeCompare(b.etichetta ?? "")
  );

  return (
    <div className="w-full h-full bg-slate-50 shadow-md rounded-lg mt-10 p-14">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold">Clienti</h2>

        {/* 5. Pulsante di refresh */}
        <button
          className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
          onClick={fetchClienti}
        >
          Aggiorna
        </button>
      </div>

      <ul className="space-y-2">
        {sortedClienti.map((cliente) => (
      
            <Link href={`/User/${cliente.id}`}>    <li
            key={cliente.id}
            className="cursor-pointer p-2 bg-gray-100 rounded shadow hover:bg-gray-200"
          >{cliente.etichetta}</li></Link>
          
        ))}
      </ul>
    </div>
  );
};

export default ListaClienti;
