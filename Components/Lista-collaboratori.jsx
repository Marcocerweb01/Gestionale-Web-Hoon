"use client";
import React, { useState } from "react";
import Link from "@node_modules/next/link";
import Lista_clienti from "./Lista-clienti";

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
    <div className="space-y-4">
      {/* Area Web Designers */}
      <div className="rounded p-3">
        <div className="flex justify-between items-center bg-gray-100 p-2 rounded">
          <h2 className="font-bold text-lg">
            Web Designer ({webDesigners.length})
          </h2>
          <button className="black_btn" onClick={toggleWeb}>
            {openWeb ? "Chiudi Lista" : "Apri Lista"}
          </button>
        </div>
        {/* Se aperto, mostra i web designer */}
        {openWeb && webDesigners.length > 0 && (
          <div className="mt-3 space-y-3">
            {webDesigners.map((collab) => (
              <CollaboratoreItem id={collab.id} nome={collab.nome} ruolo={collab.subRole} />
            ))}
          </div>
        )}
        {/* Nessun collaboratore */}
        {openWeb && webDesigners.length === 0 && (
          <p className="mt-3 text-gray-500 italic">
            Nessun collaboratore in questa categoria
          </p>
        )}
      </div>

      {/* Area Social Media Manager */}
      <div className=" rounded p-3">
        <div className="flex justify-between items-center bg-gray-100 p-2 rounded">
          <h2 className="font-bold text-lg">
            Social Media Manager ({smms.length})
          </h2>
          <button className="black_btn" onClick={toggleSmm}>
            {openSmm ? "Chiudi Lista" : "Apri Lista"}
          </button>
        </div>
        {openSmm && smms.length > 0 && (
          <div className="mt-3 space-y-3 w-full">
            {smms.map((collab) => (
              <CollaboratoreItem id={collab.id} nome={collab.nome} ruolo={collab.subRole} />
            ))}
          </div>
        )}
        {openSmm && smms.length === 0 && (
          <p className="mt-3 text-gray-500 italic">
            Nessun collaboratore in questa categoria
          </p>
        )}
      </div>

      {/* Area Commerciale */}
      <div className=" rounded p-3">
        <div className="flex justify-between items-center bg-gray-100 p-2 rounded">
          <h2 className="font-bold text-lg">
            Commerciale ({commercials.length})
          </h2>
          <button className="black_btn" onClick={toggleComm}>
            {openComm ? "Chiudi Lista" : "Apri Lista"}
          </button>
        </div>
        {openComm && commercials.length > 0 && (
          <div className="mt-3 space-y-3">
            {commercials.map((collab) => (
              <CollaboratoreItem id={collab.id} nome={collab.nome} ruolo={collab.subRole} />
            ))}
          </div>
        )}
        {openComm && commercials.length === 0 && (
          <p className="mt-3 text-gray-500 italic">
            Nessun collaboratore in questa categoria
          </p>
        )}
      </div>
    </div>
  );
};

/**
 * Singolo collaboratore. Riprende la logica di feed o toggle.
 * Al posto di "Lista_clienti", se serve, potresti passare "id".
 */
const CollaboratoreItem = ({ id, nome, ruolo }) => {
  // Mappa ruoli
  const displayRole =
    roleMap[ruolo] || ruolo.charAt(0).toUpperCase() + ruolo.slice(1);

  // Se vuoi replicare la logica di "Apri Lista" come facevi in precedenza
  const [isOpen, setIsOpen] = useState(false);
  const toggleAccordion = () => setIsOpen(!isOpen);

  return (
    <div className="p-4 rounded shadow flex bg-white">
      {/* Testo a sinistra */}
      <div className="flex-1 pr-2" style={{
    flex: "1 1 0%",    // flex-1 in Tailwind corrisponde a flex-grow: 1, flex-shrink: 1, flex-basis: 0%
    paddingRight: "0.5rem",  // pr-2 in Tailwind corrisponde a padding-right: 0.5rem
  }}>
        <Link href={`/User/${id}`}>
          <h2 className="subhead_text">{nome}</h2>
        </Link>
        <h3>
          <b>Ruolo:</b> {displayRole}
        </h3>
      </div>

      {/* Pulsante e (eventuale) lista clienti in verticale */}
      <div className="flex flex-col items-end gap-2"  style={{
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-end",
    gap: "0.5rem", // gap-2 corrisponde tipicamente a 0.5rem in Tailwind
  }}>
        {ruolo === "commerciale" ? (
          <Link href={`/Feed-comm/${id}?nome=${encodeURIComponent(nome)}`}>
            <button className="black_btn">Vai al Feed</button>
          </Link>
        ) : (
          <button className="black_btn" onClick={toggleAccordion}>
            {isOpen ? "Chiudi Lista" : "Apri Lista"}
          </button>
        )}

        {/* Se isOpen è true, appare SOTTO il pulsante */}
        {isOpen && (
          <div className="w-full border border-gray-300 p-2 bg-gray-50 rounded">
            <Lista_clienti id={id} amministratore={true} />
          </div>
        )}
      </div>
    </div>
  );
};

export default Lista_collaboratori;
