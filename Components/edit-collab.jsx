import React, { useState, useEffect } from "react";

const AdminCollaborationsList = ({ id }) => {
  const [data, setData] = useState([]);
  const [editingRow, setEditingRow] = useState();
  const [tempData, setTempData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Funzione per recuperare le collaborazioni
  const fetchCollaborazioni = async () => {
    try {
      const response = await fetch(`/api/collaborazioni/${id}`);
      if (!response.ok) {
        throw new Error("Errore nel recupero delle collaborazioni");
      }
      const result = await response.json();
      setData(result);
    } catch (err) {
      console.error(err);
      setError("Non è stato possibile recuperare i dati.");
    } finally {
      setLoading(false);
    }
  };

  // Recupera le collaborazioni al caricamento del componente
  useEffect(() => {
    fetchCollaborazioni();
  }, [id]);

  // Gestione modifica
  const handleEditClick = (rowId) => {
    setEditingRow(rowId);
    const rowData = data.find((row) => row.id === rowId);
    setTempData({ ...rowData });
  };

  // Incrementa/Decrementa valori
  const handleIncrement = (field) => {
    setTempData((prev) => ({
      ...prev,
      [field]: prev[field] + 1,
    }));
  };

  const handleDecrement = (field) => {
    setTempData((prev) => ({
      ...prev,
      [field]: Math.max(0, prev[field] - 1),
    }));
  };

  // Salva modifiche
  const handleSave = async () => {
    try {
      const response = await fetch(`/api/collaborazioni/adminedit/${editingRow}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          numero_appuntamenti: tempData.appuntamenti,
          post_ig_fb: tempData.postIg_fb,
          post_tiktok: tempData.postTiktok,
          post_linkedin: tempData.postLinkedin,
        }),
      });

      if (!response.ok) {
        throw new Error("Errore durante l'aggiornamento");
      }

      console.log("Modifica salvata con successo!");

      // Richiama la funzione per aggiornare i dati
      await fetchCollaborazioni();

      // Resetta lo stato di modifica
      setEditingRow(null);
      setTempData({});
    } catch (err) {
      console.error("Errore:", err);
      setError("Non è stato possibile aggiornare i dati.");
    }
  };

  if (loading) return <div>Caricamento in corso...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div className="overflow-x-auto">
      <table className="w-full border border-black text-left">
        <thead>
          <tr>
            <th>Cliente</th>
            <th>Numero Appuntamenti</th>
            <th>Post IG & FB</th>
            <th>Post TikTok</th>
            <th>Post LinkedIn</th>
            <th>Azione</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr key={row.id}>
              <td>{row.cliente}</td>
              <td>
                {editingRow === row.id ? (
                  <div>
                    <button onClick={() => handleDecrement("appuntamenti")}>-</button>
                    <span>{tempData.appuntamenti}</span>
                    <button onClick={() => handleIncrement("appuntamenti")}>+</button>
                  </div>
                ) : (
                  row.appuntamenti
                )}
              </td>
              <td>
                {editingRow === row.id ? (
                  <div>
                    <button onClick={() => handleDecrement("postIg_fb")}>-</button>
                    <span>{tempData.postIg_fb}</span>
                    <button onClick={() => handleIncrement("postIg_fb")}>+</button>
                  </div>
                ) : (
                  row.postIg_fb
                )}
              </td>
              <td>
                {editingRow === row.id ? (
                  <div>
                    <button onClick={() => handleDecrement("postTiktok")}>-</button>
                    <span>{tempData.postTiktok}</span>
                    <button onClick={() => handleIncrement("postTiktok")}>+</button>
                  </div>
                ) : (
                  row.postTiktok
                )}
              </td>
              <td>
                {editingRow === row.id ? (
                  <div>
                    <button onClick={() => handleDecrement("postLinkedin")}>-</button>
                    <span>{tempData.postLinkedin}</span>
                    <button onClick={() => handleIncrement("postLinkedin")}>+</button>
                  </div>
                ) : (
                  row.postLinkedin
                )}
              </td>
              <td>
                {editingRow === row.id ? (
                  <button onClick={handleSave}>Salva</button>
                ) : (
                  <button onClick={() => handleEditClick(row.id)}>Modifica</button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AdminCollaborationsList;