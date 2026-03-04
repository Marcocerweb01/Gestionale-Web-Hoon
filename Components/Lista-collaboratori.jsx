"use client";
import React, { useState, useEffect, useCallback } from "react";
import Link from "@node_modules/next/link";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import Lista_clienti from "./Lista-clienti";
import ListaClientiWebDesigner from "./Lista-clienti-webdesigner";
import ListaGoogleAdsCollaboratore from "./ListaGoogleAdsCollaboratore";

// Se serve una mappa per modificare l'etichetta dei ruoli
const roleMap = {
  "web designer": "Web Designer",
  smm: "Social Media Manager",
  commerciale: "Commerciale",
  seo: "SEO",
  "google ads": "Google ADS",
  "meta ads": "Meta ADS",
};

const Lista_collaboratori = ({ collaboratori }) => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  
  // Leggi lo stato iniziale dai query params
  const getInitialState = useCallback((param) => {
    return searchParams.get(param) === "true";
  }, [searchParams]);
  
  const getOpenLists = useCallback(() => {
    const openParam = searchParams.get("openLists");
    return openParam ? openParam.split(",") : [];
  }, [searchParams]);

  // Stato per tracciare l'apertura delle aree
  console.log(collaboratori)
  const [openWeb, setOpenWeb] = useState(() => getInitialState("web"));
  const [openSmm, setOpenSmm] = useState(() => getInitialState("smm"));
  const [openComm, setOpenComm] = useState(() => getInitialState("comm"));
  const [openMarketing, setOpenMarketing] = useState(() => getInitialState("marketing"));
  const [openSeo, setOpenSeo] = useState(() => getInitialState("seo"));
  const [openGoogleAds, setOpenGoogleAds] = useState(() => getInitialState("googleads"));
  const [openMetaAds, setOpenMetaAds] = useState(() => getInitialState("metaads"));
  const [openLists, setOpenLists] = useState(() => getOpenLists());

  // ✨ useEffect per aggiornare l'URL quando cambia lo stato
  useEffect(() => {
    const params = new URLSearchParams();
    
    // Aggiorna i parametri delle sezioni
    if (openWeb) params.set("web", "true");
    if (openSmm) params.set("smm", "true");
    if (openComm) params.set("comm", "true");
    if (openMarketing) params.set("marketing", "true");
    if (openSeo) params.set("seo", "true");
    if (openGoogleAds) params.set("googleads", "true");
    if (openMetaAds) params.set("metaads", "true");
    
    // Aggiorna le liste aperte dei singoli collaboratori
    if (openLists.length > 0) {
      params.set("openLists", openLists.join(","));
    }
    
    const newUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname;
    router.replace(newUrl, { scroll: false });
  }, [openWeb, openSmm, openComm, openMarketing, openSeo, openGoogleAds, openMetaAds, openLists, pathname, router]);

  // Funzione helper per verificare se un collaboratore ha un determinato ruolo
  const hasRole = (collaboratore, role) => {
    // Supporta sia subRoles (array) che subRole (stringa) per retrocompatibilità
    if (collaboratore.subRoles && Array.isArray(collaboratore.subRoles)) {
      return collaboratore.subRoles.includes(role);
    }
    return collaboratore.subRole === role;
  };

  // Funzione helper per ottenere i ruoli da visualizzare
  const getRuoliDisplay = (collaboratore) => {
    if (collaboratore.subRoles && Array.isArray(collaboratore.subRoles)) {
      return collaboratore.subRoles.join(", ");
    }
    return collaboratore.subRole || "";
  };

  // Filtra i collaboratori in base al ruolo E allo status attivo
  const webDesigners = collaboratori.filter((c) => hasRole(c, "web designer") && c.status === "attivo");
  const smms = collaboratori.filter((c) => hasRole(c, "smm") && c.status === "attivo");
  const commercials = collaboratori.filter((c) => hasRole(c, "commerciale") && c.status === "attivo");
  const seos = collaboratori.filter((c) => hasRole(c, "seo") && c.status === "attivo");
  const googleAds = collaboratori.filter((c) => hasRole(c, "google ads") && c.status === "attivo");
  const metaAds = collaboratori.filter((c) => hasRole(c, "meta ads") && c.status === "attivo");

  // Funzioni per togglare l'apertura/chiusura di ciascuna sezione
  const toggleWeb = () => {
    setOpenWeb(prev => !prev);
  };
  
  const toggleSmm = () => {
    setOpenSmm(prev => !prev);
  };
  
  const toggleComm = () => {
    setOpenComm(prev => !prev);
  };
  
  const toggleMarketing = () => {
    setOpenMarketing(prev => !prev);
  };
  
  const toggleSeo = () => {
    setOpenSeo(prev => !prev);
  };
  
  const toggleGoogleAds = () => {
    setOpenGoogleAds(prev => !prev);
  };
  
  const toggleMetaAds = () => {
    setOpenMetaAds(prev => !prev);
  };

  // Funzione per togglare la lista di un singolo collaboratore
  const toggleCollaboratorList = useCallback((collabId) => {
    setOpenLists(prev => {
      return prev.includes(collabId) 
        ? prev.filter(id => id !== collabId)
        : [...prev, collabId];
    });
  }, []);

  // Verifica se una lista è aperta
  const isListOpen = useCallback((collabId) => {
    return openLists.includes(collabId);
  }, [openLists]);

  return (
    <div className="space-y-6 p-4">
      {/* Area Web Designers */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200 p-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-900 cursor-pointer" onClick={toggleWeb}>
              💻 Web Designer ({webDesigners.length})
            </h2>
            <button 
              className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
              onClick={toggleWeb}
            >
              {openWeb ? "Chiudi Lista" : "Apri Lista"}
            </button>
          </div>
        </div>
        {openWeb && webDesigners.length > 0 && (
          <div className="p-4 space-y-4">
            {webDesigners.map((collab) => (
              <CollaboratoreItem 
                key={collab.id} 
                id={collab.id} 
                nome={collab.nome + " " + collab.cognome} 
                ruolo={getRuoliDisplay(collab)}
                status={collab.status}
                noteAmministratore={collab.noteAmministratore}
                isOpen={isListOpen(collab.id)}
                onToggle={() => toggleCollaboratorList(collab.id)}
              />
            ))}
          </div>
        )}
        {openWeb && webDesigners.length === 0 && (
          <div className="p-6 text-center">
            <p className="text-gray-500 italic">Nessun collaboratore in questa categoria</p>
          </div>
        )}
      </div>

      {/* Area Social Media Manager */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-pink-50 to-rose-50 border-b border-gray-200 p-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-900 cursor-pointer" onClick={toggleSmm}>
              📱 Social Media Manager ({smms.length})
            </h2>
            <button 
              className="inline-flex items-center px-4 py-2 bg-pink-600 hover:bg-pink-700 text-white text-sm font-medium rounded-lg transition-colors"
              onClick={toggleSmm}
            >
              {openSmm ? "Chiudi Lista" : "Apri Lista"}
            </button>
          </div>
        </div>
        {openSmm && smms.length > 0 && (
          <div className="p-4 space-y-4">
            {smms.map((collab) => (
              <CollaboratoreItem 
                key={collab.id} 
                id={collab.id} 
                nome={collab.nome + " " + collab.cognome} 
                ruolo={getRuoliDisplay(collab)}
                status={collab.status}
                noteAmministratore={collab.noteAmministratore}
                isOpen={isListOpen(collab.id)}
                onToggle={() => toggleCollaboratorList(collab.id)}
              />
            ))}
          </div>
        )}
        {openSmm && smms.length === 0 && (
          <div className="p-6 text-center">
            <p className="text-gray-500 italic">Nessun collaboratore in questa categoria</p>
          </div>
        )}
      </div>

      {/* Area Marketing - Contiene SEO, Google ADS, Meta ADS */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 border-b border-gray-200 p-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-900 cursor-pointer" onClick={toggleMarketing}>
              📊 Marketing ({seos.length + googleAds.length + metaAds.length})
            </h2>
            <button 
              className="inline-flex items-center px-4 py-2 bg-pink-600 hover:bg-pink-700 text-white text-sm font-medium rounded-lg transition-colors"
              onClick={toggleMarketing}
            >
              {openMarketing ? "Chiudi Lista" : "Apri Lista"}
            </button>
          </div>
        </div>
        {openMarketing && (
          <div className="p-4 space-y-4">
            {/* Google ADS */}
            <div className="bg-orange-50 rounded-lg border border-orange-200 overflow-hidden">
              <div className="p-3 flex justify-between items-center cursor-pointer hover:bg-orange-100 transition-colors" onClick={toggleGoogleAds}>
                <h3 className="text-lg font-semibold text-orange-900 flex items-center">
                  🎯 Google ADS ({googleAds.length})
                </h3>
                <button className="text-orange-700 font-medium text-sm px-3 py-1 rounded hover:bg-orange-200 transition-colors">
                  {openGoogleAds ? "▲ Chiudi" : "▼ Apri"}
                </button>
              </div>
              {openGoogleAds && (
                <div className="p-3 bg-white border-t border-orange-200">
                  {googleAds.length > 0 ? (
                    <div className="space-y-3">
                      {googleAds.map((collab) => (
                        <CollaboratoreItem 
                          key={collab.id} 
                          id={collab.id} 
                          nome={collab.nome + " " + collab.cognome} 
                          ruolo={getRuoliDisplay(collab)}
                          status={collab.status}
                          noteAmministratore={collab.noteAmministratore}
                          isOpen={isListOpen(collab.id)}
                          onToggle={() => toggleCollaboratorList(collab.id)}
                        />
                      ))}
                    </div>
                  ) : (
                    <p className="text-orange-600 text-sm italic">Nessun collaboratore Google ADS</p>
                  )}
                </div>
              )}
            </div>

            {/* Meta ADS */}
            <div className="bg-sky-50 rounded-lg border border-sky-200 overflow-hidden">
              <div className="p-3 flex justify-between items-center cursor-pointer hover:bg-sky-100 transition-colors" onClick={toggleMetaAds}>
                <h3 className="text-lg font-semibold text-sky-900 flex items-center">
                  📢 Meta ADS ({metaAds.length})
                </h3>
                <button className="text-sky-700 font-medium text-sm px-3 py-1 rounded hover:bg-sky-200 transition-colors">
                  {openMetaAds ? "▲ Chiudi" : "▼ Apri"}
                </button>
              </div>
              {openMetaAds && (
                <div className="p-3 bg-white border-t border-sky-200">
                  {metaAds.length > 0 ? (
                    <div className="space-y-3">
                      {metaAds.map((collab) => (
                        <CollaboratoreItem 
                          key={collab.id} 
                          id={collab.id} 
                          nome={collab.nome + " " + collab.cognome} 
                          ruolo={getRuoliDisplay(collab)}
                          status={collab.status}
                          noteAmministratore={collab.noteAmministratore}
                          isOpen={isListOpen(collab.id)}
                          onToggle={() => toggleCollaboratorList(collab.id)}
                        />
                      ))}
                    </div>
                  ) : (
                    <p className="text-sky-600 text-sm italic">Nessun collaboratore Meta ADS</p>
                  )}
                </div>
              )}
            </div>

            {/* SEO */}
            <div className="bg-purple-50 rounded-lg border border-purple-200 overflow-hidden">
              <div className="p-3 flex justify-between items-center cursor-pointer hover:bg-purple-100 transition-colors" onClick={toggleSeo}>
                <h3 className="text-lg font-semibold text-purple-900 flex items-center">
                  🔍 SEO ({seos.length})
                </h3>
                <button className="text-purple-700 font-medium text-sm px-3 py-1 rounded hover:bg-purple-200 transition-colors">
                  {openSeo ? "▲ Chiudi" : "▼ Apri"}
                </button>
              </div>
              {openSeo && (
                <div className="p-3 bg-white border-t border-purple-200">
                  {seos.length > 0 ? (
                    <div className="space-y-3">
                      {seos.map((collab) => (
                        <CollaboratoreItem 
                          key={collab.id} 
                          id={collab.id} 
                          nome={collab.nome + " " + collab.cognome} 
                          ruolo={getRuoliDisplay(collab)}
                          status={collab.status}
                          noteAmministratore={collab.noteAmministratore}
                          isOpen={isListOpen(collab.id)}
                          onToggle={() => toggleCollaboratorList(collab.id)}
                        />
                      ))}
                    </div>
                  ) : (
                    <p className="text-purple-600 text-sm italic">Nessun collaboratore SEO</p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Area Commerciale */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-b border-gray-200 p-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-900 cursor-pointer" onClick={toggleComm}>
              💼 Commerciale ({commercials.length})
            </h2>
            <button 
              className="inline-flex items-center px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg transition-colors"
              onClick={toggleComm}
            >
              {openComm ? "Chiudi Lista" : "Apri Lista"}
            </button>
          </div>
        </div>
        {openComm && commercials.length > 0 && (
          <div className="p-4 space-y-4">
            {commercials.map((collab) => (
              <CollaboratoreItem 
                key={collab.id} 
                id={collab.id} 
                nome={collab.nome + " " + collab.cognome} 
                ruolo={getRuoliDisplay(collab)}
                status={collab.status}
                noteAmministratore={collab.noteAmministratore}
                isOpen={isListOpen(collab.id)}
                onToggle={() => toggleCollaboratorList(collab.id)}
              />
            ))}
          </div>
        )}
        {openComm && commercials.length === 0 && (
          <div className="p-6 text-center">
            <p className="text-gray-500 italic">Nessun collaboratore in questa categoria</p>
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Singolo collaboratore. Riprende la logica di feed o toggle.
 * Al posto di "Lista_clienti", se serve, potresti passare "id".
 */
const CollaboratoreItem = ({ id, nome, ruolo, status = "attivo", noteAmministratore = "", isOpen = false, onToggle }) => {
  // Mappa ruoli
  const displayRole =
    roleMap[ruolo] || ruolo.charAt(0).toUpperCase() + ruolo.slice(1);

  // Status display
  const statusConfig = {
    attivo: { 
      icon: "🟢", 
      text: "Attivo", 
      bgColor: "bg-green-50", 
      textColor: "text-green-700",
      borderColor: "border-green-200"
    },
    non_attivo: { 
      icon: "🔴", 
      text: "Non Attivo", 
      bgColor: "bg-red-50", 
      textColor: "text-red-700",
      borderColor: "border-red-200"
    }
  };

  const currentStatus = statusConfig[status] || statusConfig.attivo;

  return (
    <div className={`bg-white rounded-lg border shadow-sm overflow-hidden ${currentStatus.borderColor}`}>
      {/* Header del collaboratore */}
      <div className={`p-4 border-b border-gray-200 ${currentStatus.bgColor}`}>
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <Link href={`/User/${id}`} className="block">
              <h3 className="text-lg font-semibold text-gray-900 hover:text-primary transition-colors">
                {nome}
              </h3>
            </Link>
            <div className="flex items-center gap-4 mt-2">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {displayRole}
              </span>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${currentStatus.bgColor} ${currentStatus.textColor}`}>
                {currentStatus.icon} {currentStatus.text}
              </span>
            </div>
            {/* ✨ Note Amministratore */}
            {noteAmministratore && (
              <div className="mt-3 p-2 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <span className="text-xs flex-shrink-0 mt-0.5">📝</span>
                  <p className="text-xs text-gray-700 leading-relaxed whitespace-pre-wrap break-words">
                    {noteAmministratore}
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2 ml-4">
            {/* Bottone Modifica - sempre visibile per admin */}
            <Link href={`/User/${id}`}>
              <button className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors w-full">
                ✏️ Modifica
              </button>
            </Link>
            
            {ruolo.toLowerCase().includes("commerciale") ? (
              <Link href={`/Lead-comm/${id}?nome=${encodeURIComponent(nome)}`}>
                <button className="inline-flex items-center px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition-colors w-full">
                  🎯 Feed Lead
                </button>
              </Link>
            ) : (
              <button 
                className="inline-flex items-center px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition-colors w-full"
                onClick={onToggle}
              >
                {isOpen ? "📁 Chiudi Lista" : "📂 Apri Lista"}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Lista clienti che si apre sotto */}
      {isOpen && (
        <div className="border-t border-gray-200 bg-gray-50">
          <div className="p-4">
            <h4 className="text-sm font-medium text-gray-700 mb-3">
              {ruolo.toLowerCase().includes("google ads") 
                ? "Collaborazioni Google ADS"
                : ruolo.toLowerCase().includes("seo")
                ? "Collaborazioni SEO"
                : ruolo.toLowerCase().includes("meta ads")
                ? "Collaborazioni Meta ADS"
                : "Lista Clienti"}
            </h4>
            {ruolo === "web designer" ? (
              <ListaClientiWebDesigner userId={id} showWebDesignerLink={true} />
            ) : ruolo.toLowerCase().includes("google ads") ? (
              <ListaGoogleAdsCollaboratore collaboratoreId={id} />
            ) : ruolo.toLowerCase().includes("seo") ? (
              <p className="text-gray-500 text-sm italic">Componente SEO in arrivo...</p>
            ) : ruolo.toLowerCase().includes("meta ads") ? (
              <p className="text-gray-500 text-sm italic">Componente Meta ADS in arrivo...</p>
            ) : (
              <Lista_clienti id={id} amministratore={true} />
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Lista_collaboratori;
