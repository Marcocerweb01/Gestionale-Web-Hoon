"use client"
import React from 'react'
import Lista_clienti from './Lista-clienti'
import {  useState } from 'react'
import Link from '@node_modules/next/link'

const Lista_collaboratori = ({nome, ruolo, id}) => {
  const [isOpen, setIsOpen] = useState(false);
 

  const toggleAccordion = () => {
    setIsOpen(!isOpen);
  };


 
  return (
    <div className="p-4 border-b-1">
      {/* Header con nome e ruolo */}
      <div className="flex">
        <div className="w-5/6">
          <Link href={`/User/${id}`}>
            <h2 className="subhead_text">{nome}</h2>
          </Link>
          <h3>
            <b>Ruolo:</b> {ruolo}
          </h3>
        </div>
  
        {/* Pulsante per Feed o Lista Clienti */}
        <div className="w-2/6 flex justify-end items-center">
          {ruolo === "commerciale" ? (
            <Link href={`/Feed-comm/${id}?nome=${encodeURIComponent(nome)}`}>
              <button className="black_btn">Vai al Feed</button>
            </Link>
          ) : (
            <button className="black_btn" onClick={toggleAccordion}>
              {isOpen ? "Chiudi Lista Clienti" : "Apri Lista Clienti"}
            </button>
          )}
        </div>
      </div>
  
      {/* Lista Clienti condizionale */}
      {isOpen && <Lista_clienti id={id} amministratore={true} />}
    </div>
  )};

export default Lista_collaboratori