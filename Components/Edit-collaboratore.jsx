"use client";

import React, { useState, useEffect } from "react";

const EditUserForm = ({ userId }) => {
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({
    nome: "",
    cognome: "",
    email: "",
    password: "",
    partitaIva: "",
    subRoles: [], // Array di ruoli
    status: "attivo",
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Recupera i dati dell'utente
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch(`/api/users/${userId}`);
        if (!response.ok) {
          throw new Error("Errore nel recupero dei dati dell'utente");
        }
        const data = await response.json();
        setUser(data);
        setFormData({
          nome: data.nome || "",
          cognome: data.cognome || "",
          email: data.email || "",
          partitaIva: data.partitaIva || "",
          subRoles: data.subRoles || data.subRole ? [data.subRole] : [], // Supporta sia subRoles che subRole legacy
          status: data.status || "attivo",
        });
      } catch (err) {
        console.error(err);
        setError("Errore nel recupero dei dati dell'utente.");
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [userId]);

  // Gestione input
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Invio del form
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error("Errore durante l'aggiornamento dell'utente");
      }

      const updatedUser = await response.json();
      setSuccess("Utente aggiornato con successo.");
      setUser(updatedUser);
      
      // ✨ Trigger refresh globale per aggiornare la lista collaboratori
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('collaboratori-updated'));
      }
    } catch (err) {
      console.error(err);
      setError("Errore durante l'aggiornamento dell'utente.");
    }
  };

  if (loading) return <div>Caricamento...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div className="formContainer container bg-slate-50 p-6 rounded-lg">
      <h2 className="text-xl font-bold mb-4">Modifica Utente</h2>
      {success && <div className="text-green-500 mb-4">{success}</div>}
      {error && <div className="text-red-500 mb-4">{error}</div>}
      <form onSubmit={handleSubmit}>
        <div className="inputWrapper">
          <label>Nome</label>
          <input
            type="text"
            name="nome"
            value={formData.nome}
            onChange={handleInputChange}
            required
          />
        </div>
        <div className="inputWrapper">
          <label>Cognome</label>
          <input
            type="text"
            name="cognome"
            value={formData.cognome}
            onChange={handleInputChange}
          />
        </div>
        <div className="inputWrapper">
          <label>Email</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            required
          />
        </div>
        <div className="inputWrapper">
          <label>Partita IVA</label>
          <input
            type="text"
            name="partitaIva"
            value={formData.partitaIva}
            onChange={handleInputChange}
          />
        </div>
        <div className="inputWrapper">
          <label>Specializzazioni</label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
            {[
              { value: "commerciale", label: "Commerciale", icon: "💼" },
              { value: "smm", label: "Social Media Manager", icon: "📱" },
              { value: "web designer", label: "Web Designer", icon: "🎨" },
              { value: "seo", label: "SEO", icon: "🔍" },
              { value: "google ads", label: "Google ADS", icon: "📢" },
              { value: "meta ads", label: "Meta ADS", icon: "📱" }
            ].map((ruolo) => (
              <label
                key={ruolo.value}
                className="flex items-center space-x-3 p-3 bg-white border-2 border-gray-200 rounded-lg cursor-pointer hover:border-blue-400 transition-colors"
              >
                <input
                  type="checkbox"
                  value={ruolo.value}
                  checked={formData.subRoles.includes(ruolo.value)}
                  onChange={(e) => {
                    const newRoles = e.target.checked
                      ? [...formData.subRoles, ruolo.value]
                      : formData.subRoles.filter(r => r !== ruolo.value);
                    setFormData(prev => ({ ...prev, subRoles: newRoles }));
                  }}
                  className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">
                  {ruolo.icon} {ruolo.label}
                </span>
              </label>
            ))}
          </div>
          {formData.subRoles.length > 0 && (
            <small className="text-green-600 mt-2 block">
              ✓ {formData.subRoles.length} specializzazione/i selezionate
            </small>
          )}
        </div>
        <div className="inputWrapper">
          <label>Status Account</label>
          <select
            name="status"
            value={formData.status}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="attivo">🟢 Attivo</option>
            <option value="non_attivo">🔴 Non Attivo</option>
          </select>
          <small className="text-gray-600 mt-1 block">
            I collaboratori con status &quot;Non Attivo&quot; non possono effettuare il login
          </small>
        </div>
        <div className="inputWrapper">
          <label>Nuova Password</label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleInputChange}
          />
        </div>
        <button
          type="submit"
          className="inline-flex items-center px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors mt-6"
        >
          ✅ Aggiorna Utente
        </button>
      </form>
    </div>
  );
};

export default EditUserForm;
