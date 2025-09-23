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
      console.log(info);
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(info),
      });
      console.log(res)
      if (res.ok) {
        // ✨ Invalida cache collaboratori dopo inserimento
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('collaboratori-updated'));
        }
        router.push("/");
      } else {
        const errorData = await res.json();
        setError(errorData.message || "Errore nella registrazione.");
      }
    } catch (err) {
      console.error("Errore durante la registrazione:", err);
      console.log(err)
      setError("Errore del server. Riprova più tardi.");
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-primary to-primary-600 px-8 py-6">
            <h2 className="text-3xl font-bold text-black">Registrazione</h2>
            <p className="text-primary-100 mt-1">Crea il tuo account per accedere alla piattaforma</p>
          </div>
          
          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            {/* Ruolo */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">
                Ruolo <span className="text-red-500">*</span>
              </label>
              <select
                name="ruolo.nome"
                onChange={handleInput}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              >
                <option value="">Seleziona un ruolo</option>
                <option value="azienda">Azienda</option>
                <option value="contatto">Contatto</option>
                <option value="collaboratore">Collaboratore</option>
                <option value="amministratore">Amministratore</option>
              </select>
            </div>

            {/* Campi specifici per Azienda */}
            {info.ruolo.nome === "azienda" && (
              <div className="space-y-6 p-6 bg-blue-50 rounded-lg border border-blue-200">
                <h3 className="text-lg font-semibold text-blue-900 mb-4">Informazioni Azienda</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">
                      Ragione Sociale <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="ragioneSociale"
                      onChange={handleDettagliInput}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                      placeholder="Inserisci la ragione sociale"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">
                      Etichetta <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="etichetta"
                      onChange={handleDettagliInput}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                      placeholder="Nome commerciale"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Indirizzo
                  </label>
                  <input
                    type="text"
                    name="indirizzo"
                    onChange={handleDettagliInput}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                    placeholder="Via, numero civico, città"
                  />
                </div>
              </div>
            )}

            {/* Campi specifici per Collaboratore */}
            {info.ruolo.nome === "collaboratore" && (
              <div className="space-y-6 p-6 bg-green-50 rounded-lg border border-green-200">
                <h3 className="text-lg font-semibold text-green-900 mb-4">Informazioni Collaboratore</h3>
                
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Specializzazione <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="subRole"
                    onChange={handleDettagliInput}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  >
                    <option value="">Seleziona una specializzazione</option>
                    <option value="commerciale">Commerciale</option>
                    <option value="smm">Social Media Manager</option>
                    <option value="web designer">Web Designer</option>
                  </select>
                </div>
              </div>
            )}

            {/* Informazioni Personali */}
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">Informazioni Personali</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">Nome</label>
                  <input
                    type="text"
                    name="nome"
                    onChange={handleInput}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                    placeholder="Il tuo nome"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">Cognome</label>
                  <input
                    type="text"
                    name="cognome"
                    onChange={handleInput}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                    placeholder="Il tuo cognome"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  onChange={handleInput}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  placeholder="nome@esempio.com"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Numero Telefonico
                </label>
                <input
                  type="text"
                  name="numerotelefonico"
                  onChange={handleInput}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  placeholder="+39 123 456 7890"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Partita IVA {(info.ruolo.nome === "azienda" || info.ruolo.nome === "collaboratore") && <span className="text-red-500">*</span>}
                </label>
                <input
                  type="text"
                  name="partitaIva"
                  onChange={handleInput}
                  required={info.ruolo.nome === "azienda" || info.ruolo.nome === "collaboratore"}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  placeholder="IT12345678901"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Password <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  name="password"
                  onChange={handleInput}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  placeholder="Inserisci una password sicura"
                />
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center">
                  <div className="text-red-500 mr-2">⚠️</div>
                  <p className="text-red-700 font-medium">{error}</p>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={pending}
                className="w-full btn-primary py-4 text-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {pending ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Registrazione in corso...
                  </div>
                ) : (
                  'Registra Account'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Registrazione;
