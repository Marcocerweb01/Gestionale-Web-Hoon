"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const ListaCollaboratori = () => {
  const [collaboratori, setCollaboratori] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchCollaboratori = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/lista_collaboratori", {
        method: "GET",
        cache: "no-store",
        headers: { "Cache-Control": "no-cache" },
      });
      if (!response.ok) throw new Error("Errore nel recupero dei collaboratori");
      const result = await response.json();
      setCollaboratori(result);
    } catch (err) {
      setError("Non è stato possibile recuperare i collaboratori");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCollaboratori();
  }, []);

  if (loading) return <div>Caricamento collaboratori...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  // Ordina per nome e cognome
  const sorted = [...collaboratori].sort((a, b) =>
    (a.nome + " " + a.cognome).localeCompare(b.nome + " " + b.cognome)
  );

  return (
    <div className="w-full max-w-3xl mx-auto bg-slate-50 shadow-md rounded-lg mt-10 p-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">Collaboratori</h2>
        <button
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 font-semibold"
          onClick={fetchCollaboratori}
        >
          Aggiorna
        </button>
      </div>
      <table className="w-full text-left border border-gray-200 rounded-lg overflow-hidden bg-white">
        <thead className="bg-gray-100">
          <tr>
            <th className="py-2 px-4">Nome</th>
            <th className="py-2 px-4">Cognome</th>
            <th className="py-2 px-4">Ruolo</th>
            <th className="py-2 px-4">Email</th>
            <th className="py-2 px-4">Dettaglio</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((collab) => (
            <tr
              key={collab.id}
              className="border-t hover:bg-blue-50 cursor-pointer transition"
              onClick={() => router.push(`/User/${collab.id}`)}
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ")
                  router.push(`/User/${collab.id}`);
              }}
            >
              <td className="py-2 px-4">{collab.nome}</td>
              <td className="py-2 px-4">{collab.cognome}</td>
              <td className="py-2 px-4 capitalize">{collab.subRole}</td>
              <td className="py-2 px-4">{collab.email}</td>
              <td className="py-2 px-4 text-blue-600 underline">Vai</td>
            </tr>
          ))}
        </tbody>
      </table>
      {sorted.length === 0 && (
        <div className="text-gray-500 text-center mt-6">
          Nessun collaboratore trovato.
        </div>
      )}
    </div>
  );
};

export default ListaCollaboratori;
