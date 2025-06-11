import PagamentiTable from '@Components/PagamentiTable'
import React from 'react'

const page = async () => {
  
  return (
    <div>
        <h1 className='head_text p-5'>Pagamenti</h1>
  

        <PagamentiTable />
        
    </div>
  )
}

export default page