"use client";

import React from "react";
import { useSearchParams } from "next/navigation"; // Importa useSearchParams
import FeedCommerciale from "@Components/feed-commerciale";

const FeedCollaborazione = ({params}) => {
  const searchParams = useSearchParams();
  console.log(searchParams) // Recupera 'id' dai query param
  const nome = searchParams.get("nome"); // Recupera 'nome' dai query param
  const { collaboratoreId } = params
  console.log(collaboratoreId)
  if (!collaboratoreId || !nome) {
    return <div>Errore: ID o Nome non forniti.</div>;
  }

  return (
    <div className="w-full h-4/5 bg-slate-50 shadow-md rounded-lg mt-3 p-14 sm:p-2">
      <h1 className="text-2xl font-bold">{nome}</h1>
      <FeedCommerciale id={collaboratoreId} className="fixed"/>
    </div>
  );
};

export default FeedCollaborazione;
