import React from 'react';
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
      <body className="min-h-screen bg-gray-50">
        <div className='main'>
          <div className='gradient'/>
        </div>
        
        <Providers>
          <div className="relative z-10 min-h-screen">
            <Header />
            
            {/* Main content with proper spacing from fixed header */}
            <main className="pt-16">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {children}
              </div>
            </main>
          </div>
        </Providers>
      </body>
    </html>
  )
}

export default Rootlayout