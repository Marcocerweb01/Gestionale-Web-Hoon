"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Download, RefreshCw } from "lucide-react";
import Link from "next/link";

const TabellaCollaborazioni = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [collaboratori, setCollaboratori] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Controllo autenticazione
  useEffect(() => {
    if (status === "loading") return;
    
    if (status === "unauthenticated") {
      router.push("/Login");
      return;
    }
    
    if (session?.user?.role !== "amministratore") {
      router.push("/unauthorized");
    }
  }, [session, status, router]);

  // Caricamento dati
  useEffect(() => {
    if (session?.user?.role === "amministratore") {
      fetchData();
    }
  }, [session]);

  // Ricarica automaticamente quando la finestra torna in focus
  useEffect(() => {
    const handleFocus = () => {
      if (session?.user?.role === "amministratore") {
        console.log("🔄 Finestra in focus - ricarico dati...");
        fetchData();
      }
    };

    window.addEventListener('focus', handleFocus);
    
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, [session]);

  const fetchData = async () => {
    try {
      setLoading(true);
      console.log("🔄 Caricamento tabella collaborazioni...");
      
      // Aggiungi timestamp per forzare no-cache
      const timestamp = new Date().getTime();
      const response = await fetch(`/api/tabella-collaborazioni?_=${timestamp}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Errore ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log("✅ Dati ricevuti:", data);

      // Filtriamo solo i Social Media Manager ed escludiamo "Hoon Web"
      const smmCollaboratori = data.filter(collaboratore => 
        collaboratore.subRole === 'smm' && 
        !(collaboratore.nome === 'Hoon' && collaboratore.cognome === 'Web')
      );
      
      setCollaboratori(smmCollaboratori);
      console.log("📱 SMM trovati:", smmCollaboratori.length);
      
    } catch (err) {
      console.error("❌ Errore:", err);
      setError(`Errore nel caricamento dei dati: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const esportaCsv = () => {
    // Creiamo le righe per CSV: una riga per ogni combinazione cliente-collaboratore
    const righeCSV = [];
    
    collaboratori.forEach(collaboratore => {
      if (collaboratore.collaborazioni && collaboratore.collaborazioni.length > 0) {
        collaboratore.collaborazioni.forEach(collaborazione => {
          righeCSV.push([
            `"${collaboratore.nome} ${collaboratore.cognome}"`,
            `"${collaboratore.email}"`,
            `"${collaboratore.subRole}"`,
            `"${collaborazione.aziendaNome}"`,
            `"${collaborazione.aziendaEmail}"`,
            collaborazione.numero_appuntamenti || 0,
            `"${collaborazione.post_ig_fb_fatti || 0}/${collaborazione.post_ig_fb || 0}"`,
            `"${collaborazione.post_tiktok_fatti || 0}/${collaborazione.post_tiktok || 0}"`,
            `"${collaborazione.post_linkedin_fatti || 0}/${collaborazione.post_linkedin || 0}"`,
            collaborazione.post_totali || 0,
            collaborazione.appuntamenti_totali || 0,
            `"${collaborazione.note || ''}"`
          ]);
        });
      } else {
        righeCSV.push([
          `"${collaboratore.nome} ${collaboratore.cognome}"`,
          `"${collaboratore.email}"`,
          `"${collaboratore.subRole}"`,
          `"Nessuna collaborazione"`,
          `"-"`,
          0,
          `"0/0"`,
          `"0/0"`,
          `"0/0"`,
          0,
          0,
          `""`
        ]);
      }
    });

    const headers = ["Collaboratore", "Email", "Ruolo", "Cliente", "Email Cliente", "Appuntamenti", "Post IG/FB", "Post TikTok", "Post LinkedIn", "Post Totali", "App. Totali", "Note"];
    const csvContent = [
      headers.join(","),
      ...righeCSV.map(row => row.join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = `tabella-collaborazioni-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  const getRoleColor = (subRole) => {
    switch (subRole) {
      case "web designer": return "bg-blue-100 text-blue-800";
      case "smm": return "bg-pink-100 text-pink-800";
      case "commerciale": return "bg-green-100 text-green-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getRoleIcon = (subRole) => {
    switch (subRole) {
      case "web designer": return "💻";
      case "smm": return "📱";
      case "commerciale": return "💼";
      default: return "👤";
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Caricamento tabella collaborazioni...</p>
        </div>
      </div>
    );
  }

  if (session?.user?.role !== "amministratore") {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-full mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center space-x-4">
              <Link 
                href="/"
                className="inline-flex items-center px-3 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Torna alla Dashboard
              </Link>
              <div className="hidden md:block w-px h-6 bg-gray-300"></div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-800">📱 Social Media Manager</h1>
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={fetchData}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 mr-2 inline ${loading ? 'animate-spin' : ''}`} />
                Aggiorna
              </button>
              <button
                onClick={esportaCsv}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
              >
                <Download className="w-4 h-4 mr-2 inline" />
                Esporta CSV
              </button>
            </div>
          </div>
          
          <p className="text-gray-600 mt-2 text-sm">
            Vista compatta dei Social Media Manager e i loro clienti
          </p>
        </div>

        {/* Statistiche Compatte SMM */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <div className="bg-pink-50 p-3 rounded-lg border border-pink-200">
            <div className="text-pink-600 text-xs font-medium">SMM Attivi</div>
            <div className="text-xl font-bold text-pink-700">{collaboratori.length}</div>
          </div>
          <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
            <div className="text-blue-600 text-xs font-medium">Clienti Totali</div>
            <div className="text-xl font-bold text-blue-700">
              {collaboratori.reduce((total, c) => total + c.collaborazioni.length, 0)}
            </div>
          </div>
          <div className="bg-green-50 p-3 rounded-lg border border-green-200">
            <div className="text-green-600 text-xs font-medium">Media per SMM</div>
            <div className="text-xl font-bold text-green-700">
              {collaboratori.length > 0 ? 
                Math.round(collaboratori.reduce((total, c) => total + c.collaborazioni.length, 0) / collaboratori.length) : 
                0
              }
            </div>
          </div>
          <div className="bg-purple-50 p-3 rounded-lg border border-purple-200">
            <div className="text-purple-600 text-xs font-medium">Top SMM</div>
            <div className="text-sm font-bold text-purple-700">
              {collaboratori.length > 0 ? 
                collaboratori.reduce((max, c) => c.collaborazioni.length > max.collaborazioni.length ? c : max, collaboratori[0])?.nome || '-' :
                '-'
              }
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <span className="text-red-500 text-xl mr-2">⚠️</span>
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        )}

        {/* Tabella Compatta Solo SMM */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <div className="flex min-w-full">
              {collaboratori.length === 0 ? (
                <div className="w-full p-8 text-center text-gray-500">
                  Nessun Social Media Manager disponibile
                </div>
              ) : (
                collaboratori.map((collaboratore, index) => (
                  <div 
                    key={collaboratore.id} 
                    className={`flex-shrink-0 w-44 border-r border-gray-200 ${index === collaboratori.length - 1 ? 'border-r-0' : ''}`}
                  >
                    {/* Header SMM - Compatto */}
                    <div className="bg-pink-50 p-2 border-b border-gray-200 sticky top-0 z-10">
                      <div className="text-center space-y-1">
                        <div className="text-lg">📱</div>
                        <div className="font-bold text-gray-900 text-xs leading-tight">
                          {collaboratore.nome} {collaboratore.cognome}
                        </div>
                        <div className="text-xs text-pink-600 font-semibold">
                          {collaboratore.collaborazioni.length} clienti
                        </div>
                      </div>
                    </div>

                    {/* Lista Clienti - Con Post Totali */}
                    <div className="min-h-[300px]">
                      {collaboratore.collaborazioni.length === 0 ? (
                        <div className="p-4 text-center text-gray-400">
                          <div className="text-2xl mb-1">📭</div>
                          <div className="text-xs">Nessun cliente</div>
                        </div>
                      ) : (
                        <div className="p-1">
                          {collaboratore.collaborazioni.map((collaborazione, collabIndex) => (
                            <div 
                              key={collaborazione.id} 
                              className={`p-2 border-b border-gray-100 hover:bg-pink-50 transition-colors ${
                                collabIndex % 2 === 0 ? 'bg-gray-50' : 'bg-white'
                              }`}
                            >
                              {/* Nome Cliente */}
                              <div className="font-medium text-gray-900 text-xs text-center leading-tight mb-2">
                                {collaborazione.aziendaNome}
                              </div>
                              
                              {/* Totali Generali (non si azzerano) */}
                              <div className="bg-purple-50 rounded p-1.5 mb-1">
                                <div className="text-[10px] text-purple-600 font-semibold text-center mb-1">📊 TOTALI</div>
                                <div className="grid grid-cols-2 gap-1 text-center">
                                  <div>
                                    <div className="text-[9px] text-gray-500">Post</div>
                                    <div className="text-xs font-bold text-purple-700">{collaborazione.post_totali || 0}</div>
                                  </div>
                                  <div>
                                    <div className="text-[9px] text-gray-500">App.</div>
                                    <div className="text-xs font-bold text-purple-700">{collaborazione.appuntamenti_totali || 0}</div>
                                  </div>
                                </div>
                              </div>
                              
                              {/* Post Mensili */}
                              <div className="grid grid-cols-3 gap-0.5 text-center text-[9px]">
                                <div className="bg-pink-100 rounded px-1 py-0.5">
                                  <div className="text-pink-600">IG/FB</div>
                                  <div className="font-bold">{collaborazione.post_ig_fb_fatti}/{collaborazione.post_ig_fb}</div>
                                </div>
                                <div className="bg-gray-200 rounded px-1 py-0.5">
                                  <div className="text-gray-600">TikTok</div>
                                  <div className="font-bold">{collaborazione.post_tiktok_fatti}/{collaborazione.post_tiktok}</div>
                                </div>
                                <div className="bg-blue-100 rounded px-1 py-0.5">
                                  <div className="text-blue-600">LinkedIn</div>
                                  <div className="font-bold">{collaborazione.post_linkedin_fatti}/{collaborazione.post_linkedin}</div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
          
          {/* Footer Compatto */}
          <div className="p-2 bg-pink-50 border-t border-gray-200 text-center text-xs text-gray-600">
            💡 Scroll orizzontale per vedere tutti i Social Media Manager
          </div>
        </div>

        {/* Footer con statistiche */}
        {collaboratori.length > 0 && (
          <div className="mt-6 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-600">{collaboratori.length}</div>
                <div className="text-sm text-gray-600">Collaboratori Totali</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {collaboratori.reduce((acc, c) => acc + c.collaborazioni.length, 0)}
                </div>
                <div className="text-sm text-gray-600">Collaborazioni Attive</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-600">
                  {collaboratori.filter(c => c.subRole === "smm").length}
                </div>
                <div className="text-sm text-gray-600">Social Media Manager</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-orange-600">
                  {(() => {
                    // Contiamo tutti i clienti unici
                    const clientiUnici = new Set();
                    collaboratori.forEach(collaboratore => {
                      collaboratore.collaborazioni.forEach(collaborazione => {
                        clientiUnici.add(collaborazione.aziendaNome);
                      });
                    });
                    return clientiUnici.size;
                  })()}
                </div>
                <div className="text-sm text-gray-600">Clienti Unici</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TabellaCollaborazioni;