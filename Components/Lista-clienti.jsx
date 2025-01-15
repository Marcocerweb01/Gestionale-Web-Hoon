"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";

const ListaClienti = ({ id, amministratore }) => {
  const [data, setData] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [editingRow, setEditingRow] = useState(null);
  const [tempData, setTempData] = useState({});
  const [appuntamenti, setAppuntamenti] = useState({});

  const fetchCollaborazioni = async () => {
    try {
      const response = await fetch(`/api/collaborazioni/${id}`);
      if (!response.ok) {
        throw new Error("Errore nel recupero delle collaborazioni");
      }
      const result = await response.json();
      setData(result);
    } catch (err) {
      console.error("Errore:", err);
      setError("Non è stato possibile recuperare i dati.");
    } finally {
      setLoading(false);
    }
  };


  const fetchAppuntamenti = async (collaborazioneId) => {
    try {
      if (!collaborazioneId) return;


      const response = await fetch(`/api/appuntamenti_fatti/${collaborazioneId}`);
      if (!response.ok) {
        throw new Error("Errore nel recupero degli appuntamenti");
      }
      const result = await response.json();
      return result;
    } catch (err) {
      console.error("Errore:", err);
      setError("Non è stato possibile recuperare gli appuntamenti.");
    }
  };


  useEffect(() => {
    if (id) {
      fetchCollaborazioni();
    } else {
      setError("ID utente non fornito.");
      setLoading(false);
    }
  }, [id],[fetchCollaborazioni]);


  useEffect(() => {
    const loadAppuntamenti = async () => {
      const appuntamentiData = {};
      for (const row of data) {
        const result = await fetchAppuntamenti(row.feed);
        appuntamentiData[row.feed] = result || 0;
      }
      setAppuntamenti(appuntamentiData);
    };


    if (data.length > 0) {
      loadAppuntamenti();
    }
  }, [data]);


  const handleEditClick = (rowId) => {
    setEditingRow(rowId);
    const rowData = data.find((row) => row.id === rowId);
    setTempData({ ...rowData });
  };


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


  const handleSave = async () => {
    try {
      const response = await fetch(`/api/collaborazioni/edit/${editingRow}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          post_ig_fb_fatti: tempData.post_ig_fb_fatti,
          post_tiktok_fatti: tempData.post_tiktok_fatti,
          post_linkedin_fatti: tempData.post_linkedin_fatti,
        }),
      });


      if (!response.ok) {
        throw new Error("Errore durante l'aggiornamento");
      }


      const updatedCollaborazione = await response.json();


      setData((prevData) =>
        prevData.map((item) =>
          item.id === editingRow ? { ...item, ...updatedCollaborazione.collaborazione } : item
        )
      );


      setEditingRow(null);
      setTempData({});
    } catch (err) {
      console.error("Errore:", err);
      setError("Non è stato possibile aggiornare i dati.");
    }
  };


  const CounterEditor = ({ value, onIncrement, onDecrement }) => (
    <div className="flex items-center space-x-2 w-full">
      <button className="w-8 h-8 border border-black bg-slate-200 rounded-md" onClick={onDecrement}>
        <b>-</b>
      </button>
      <span className="flex-1 text-center">{value || "Non disponibile"}</span>
      <button className="w-8 h-8 border border-black bg-slate-200 rounded-md" onClick={onIncrement}>
        <b>+</b>
      </button>
    </div>
  );

  // Componente per la visualizzazione desktop
  const DesktopView = () => (
    <div className="hidden lg:hidden overflow-x-auto">
      <table className="w-full border border-black text-left">
        <thead className="rounded-lg">
          <tr className="bg-gray-100">
            <th className="border border-black px-4 py-2">Cliente</th>
            <th className="border border-black px-4 py-2">Feed</th>
            <th className="border border-black px-4 py-2">Appuntamenti mensili</th>
            <th className="border border-black px-4 py-2">Post IG & FB</th>
            <th className="border border-black px-4 py-2">Post TikTok</th>
            <th className="border border-black px-4 py-2">Post LinkedIn</th>
            {amministratore && <th className="border border-black px-4 py-2">Pagato</th>}
            <th className="border border-black px-4 py-2">Azione</th>
          </tr>
        </thead>
        <tbody>
        {data.map((row) => (
              <tr key={row.id} className="even:bg-gray-50">
                <td className="border border-black px-4 py-2">
                  <Link href={`User/${row.clienteId}`}> {row.cliente} </Link>
                </td>
                <td className="border border-black px-4 py-2 text-blue-600 cursor-pointer hover:underline">
                  <Link href={`/Feed-2/${id}`}>Visualizza Feed</Link>
                </td>
                <td className="border border-black px-4 py-2">
                  {appuntamenti[row.feed] || 0}/{row.appuntamenti}
                </td>
                <td className="border border-black px-4 py-2">
                  {editingRow === row.id ? (
                    <div className=" flex content-center items-center self-stretch ">
                      <button className="w-1/5 border border-black bg-slate-200 rounded-md py-0" onClick={() => handleIncrement("post_ig_fb_fatti")}><b>+</b></button>
                      <span className="w-3/5 text-center">{tempData.post_ig_fb_fatti || "Non disponibile"}</span>
                      <button className="w-1/5 border border-black bg-slate-200 rounded-md py-0" onClick={() => handleDecrement("post_ig_fb_fatti")}><b>-</b></button>
                    </div>
                  ) : row.postIg_fb === 0 ? (
                    "Non disponibile"
                  ) : (
                    row.post_ig_fb_fatti + " / " + row.postIg_fb
                  )}
                </td>
                <td className="border border-black px-4 py-2">
                  {editingRow === row.id ? (
                    <div className=" flex content-center items-center self-stretch ">
                      <button className="w-1/5 border border-black bg-slate-200 rounded-md py-0" onClick={() => handleIncrement("post_tiktok_fatti")}><b>+</b></button>
                      <span className="w-3/5 text-center">{tempData.post_tiktok_fatti || "Non disponibile"}</span>
                      <button className="w-1/5 border border-black bg-slate-200 rounded-md py-0" onClick={() => handleDecrement("post_tiktok_fatti")}><b>-</b></button>
                    </div>
                  ) : row.postTiktok === 0 ? (
                    "Non disponibile"
                  ) : (
                    row.post_tiktok_fatti + " / " + row.postTiktok
                  )}
                </td>
                <td className="border border-black px-4 py-2">
                  {editingRow === row.id ? (
                    <div className=" flex content-center items-center self-stretch ">
                      <button className="w-1/5 border border-black bg-slate-200 rounded-md py-0" onClick={() => handleIncrement("post_linkedin_fatti")}><b>+</b></button>
                      <span className="w-3/5 text-center">{tempData.post_linkedin_fatti || "Non disponibile"}</span>
                      <button className="w-1/5 border border-black bg-slate-200 rounded-md py-0" onClick={() => handleDecrement("post_linkedin_fatti")}><b>-</b></button>
                    </div>
                  ) : row.postLinkedin === 0 ? (
                    "Non disponibile"
                  ) : (
                    row.post_linkedin_fatti + " / " + row.postLinkedin
                  )}
                </td>
                {amministratore ? (
                  <td className="border border-black px-4 py-2">{row.pagato}</td>
                ) : null}
                <td className="border border-black px-4 py-2">
                  {editingRow === row.id ? (
                    <button onClick={handleSave} className="bg-green-500 text-white px-4 py-2 rounded">
                      Salva
                    </button>
                  ) : (
                    <button
                      onClick={() => handleEditClick(row.id)}
                      className="bg-blue-500 text-white px-4 py-2 rounded"
                    >
                      Modifica
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>

      </table>
    </div>
  );

  // Componente per la visualizzazione mobile
  const MobileView = () => (
    <div className="md:hidden space-y-4">
      {data.map((row) => (
        <div key={row.id} className="bg-white rounded-lg shadow-md p-4 space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold text-lg">{row.cliente}</h3>
            {editingRow === row.id ? (
              <button onClick={handleSave} className="bg-green-500!important text-white px-3 py-1 rounded text-sm">
                Salva
              </button>
            ) : (
              <button
                onClick={() => handleEditClick(row.id)}
                className="bg-blue-500 text-white px-3 py-1 rounded text-sm"
              >
                Modifica
              </button>
            )}
          </div>
          
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="space-y-1">
              <p className="font-medium text-gray-600">Feed:</p>
              <Link href={`/Feed-2/${id}`} className="text-blue-600 hover:underline">
                Visualizza Feed
              </Link>
            </div>
            
            <div className="space-y-1">
              <p className="font-medium text-gray-600">Appuntamenti:</p>
              <p>{appuntamenti[row.feed] || 0}/{row.appuntamenti}</p>
            </div>
            
            <div className="space-y-1 col-span-2">
              <p className="font-medium text-gray-600">Post IG & FB:</p>
              {editingRow === row.id ? (
                <CounterEditor
                  value={tempData.post_ig_fb_fatti}
                  onIncrement={() => handleIncrement("post_ig_fb_fatti")}
                  onDecrement={() => handleDecrement("post_ig_fb_fatti")}
                />
              ) : (
                <p>{row.postIg_fb === 0 ? "Non disponibile" : `${row.post_ig_fb_fatti} / ${row.postIg_fb}`}</p>
              )}
            </div>
            
            <div className="space-y-1 col-span-2">
              <p className="font-medium text-gray-600">Post TikTok:</p>
              {editingRow === row.id ? (
                <CounterEditor
                  value={tempData.post_tiktok_fatti}
                  onIncrement={() => handleIncrement("post_tiktok_fatti")}
                  onDecrement={() => handleDecrement("post_tiktok_fatti")}
                />
              ) : (
                <p>{row.postTiktok === 0 ? "Non disponibile" : `${row.post_tiktok_fatti} / ${row.postTiktok}`}</p>
              )}
            </div>
            
            <div className="space-y-1 col-span-2">
              <p className="font-medium text-gray-600">Post LinkedIn:</p>
              {editingRow === row.id ? (
                <CounterEditor
                  value={tempData.post_linkedin_fatti}
                  onIncrement={() => handleIncrement("post_linkedin_fatti")}
                  onDecrement={() => handleDecrement("post_linkedin_fatti")}
                />
              ) : (
                <p>{row.postLinkedin === 0 ? "Non disponibile" : `${row.post_linkedin_fatti} / ${row.postLinkedin}`}</p>
              )}
            </div>
            
            {amministratore && (
              <div className="space-y-1">
                <p className="font-medium text-gray-600">Pagato:</p>
                <p>{row.pagato}</p>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );

  if (loading) return <div>Caricamento in corso...</div>;
  if (error) return <div>{error}</div>;
  if (data.length === 0) return <div className="text-center text-gray-500">Nessuna collaborazione trovata.</div>;

  return (
    <>
      <DesktopView />
      <MobileView />
    </>
  );
};

export default ListaClienti;