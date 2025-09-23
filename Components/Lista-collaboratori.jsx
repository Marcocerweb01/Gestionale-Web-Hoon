"use client";
import React, { useState } from "react";
import Link from "@node_modules/next/link";
import Lista_clienti from "./Lista-clienti";
import ListaClientiWebDesigner from "./Lista-clienti-webdesigner";

// Se serve una mappa per modificare l'etichetta dei ruoli
const roleMap = {
  "web designer": "Web Designer",
  smm: "Social Media Manager",
  commerciale: "Commerciale",
};

const Lista_collaboratori = ({ collaboratori }) => {
  // Stato per tracciare l'apertura delle tre aree
  console.log(collaboratori)
  const [openWeb, setOpenWeb] = useState(false);
  const [openSmm, setOpenSmm] = useState(false);
  const [openComm, setOpenComm] = useState(false);

  // Filtra i collaboratori in base al ruolo
  const webDesigners = collaboratori.filter((c) => c.subRole === "web designer");
  const smms = collaboratori.filter((c) => c.subRole === "smm");
  const commercials = collaboratori.filter((c) => c.subRole === "commerciale");

  // Funzioni per togglare l'apertura/chiusura di ciascuna sezione
  const toggleWeb = () => setOpenWeb((prev) => !prev);
  const toggleSmm = () => setOpenSmm((prev) => !prev);
  const toggleComm = () => setOpenComm((prev) => !prev);

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
                ruolo={collab.subRole}
                status={collab.status}
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
                ruolo={collab.subRole}
                status={collab.status}
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
                ruolo={collab.subRole}
                status={collab.status}
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
const CollaboratoreItem = ({ id, nome, ruolo, status = "attivo" }) => {
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

  // Se vuoi replicare la logica di "Apri Lista" come facevi in precedenza
  const [isOpen, setIsOpen] = useState(false);
  const toggleAccordion = () => setIsOpen(!isOpen);

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
          </div>

          <div className="flex flex-col gap-2 ml-4">
            {ruolo === "commerciale" ? (
              <Link href={`/Feed-comm/${id}?nome=${encodeURIComponent(nome)}`}>
                <button className="inline-flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors">
                  📊 Vai al Feed
                </button>
              </Link>
            ) : (
              <button 
                className="inline-flex items-center px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition-colors"
                onClick={toggleAccordion}
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
            <h4 className="text-sm font-medium text-gray-700 mb-3">Lista Clienti</h4>
            {ruolo === "web designer" ? (
              <ListaClientiWebDesigner userId={id} showWebDesignerLink={true} />
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
