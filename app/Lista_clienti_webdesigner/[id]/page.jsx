'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Header from '@/Components/Header';
import ListaClientiWebDesigner from '@/Components/Lista-clienti-webdesigner';
import { Monitor, ArrowLeft, User } from 'lucide-react';

const ProgettiWebDesigner = () => {
  const params = useParams();
  const webDesignerId = params.id;
  const [designer, setDesigner] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDesignerInfo = async () => {
      try {
        const response = await fetch(`/api/users/${webDesignerId}`);
        if (!response.ok) {
          throw new Error('Errore nel recupero delle informazioni del designer');
        }
        const designerData = await response.json();
        setDesigner(designerData);
      } catch (error) {
        console.error('Errore:', error);
      } finally {
        setLoading(false);
      }
    };

    if (webDesignerId) {
      fetchDesignerInfo();
    }
  }, [webDesignerId]);

  if (loading) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
          <span className="ml-3 text-gray-600 text-lg">Caricamento...</span>
        </div>
      </>
    );
  }

  if (!designer) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Designer non trovato</h2>
            <Link href="/Lista_webdesigner" className="text-orange-600 hover:text-orange-800">
              Torna alla lista web designer
            </Link>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Breadcrumb */}
          <div className="mb-8">
            <Link href="/Lista_webdesigner" className="inline-flex items-center text-orange-600 hover:text-orange-800 mb-4 transition-colors">
              <ArrowLeft className="w-5 h-5 mr-2" />
              Torna alla lista Web Designer
            </Link>
            
            {/* Header della pagina */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center mr-4">
                    <User className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                      {designer.nome} {designer.cognome}
                    </h1>
                    <p className="text-orange-600 font-medium flex items-center mt-1">
                      <Monitor className="w-4 h-4 mr-2" />
                      Web Designer
                    </p>
                    {designer.email && (
                      <p className="text-sm text-gray-600 mt-1">📧 {designer.email}</p>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-500">Registrato</div>
                  <div className="text-sm font-medium text-gray-900">
                    {new Date(designer.createdAt).toLocaleDateString('it-IT')}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Progetti del designer */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <ListaClientiWebDesigner userId={webDesignerId} />
          </div>
        </div>
      </div>
    </>
  );
};

export default ProgettiWebDesigner;
