'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

// Hook personalizzato per gestire i collaboratori con auto-refresh
export const useCollaboratori = () => {
  const [collaboratori, setCollaboratori] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastHash, setLastHash] = useState(""); // ✨ Traccia un hash dei dati, non solo il count
  const intervalRef = useRef(null);

  // ✨ Funzione per creare un hash semplice dei dati
  const createDataHash = (data) => {
    if (!data || data.length === 0) return "empty";
    // Crea un hash basato su: numero + tutti gli status + tutti gli id
    return data.map(c => `${c.id}-${c.status || 'attivo'}`).join('|');
  };

  const fetchCollaboratori = useCallback(async (isPolling = false) => {
    if (!isPolling) setLoading(true);
    setError("");
    try {
      // ✨ Timestamp più aggressivo per evitare cache
      const timestamp = Date.now() + Math.random();
      const response = await fetch(`/api/lista_collaboratori?t=${timestamp}&r=${Math.random()}`, {
        method: "GET",
        cache: "no-store",
        headers: { 
          "Cache-Control": "no-cache, no-store, must-revalidate, max-age=0",
          "Pragma": "no-cache",
          "Expires": "0"
        },
      });
      
      if (!response.ok) throw new Error("Errore nel recupero dei collaboratori");
      
      const result = await response.json();
      const currentHash = createDataHash(result);
      
      // ✨ Aggiorna se l'hash è diverso (numero O status cambiati)
      if (isPolling && currentHash !== lastHash) {
        console.log(`🔄 Rilevati cambiamenti nei dati collaboratori`);
        setCollaboratori(result);
        setLastHash(currentHash);
      } else if (!isPolling) {
        setCollaboratori(result);
        setLastHash(currentHash);
      }
      
    } catch (err) {
      console.error("Errore:", err);
      if (!isPolling) setError("Non è stato possibile recuperare i collaboratori");
    } finally {
      if (!isPolling) setLoading(false);
    }
  }, [lastHash]);

  // ✨ Polling intelligente ogni 3 secondi
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      fetchCollaboratori(true);
    }, 3000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [fetchCollaboratori]);

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