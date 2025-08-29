"use client";

import React from "react";
import { useSearchParams } from "next/navigation";
import FeedCommerciale from "@Components/feed-commerciale";

const FeedCollaborazione = ({params}) => {
  const searchParams = useSearchParams();
  console.log(searchParams)
  const nome = searchParams.get("nome");
  const { collaboratoreId } = params
  console.log(collaboratoreId)
  
  if (!collaboratoreId || !nome) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center p-6">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Errore</h2>
          <p className="text-gray-600">ID collaboratore o Nome non forniti.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header fisso mobile-friendly */}
      <div className="bg-white shadow-sm border-b px-4 py-3 sm:px-6 flex-shrink-0">
        <div className="flex items-center justify-between">
          <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 truncate">
            💼 {nome}
          </h1>
          <div className="text-sm text-gray-500 hidden sm:block">
            Feed Commerciale
          </div>
        </div>
      </div>
      
      {/* Content area che occupa il resto dello spazio */}
      <div className="flex-1 overflow-hidden">
        <FeedCommerciale id={collaboratoreId} />
      </div>
    </div>
  );
};

export default FeedCollaborazione;
