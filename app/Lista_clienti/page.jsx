"use client";

import React, { useState, useEffect } from "react";
import Link from "@node_modules/next/link";
const ListaClienti = () => {
  const [clienti, setClienti] = useState([]);
  const [error, setError] = useState("");
  const [loadingClienti, setLoadingClienti] = useState(true);

 
  
  

  useEffect(() => {
    const fetchClienti = async () => {
      try {
        const response = await fetch(`/api/lista_aziende`);
        if (!response.ok) {
          throw new Error("Errore nel recupero delle collaborazioni");
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

    fetchClienti();
  }, []); // Assicurati di avere un array di dipendenze vuoto per eseguire il fetch solo una volta.

  if (loadingClienti) return <div>Caricamento in corso...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div className="w-full h-full bg-slate-50 shadow-md rounded-lg mt-10 p-14">
      <h2 className="text-lg font-bold mb-4">Clienti</h2>
      <ul className="space-y-2">
        {clienti.map((cliente) => (
          <li
            key={cliente.id}
            className="cursor-pointer p-2 bg-gray-100 rounded shadow hover:bg-gray-200"
          >
            <Link href={`/User/${cliente.id}`}> 
            {cliente.ragioneSociale}
            </Link>
          </li>
         
        ))}
      </ul>
    </div>
  );
};

export default ListaClienti;
