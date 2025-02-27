'use client';

import React, { useEffect, useState } from 'react';
import ListaCollaboratori from './Lista-collaboratori';
import ListaClienti from './Lista-clienti';
import { useSession } from "next-auth/react";
import Link from '@node_modules/next/link';
import FeedCommerciale from './feed-commerciale';

const Dashboard = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { data: session, status } = useSession();

  // Funzione per recuperare la lista dei collaboratori
  const fetchCollaboratori = async () => {
    try {
      const response = await fetch(`/api/lista_collaboratori`);
      if (!response.ok) {
        throw new Error("Errore nel recupero dei collaboratori");
      }
      const result = await response.json();
      setData(result);
    } catch (err) {
      console.error("Errore:", err);
      setError("Non è stato possibile recuperare i dati dei collaboratori.");
    } finally {
      setLoading(false);
    }
  };
    // Funzione per avviare il download
    const downloadxlsx = async () => {
      try {
        const response = await fetch(`/api/export_data`);
        if (!response.ok) {
          throw new Error("download avviato");
        } 
      } catch (err) {
        console.error("Errore:", err);
        setError("Non è stato possibile effettuare il download.");
      }
    };
  // Effetto per chiamare l'API al caricamento se amministratore
  useEffect(() => {
    if (status === "authenticated" && session?.user?.role === "amministratore") {
      fetchCollaboratori();
    } else {
      setLoading(false); // Termina il caricamento per utenti non amministratori
    }
  }, [status, session]);

  if (loading || status === "loading") {
    return <div>Caricamento in corso...</div>;
  }

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  return (
            
    
    <div className="w-full h-full bg-slate-50 shadow-md rounded-lg mt-10 px-2 lg:px-6">
      <h1 className='head_text p-5'>Ciao {session?.user?.nome}</h1>
      

      <div className="flex space-x-5"> 
        {session?.user?.role === "amministratore" ? (
          <div className='flex space-x-5 ' style={{display:'flex', 	marginLeft: '1.25rem' }}>
          <Link href="/AddCollab"> <button className="black_btn">Crea Collaborazione</button></Link> 
          <Link href="/Register"> <button className="black_btn" style={{marginLeft:'1.25rem',marginRight:'1.25rem'}}>Registra utente</button></Link>
          <Link href="/Lista_clienti"> <button className="black_btn">Lista Clienti</button></Link> 
          <button className="black_btn" onClick={downloadxlsx}>Download Dati</button> </div> ):(<></>)}

      </div>
      <div className=" mt-10 sm:mt-5">
        {/* Verifica del ruolo dell'utente */}
        {session?.user?.role === "amministratore" ? (
          // Mostra collaboratori se amministratore
      
            <ListaCollaboratori
              collaboratori={data}
            />
        
        ) : session?.user?.subrole === "commerciale" ? (
          <FeedCommerciale id={session?.user.id} />
        
        ):(
          <ListaClienti id={session?.user.id} amministratore={false} />
        )}
         
      </div>
      
    </div>
  );
};

export default Dashboard;
