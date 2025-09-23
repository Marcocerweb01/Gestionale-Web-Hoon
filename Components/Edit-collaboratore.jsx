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
    subRole: "",
    status: "attivo", // Nuovo campo status
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
          subRole: data.subRole || "",
          status: data.status || "attivo", // Nuovo campo status
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
          <label>Sub-ruolo</label>
          <input
            type="text"
            name="subRole"
            value={formData.subRole}
            onChange={handleInputChange}
          />
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
            I collaboratori con status "Non Attivo" non possono effettuare il login
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
