"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

const CreaNota = ({ collaborazioneId, autoreId, autorenome }) => {
  const [nota, setNota] = useState("");
  const [tipo, setTipo] = useState("generico");
  const [dataAppuntamento, setDataAppuntamento] = useState("");
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter(); // Inizializza il router

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    try {
      const response = await fetch("/api/note", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          data: new Date().toISOString(),
          nota,
          autoreId: autoreId,
          autore: autorenome,
          collaborazione: collaborazioneId,
          tipo,
          data_appuntamento: tipo === "appuntamento" ? dataAppuntamento : undefined,
        }),
      });

      if (!response.ok) {
        const res = await response.json();
        throw new Error(res.message || "Errore durante la creazione della nota.");
      }

      setNota("");
      setDataAppuntamento("");
      setSuccess(true);

      // Reindirizza al link precedente dopo il successo
      router.back();
    } catch (err) {
      console.error(err);
      setError(err.message);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label>Tipo:</label>
        <select
          className="w-full p-2 border"
          value={tipo}
          onChange={(e) => setTipo(e.target.value)}
        >
          <option value="generico">Generico</option>
          <option value="appuntamento">Appuntamento</option>
          <option value="problema">Problema</option>
        </select>
      </div>
      {tipo === "appuntamento" && (
        <div>
          <label>Data Appuntamento:</label>
          <input
            type="date"
            className="w-full p-2 border"
            value={dataAppuntamento}
            onChange={(e) => setDataAppuntamento(e.target.value)}
          />
        </div>
      )}
      <div>
        <label>Nota:</label>
        <textarea
          className="w-full p-2 border"
          value={nota}
          onChange={(e) => setNota(e.target.value)}
          required
        />
      </div>
      
      <button type="submit" className="bg-blue-500 text-white p-2 rounded">
        Crea Nota
      </button>
      {success && <p className="text-green-500">Nota creata con successo!</p>}
      {error && <p className="text-red-500">{error}</p>}
    </form>
  );
};

export default CreaNota;
