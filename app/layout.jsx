'use client'
import React from 'react';
import '@styles/global.css';
import { SessionProvider } from "next-auth/react";
import Header from '@Components/header';
export const metadada = {
    title:"Wbarea",
    description:"La città del business"
}
const Rootlayout = ({children}) => {
  return (
    <html lang="it">
      
        <body>
          
              <div className='main'>
              
              <div className='gradient'/>
          
              </div>
             <SessionProvider>
              <main className="app w-full">
                  <Header></Header>
                  <div className='lg:h-40 sm:h-0'></div>
                  {children}
              
              </main>
              </SessionProvider>
        </body>
       
    </html>
  )
}

export default Rootlayout