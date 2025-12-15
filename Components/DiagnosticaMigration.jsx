"use client";

import { useEffect, useState } from "react";
import { AlertCircle, CheckCircle, XCircle, RefreshCw } from "lucide-react";

export default function DiagnosticaMigration() {
  const [stato, setStato] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMigrating, setIsMigrating] = useState(false);

  useEffect(() => {
    verificaStato();
  }, []);

  const verificaStato = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/collaboratori/migrate-fields");
      if (response.ok) {
        const data = await response.json();
        setStato(data);
      }
    } catch (error) {
      console.error("Errore verifica migration:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const eseguiMigration = async () => {
    if (!confirm("Vuoi eseguire la migration dei collaboratori ora?")) return;

    setIsMigrating(true);
    try {
      const response = await fetch("/api/collaboratori/migrate-fields", {
        method: "POST"
      });
      
      if (response.ok) {
        const result = await response.json();
        alert(`✅ Migration completata!\n\nAggiornati: ${result.risultati.aggiornati} collaboratori`);
        verificaStato(); // Ricarica stato
      } else {
        alert("❌ Errore durante la migration");
      }
    } catch (error) {
      console.error("Errore migration:", error);
      alert("❌ Errore di connessione");
    } finally {
      setIsMigrating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 animate-pulse">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 bg-blue-200 rounded-full"></div>
          <div className="h-4 bg-blue-200 rounded w-48"></div>
        </div>
      </div>
    );
  }

  if (!stato) return null;

  // Se tutti hanno i campi, non mostrare nulla (sistema OK)
  if (stato.senza_nuovi_campi === 0) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
        <div className="flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-green-800">
              ✅ Sistema configurato correttamente
            </p>
            <p className="text-xs text-green-600 mt-1">
              Tutti i {stato.totali} collaboratori hanno i campi del nuovo sistema pagamenti
            </p>
          </div>
          <button
            onClick={verificaStato}
            className="p-2 text-green-600 hover:bg-green-100 rounded-lg transition-colors"
            title="Ricontrolla"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  // Altrimenti mostra warning
  return (
    <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-4 mb-6">
      <div className="flex items-start gap-3">
        <AlertCircle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h3 className="text-sm font-bold text-yellow-900 mb-1">
            ⚠️ Setup Richiesto - Nuovo Sistema Pagamenti
          </h3>
          <p className="text-sm text-yellow-800 mb-3">
            Alcuni collaboratori ({stato.senza_nuovi_campi} su {stato.totali}) non hanno ancora i campi necessari per il nuovo sistema pagamenti.
          </p>
          
          <div className="bg-yellow-100 rounded-lg p-3 mb-3 text-xs text-yellow-800">
            <p className="font-semibold mb-1">Campi mancanti:</p>
            <ul className="list-disc list-inside space-y-0.5 ml-2">
              <li>percentuale_hoon (50/55/60/70%)</li>
              <li>tot_fatturato</li>
              <li>guadagno_da_hoon</li>
              <li>totale_fatture_terzi</li>
            </ul>
          </div>

          <div className="flex gap-2">
            <button
              onClick={eseguiMigration}
              disabled={isMigrating}
              className="px-4 py-2 bg-yellow-600 text-white text-sm font-medium rounded-lg hover:bg-yellow-700 disabled:bg-gray-400 transition-colors flex items-center gap-2"
            >
              {isMigrating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Configurando...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Configura Ora
                </>
              )}
            </button>
            
            <button
              onClick={verificaStato}
              className="px-4 py-2 bg-white border border-yellow-300 text-yellow-700 text-sm font-medium rounded-lg hover:bg-yellow-50 transition-colors"
            >
              Ricontrolla
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
