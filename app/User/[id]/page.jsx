"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession} from "next-auth/react";

const UserDetails = ({ params }) => {
  const { id } = params; // ID utente dalla route
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({}); // Stato del form per modifica
  const { data: session, status } = useSession();
  
  const router = useRouter();

  // Fetch dettagli utente
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch(`/api/users/${id}`);
        if (!response.ok) {
          throw new Error("Errore nel recupero dei dettagli utente");
        }
        const data = await response.json();
        setUser(data);
        setFormData(data); // Imposta i dati iniziali del form
      } catch (err) {
        console.error(err);
        setError("Non è stato possibile recuperare i dettagli utente.");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchUser();
    }
  }, [id]);

  // Gestione input del form
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Salva modifiche
  const handleSave = async () => {
    try {
      const response = await fetch(`/api/users/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error("Errore durante l'aggiornamento dell'utente");
      }

      const updatedUser = await response.json();
      setUser(updatedUser);
      setEditMode(false); // Esci dalla modalità modifica
    } catch (err) {
      console.error(err);
      setError("Non è stato possibile aggiornare i dettagli utente.");
    }
  };

  if (loading) return <div>Caricamento...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div className="p-6 bg-white shadow rounded w-5/6">
      <h1 className="text-2xl font-bold mb-4">
        {editMode ? "Modifica Utente" : "Dettagli Utente"}
      </h1>
      {user && (
        <div>
          {editMode ? (
            <form className="space-y-4">
                {typeof user.etichetta !== "undefined" && (
               <div>
                <label className="block font-medium">Eichetta:</label>
                <input
                  type="text"
                  name="etichetta"
                  value={formData.etichetta || ""}
                  onChange={handleChange}
                  className="w-full p-2 border rounded"
                />
              </div>
                )}
              <div>
                <label className="block font-medium">Nome:</label>
                <input
                  type="text"
                  name="nome"
                  value={formData.nome || ""}
                  onChange={handleChange}
                  className="w-full p-2 border rounded"
                />
              </div>
              <div>
                <label className="block font-medium">Cognome:</label>
                <input
                  type="text"
                  name="cognome"
                  value={formData.cognome || ""}
                  onChange={handleChange}
                  className="w-full p-2 border rounded"
                />
              </div>
              {user.subRole && (
                <div>
                  <label className="block font-medium">Ruolo:</label>
                  <select
                    name="subRole"
                    value={formData.subRole || ""}
                    onChange={handleChange}
                    className="w-full p-2 border rounded"
                  >
                    <option value="commerciale">Commerciale</option>
                    <option value="smm">Social Media Manager</option>
                    <option value="web designer">Web Designer</option>
                  </select>
                </div>
              )}
              <div>
                <label className="block font-medium">Email:</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email || ""}
                  onChange={handleChange}
                  className="w-full p-2 border rounded"
                />
              </div>
              {user.partitaIva && (
                <div>
                  <label className="block font-medium">Partita IVA:</label>
                  <input
                    type="text"
                    name="partitaIva"
                    value={formData.partitaIva || ""}
                    onChange={handleChange}
                    className="w-full p-2 border rounded"
                  />
                </div>
              )}
              {user.ragioneSociale && (
                <div>
                  <label className="block font-medium">Ragione Sociale:</label>
                  <input
                    type="text"
                    name="ragioneSociale"
                    value={formData.ragioneSociale || ""}
                    onChange={handleChange}
                    className="w-full p-2 border rounded"
                  />
                </div>
              )}
              {user.indirizzo && (
                <div>
                  <label className="block font-medium">Indirizzo:</label>
                  <input
                    type="text"
                    name="indirizzo"
                    value={formData.indirizzo || ""}
                    onChange={handleChange}
                    className="w-full p-2 border rounded"
                  />
                </div>
              )}
              {typeof user.pagamento !== "undefined" && (
                <div>
                  <label className="block font-medium">Pagamento:</label>
                  <select
                    name="pagamento"
                    value={formData.pagamento ? "pagato" : "non pagato"}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        pagamento: e.target.value === "pagato",
                      }))
                    }
                    className="w-full p-2 border rounded"
                  >
                    <option value="pagato">Pagato</option>
                    <option value="non pagato">Non Pagato</option>
                  </select>
                </div>
              )}
              <button
                type="button"
                onClick={handleSave}
                className="bg-blue-500 text-white px-4 py-2 rounded"
              >
                Salva
              </button>
            </form>
          ) : (
            <div>
              {typeof user.etichetta !== "undefined" && (
               <p>
                <strong>Etichetta:</strong> {user.etichetta}
              </p>
              )}
              <p>
                <strong>Nome:</strong> {user.nome}
              </p>
              <p>
                <strong>Cognome:</strong> {user.cognome}
              </p>
              <p>
                <strong>Email:</strong> {user.email}
              </p>
              {user.subRole && (
                <p>
                  <strong>Ruolo:</strong> {user.subRole}
                </p>
              )}
              {user.partitaIva && (
                <p>
                  <strong>Partita IVA:</strong> {user.partitaIva}
                </p>
              )}
              {user.ragioneSociale && (
                <p>
                  <strong>Ragione Sociale:</strong> {user.ragioneSociale}
                </p>
              )}
              {user.indirizzo && (
                <p>
                  <strong>Indirizzo:</strong> {user.indirizzo}
                </p>
              )}
              {typeof user.pagamento !== "undefined" && (
                <p>
                  <strong>Pagamento:</strong> {user.pagamento ? "Pagato" : "Non Pagato"}
                </p>
              )}
            {session?.user?.role === "amministratore" ? (
              <button
                type="button"
                onClick={() => setEditMode(true)}
                className="bg-yellow-500 text-white px-4 py-2 rounded mt-4"
              >
                Modifica
              </button>):(<></>)}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default UserDetails;
