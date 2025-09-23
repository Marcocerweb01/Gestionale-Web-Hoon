'use client';

import { useState, useEffect, useCallback } from 'react';

// Hook personalizzato per gestire i collaboratori con auto-refresh
export const useCollaboratori = () => {
  const [collaboratori, setCollaboratori] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchCollaboratori = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      // ✨ Timestamp per evitare cache
      const timestamp = new Date().getTime();
      const response = await fetch(`/api/lista_collaboratori?t=${timestamp}`, {
        method: "GET",
        cache: "no-store",
        headers: { 
          "Cache-Control": "no-cache, no-store, must-revalidate",
          "Pragma": "no-cache",
          "Expires": "0"
        },
      });
      
      if (!response.ok) throw new Error("Errore nel recupero dei collaboratori");
      
      const result = await response.json();
      setCollaboratori(result);
    } catch (err) {
      console.error("Errore:", err);
      setError("Non è stato possibile recuperare i collaboratori");
    } finally {
      setLoading(false);
    }
  }, []);

  // Funzione per invalidare manualmente i dati
  const refreshCollaboratori = useCallback(() => {
    fetchCollaboratori();
  }, [fetchCollaboratori]);

  useEffect(() => {
    fetchCollaboratori();
  }, [fetchCollaboratori]);

  return {
    collaboratori,
    loading,
    error,
    refreshCollaboratori
  };
};

// Evento globale per invalidare i dati quando vengono inseriti nuovi collaboratori
export const invalidateCollaboratori = () => {
  // Trigger evento personalizzato
  window.dispatchEvent(new CustomEvent('collaboratori-updated'));
};

// Hook per ascoltare gli aggiornamenti globali
export const useCollaboratoriWithGlobalRefresh = () => {
  const collaboratoriData = useCollaboratori();

  useEffect(() => {
    const handleRefresh = () => {
      collaboratoriData.refreshCollaboratori();
    };

    window.addEventListener('collaboratori-updated', handleRefresh);
    return () => window.removeEventListener('collaboratori-updated', handleRefresh);
  }, [collaboratoriData.refreshCollaboratori]);

  return collaboratoriData;
};