import React from 'react'
import AddCollabForm from '@Components/add-collab'
import AddWebDesignV2Form from '@Components/add-webdesign-v2'
import AddGoogleAdsCollabForm from '@Components/add-googleads-collab'
import { UserPlus, PlusCircle } from 'lucide-react'

export const dynamic = 'force-dynamic';

export const AddCollab = () => {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
            <UserPlus className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Crea Nuova Collaborazione</h1>
            <p className="text-sm text-gray-600">
              Aggiungi una nuova collaborazione standard o per web design
            </p>
          </div>
        </div>
      </div>

      {/* Forms */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Standard Collaboration */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <PlusCircle className="w-5 h-5 mr-2 text-blue-600" />
              Collaborazione Standard
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Per social media manager e commerciali
            </p>
          </div>
          <div className="p-6">
            <AddCollabForm />
          </div>
        </div>

        {/* Web Design V2 - Nuovo Workflow */}
        <div className="bg-white rounded-xl shadow-sm border border-violet-200 overflow-hidden">
          <div className="bg-gradient-to-r from-violet-50 to-purple-50 px-6 py-4 border-b border-violet-200">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <PlusCircle className="w-5 h-5 text-violet-600" />
              Nuovo Workflow Web Design
              <span className="px-1.5 py-0.5 bg-violet-600 text-white text-xs font-bold rounded-full">V2</span>
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Calendario operativo · checkbox · note per attività
            </p>
          </div>
          <div className="p-6">
            <AddWebDesignV2Form />
          </div>
        </div>

        {/* Google Ads Collaboration */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <PlusCircle className="w-5 h-5 mr-2 text-green-600" />
              📢 Campagna Google ADS
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Per servizi di advertising Google
            </p>
          </div>
          <div className="p-6">
            <AddGoogleAdsCollabForm />
          </div>
        </div>
      </div>
    </div>
  )
}

export default AddCollab
