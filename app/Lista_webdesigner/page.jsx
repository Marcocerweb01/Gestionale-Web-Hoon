'use client';

import React, { useEffect, useState } from 'react';
import { useSession } from "next-auth/react";
import Link from 'next/link';
import Header from '@/Components/Header';
import { Monitor, User, Calendar, ExternalLink, ArrowLeft } from 'lucide-react';

const ListaWebDesigner = () => {
  const [webDesigners, setWebDesigners] = useState([]);
  const [loading, setLoading] = useState(true);
  const { data: session } = useSession();

  useEffect(() => {
    const fetchWebDesigners = async () => {
      try {
        const response = await fetch('/api/lista_collaboratori');
        if (!response.ok) {
          throw new Error('Errore nel recupero dei web designer');
        }
        const collaboratori = await response.json();
        
        // Filtra solo i web designer
        const webDesignersOnly = collaboratori.filter(
          collab => collab.subrole === 'webdesigner'
        );
        
        setWebDesigners(webDesignersOnly);
      } catch (error) {
        console.error('Errore:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchWebDesigners();
  }, []);

  if (loading) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          <span className="ml-3 text-gray-600 text-lg">Caricamento web designer...</span>
        </div>
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Header della pagina */}
          <div className="mb-8">
            <Link href="/" className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4 transition-colors">
              <ArrowLeft className="w-5 h-5 mr-2" />
              Torna alla Dashboard
            </Link>
            
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                    <Monitor className="w-8 h-8 mr-3 text-orange-600" />
                    Web Designer
                  </h1>
                  <p className="text-gray-600 mt-2">Gestisci i progetti e i clienti dei web designer</p>
                </div>
                <div className="bg-orange-100 text-orange-800 text-sm font-medium px-4 py-2 rounded-full">
                  {webDesigners.length} {webDesigners.length === 1 ? 'designer' : 'designer'}
                </div>
              </div>
            </div>
          </div>

          {webDesigners.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
              <Monitor className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">Nessun Web Designer</h3>
              <p className="text-gray-500">Non ci sono web designer registrati nel sistema.</p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {webDesigners.map((designer) => (
                <div key={designer._id} className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                  <div className="p-6">
                    <div className="flex items-center mb-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center">
                        <User className="w-6 h-6 text-white" />
                      </div>
                      <div className="ml-4">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {designer.nome} {designer.cognome}
                        </h3>
                        <p className="text-sm text-orange-600 font-medium">Web Designer</p>
                      </div>
                    </div>

                    <div className="space-y-2 mb-6">
                      <div className="flex items-center text-sm text-gray-600">
                        <Calendar className="w-4 h-4 mr-2" />
                        Registrato: {new Date(designer.createdAt).toLocaleDateString('it-IT')}
                      </div>
                      {designer.email && (
                        <div className="text-sm text-gray-600">
                          📧 {designer.email}
                        </div>
                      )}
                    </div>

                    <Link 
                      href={`/Lista_clienti_webdesigner/${designer._id}`}
                      className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors duration-200 group"
                    >
                      <Monitor className="w-5 h-5 group-hover:scale-110 transition-transform" />
                      <span className="font-medium">Vedi Progetti</span>
                      <ExternalLink className="w-4 h-4 opacity-75" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default ListaWebDesigner;
