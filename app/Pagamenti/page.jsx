import PagamentiTable from '@Components/PagamentiTable'
import React from 'react'

const page = async () => {
  
  return (
    <div>
        <h1>Pagamenti</h1>
        <p>Questa è la pagina dei pagamenti.</p>
        <p>Qui puoi visualizzare e gestire i pagamenti effettuati dai clienti.</p>
        <p>Puoi anche aggiungere nuovi pagamenti e modificare quelli esistenti.</p>
        <p>Utilizza il menu a sinistra per navigare tra le diverse sezioni.</p>
        <p>Se hai bisogno di assistenza, contatta il supporto.</p>

        <PagamentiTable />
        
    </div>
  )
}

export default page