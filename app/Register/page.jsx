"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";

const Registrazione = () => {
  const router = useRouter();
  const [info, setInfo] = useState({
    nome: "",
    cognome: "",
    email: "",
    numerotelefonico: "",
    password: "",
    partitaIva: "",
    ruolo: { nome: "", dettagli: {} },
  });
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  const handleInput = (e) => {
    const { name, value } = e.target;

    if (name.startsWith("ruolo.")) {
      const fieldName = name.split(".")[1];
      setInfo((prev) => ({
        ...prev,
        ruolo: { ...prev.ruolo, [fieldName]: value },
      }));
    } else {
      setInfo((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleDettagliInput = (e) => {
    const { name, value } = e.target;
    setInfo((prev) => ({
      ...prev,
      ruolo: {
        ...prev.ruolo,
        dettagli: { ...prev.ruolo.dettagli, [name]: value },
      },
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if ( !info.email || !info.password || !info.ruolo.nome) {
      setError("Compila tutti i campi obbligatori.");
      return;
    }

    try {
      setPending(true);
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(info),
      });

      if (res.ok) {
        router.push("/");
      } else {
        const errorData = await res.json();
        setError(errorData.message || "Errore nella registrazione.");
      }
    } catch (err) {
      console.error("Errore durante la registrazione:", err);
      setError("Errore del server. Riprova più tardi.");
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="w-4/6 mx-auto mt-10 bg-white p-8 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-center mb-6">Registrazione</h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium mb-1">Ruolo</label>
          <select
            name="ruolo.nome"
            onChange={handleInput}
            required
            className="w-full border-gray-300 rounded-lg p-2"
          >
            <option value="">Seleziona un ruolo</option>
            <option value="azienda">Azienda</option>
            <option value="contatto">Contatto</option>
            <option value="collaboratore">Collaboratore</option>
            <option value="amministratore">Amministratore</option>
          </select>
        </div>

        {info.ruolo.nome === "azienda" && (
          <>
            <div>
              <label className="block text-sm font-medium mb-1">
                Ragione Sociale
              </label>
              <input
                type="text"
                name="ragioneSociale"
                onChange={handleDettagliInput}
                required
                className="w-full border-gray-300 rounded-lg p-2 bg-slate-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Indirizzo</label>
              <input
                type="text"
                name="indirizzo"
                onChange={handleDettagliInput}
                className="w-full border-gray-300 rounded-lg p-2 bg-slate-100"
              />
            </div>
          </>
        )}

        {info.ruolo.nome === "collaboratore" && (
          <div>
            <label className="block text-sm font-medium mb-1">Sub-ruolo</label>
            <select
              name="subRole"
              onChange={handleDettagliInput}
              required
              className="w-full border-gray-300 rounded-lg p-2"
            >
              <option value="">Seleziona un sub-ruolo</option>
              <option value="commerciale">Commerciale</option>
              <option value="smm">SMM</option>
              <option value="web designer">Web Designer</option>
            </select>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium mb-1">Nome</label>
          <input
            type="text"
            name="nome"
            onChange={handleInput}
            className="w-full border-gray-300 rounded-lg p-2 bg-slate-100"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Cognome</label>
          <input
            type="text"
            name="cognome"
            onChange={handleInput}
            className="w-full border-gray-300 rounded-lg p-2 bg-slate-100"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <input
            type="email"
            name="email"
            onChange={handleInput}
            required
            className="w-full border-gray-300 rounded-lg p-2 bg-slate-100"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Numero Telefonico
          </label>
          <input
            type="text"
            name="numerotelefonico"
            onChange={handleInput}
            className="w-full border-gray-300 rounded-lg p-2 bg-slate-100"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Partita IVA</label>
          <input
            type="text"
            name="partitaIva"
            onChange={handleInput}
            required={info.ruolo.nome === "azienda" || info.ruolo.nome === "collaboratore"}
            className="w-full border-gray-300 rounded-lg p-2 bg-slate-100"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Password</label>
          <input
            type="password"
            name="password"
            onChange={handleInput}
            required
            className="w-full border-gray-300 rounded-lg p-2 bg-slate-100"
          />
        </div>

        <button
          type="submit"
          disabled={pending}
          className="w-full bg-blue-500 text-white p-3 rounded-lg hover:bg-blue-600 transition-all"
        >
          {pending ? "Registrazione in corso..." : "Registra"}
        </button>
        {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
      </form>
    </div>
  );
};

export default Registrazione;
