import React, { Suspense } from 'react';
import '@styles/global.css';
import { Providers } from './providers';
import Header from '@Components/Header';

export const metadata = {
    title:"Webarea",
    description:"La città del business"
}

const Rootlayout = ({children}) => {
  return (
    <html lang="it">
      <body className="min-h-screen bg-gray-50" suppressHydrationWarning>
        <div className='main'>
          <div className='gradient'/>
        </div>
        
        <Providers>
          <div className="relative z-10 min-h-screen">
            <Suspense fallback={<div className="h-16 bg-white border-b border-gray-200" />}>
              <Header />
            </Suspense>
            
            {/* Main content with proper spacing from fixed header */}
            <main className="pt-16">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {children}
              </div>
            </main>

            {/* Footer WhatsApp Admin */}
            <footer className="bg-slate-900 border-t border-slate-700 py-4 px-4">
              <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-3 text-center sm:text-left">
                  <span className="text-xl">🐞</span>
                  <div>
                    <p className="text-white font-semibold text-sm leading-tight">Hai notato qualche problema?</p>
                    <p className="text-slate-400 text-xs">Segnalalo all&apos;admin e lo risolviamo subito.</p>
                  </div>
                </div>
                <a
                  href="https://wa.me/393715820785"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-green-500 hover:bg-green-400 active:bg-green-600 text-white text-sm font-semibold rounded-xl shadow-md transition-all duration-200 whitespace-nowrap"
                >
                  <span className="text-base">💬</span>
                  Contatta l&apos;Admin
                </a>
              </div>
            </footer>
          </div>
        </Providers>
      </body>
    </html>
  )
}

export default Rootlayout