import PagamentiTable from '@Components/PagamentiTable'
import React from 'react'
import { CreditCard } from 'lucide-react'

const page = async () => {
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg flex items-center justify-center">
            <CreditCard className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Gestione Pagamenti</h1>
            <p className="text-sm text-gray-600">
              Visualizza e gestisci tutti i pagamenti dei collaboratori
            </p>
          </div>
        </div>
      </div>

      {/* Pagamenti Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <PagamentiTable />
      </div>
    </div>
  )
}

export default page