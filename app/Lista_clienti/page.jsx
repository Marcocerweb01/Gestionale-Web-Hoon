"use client";

import React, { useState, useEffect } from "react";

import Link from "next/link";
import { useRouter } from "next/navigation"; // Importa useRouter

const ListaClienti = () => {
  const [clienti, setClienti] = useState([]);
  const [error, setError] = useState("");
  const [loadingClienti, setLoadingClienti] = useState(true);
  const router = useRouter(); // Inizializza il router

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
    } catch (err) {
      console.error("Errore:", err);
      setError("Non è stato possibile recuperare i clienti");
    } finally {
      setLoadingClienti(false);
    }
  };

  useEffect(() => {
    fetchClienti();
  }, []);

  if (loadingClienti) {
    return <div>Caricamento in corso...</div>;
  }

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  const sortedClienti = [...clienti].sort((a, b) =>
    (a.etichetta ?? "").localeCompare(b.etichetta ?? "")
  );

  return (
    <div className="w-full h-full bg-slate-50 shadow-md rounded-lg mt-10 p-14">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold">Clienti</h2>

        <button
          className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
          onClick={fetchClienti}
        >
          Aggiorna
        </button>
      </div>

      <ul className="space-y-2">
        {sortedClienti.map((cliente) => (
          <li
            key={cliente.id}
            className="cursor-pointer p-2 bg-gray-100 rounded shadow hover:bg-gray-200"
            onClick={() => router.push(`/User/${cliente.id}`)} // Naviga al link
          >
            <Link href={`/User/${cliente.id}`}>{cliente.etichetta}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ListaClienti;
