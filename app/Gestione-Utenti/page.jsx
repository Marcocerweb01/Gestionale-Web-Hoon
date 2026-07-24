"use client";
import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { CheckCircle2, KeyRound, XCircle } from "lucide-react";

const tipoColori = {
  amministratore: "bg-purple-100 text-purple-800",
  collaboratore: "bg-blue-100 text-blue-800",
  azienda: "bg-green-100 text-green-800",
};

const statusColori = {
  attivo: "bg-green-100 text-green-800",
  non_attivo: "bg-red-100 text-red-800",
};

export default function GestioneUtenti() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [utenti, setUtenti] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cerca, setCerca] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("tutti");
  const [updatingStatusId, setUpdatingStatusId] = useState(null);
  const [statusMsg, setStatusMsg] = useState("");

  // Modal reset password
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [modalError, setModalError] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/Login");
      return;
    }
    if (status === "authenticated" && session.user.role !== "amministratore") {
      router.push("/unauthorized");
      return;
    }
    if (status === "authenticated") {
      fetchUtenti();
    }
  }, [status]);

  const fetchUtenti = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/gestione-utenti");
      if (!res.ok) throw new Error("Errore nel caricamento");
      const data = await res.json();
      setUtenti(data);
    } catch (e) {
      setError("Impossibile caricare la lista utenti");
    } finally {
      setLoading(false);
    }
  };

  const openModal = (user) => {
    setSelectedUser(user);
    setNewPassword("");
    setConfirmPassword("");
    setShowPassword(false);
    setModalError("");
    setSuccessMsg("");
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelectedUser(null);
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setModalError("");
    setSuccessMsg("");

    if (newPassword.length < 6) {
      setModalError("La password deve essere di almeno 6 caratteri.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setModalError("Le due password non coincidono.");
      return;
    }

    try {
      setSaving(true);
      const res = await fetch(`/api/gestione-utenti/${selectedUser._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPassword, tipo: selectedUser.tipo }),
      });

      const data = await res.json();
      if (!res.ok) {
        setModalError(data.error || "Errore durante l'aggiornamento");
        return;
      }

      setSuccessMsg("Password aggiornata con successo!");
      setNewPassword("");
      setConfirmPassword("");
    } catch (e) {
      setModalError("Errore di connessione al server");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (user) => {
    if (user.tipo !== "collaboratore") return;

    const newStatus = user.status === "attivo" ? "non_attivo" : "attivo";
    setStatusMsg("");

    try {
      setUpdatingStatusId(user._id);
      const res = await fetch(`/api/gestione-utenti/${user._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tipo: user.tipo, status: newStatus }),
      });

      const data = await res.json();
      if (!res.ok) {
        setStatusMsg(data.error ? `Errore: ${data.error}` : "Errore durante l'aggiornamento dello status");
        return;
      }

      setUtenti((current) =>
        current.map((u) =>
          u._id === user._id ? { ...u, status: newStatus } : u
        )
      );
      setStatusMsg(
        `${user.nome} ${user.cognome || ""} ${newStatus === "attivo" ? "riattivato" : "disattivato"} con successo.`
      );

      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("collaboratori-updated"));
      }
    } catch (e) {
      setStatusMsg("Errore di connessione al server");
    } finally {
      setUpdatingStatusId(null);
    }
  };

  const utentiFiltrati = utenti.filter((u) => {
    const matchTipo = filtroTipo === "tutti" || u.tipo === filtroTipo;
    const query = cerca.toLowerCase();
    const matchCerca =
      !cerca ||
      (u.nome + " " + u.cognome).toLowerCase().includes(query) ||
      u.email.toLowerCase().includes(query);
    return matchTipo && matchCerca;
  });

  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="ml-3 text-gray-600">Caricamento...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-4 m-4">
        <p className="text-red-700">{error}</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-700 rounded-lg flex items-center justify-center">
            <span className="text-white text-lg">🔐</span>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Gestione Utenti</h1>
            <p className="text-sm text-gray-500">
              Visualizza utenti, password e stato collaboratori
            </p>
          </div>
        </div>
        <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-sm text-amber-800">
            <strong>Nota:</strong> Le password sono cifrate e non possono essere visualizzate. Da qui puoi impostare una nuova password per qualsiasi utente.
          </p>
        </div>
      </div>

      {/* Filtri */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            placeholder="Cerca per nome o email..."
            value={cerca}
            onChange={(e) => setCerca(e.target.value)}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
          />
          <select
            value={filtroTipo}
            onChange={(e) => setFiltroTipo(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
          >
            <option value="tutti">Tutti ({utenti.length})</option>
            <option value="amministratore">
              Amministratori ({utenti.filter((u) => u.tipo === "amministratore").length})
            </option>
            <option value="collaboratore">
              Collaboratori ({utenti.filter((u) => u.tipo === "collaboratore").length})
            </option>
            <option value="azienda">
              Aziende ({utenti.filter((u) => u.tipo === "azienda").length})
            </option>
          </select>
        </div>
        {statusMsg && (
          <div
            className={`mt-3 p-3 border rounded-lg ${
              statusMsg.includes("Errore")
                ? "bg-red-50 border-red-200 text-red-700"
                : "bg-green-50 border-green-200 text-green-700"
            }`}
          >
            <p className="text-sm">{statusMsg}</p>
          </div>
        )}
      </div>

      {/* Lista utenti */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-x-auto">
        {utentiFiltrati.length === 0 ? (
          <div className="p-8 text-center text-gray-500">Nessun utente trovato.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Nome</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Email</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Tipo</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Stato</th>
                <th className="px-4 py-3 text-right font-semibold text-gray-600">Azioni</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {utentiFiltrati.map((u) => (
                <tr key={u._id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {u.nome} {u.cognome}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{u.email}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${tipoColori[u.tipo]}`}
                    >
                      {u.etichetta}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {u.tipo === "collaboratore" ? (
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColori[u.status || "attivo"]}`}
                      >
                        {(u.status || "attivo") === "attivo" ? (
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        ) : (
                          <XCircle className="w-3.5 h-3.5" />
                        )}
                        {(u.status || "attivo") === "attivo" ? "Attivo" : "Non attivo"}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      {u.tipo === "collaboratore" && (
                        <button
                          onClick={() => handleToggleStatus(u)}
                          disabled={updatingStatusId === u._id}
                          title={
                            (u.status || "attivo") === "attivo"
                              ? "Disattiva collaboratore"
                              : "Riattiva collaboratore"
                          }
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition-colors ${
                            (u.status || "attivo") === "attivo"
                              ? "text-red-700 bg-red-50 hover:bg-red-100"
                              : "text-green-700 bg-green-50 hover:bg-green-100"
                          }`}
                        >
                          {(u.status || "attivo") === "attivo" ? (
                            <XCircle className="w-3.5 h-3.5" />
                          ) : (
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          )}
                          {updatingStatusId === u._id
                            ? "Salvo..."
                            : (u.status || "attivo") === "attivo"
                              ? "Disattiva"
                              : "Attiva"}
                        </button>
                      )}
                      <button
                        onClick={() => openModal(u)}
                        disabled={u._id === session?.user?.id}
                        title={
                          u._id === session?.user?.id
                            ? "Non puoi modificare la tua password da qui"
                            : "Imposta nuova password"
                        }
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      >
                        <KeyRound className="w-3.5 h-3.5" />
                        Cambia Password
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal */}
      {modalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">
                Cambia Password
              </h2>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600 transition-colors text-2xl leading-none"
              >
                ×
              </button>
            </div>

            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-700">
                <span className="font-medium">Utente:</span>{" "}
                {selectedUser.nome} {selectedUser.cognome}
              </p>
              <p className="text-sm text-gray-700">
                <span className="font-medium">Email:</span> {selectedUser.email}
              </p>
              <span
                className={`inline-flex items-center mt-1 px-2 py-0.5 rounded-full text-xs font-medium ${tipoColori[selectedUser.tipo]}`}
              >
                {selectedUser.etichetta}
              </span>
            </div>

            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nuova Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimo 6 caratteri"
                    className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-sm"
                  >
                    {showPassword ? "👁️" : "🙈"}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Conferma Password
                </label>
                <input
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Ripeti la password"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                  required
                />
              </div>

              {modalError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-700">{modalError}</p>
                </div>
              )}

              {successMsg && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-700">{successMsg}</p>
                </div>
              )}

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors"
                >
                  {saving ? "Salvataggio..." : "Aggiorna Password"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
